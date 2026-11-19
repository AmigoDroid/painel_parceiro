// Destino pós-cadastro do convite administrativo: não confundir login da Revenda com o do Parceiro.
export function resolveInviteLoginTarget(kind, { resellerOrigin = '', dev = false } = {}) {
  if (kind !== 'reseller') return '/';
  const fallback = dev ? 'http://localhost:5175/' : 'https://revenda.deltatv.com.br/';
  const candidate = String(resellerOrigin || '').trim() || fallback;
  try {
    const url = new URL(candidate);
    if (!['https:', 'http:'].includes(url.protocol) || (!dev && url.protocol !== 'https:') ||
        url.username || url.password || url.search || url.hash || url.pathname !== '/') return fallback;
    return `${url.origin}/`;
  } catch {
    return fallback;
  }
}
