import React,{useEffect,useState,useCallback} from "react";
import EasyStart, { EasyPageGuide } from "./EasyStart.jsx";
import { useSimpleMode } from "./useSimpleMode.js";
import "./easy-start.css";
import { api,login,logout,getAuth } from "./api.js";
import SupportCenter from "./SupportCenter.jsx";
import {CommercialOverview,PartnerDevices,CreditAllocationModal} from "./Commercial.jsx";
import { Customers, LicensesAndActivations, Messages, AccessHistory, BillingHistory, AppDownloads, CreditsLedger, WebPlayer, PartnerAccount } from "./PartnerOperations.jsx";
import { connectRealtime } from "./realtime.js";
import Icon from "./Icon.jsx";
import WhiteLabelApps from "./WhiteLabelApps.jsx";
import AppearanceStudio from "./AppearanceStudio.jsx";
import HelpExperience from "./HelpExperience.jsx";
import InviteRegistration from "./InviteRegistration.jsx";
import { ForgotPassword } from "./PasswordReset.jsx";
import "./password-reset.css";
import { consumeInviteRequest } from "./invite-link.js";
const NAV_GROUPS=[
 {label:"Visão geral",items:[["overview","Início","dashboard"]]},
 {label:"Atendimento",items:[["support","Resolver problema da TV","activity"],["customers","Clientes","users"],["devices","Dispositivos","monitor"],["licenses","Licenças","shield"]]},
 {label:"Ativação e conteúdo",items:[["codes","Códigos para ativar TVs","key"],["white-label","Meus aplicativos","download"],["studio","Estúdio Visual","monitor"],["web","Player Web","globe"],["servers","Links de conteúdo","server"],["monitor","Qualidade dos links","activity"],["downloads","Downloads e links","download"]]},
 {label:"Comercial",items:[["commercial","Contrato e licenças","wallet"],["credits","Créditos e extrato","coins"],["billing","Faturas e pagamentos","receipt"]]},
 {label:"Conta",items:[["notifications","Notificações","bell"],["access","Histórico de login","history"],["account","Minha conta","account"],["help","Central de Ajuda","help"]]},
];
const SIMPLE_PARTNER = new Set(["overview", "support", "customers", "devices", "codes", "servers", "monitor", "notifications", "help", "account"]);
const SCREEN_SUBTITLES={
 overview:"Acompanhe sua operação, códigos e infraestrutura em um só lugar.",
 customers:"Gerencie os clientes associados à sua parceria.",
 support:"Diagnóstico guiado da TV e orientações para resolver problemas.",
 devices:"Consulte seus dispositivos e os vínculos de ativação.",
 licenses:"Acompanhe licenças e ativações do seu contrato.",
 codes:"Organize os códigos de parceria e seus servidores.",
 web:"Gerencie o acesso ao Player Web dos seus clientes.",
 "white-label":"Controle seus aplicativos white-label, servidores e ativações.",
 studio:"Personalize o visual e publique novos temas para seus aplicativos Roku.",
 servers:"Configure e acompanhe seus servidores de conteúdo.",
 monitor:"Disponibilidade e latência dos servidores, em tempo real.",
 downloads:"Consulte os aplicativos e links disponibilizados.",
 commercial:"Condições do contrato e capacidade disponível.",
 credits:"Acompanhe movimentações e saldos de créditos.",
 billing:"Consulte suas faturas e informações financeiras.",
 notifications:"Confira os comunicados enviados pela administração.",
 access:"Consulte o histórico de acesso e a segurança da conta.",
 account:"Atualize os dados e preferências da sua conta.",
 help:"Guias e tutoriais interativos para usar a plataforma."
};
const SCREEN_TITLES=Object.fromEntries(NAV_GROUPS.flatMap(g=>g.items.map(i=>[i[0],i[1]])));

