import { useEffect, useState } from 'react';

const origin = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000' : '')).replace(/\/+$/, '');
const errorText = 'Este QR expirou ou é inválido. Na TV, pressione CONECTAR para gerar outro.';
const validApp = value => /^[a-z0-9][a-z0-9._-]{1,63}$/.test(value || '');
const validMac = value => /^[0-9A-F]{12}$/.test(value || '');
const validToken = value => /^[A-Za-z0-9_-]{20,100}$/.test(value || '');
const formatMac = mac => (mac.match(/.{2}/g) || []).join(':');
const colors = { background: '#02030A', panel: '#070D24', primary: '#1F4BFF', text: '#F2F6FF', muted: '#A9BCD6' };

export default function PublicUploadPlaylist({ request }) {
  const { app, mac, token } = request;
  const [meta, setMeta] = useState(null);
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const valid = validApp(app) && validMac(mac) && validToken(token);
  useEffect(() => {
    if (!valid || !origin) { setState('invalid'); return; }
    let active = true;
    setState('loading');
    const path = `${origin}/api/v1/public/client-apps/${encodeURIComponent(app)}`;
    fetch(path, { cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer' })
      .then(async r => { if (!r.ok) throw new Error(r.status === 403 ? 'indisponivel' : 'rede'); return r.json(); })
      .then(async data => {
        if (!data.available) return { ...data, available: false };
        const verify = await fetch(`${path}/verify`, {
          method: 'POST', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
          headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mac, token }),
        });
        if (!verify.ok) throw new Error(verify.status === 403 ? 'indisponivel' : 'rede');
        return verify.json();
      }).then(data => {
        if (!active) return;
        setMeta(data);
        setState(data?.available ? 'ready' : 'invalid');
        if (data?.available) document.title = `Cadastrar lista · ${data.name}`;
      }).catch(e => {
        if (!active) return;
        setState(e.message === 'indisponivel' ? 'unavailable' : 'network');
      });
    return () => { active = false; };
  }, [app, mac, token, valid, attempt]);

  const submit = async e => {
    e.preventDefault();
    if (!valid || state !== 'ready' || busy || !username.trim() || !password) return;
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`${origin}/api/v1/public/client-apps/${encodeURIComponent(app)}/link`, {
        method: 'POST', cache: 'no-store', credentials: 'omit', referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mac, token, username: username.trim(), password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (['INVALID_QR', 'PAIRING_NOT_FOUND'].includes(result.code)) { setState('invalid'); return; }
        if (result.code === 'APP_NOT_AVAILABLE') { setState('unavailable'); return; }
        if (response.status === 429) { setMessage('Muitas tentativas. Aguarde antes de tentar novamente.'); return; }
        setMessage(['INVALID_CREDENTIALS', 'INVALID_LOGIN'].includes(result.code) ? 'Usuário ou senha inválidos.' : (result.message || 'Não foi possível validar a lista. Tente novamente.'));
        return;
      }
      setPassword(''); setUsername(''); setState('done');
    } catch {
      setMessage('Falha de conexão. Verifique sua internet e tente novamente.');
    } finally { setBusy(false); }
  };
  const theme = meta?.theme || {};
  const palette = Object.fromEntries(Object.entries(colors).map(([key, fallback]) =>
    [key, /^#[0-9a-fA-F]{6}$/.test(theme[key] || '') ? theme[key] : fallback]));
  return <main className="public-qr" style={{ '--qr-bg': palette.background, '--qr-panel': palette.panel,
    '--qr-primary': palette.primary, '--qr-text': palette.text, '--qr-muted': palette.muted }}>
    <section className="public-qr-card" aria-label="Cadastro de lista">
      {meta?.logoUrl && <img className="public-qr-logo" src={meta.logoUrl} alt={`Logo ${meta.name}`} referrerPolicy="no-referrer" />}
      <h1>{meta?.name || 'Cadastro de lista'}</h1>
      {state === 'loading' ? <p role="status">Verificando seu QR Code…</p>
        : state === 'invalid' ? <p role="alert">{errorText}</p>
        : state === 'unavailable' ? <p role="alert">Aplicativo indisponível. Fale com seu provedor.</p>
        : state === 'network' ? <><p role="alert">Não foi possível consultar o servidor.</p><button type="button" onClick={() => setAttempt(x => x + 1)}>Tentar novamente</button></>
        : state === 'done' ? <p role="status">Pronto! Volte para a TV: o {meta?.name || 'aplicativo'} vai abrir sua lista.</p>
        : <>
          <p>Informe as credenciais fornecidas pelo seu provedor.</p>
          <form onSubmit={submit} autoComplete="off">
            <label htmlFor="public-app">Aplicativo</label><input id="public-app" readOnly value={meta.name} />
            <label htmlFor="public-mac">MAC da TV</label><input id="public-mac" readOnly value={formatMac(mac)} />
            <label htmlFor="public-user">Usuário</label><input id="public-user" required maxLength={128} value={username} onChange={e => setUsername(e.target.value)} autoComplete="off" />
            <label htmlFor="public-pass">Senha</label><input id="public-pass" required type="password" maxLength={128} value={password} onChange={e => setPassword(e.target.value)} autoComplete="off" />
            {message && <p role="alert" className="public-qr-error">{message}</p>}
            <button type="submit" disabled={busy}>{busy ? 'Validando…' : 'Vincular minha TV'}</button>
          </form>
        </>}
    </section>
  </main>;
}
