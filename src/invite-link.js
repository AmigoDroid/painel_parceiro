/**
 * Recupera convites do fragmento legado ou do parâmetro de URL compatível
 * com redirecionadores de e-mail. Remove o segredo do endereço imediatamente.
 * O index.html também o captura antes do carregamento dos módulos.
 */
export function consumeInviteToken(win = window) {
  const bootstrapToken = win.__DELTA_PARTNER_INVITE_TOKEN__;
  if (bootstrapToken) {
    delete win.__DELTA_PARTNER_INVITE_TOKEN__;
    return bootstrapToken;
  }
  const url = new URL(win.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
  const token = url.searchParams.get("convite") || hashParams.get("convite");
  if (!token) return null;
  url.searchParams.delete("convite");
  if (hashParams.has("convite")) url.hash = "";
  win.history.replaceState(win.history.state, "", url.pathname + url.search + url.hash);
  return token;
}
