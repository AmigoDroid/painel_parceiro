import { createApiClient, ApiError } from "../shared/api-client.js";
export { ApiError };
const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:3000" : "")).replace(/\/+$/, "");
if (!API || !/^https?:\/\//i.test(API) || (import.meta.env.PROD && !API.startsWith("https://"))) throw new Error("VITE_API_URL deve apontar para uma API válida via HTTPS em produção.");
const client = createApiClient({ baseUrl: API, key: "iptv-content-partner-auth", audience: "content_partner" });
export const { getAuth, api, login, logout, ensureAccessToken, acceptSession, endImpersonation } = client;
export const updateAuthUser = client.updateAuthUser;
const { raw, refresh } = client;
// Acesso por MAC + chave de 6 dígitos (/device-access). O token dessa sessão é limitado a UM dispositivo e fica só em memória
// (nunca em localStorage): fechar a aba encerra o acesso.
export async function deviceApi(path, { method = "GET", body, token, signal } = {}) {
  return raw(`/device-access${path}`, { method, body, token, signal });
}

// Cadastro público de revendedor (sem login). A resposta é a mesma para qualquer e-mail.
export const registerReseller = (body) => raw("/auth/register-reseller", { method: "POST", body });

// Convites de parceria: rotas públicas, segredo sempre no corpo POST.
export const verifyPartnerInvite = (token) => raw("/auth/partner-invite/verify", { method: "POST", body: { token } });
export const completePartnerInvite = (body) => raw("/auth/partner-invite/complete", { method: "POST", body });
// Convite COMERCIAL de acesso pré-pago ao painel (isolado do convite administrativo legado).
export const verifyPortalSalesInvite = token => raw("/auth/portal-sales-invite/verify",{method:"POST",body:{token}});
export const completePortalSalesInvite = body => raw("/auth/portal-sales-invite/complete",{method:"POST",body});

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
    if (response.status === 401 && retry && getAuth()?.refreshToken) {
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
    if(res.status===401 && retry && getAuth()?.refreshToken){await refresh();return send(false);}
    const response=await res.json().catch(()=>null);
    if(!res.ok) throw new ApiError(res.status,response);
    return response;
  };
  return send(true);
}
