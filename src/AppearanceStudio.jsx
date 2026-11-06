import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { api, downloadRokuZip, uploadRokuImage } from './api.js';
import './appearance-studio.css';

const ROOT = '/partner/white-label';
const PRESETS = [
  { id: 'classic', title: 'Clássico', description: 'Banner e cartões, com destaques abaixo.', colors: ['#6B47E6','#090B14','#101321','#FFFFFF'] },
  { id: 'cinema', title: 'Cinema', description: 'Banner imersivo, dando destaque à capa.', colors: ['#E7A94B','#090B10','#17191F','#FFFFFF'] },
  { id: 'compact', title: 'Compacto', description: 'Categorias e conteúdo em primeiro plano.', colors: ['#25B6A6','#081519','#10252B','#F5FCFC'] },
];
const KEYS = ['primaryColor','backgroundColor','panelColor','textColor'];
const ROKU_ASSETS=[['logo','Logotipo (180×180 ou 400×400)'],['icon_hd','Ícone HD (336×210)'],
 ['icon_sd','Ícone SD (246×140)'],['splash_hd','Splash HD (1280×720)'],['splash_fhd','Splash Full HD (1920×1080)'],
 ['banner','Banner na Home (1020×314)']];
const palette = (previous, preset) => Object.fromEntries(KEYS.map((key, i) => [key, preset.colors[i]]));
const empty = { template:'classic', brandName:'Meu aplicativo', tagline:'Seu entretenimento em um só lugar.',
  heroTitle:'Bem-vindo', logoUrl:'', heroUrl:'', primaryColor:'#6B47E6', backgroundColor:'#090B14', panelColor:'#101321', textColor:'#FFFFFF' };