// Importante: capturar apenas uma vez. React.StrictMode chama inicializadores duas
// vezes em desenvolvimento; uma leitura destrutiva no useState perderia o convite.
const INITIAL_INVITE = consumeInviteRequest();
const BASE="/content-partner";
const Label=({children})=><label className="label">{children}</label>;
const healthNames={healthy:"Saudável",slow:"Lento",down:"Indisponível",suspect:"Falha detectada",checking:"Em verificação",unknown:"Aguardando"};
function State({health}) { const state=health?.state||"unknown";return <span className={`pill ${state}`}>{healthNames[state]||state}</span> }
function PartnerPortalApp(){
 const [user,setUser]=useState(getAuth()?.user||null),[screen,setScreen]=useState("overview");
 const [simpleMode,setSimpleMode]=useSimpleMode("parceiro");
 const [studioApps,setStudioApps]=useState([]);
 useEffect(()=>{if(!user){setStudioApps([]);return;} let active=true;
  const fetchStudio=()=>api('/partner/white-label/appearance/eligible').then(r=>{if(active)setStudioApps(r.data||[])}).catch(()=>{if(active)setStudioApps([])});
  void fetchStudio();const timer=setInterval(fetchStudio,60000);
  return()=>{active=false;clearInterval(timer)};
 },[user?.id]);
 const [data,setData]=useState({providers:[],codes:[],monitorEnabled:false}),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const [saving,setSaving]=useState(false),[form,setForm]=useState(null),[codeForm,setCodeForm]=useState(null),[search,setSearch]=useState("");
 const [credentials,setCredentials]=useState({email:"",password:""});
 const [forgotMode,setForgotMode]=useState(false);
 const [profileDetails,setProfileDetails]=useState(null);
 useEffect(()=>{if(!user)return;let live=true;
  api("/auth/profile").then(x=>{if(live)setProfileDetails(x)}).catch(()=>{});
  const updated=e=>setProfileDetails(e.detail);
  window.addEventListener("profile-updated",updated);
  return()=>{live=false;window.removeEventListener("profile-updated",updated)};
 },[user?.id]);
 const showBadge=profileDetails?.profile?.showNotificationBadge!==false;
 const showUnread=profileDetails?.profile?.showUnreadBanner!==false;
 const [poolForm,setPoolForm]=useState(null),[editCode,setEditCode]=useState(null);
 const [allocation,setAllocation]=useState(null);
 const [mobileMenu,setMobileMenu]=useState(false),[unread,setUnread]=useState(0),[profileMenu,setProfileMenu]=useState(false);
 // O tutorial de navegação abre o menu móvel para exibir o item real destacado.
 useEffect(()=>{const openForHelp=()=>setMobileMenu(true);window.addEventListener("deltatv-help-open-menu",openForHelp);return()=>window.removeEventListener("deltatv-help-open-menu",openForHelp)},[]);
 useEffect(()=>connectRealtime(),[]);
 useEffect(()=>{const sync=()=>setUser(getAuth()?.user||null);window.addEventListener("auth-changed",sync);return()=>window.removeEventListener("auth-changed",sync)},[]);
 useEffect(()=>{
  const onEscape=e=>{if(e.key==="Escape"){setProfileMenu(false);setMobileMenu(false)}};
  window.addEventListener("keydown",onEscape);
  return()=>window.removeEventListener("keydown",onEscape);
 },[]);
 useEffect(()=>{ if(!user)return;
  let active=true;
  const run=()=>api(BASE+"/notifications",{query:{page:1,limit:1}}).then(r=>{if(active)setUnread(r.unread||0)}).catch(()=>{});
  const onChange=e=>{if(!e.detail?.topic || ["notifications","data"].includes(e.detail.topic) || e.detail?.type==="notification")run()};
  run();const timer=setInterval(run,60000);
  window.addEventListener("realtime-ready",onChange);window.addEventListener("realtime-change",onChange);
  return()=>{active=false;clearInterval(timer);window.removeEventListener("realtime-ready",onChange);window.removeEventListener("realtime-change",onChange)};
 },[user]);
 const navigate=useCallback(id=>{setScreen(id);setForm(null);setMobileMenu(false);setProfileMenu(false)},[]);
 const [history,setHistory]=useState(null);
 const showHistory=async server=>{setHistory({name:server.name,loading:true,data:[],error:""});try{
  const r=await api(`${BASE}/servers/${server.id}/history`);setHistory({name:server.name,loading:false,data:r.data||[],error:""});
 }catch(e){setHistory({name:server.name,loading:false,data:[],error:e.message})}};
 const maxCodeServers=data?.servicePlan?.features?.maxServers ?? null;
 const maxCodeServersLabel=maxCodeServers == null ? "um número ilimitado de" : `até ${maxCodeServers}`;
 const canPoolEdit=(maxCodeServers == null || maxCodeServers > 1) && !!data?.servicePlan?.features?.autoFailover;
 const [codes,setCodes]=useState({rows:[],count:0,page:1,pageSize:25});
 const [codePage,setCodePage]=useState(1),[codeReload,setCodeReload]=useState(0);
 const refresh=useCallback(async()=>{if(!getAuth())return;try{const d=await api(BASE+"/overview");setData(d);setError("");}catch(e){setError(e.message)}},[]);
 useEffect(()=>{if(!user)return;void refresh();const id=setInterval(()=>{void refresh()},60000);
  let t;
  const onChange=e=>{if(["server-health","codes","providers","data"].includes(e.detail?.topic)){clearTimeout(t);t=setTimeout(()=>void refresh(),300)}};
  window.addEventListener("realtime-change",onChange);window.addEventListener("realtime-ready",onChange);
  return()=>{clearInterval(id);clearTimeout(t);window.removeEventListener("realtime-change",onChange);window.removeEventListener("realtime-ready",onChange)};
 },[user,refresh]);
 useEffect(()=>{if(!user||screen!=="codes")return;let cancelled=false;
  const id=setTimeout(async()=>{try{const d=await api(BASE+"/codes",{query:{q:search,page:codePage}});if(!cancelled)setCodes(d);}catch(e){if(!cancelled)setError(e.message)}},250);
  return()=>{cancelled=true;clearTimeout(id)};
 },[user,screen,search,codePage,codeReload]);
 const reloadCodeList=()=>{setCodeReload(v=>v+1);void refresh()};
 const savePool=async e=>{e.preventDefault();if(!poolForm?.serverIds.length)return;
  setSaving(true);setError("");try{await api(`${BASE}/codes/${poolForm.id}/servers`,{method:"PUT",body:{serverIds:poolForm.serverIds}});
   setPoolForm(null);reloadCodeList();}catch(e){setError(e.message)}finally{setSaving(false)};
 };
 const toggleServer=(id)=>setPoolForm(current=>{
   if(!current)return current;
   const have=current.serverIds.includes(id);
   return {...current,serverIds:have?current.serverIds.filter(x=>x!==id):(maxCodeServers == null || current.serverIds.length<maxCodeServers)?[...current.serverIds,id]:current.serverIds};
 });
 const signIn=async e=>{e.preventDefault();setLoading(true);setError("");try{await login(credentials.email,credentials.password);setUser(getAuth()?.user);setCredentials({email:"",password:""});}catch(e){setError(e.message)}finally{setLoading(false)}};
 const signOut=async()=>{setProfileMenu(false);await logout();setUser(null);setData({providers:[],codes:[],monitorEnabled:false})};
 const saveServer=async e=>{e.preventDefault();setSaving(true);setError("");try{const body={name:form.name,baseUrl:form.baseUrl,priority:Number(form.priority)||0,status:form.status};
 await api(BASE+(form.id?`/servers/${form.id}`:"/servers"),{method:form.id?"PATCH":"POST",body});setForm(null);await refresh();}catch(e){setError(e.message)}finally{setSaving(false)}};
 const createCode=async e=>{e.preventDefault();setSaving(true);setError("");try{await api(BASE+"/codes",{method:"POST",body:{code:codeForm.code||undefined,label:codeForm.label||undefined,providerId:codeForm.providerId}});setCodeForm(null);reloadCodeList()}catch(e){setError(e.message)}finally{setSaving(false)}};
 const saveCode=async e=>{e.preventDefault();setSaving(true);setError("");try{
   await api(`${BASE}/codes/${editCode.id}`,{method:"PATCH",body:{label:editCode.label||"",maxActivations:editCode.maxActivations===""?null:Number(editCode.maxActivations),allowWebIssuance:!!editCode.allowWebIssuance,expiresAt:editCode.expiresAt?(editCode.originalExpiresAt&&new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(new Date(editCode.originalExpiresAt))===editCode.expiresAt?editCode.originalExpiresAt:new Date(`${editCode.expiresAt}T23:59:59-03:00`).toISOString()):null}});
   setEditCode(null);reloadCodeList();
  }catch(e){setError(e.message)}finally{setSaving(false)}};
 const revoke=async c=>{if(!window.confirm(`Revogar o código ${c.code}? Dispositivos já ativados permanecem ativos.`))return;try{await api(`${BASE}/codes/${c.id}/revoke`,{method:"POST"});reloadCodeList()}catch(e){setError(e.message)}};
 const visibleCodes=codes.rows;
 if(!user && forgotMode)return <ForgotPassword initialEmail={credentials.email} onBack={()=>{setForgotMode(false);setError("")}}/>;
 if(!user)return <main className="loginwrap"><form className="login" onSubmit={signIn}><div className="brandico brandico-login">D</div><h1>Delta TV <span>Parceiros</span></h1><p>Servidores, parcerias e disponibilidade em um só lugar.</p><Label>E-mail</Label><input type="email" required autoComplete="username" value={credentials.email} onChange={e=>setCredentials({...credentials,email:e.target.value})} placeholder="seu@email.com"/><Label>Senha</Label><input type="password" required autoComplete="current-password" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})} placeholder="••••••••"/>{error&&<div className="alert">{error}</div>}<button disabled={loading} className="primary wide">{loading?"Entrando…":"Entrar no painel"}</button><button type="button" className="reset-login-link" onClick={()=>{setForgotMode(true);setError("")}}>Esqueceu a senha?</button><small>Uso exclusivo dos parceiros de conteúdo Delta TV.</small></form></main>;
 return <div className="shell">
 {mobileMenu&&<button className="partner-scrim" aria-label="Fechar navegação" onClick={()=>setMobileMenu(false)}/>}
 <aside className={`aside ${mobileMenu?"mobile-open":""}`}>
  <div className="logo"><div className="brandico">D</div><div className="brandcopy">Delta TV<small>PORTAL DO PARCEIRO</small></div><button type="button" className="close mobile-close" aria-label="Fechar menu" onClick={()=>setMobileMenu(false)}><Icon name="x" size={20}/></button></div>
  <button type="button" className="easy-mode-button" aria-pressed={!simpleMode} onClick={()=>setSimpleMode(v=>!v)}>{simpleMode?"⚙ Mostrar todas as opções":"✓ Usar menu simples"}</button>
  <nav className="nav" aria-label="Navegação do parceiro">{NAV_GROUPS.map(group=><div key={group.label} className="partner-nav-group"><span className="partner-nav-label">{group.label}</span>{group.items.filter(([id])=>(id!=="studio"||studioApps.length>0)&&(!simpleMode||SIMPLE_PARTNER.has(id)||screen===id)).map(([id,name,ico])=><button type="button" className={screen===id?"active":""} aria-current={screen===id?"page":undefined} key={id} data-help-target={({overview:"home", account:"profile", "white-label":"apps", studio:"studio", servers:"servers", codes:"codes", devices:"devices", licenses:"licenses", billing:"billing", notifications:"notifications", help:"help"})[id] || undefined} onClick={()=>navigate(id)}><span className="nav-icon"><Icon name={ico} size={19}/></span><span className="nav-text">{name}</span>{id==="notifications"&&showBadge&&unread>0&&<b className="nav-count">{unread}</b>}{screen===id&&<Icon name="chevronRight" size={14} className="nav-chevron"/>}</button>)}</div>)}</nav>
  <div className="sidefoot"><span className={`side-status-dot ${data.monitorEnabled?"is-on":""}`}/><div><span>Monitoramento</span><b>{data.monitorEnabled?"Ativado":"Desativado"}</b></div></div>
 </aside>
 <section className="main"><header className="app-header"><div className="header-left"><button type="button" className="partner-menu" aria-label="Abrir menu" onClick={()=>setMobileMenu(true)}><Icon name="menu" size={21}/></button><div className="page-heading"><div className="eyebrow"><span className="eyebrow-dot"/>{data.servicePlan?.features?.label||"PARCEIRO DE CONTEÚDO"}</div><h1>{SCREEN_TITLES[screen]||"Painel do parceiro"}</h1><p className="page-subtitle">{SCREEN_SUBTITLES[screen]||"Gerencie sua parceria"}</p></div></div><div className="topright"><button type="button" className="easy-mode-button" aria-pressed={!simpleMode} onClick={()=>setSimpleMode(v=>!v)}>{simpleMode?"Modo simples · mostrar tudo":"Modo completo · simplificar"}</button><button type="button" className="header-refresh" data-help-target="context-help" onClick={()=>window.dispatchEvent(new CustomEvent("deltatv-help-context",{detail:{screen}}))}>? Ajuda</button><button type="button" className="header-refresh" onClick={refresh} title="Atualizar informações"><Icon name="refresh" size={18}/><span>Atualizar</span></button><button type="button" className="header-notifications" aria-label={`Notificações${unread?` (${unread} não lidas)`:""}`} onClick={()=>navigate("notifications")}><Icon name="bell" size={19}/>{showBadge&&unread>0&&<span className="notif-dot"/>}</button><div className="profile-wrap"><button type="button" className="profile-trigger" aria-haspopup="menu" aria-expanded={profileMenu} onClick={()=>setProfileMenu(v=>!v)}><span className="avatar">{profileDetails?.profile?.avatarData?<img src={profileDetails.profile.avatarData} className="profile-menu-avatar" alt=""/>:(user.name||user.email||"P")[0].toUpperCase()}</span><span className="profile-identity"><b>{user.name||"Parceiro"}</b><small>Minha conta</small></span><Icon name="chevron" size={16}/></button>{profileMenu&&<><button type="button" className="profile-dismiss" aria-label="Fechar menu da conta" onClick={()=>setProfileMenu(false)}/><div className="profile-popover" role="menu"><div className="profile-popover-title"><b>{user.name||"Parceiro"}</b><span>{user.email||"Conta de parceiro"}</span></div><button role="menuitem" onClick={()=>navigate("account")}><Icon name="account" size={17}/> Meu perfil</button><button role="menuitem" className="logout-item" onClick={signOut}><Icon name="logout" size={17}/> Sair da conta</button></div></>}</div></div></header>
 <div className="body">
 {simpleMode && screen!=="overview" && <EasyPageGuide role="partner" page={screen} onBack={()=>navigate("overview")}/>}
 <HelpExperience screen={screen} portal="content" userId={user.id} onNavigate={navigate}/>
 {screen==="overview"&&<EasyStart role="partner" onNavigate={navigate}/>}
 {error&&<div className="alert">{error}</div>}
 {showUnread&&unread>0&&screen!=="notifications"&&<div className="partner-unread" role="status"><span className="alert-content"><Icon name="bell" size={20}/> Você tem <b>{unread} comunicado(s) não lido(s)</b> da Delta TV.</span><button className="primary" onClick={()=>navigate("notifications")}>Ver mensagens</button></div>}
 {data.providers.some(p=>["slow","suspect","down"].includes(p.health?.state))&&! ["servers","monitor"].includes(screen)&&<div className="partner-alert" role="status"><span className="alert-content"><Icon name="alert" size={20}/> Há servidores da sua parceria com lentidão ou indisponibilidade.</span><button className="outline" onClick={()=>navigate("monitor")}>Ver monitoramento</button></div>}
 {!data.monitorEnabled&&["overview","servers","monitor"].includes(screen)&&<div className="notice">O monitor automático está desligado. Solicite à administração a ativação do monitoramento.</div>}
 {screen==="support"&&<SupportCenter base="/partner"/>}
 {screen==="customers"&&<Customers/>}
 {screen==="licenses"&&<LicensesAndActivations/>}
 {screen==="web"&&<WebPlayer/>}
 {screen==="white-label"&&<WhiteLabelApps/>}
 {screen==="studio"&&studioApps.length>0&&<AppearanceStudio apps={studioApps}/>}
 {screen==="credits"&&<CreditsLedger/>}
 {screen==="notifications"&&<Messages onUnread={setUnread}/>}
 {screen==="access"&&<AccessHistory/>}
 {screen==="billing"&&<BillingHistory/>}
 {screen==="downloads"&&<AppDownloads/>}
 {screen==="account"&&<PartnerAccount/>}
 {screen==="monitor"&&<><div className="heading"><p>Estado e latência dos servidores da sua parceria. A consulta usa medições já coletadas pelo backend e não gera novas sondagens.</p><button className="outline" onClick={refresh}>Atualizar</button></div><div className="cards">{data.providers.map(s=><article className="servercard" key={s.id}><div className="between"><h3>{s.name}</h3><State health={s.health}/></div><p className="break">{s.baseUrl}</p><div className="two"><span>Latência</span><b>{s.health?.latencyMs!=null?`${s.health.latencyMs} ms`:"Sem medição"}</b></div><div className="two"><span>Disponibilidade HTTP (24h / 7d / 30d)</span><b>{['24h','7d','30d'].map(period => { const sample=s.availability?.[period]; return sample?.percent == null ? `— (${sample?.samples || 0} testes)` : `${sample.percent}% (${sample.samples} testes)`; }).join(' · ')}</b></div><div className="two"><span>Última verificação</span><b>{s.health?.lastCheckedAt?new Date(s.health.lastCheckedAt).toLocaleString("pt-BR"):"—"}</b></div>{s.health?.lastError&&<div className="errorline">{s.health.lastError}</div>}</article>)}{!data.providers.length&&<div className="empty">Nenhum servidor.</div>}</div></>}
 {screen==="commercial"&&<CommercialOverview/>}
 {screen==="devices"&&<PartnerDevices/>}
 {screen==="overview"&&<><CommercialOverview/><div className="stats"><div className="stat"><small>Servidores cadastrados</small><strong>{data.providers.length}</strong><span>Da sua parceria</span></div><div className="stat"><small>Servidores saudáveis</small><strong className="green">{data.providers.filter(p=>p.health?.state==="healthy").length}</strong><span>Verificados pelo monitor</span></div><div className="stat"><small>Em falha</small><strong className="red">{data.providers.filter(p=>p.health?.state==="down").length}</strong><span>Falhas confirmadas</span></div><div className="stat"><small>Códigos de parceria</small><strong>{data.totalCodes??0}</strong><span>Consulta paginada</span></div></div><div className="panel"><div className="panelhead"><div><h2>Saúde dos servidores</h2><p>Tempo de resposta e disponibilidade</p></div><button onClick={()=>setScreen("servers")}>Ver servidores</button></div><div className="entries">{data.providers.map(s=><div className="entry" key={s.id}><div className={`serverdot ${s.health?.state||"unknown"}`}/><div className="grow"><b>{s.name}</b><small className="break">{s.baseUrl}</small></div><div className="latency">{s.health?.latencyMs!=null?`${s.health.latencyMs} ms`:"—"}</div><State health={s.health}/></div>)}{!data.providers.length&&<div className="empty">Nenhum servidor cadastrado.</div>}</div></div></>}
 {screen==="servers"&&<><div className="heading"><p>Cadastre URLs alternativas e monitore a resposta de cada servidor. Não confunda disponibilidade HTTP com reprodução garantida.</p><button className="primary" data-help-target="add-server" onClick={()=>setForm({name:"",baseUrl:"",priority:0,status:"active"})}>+ Adicionar servidor</button></div><div className="cards">{data.providers.map(s=><article className="servercard" key={s.id}><div className="between"><div className="iconglow"><Icon name="server" size={22}/></div><State health={s.health}/></div><h3>{s.name}</h3><p className="break">{s.baseUrl}</p><div className="two"><span>Latência</span><b>{s.health?.latencyMs!=null?`${s.health.latencyMs} ms`:"—"}</b></div><div className="two"><span>Prioridade configurada</span><b>{s.priority}</b></div><div className="two"><span>Prioridade em tempo real</span><b>#{s.effectivePriority||"—"} {data.autoPriority?"(automática)":"(manual)"}</b></div><div className="two"><span>Disponibilidade HTTP (24h / 7d / 30d)</span><b>{['24h','7d','30d'].map(period => { const sample=s.availability?.[period]; return sample?.percent == null ? `— (${sample?.samples || 0} testes)` : `${sample.percent}% (${sample.samples} testes)`; }).join(' · ')}</b></div><div className="two"><span>Última verificação</span><b>{s.health?.lastCheckedAt?new Date(s.health.lastCheckedAt).toLocaleString("pt-BR"):"—"}</b></div>{s.health?.lastError&&<div className="errorline">{s.health.lastError}</div>}<button className="outline wide" onClick={()=>setForm(s)}>Editar servidor</button><button className="revoke" onClick={async()=>{if(!confirm(`Excluir o servidor ${s.name}? Códigos vinculados podem impedir a exclusão.`))return;try{await api(`${BASE}/servers/${s.id}`,{method:"DELETE"});refresh()}catch(e){setError(e.message)}}}>Excluir servidor</button>
 {data.servicePlan?.features?.detailedHistory&&<button className="outline wide" onClick={()=>showHistory(s)}>Histórico de quedas (Premium)</button>}</article>)}{!data.providers.length&&<div className="empty">Adicione o primeiro servidor para começar.</div>}</div></>}
 {screen==="codes"&&<>
  <div className="heading"><p>Seu plano permite {maxCodeServers == null ? "URLs ilimitadas" : `até ${maxCodeServers} URL(s)`} por código. {data.servicePlan?.features?.autoFailover?"Failover automático disponível.":"Failover automático não incluído."} A seleção é verificada no backend.</p>
    <input className="search" value={search} onChange={e=>{setSearch(e.target.value);setCodePage(1)}} placeholder="Buscar código ou descrição"/>
    <button className="primary" data-help-target="new-code" onClick={()=>setCodeForm({code:"",label:"",providerId:data.providers.find(p=>p.status==="active")?.id||""})}>+ Novo código</button>
  </div>
  <div className="panel codepanel"><div className="codeheads"><b>Código</b><b>Descrição</b><b>Servidores do código</b><b>Status</b></div>
   {visibleCodes.map(c=><div className="coderow" key={c.id}>
    <div><small className="m-label">Código</small><b className="mono">{c.code}</b></div>
    <div><small className="m-label">Descrição</small>{c.label||"Sem descrição"}</div>
    <div><small className="m-label">URLs vinculadas</small><div className="code-actions"><span className="pill checking">{c.serverIds.length} URL(s)</span><span className={`pill ${c.allowWebIssuance?"healthy":"checking"}`}>{c.allowWebIssuance?"Player Web liberado":"Player Web restrito"}</span>
      {canPoolEdit&&<button className="outline" onClick={()=>setPoolForm({id:c.id,code:c.code,serverIds:[...c.serverIds]})}>Configurar URLs</button>}<span className="pill checking">{c.credits?.available||0} créditos · {c.activationCount||0}{c.maxActivations!=null?`/${c.maxActivations}`:""} ativações</span><button className="outline" onClick={()=>setAllocation(c)}>Alocar créditos</button><button className="outline" onClick={()=>setEditCode({id:c.id,code:c.code,label:c.label||"",maxActivations:c.maxActivations??"",allowWebIssuance:!!c.allowWebIssuance,originalExpiresAt:c.expiresAt||null,expiresAt:c.expiresAt?new Intl.DateTimeFormat("en-CA",{timeZone:"America/Sao_Paulo"}).format(new Date(c.expiresAt)):""})}>Editar código</button></div></div>
    <div><small className="m-label">Status</small><span className={`pill ${c.status==="active"?"healthy":"checking"}`}>{{active:"Ativo",revoked:"Revogado",expired:"Expirado"}[c.status]||c.status}</span>
      {c.status==="active"&&<button className="revoke" onClick={()=>revoke(c)}>Revogar</button>}</div>
   </div>)}
   {!visibleCodes.length&&<div className="empty">Nenhum código encontrado.</div>}
  </div>
  <div className="pagination"><span>{codes.count} código(s) • página {codes.page}</span>
   <div><button className="outline" disabled={codePage<=1} onClick={()=>setCodePage(v=>Math.max(1,v-1))}>Anterior</button>
    <button className="outline" disabled={codePage*25>=codes.count} onClick={()=>setCodePage(v=>v+1)}>Próxima</button></div>
  </div>
 </>}

 </div></section>{form&&<div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setForm(null)}}><form className="modal" onSubmit={saveServer}><div className="between"><h2>{form.id?"Editar servidor":"Novo servidor"}</h2><button type="button" className="close" onClick={()=>setForm(null)}>×</button></div><Label>Nome do servidor</Label><input required maxLength="120" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Label>URL base do servidor</Label><input required type="url" placeholder="https://servidor.exemplo.com" value={form.baseUrl} onChange={e=>setForm({...form,baseUrl:e.target.value})}/><div className="rowfields"><div><Label>Prioridade (menor primeiro)</Label><input type="number" min="0" max="1000" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}/></div><div><Label>Situação</Label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Ativo</option><option value="disabled">Desativado</option></select></div></div><div className="modalfoot"><button type="button" className="outline" onClick={()=>setForm(null)}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Salvando…":"Salvar servidor"}</button></div></form></div>}{codeForm&&<div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setCodeForm(null)}}><form className="modal" onSubmit={createCode}><div className="between"><h2>Novo código de parceria</h2><button type="button" className="close" onClick={()=>setCodeForm(null)}>×</button></div><Label>Código (deixe vazio para gerar)</Label><input maxLength="12" placeholder="Gerar automaticamente" value={codeForm.code} onChange={e=>setCodeForm({...codeForm,code:e.target.value})}/><Label>Descrição</Label><input maxLength="120" value={codeForm.label} onChange={e=>setCodeForm({...codeForm,label:e.target.value})}/><Label>Servidor de destino</Label><select required value={codeForm.providerId} onChange={e=>setCodeForm({...codeForm,providerId:e.target.value})}><option value="">Selecione</option>{data.providers.filter(p=>p.status==="active").map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="modalfoot"><button type="button" className="outline" onClick={()=>setCodeForm(null)}>Cancelar</button><button className="primary" disabled={saving||!codeForm.providerId}>{saving?"Salvando…":"Criar código"}</button></div></form></div>}{editCode&&<div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&setEditCode(null)}><form className="modal" onSubmit={saveCode}><div className="between"><h2>Editar código {editCode.code}</h2><button className="close" type="button" onClick={()=>setEditCode(null)}>×</button></div><Label>Descrição</Label><input maxLength="120" value={editCode.label} onChange={e=>setEditCode(v=>({...v,label:e.target.value}))}/><Label>Máximo de ativações (vazio = sem limite)</Label><input type="number" min="1" value={editCode.maxActivations} onChange={e=>setEditCode(v=>({...v,maxActivations:e.target.value}))}/><label className="partner-web-switch"><input type="checkbox" checked={!!editCode.allowWebIssuance} onChange={e=>setEditCode(v=>({...v,allowWebIssuance:e.target.checked}))}/> Autorizar que revendas emitam Player Web usando este código (sem vínculo obrigatório entre contas)</label><p className="modalhelp">É necessário que o Superadmin habilite Player Web no contrato. Recomendado definir um limite de ativações e controlar o saldo do código.</p><Label>Expiração (deixe vazio para sem data)</Label><input type="date" value={editCode.expiresAt} onChange={e=>setEditCode(v=>({...v,expiresAt:e.target.value}))}/><div className="modalfoot"><button type="button" className="outline" onClick={()=>setEditCode(null)}>Cancelar</button><button className="primary" disabled={saving}>Salvar</button></div></form></div>}{allocation&&<CreditAllocationModal code={allocation} onClose={()=>setAllocation(null)} onSaved={()=>{setAllocation(null);reloadCodeList()}}/>}
 {history&&<div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setHistory(null)}}>
  <div className="modal" role="dialog" aria-modal="true" aria-label={`Histórico de ${history.name}`}>
   <div className="between"><h2>Histórico · {history.name}</h2><button type="button" className="close" onClick={()=>setHistory(null)}>×</button></div>
   <p className="modalhelp">Até 50 mudanças de estado nos últimos 30 dias. Uma verificação bem-sucedida de HTTP não garante reprodução do catálogo.</p>
   {history.loading?<p>Carregando…</p>:history.error?<div className="alert">{history.error}</div>:
     !history.data.length?<div className="empty">Nenhuma mudança de estado registrada.</div>:
     <div className="servers-picker">{history.data.map(e=><div className="server-option" key={e.id}>
      <div className="grow"><b>{new Date(e.occurredAt).toLocaleString("pt-BR")}</b><small>{e.note||"Estado atualizado pelo monitor"}</small></div>
      <span className={`pill ${e.state}`}>{healthNames[e.state]||e.state}</span>
     </div>)}</div>}
   <div className="modalfoot"><button className="outline" onClick={()=>setHistory(null)}>Fechar</button></div>
  </div>
 </div>}
 {poolForm&&<div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setPoolForm(null)}}>
  <form className="modal" onSubmit={savePool}>
   <div className="between"><div><h2>Servidores do código {poolForm.code}</h2><p className="modalhelp">Escolha {maxCodeServers == null ? "quantas URLs equivalentes precisar" : `entre 1 e ${maxCodeServers} URLs equivalentes`}. O backend valida os limites do plano e a compatibilidade das credenciais.</p></div>
    <button type="button" className="close" onClick={()=>setPoolForm(null)}>×</button></div>
   <div className="servers-picker">{data.providers.filter(p=>p.status==="active").map(p=><label key={p.id} className={`server-option ${poolForm.serverIds.includes(p.id)?"selected":""}`}>
    <input type="checkbox" checked={poolForm.serverIds.includes(p.id)} onChange={()=>toggleServer(p.id)}/>
    <div className="grow"><b>{p.name}</b><small className="break">{p.baseUrl}</small></div>
    <div className="server-status"><State health={p.health}/><small>{p.health?.latencyMs!=null?`${p.health.latencyMs}ms`:"Sem medição"}</small></div>
   </label>)}</div>
   <p className="modalhelp">{poolForm.serverIds.length} URL(s) selecionada(s) · {maxCodeServersLabel} permitidas. Ordem de seleção define a URL padrão; o monitor prioriza as saudáveis e mais rápidas.</p>
   <div className="modalfoot"><button type="button" className="outline" onClick={()=>setPoolForm(null)}>Cancelar</button>
    <button className="primary" disabled={saving||poolForm.serverIds.length<1||(maxCodeServers !== null && poolForm.serverIds.length>maxCodeServers)}>{saving?"Salvando…":"Salvar URLs"}</button></div>
  </form>
 </div>}</div>;
}

/** O formulário público tem prioridade absoluta sobre a sessão já existente. */
export default function App() {
 const [invite,setInvite]=useState(INITIAL_INVITE);
 useEffect(()=>{
  const onLocationChange=()=>{const request=consumeInviteRequest();if(request)setInvite(request)};
  window.addEventListener("popstate",onLocationChange);
  window.addEventListener("hashchange",onLocationChange);
  return()=>{
   window.removeEventListener("popstate",onLocationChange);
   window.removeEventListener("hashchange",onLocationChange);
  };
 },[]);
 if(invite)return <InviteRegistration token={invite.token} onBack={()=>setInvite(null)}/>;
 return <PartnerPortalApp/>;
}
