/**
 * Detecta o fluxo de convite mesmo se o usuário já estiver autenticado.
 * Recolhe o segredo e o remove imediatamente da barra do navegador.
 * O index.html faz essa remoção ainda antes de carregar os bundles JS.
 */
export function consumeInviteRequest(win = window) {
  const early = win.__DELTA_PARTNER_INVITE_REQUEST__;
  if (early) {
    delete win.__DELTA_PARTNER_INVITE_REQUEST__;
    return { token: String(early.token || ""), type: early.type || "legacy" };
  }
  const url = new URL(win.location.href);
  const commercialRoute = url.pathname === "/convite-comercial" || url.pathname.startsWith("/convite-comercial/");
  const viaPath = url.pathname === "/convite" || url.pathname.startsWith("/convite/") || commercialRoute;
  const routeToken = viaPath ? (url.pathname.match(/^\/convite(?:-comercial)?\/([^/]+)\/?$/)?.[1] || "") : "";
  const legacyHash = new URLSearchParams(url.hash.startsWith("#") ? url.hash.slice(1) : "");
  const viaQuery = url.searchParams.has("convite");
  const viaHash = legacyHash.has("convite");
  if (!viaPath && !viaQuery && !viaHash) return null;
  const token = routeToken || (commercialRoute ? legacyHash.get("token") : null) || url.searchParams.get("convite") || legacyHash.get("convite") || "";
  if (viaPath || viaQuery || viaHash) url.pathname = commercialRoute ? "/convite-comercial" : "/convite";
  url.searchParams.delete("convite");
  if (viaHash || commercialRoute) url.hash = "";
  // A URL mostra a rota publica, mas nao expõe o segredo.
  win.history.replaceState(win.history.state, "", url.pathname + url.search + url.hash);
  return { token, type: commercialRoute ? "commercial" : "legacy" };
}

// Mantém a API antiga para integrações que ainda a utilizarem.
export function consumeInviteToken(win = window) {
  return consumeInviteRequest(win)?.token || null;
}