const looksLikeImage = url => !url || /^https:\/\//i.test(url);
const contrast = (a,b) => {
  const L = hex => [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
    .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
  const x=L(a),y=L(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
};
function TvPreview({ config }) {
  const style = {
    '--ap-accent': config.primaryColor, '--ap-bg': config.backgroundColor,
    '--ap-panel': config.panelColor, '--ap-fg': config.textColor,
  };
  return <div className={`ap-tv ap-tv-${config.template}`} style={style} role="img" aria-label={`Prévia da interface ${config.template}`}>
    <aside className="ap-tv-side"><div className="ap-tv-brand">{config.logoUrl && looksLikeImage(config.logoUrl) ? <img src={config.logoUrl} alt="" /> : <span className="ap-tv-mark">{config.brandName.slice(0,1).toUpperCase()}</span>}
      <b>{config.brandName}</b></div><span className="ap-tv-active">Início</span><span>TV ao vivo</span><span>Filmes</span><span>Séries</span><span>Favoritos</span></aside>
    <main className="ap-tv-main">
      {config.template !== 'compact' && <section className="ap-tv-hero" style={config.heroUrl && looksLikeImage(config.heroUrl) ? { backgroundImage: `linear-gradient(90deg,${config.backgroundColor} 0%,transparent 100%),url("${config.heroUrl.replace(/"/g,'')}")` } : {}}>
        <small>{config.brandName}</small><h3>{config.heroTitle}</h3><p>{config.tagline}</p></section>}
      <div className="ap-tv-cards"><div>TV AO VIVO</div><div>FILMES</div><div>SÉRIES</div></div>
      {config.template !== 'cinema' && <section className="ap-tv-feature"><b>Em destaque</b><div className="ap-tv-posters">{[0,1,2,3,4].map(i => <span key={i} />)}</div></section>}
    </main>
  </div>;
}
export default function AppearanceStudio({ apps: initialApps = [] }) {
  const [apps, setApps] = useState(initialApps);
  const [appId, setAppId] = useState(initialApps[0]?.id || '');
  const [draft, setDraft] = useState(empty);
  const [published, setPublished] = useState(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [rokuAssets,setRokuAssets]=useState({});
  const [rokuBuildVersion,setRokuBuildVersion]=useState(1);
  const load = useCallback(async () => {
    try {
      const r = await api(`${ROOT}/appearance/eligible`);
      const rows = r.data || []; setApps(rows);
      setAppId(id => rows.some(a => a.id === id) ? id : (rows[0]?.id || ''));
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!appId) { setDraft(empty); return; }
    let active = true;
    setError(''); setNotice('');
    api(`${ROOT}/${appId}/appearance`).then(r => { if (!active) return;
      setDraft(r.draft || empty); setPublished(r.published); setVersion(r.version || 0); setDirty(false);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [appId]);
  const selected = useMemo(() => apps.find(a => a.id === appId), [apps, appId]);
  const set = (key, value) => { setDraft(d => ({ ...d, [key]: value })); setDirty(true); setNotice(''); };
  useEffect(()=>{
    if(!appId) return;
    let active=true;
    api(`${ROOT}/${appId}/roku-assets`).then(d=>{if(active)setRokuAssets(d.assets||{});}).catch(()=>{});
    return ()=>{active=false;};
  },[appId]);
  const uploadRokuAsset = async (kind, file) => {
    if(!file) return;
    setBusy(true);setError('');setNotice('');
    try{
      await uploadRokuImage(`${ROOT}/${appId}/roku-assets/${kind}`,file);
      const d=await api(`${ROOT}/${appId}/roku-assets`);
      setRokuAssets(d.assets||{});
      setNotice('Imagem salva. Ela será incluída nos próximos pacotes Premium.');
    }catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const exportRoku = async edition => {
    if (dirty && !window.confirm('Seu rascunho foi alterado. O pacote utilizará o último visual publicado. Continuar?')) return;
    setBusy(true);setError('');setNotice('');
    try {
      const currentApp=apps.find(a=>a.id===appId);
      await downloadRokuZip(`${ROOT}/${appId}/roku-export?edition=${edition}&buildVersion=${rokuBuildVersion}`,
        `roku-${currentApp?.appKey||'aplicativo'}-${edition}.zip`);
      setNotice('ZIP preparado. O responsável precisa instalar na TV Roku, assinar o .pkg e enviar à loja.');
    } catch(e){setError(e.message);}finally{setBusy(false);}
  };
  const chooseTemplate = preset => { setDraft(d => ({ ...d, template: preset.id, ...palette(d, preset) })); setDirty(true); setNotice(''); };
  const save = async () => {
    setBusy(true); setError(''); setNotice('');
    try { if (!looksLikeImage(draft.logoUrl) || !looksLikeImage(draft.heroUrl)) throw Error('As imagens devem usar HTTPS.');
      await api(`${ROOT}/${appId}/appearance/draft`, { method: 'PUT', body: draft });
      setDirty(false); setNotice('Rascunho salvo. Publique para atualizar os dispositivos.');
      return true;
    } catch (e) { setError(e.message); return false; }
    finally { setBusy(false); }
  };
  const publish = async () => {
    if (!window.confirm('Publicar este visual para os dispositivos vinculados ao aplicativo?')) return;
    setBusy(true); setError(''); setNotice('');
    try {
      if (!looksLikeImage(draft.logoUrl) || !looksLikeImage(draft.heroUrl)) throw Error('As imagens devem usar HTTPS.');
      // Save then publish in sequence, so there is no stale draft.
      await api(`${ROOT}/${appId}/appearance/draft`, { method: 'PUT', body: draft });
      const result = await api(`${ROOT}/${appId}/appearance/publish`, { method: 'POST' });
      setVersion(result.version); setPublished({ ...draft }); setDirty(false);
      setNotice(`Versão visual ${result.version} publicada. O player atualizará quando consultar a API.`);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };
  return <div className="ap-studio">
    <section className="panel ap-intro"><h2>Estúdio Visual</h2><p>Escolha um modelo pronto ou personalize seu aplicativo Roku. O Superadmin controla quais aplicativos podem acessar este recurso.</p>
      {apps.length > 0 && <label>Aplicativo<select value={appId} onChange={e => setAppId(e.target.value)}>{apps.map(a => <option key={a.id} value={a.id}>{a.name} · {a.appKey}</option>)}</select></label>}
      {!apps.length && <p className="ap-alert">Nenhum aplicativo com personalização liberada. Solicite a habilitação ao Superadmin.</p>}
    </section>
    {error && <p className="ap-alert" role="alert">{error}</p>}{notice && <p className="ap-success" role="status">{notice}</p>}
    {selected && <>
      <section className="panel"><div className="ap-header"><div><h3>Modelos prontos</h3><p>Um clique carrega o modelo. Depois, personalize cores e conteúdo.</p></div><span>Versão publicada: {version || 'nenhuma'}</span></div>
        <div className="ap-presets">{PRESETS.map(p => <button type="button" key={p.id} aria-pressed={draft.template === p.id} className={`ap-preset ${draft.template === p.id ? 'selected' : ''}`} onClick={() => chooseTemplate(p)}>
          <div className="ap-swatch" style={{ background:p.colors[1] }}><i style={{background:p.colors[0]}}/><em style={{background:p.colors[2]}}/><span style={{color:p.colors[3]}}>TV</span></div><b>{p.title}</b><small>{p.description}</small></button>)}</div></section>
      <div className="ap-editor-layout">
        <section className="panel ap-controls"><h3>Personalização</h3>
          <label>Nome mostrado no aplicativo<input maxLength={45} value={draft.brandName} onChange={e=>set('brandName',e.target.value)} /></label>
          <label>Título principal<input maxLength={90} value={draft.heroTitle} onChange={e=>set('heroTitle',e.target.value)} /></label>
          <label>Mensagem de boas-vindas<input maxLength={110} value={draft.tagline} onChange={e=>set('tagline',e.target.value)} /></label>
          <label>URL HTTPS do logotipo<input type="url" placeholder="https://exemplo.com/logo.png" value={draft.logoUrl} onChange={e=>set('logoUrl',e.target.value)} /></label>
          <label>URL HTTPS da imagem de destaque<input type="url" placeholder="https://exemplo.com/capa.jpg" value={draft.heroUrl} onChange={e=>set('heroUrl',e.target.value)} /></label>
          <div className="ap-colors">{[['primaryColor','Cor de destaque'],['backgroundColor','Fundo'],['panelColor','Menu e cartões'],['textColor','Texto']].map(([key,label]) => <label key={key}>{label}<div><input type="color" value={draft[key]} onChange={e=>set(key,e.target.value)}/><code>{draft[key]}</code></div></label>)}</div>
          {(contrast(draft.textColor,draft.backgroundColor)<4.5 || contrast(draft.textColor,draft.panelColor)<4.5) &&
            <p className="ap-alert" role="alert">Baixo contraste: ajuste as cores de texto, fundo e menu para permitir a publicação.</p>}
          <p className="ap-help">Use imagens públicas otimizadas. Ícone e splash da loja Roku são definidos no pacote do aplicativo.</p>
          <div className="ap-buttons"><button type="button" disabled={busy || !dirty} className="outline" onClick={save}>Salvar rascunho</button>
            <button type="button" disabled={busy || !draft.brandName.trim() || !draft.heroTitle.trim()} className="primary" onClick={publish}>{busy?'Publicando…':'Publicar no aplicativo'}</button></div>
        </section>
        <section className="panel ap-preview"><div className="ap-header"><h3>Prévia da TV</h3><span>Simulação 16:9</span></div><TvPreview config={draft}/>
          <p>Prévia aproximada do layout. A renderização real precisa ser testada em um aparelho Roku.</p>
          {published && <small>O visual publicado é independente deste rascunho até você clicar em Publicar.</small>}
        </section>
      </div>
      <section className="panel ap-export-studio">
        <h3>Gerar aplicativo Roku</h3><p>Após configurar e publicar o visual, escolha a modalidade de entrega. O Superadmin controla a liberação.</p>
        <div className="ap-brand-assets">
          <h4>Arquivos de identidade para a loja e a TV</h4>
          <p>Opcional: envie imagens PNG nos tamanhos abaixo. Se faltar alguma, o sistema cria um modelo básico com a marca; para publicação profissional, envie sua arte.</p>
          <div className="ap-assets-grid">{ROKU_ASSETS.map(([key,label])=><label key={key}>{label}
            <small>{rokuAssets[key]?.present?'Imagem cadastrada':'Automático / não cadastrado'}</small>
            <input aria-label={label} disabled={busy} type="file" accept="image/png" onChange={e=>{void uploadRokuAsset(key,e.target.files?.[0]);e.target.value='';}}/>
          </label>)}</div>
        </div>
        <label className="ap-build-version">Número da build (aumente nas atualizações) <input type="number" min="1" max="99999" value={rokuBuildVersion} onChange={e=>setRokuBuildVersion(e.target.valueAsNumber||1)}/></label>
        <div className="ap-export-options">
          <div><h4>Econômico — visual dinâmico</h4><p>Canal com identidade básica e atualizações de aparência pelo painel, sem recompilar a cada mudança de cor.</p>
            <button type="button" disabled={busy} className="outline" onClick={()=>exportRoku('economy')}>Baixar ZIP Econômico</button></div>
          <div><h4>Premium — aplicativo próprio</h4><p>Nome, ícones e splash individualizados, tema publicado incluído no pacote e configuração de login Xtream do cliente.</p>
            <button type="button" disabled={busy||!version||dirty} className="primary" onClick={()=>exportRoku('dedicated')}>Gerar ZIP Premium</button></div>
        </div>
        <small>O ZIP é a fonte para sideload. A assinatura .pkg depende de uma TV Roku configurada com chave de desenvolvedor. O envio e a aprovação na loja não são automáticos.</small>
      </section>
    </>}
  </div>;
}
