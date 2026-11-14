// Cliente da API. Tokens de acesso são curtos; o refresh é rotacionado a cada uso.
// A autorização real acontece no backend: esconder botões aqui é só conveniência de UI.
const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "")).replace(/\/+$/, "");
if (!API || !/^https?:\/\//i.test(API) || (import.meta.env.PROD && !API.startsWith("https://"))) {
  throw new Error("VITE_API_URL deve apontar para uma API válida via HTTPS em produção.");
}
const KEY = "iptv-content-partner-auth"; // chave própria: não mistura sessão com o painel admin

let auth = (() => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } })();
const save = (a) => {
  auth = a;
  if (a) localStorage.setItem(KEY, JSON.stringify(a)); else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("auth-changed"));
};
export const getAuth = () => auth;
export const updateAuthUser = (user) => { if (auth?.user && user?.id === auth.user.id) save({ ...auth, user: { ...auth.user, ...user } }); };

export class ApiError extends Error {
  constructor(status, data) {
    super(data?.message || "Não foi possível concluir a operação.");
    this.status = status;
    this.code = data?.code;
    this.details = data?.details;
  }
}

async function raw(path, { method = "GET", body, query, token, signal } = {}) {
  const url = new URL(`${API}/api/v1${path}`);
  Object.entries(query || {}).forEach(([k, v]) => { if (v !== "" && v != null) url.searchParams.set(k, v); });
  let res;
  try {
    res = await fetch(url, {
      method,
      signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    // fetch só rejeita por falha de rede/CORS: a mensagem padrão do navegador ("Failed to fetch") não ajuda ninguém.
    throw new ApiError(0, { code: "NETWORK", message: "Não foi possível conectar ao servidor. Verifique a conexão e tente novamente." });
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// Sincroniza login/logout/rotação entre abas do mesmo painel.
window.addEventListener("storage", event => {
  if (event.key !== KEY && event.key !== null) return;
  try { auth = JSON.parse(localStorage.getItem(KEY)); } catch { auth = null; }
  window.dispatchEvent(new Event("auth-changed"));
});
let refreshing = null;
async function rotate() {
  const current = auth;
  if (!current?.refreshToken) throw new ApiError(401, { code: "INVALID_TOKEN", message: "Entre novamente para continuar." });
  try {
    const stored = JSON.parse(localStorage.getItem(KEY));
    if (stored?.refreshToken && stored.refreshToken !== current.refreshToken) { save(stored); return; }
    const data = await raw("/auth/refresh", { method: "POST", body: { refreshToken: current.refreshToken } });
    // Uma resposta atrasada nunca pode desfazer logout ou substituir outro login.
    if (auth !== current) return;
    save({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
  } catch (error) {
    if (auth === current && error.status === 401) save(null);
    throw error;
  }
}
function refresh() {
  return refreshing ??= (globalThis.navigator?.locks
    ? navigator.locks.request(KEY + ":refresh", rotate)
    : rotate()).finally(() => { refreshing = null; });
}
// O socket também precisa renovar tokens: uma tela ociosa pode não fazer chamadas HTTP.
export async function ensureAccessToken() {
  const token = auth?.accessToken;
  if (!token) return null;
  let exp;
  try { exp = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).exp; } catch { exp = 0; }
  if (!Number.isFinite(exp) || exp * 1000 <= Date.now() + 30000) await refresh();
  return auth?.accessToken || null;
}
export async function api(path, opts = {}, retry = true) {
  const token = auth?.accessToken;
  try {
    return await raw(path, { ...opts, token });
  } catch (error) {
    if (error.status === 401 && error.code === "INVALID_TOKEN" && retry && auth?.refreshToken) {
      // Resposta de uma chamada antiga: reutiliza a renovação que já terminou.
      if (auth.accessToken === token) await refresh();
      if (!auth?.accessToken) throw error;
      return api(path, opts, false);
    }
    throw error;
  }
}

export async function login(email, password) {
  const d = await raw("/auth/login", { method: "POST", body: { email, password, audience: "content_partner" } });
  save({ accessToken: d.accessToken, refreshToken: d.refreshToken, user: d.user });
}
export async function logout() {
  const t = auth?.refreshToken;
  save(null);
  if (t) await raw("/auth/logout", { method: "POST", body: { refreshToken: t } }).catch(() => {});
}

// Acesso por MAC + chave de 6 dígitos (/device-access). O token dessa sessão é limitado a UM dispositivo e fica só em memória
// (nunca em localStorage): fechar a aba encerra o acesso.
export async function deviceApi(path, { method = "GET", body, token } = {}) {
  const res = await fetch(new URL(`${API}/api/v1/device-access${path}`), {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

// Cadastro público de revendedor (sem login). A resposta é a mesma para qualquer e-mail.
export const registerReseller = (body) => raw("/auth/register-reseller", { method: "POST", body });

// Convites de parceria: rotas públicas, segredo sempre no corpo POST.
export const verifyPartnerInvite = (token) => raw("/auth/partner-invite/verify", { method: "POST", body: { token } });
export const completePartnerInvite = (body) => raw("/auth/partner-invite/complete", { method: "POST", body });

// Públicos: são chamados sem sessão para não expor um access token num link de e-mail.
export const requestPasswordReset = (email) => raw("/auth/password-reset/request", { method: "POST", body: { email } });
export const completePasswordReset = (token, newPassword) => raw("/auth/password-reset/complete", { method: "POST", body: { token, newPassword } });

// Authenticated binary Roku ZIP export. Avoids tokens in URL/query or browser history.
export async function downloadRokuZip(path, filename) {
  const request = async (retry = true) => {
    const token = await ensureAccessToken();
    if (!token) throw new ApiError(401, { code: "INVALID_TOKEN", message: "Entre novamente para baixar." });
    const response = await fetch(`${API}/api/v1${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/zip" }, cache: "no-store",
    });
    if (response.status === 401 && retry && auth?.refreshToken) {
      await refresh();
      return request(false);
    }
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new ApiError(response.status, data);
    }
    if (!(response.headers.get("Content-Type") || "").includes("application/zip"))
      throw new ApiError(502, { message: "O servidor não retornou o pacote Roku." });
    const blob = await response.blob();
    if (blob.size > 70_000_000) throw new ApiError(502, { message: "O arquivo excedeu o tamanho permitido." });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  };
  return request();
}

export async function uploadRokuImage(path, file) {
  if (!file || file.type !== "image/png" || file.size > 3_000_000) {
    throw new ApiError(422,{message:"Envie PNG com até 3 MB, nas dimensões indicadas."});
  }
  const send = async retry => {
    const token=await ensureAccessToken();
    if(!token) throw new ApiError(401,{message:"Faça login novamente."});
    const res=await fetch(`${API}/api/v1${path}`,{
      method:"PUT",cache:"no-store",headers:{Authorization:`Bearer ${token}`,"Content-Type":"image/png"},body:file,
    });
    if(res.status===401 && retry && auth?.refreshToken){await refresh();return send(false);}
    const response=await res.json().catch(()=>null);
    if(!res.ok) throw new ApiError(res.status,response);
    return response;
  };
  return send(true);
}
