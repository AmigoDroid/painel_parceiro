/** Erros públicos de convite: nunca exibir tokens ou mensagens internas de SQL. */
export function retryableInviteError(error) {
  const status = Number(error?.status);
  const code = String(error?.code || '');
  if (code === 'CORS_NOT_ALLOWED') return false;
  return status === 0 || status === 429 || status >= 500;
}

export function messageForInviteError(error, { stage = 'verify' } = {}) {
  const status = Number(error?.status);
  const code = String(error?.code || '');
  if (code === 'CORS_NOT_ALLOWED')
    return 'Esta origem não foi autorizada pela API (CORS). A administração precisa conferir as origens permitidas.';
  if (status === 429)
    return 'Muitas tentativas de acesso ao convite. Aguarde alguns minutos antes de tentar novamente.';
  if (code === 'TIMEOUT')
    return 'A API demorou para responder. Confira sua conexão antes de tentar novamente.';
  if (status === 0)
    return 'Não foi possível conectar à API. Verifique sua rede, a URL da API e se a origem do site está autorizada (CORS).';
  if (status === 404 || status === 410 || /^(?:INVITE_UNAVAILABLE|INVITE_EXPIRED|INVALID_INVITE)$/.test(code))
    return 'Este convite é inválido, expirou, foi revogado ou já foi utilizado. Solicite um novo link.';
  if (status === 400 || status === 422)
    return stage === 'complete'
      ? 'Confira os dados do formulário e tente concluir o cadastro novamente.'
      : 'Os dados enviados para validar este convite são inválidos. Solicite um novo link.';
  if (status === 409)
    return 'Este convite ou cadastro entrou em conflito com uma alteração recente. Consulte a administração.';
  if (status >= 500)
    return 'A API está temporariamente indisponível. Tente novamente mais tarde.';
  return error?.message || 'Não foi possível consultar o convite. Tente novamente.';
}
