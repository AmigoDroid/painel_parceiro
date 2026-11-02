import React,{useEffect,useState,useCallback} from "react";
import { api,login,logout,getAuth } from "./api.js";
import {CommercialOverview,PartnerDevices,CreditAllocationModal} from "./Commercial.jsx";
const BASE="/content-partner";
const Label=({children})=><label className="label">{children}</label>;
const healthNames={healthy:"Saudável",slow:"Lento",down:"Indisponível",suspect:"Falha detectada",checking:"Em verificação",unknown:"Aguardando"};
function State({health}) { const state=health?.state||"unknown";return <span className={`pill ${state}`}>{healthNames[state]||state}</span> }
export default function App(){
 const [user,setUser]=useState(getAuth()?.user||null),[screen,setScreen]=useState("overview");
 const [data,setData]=useState({providers:[],codes:[],monitorEnabled:false}),[loading,setLoading]=useState(false),[error,setError]=useState("");
 const [saving,setSaving]=useState(false),[form,setForm]=useState(null),[codeForm,setCodeForm]=useState(null),[search,setSearch]=useState("");
 const [credentials,setCredentials]=useState({email:"",password:""});
 const [poolForm,setPoolForm]=useState(null);
 const [allocation,setAllocation]=useState(null);
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
 useEffect(()=>{if(!user)return;void refresh();const id=setInterval(()=>{void refresh()},30000);return()=>clearInterval(id)},[user,refresh]);
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
 const signOut=async()=>{await logout();setUser(null);setData({providers:[],codes:[],monitorEnabled:false})};
 const saveServer=async e=>{e.preventDefault();setSaving(true);setError("");try{const body={name:form.name,baseUrl:form.baseUrl,priority:Number(form.priority)||0,status:form.status};
 await api(BASE+(form.id?`/servers/${form.id}`:"/servers"),{method:form.id?"PATCH":"POST",body});setForm(null);await refresh();}catch(e){setError(e.message)}finally{setSaving(false)}};
 const createCode=async e=>{e.preventDefault();setSaving(true);setError("");try{await api(BASE+"/codes",{method:"POST",body:{code:codeForm.code||undefined,label:codeForm.label||undefined,providerId:codeForm.providerId}});setCodeForm(null);reloadCodeList()}catch(e){setError(e.message)}finally{setSaving(false)}};
 const revoke=async c=>{if(!window.confirm(`Revogar o código ${c.code}? Dispositivos já ativados permanecem ativos.`))return;try{await api(`${BASE}/codes/${c.id}/revoke`,{method:"POST"});reloadCodeList()}catch(e){setError(e.message)}};
 const visibleCodes=codes.rows;
 if(!user)return <main className="loginwrap"><form className="login" onSubmit={signIn}><div className="brandico">D</div><h1>Delta TV <span>Parceiros</span></h1><p>Servidores, parcerias e disponibilidade em um só lugar.</p><Label>E-mail</Label><input type="email" required autoComplete="username" value={credentials.email} onChange={e=>setCredentials({...credentials,email:e.target.value})} placeholder="seu@email.com"/><Label>Senha</Label><input type="password" required autoComplete="current-password" value={credentials.password} onChange={e=>setCredentials({...credentials,password:e.target.value})} placeholder="••••••••"/>{error&&<div className="alert">{error}</div>}<button disabled={loading} className="primary wide">{loading?"Entrando…":"Entrar no painel"}</button><small>Uso exclusivo dos parceiros de conteúdo Delta TV.</small></form></main>;
 return <div className="shell"><aside className="aside"><div className="logo"><div className="brandico">D</div><div>Delta TV<small>Painel do parceiro</small></div></div><div className="nav">{[["overview","Visão geral","◫"],["commercial","Licenças e créditos","◈"],["devices","Dispositivos","▣"],["servers","Servidores","▤"],["codes","Códigos de parceria","⌗"]].map(([id,n,ico])=><button className={screen===id?"active":""} key={id} onClick={()=>{setScreen(id);setForm(null);}}><span>{ico}</span> {n}</button>)}</div><div className="sidefoot">Monitoramento de conectividade <b>{data.monitorEnabled?"Ativado":"Desativado"}</b></div></aside><section className="main"><header><div><div className="eyebrow">{data.servicePlan?.features?.label||"PARCEIRO DE CONTEÚDO"}</div><h1>{screen==="overview"?"Visão geral":screen==="servers"?"Servidores":screen==="codes"?"Códigos de parceria":screen==="devices"?"Dispositivos":"Licenças e créditos"}</h1></div><div className="topright"><button className="subtle" onClick={refresh}>↻ Atualizar</button><div className="avatar">{(user.name||"P")[0].toUpperCase()}</div><button className="subtle" onClick={signOut}>Sair</button></div></header><nav className="mobilenav">{[["overview","Resumo"],["commercial","Créditos"],["devices","Dispositivos"],["servers","Servidores"],["codes","Códigos"]].map(([id,t])=><button key={id} className={screen===id?"active":""} onClick={()=>setScreen(id)}>{t}</button>)}</nav><div className="body">
 {error&&<div className="alert">{error}</div>}
 {!data.monitorEnabled&&<div className="notice">O monitor automático está desligado. Ative-o no backend após testar as verificações e o SMTP.</div>}
 {screen==="commercial"&&<CommercialOverview/>}
 {screen==="devices"&&<PartnerDevices/>}
 {screen==="overview"&&<><CommercialOverview/><div className="stats"><div className="stat"><small>Servidores cadastrados</small><strong>{data.providers.length}</strong><span>Da sua parceria</span></div><div className="stat"><small>Servidores saudáveis</small><strong className="green">{data.providers.filter(p=>p.health?.state==="healthy").length}</strong><span>Verificados pelo monitor</span></div><div className="stat"><small>Em falha</small><strong className="red">{data.providers.filter(p=>p.health?.state==="down").length}</strong><span>Falhas confirmadas</span></div><div className="stat"><small>Códigos de parceria</small><strong>{data.totalCodes??0}</strong><span>Consulta paginada</span></div></div><div className="panel"><div className="panelhead"><div><h2>Saúde dos servidores</h2><p>Tempo de resposta e disponibilidade</p></div><button onClick={()=>setScreen("servers")}>Ver servidores</button></div><div className="entries">{data.providers.map(s=><div className="entry" key={s.id}><div className="serverdot"/><div className="grow"><b>{s.name}</b><small className="break">{s.baseUrl}</small></div><div className="latency">{s.health?.latencyMs!=null?`${s.health.latencyMs} ms`:"—"}</div><State health={s.health}/></div>)}{!data.providers.length&&<div className="empty">Nenhum servidor cadastrado.</div>}</div></div></>}
 {screen==="servers"&&<><div className="heading"><p>Cadastre URLs alternativas e monitore a resposta de cada servidor. Não confunda disponibilidade HTTP com reprodução garantida.</p><button className="primary" onClick={()=>setForm({name:"",baseUrl:"",priority:0,status:"active"})}>+ Adicionar servidor</button></div><div className="cards">{data.providers.map(s=><article className="servercard" key={s.id}><div className="between"><div className="iconglow">▤</div><State health={s.health}/></div><h3>{s.name}</h3><p className="break">{s.baseUrl}</p><div className="two"><span>Latência</span><b>{s.health?.latencyMs!=null?`${s.health.latencyMs} ms`:"—"}</b></div><div className="two"><span>Prioridade configurada</span><b>{s.priority}</b></div><div className="two"><span>Prioridade em tempo real</span><b>#{s.effectivePriority||"—"} {data.autoPriority?"(automática)":"(manual)"}</b></div><div className="two"><span>Última verificação</span><b>{s.health?.lastCheckedAt?new Date(s.health.lastCheckedAt).toLocaleString("pt-BR"):"—"}</b></div>{s.health?.lastError&&<div className="errorline">{s.health.lastError}</div>}<button className="outline wide" onClick={()=>setForm(s)}>Editar servidor</button>
 {data.servicePlan?.features?.detailedHistory&&<button className="outline wide" onClick={()=>showHistory(s)}>Histórico de quedas (Premium)</button>}</article>)}{!data.providers.length&&<div className="empty">Adicione o primeiro servidor para começar.</div>}</div></>}
 {screen==="codes"&&<>
  <div className="heading"><p>Seu plano permite {maxCodeServers == null ? "URLs ilimitadas" : `até ${maxCodeServers} URL(s)`} por código. {data.servicePlan?.features?.autoFailover?"Failover automático disponível.":"Failover automático não incluído."} A seleção é verificada no backend.</p>
    <input className="search" value={search} onChange={e=>{setSearch(e.target.value);setCodePage(1)}} placeholder="Buscar código ou descrição"/>
    <button className="primary" onClick={()=>setCodeForm({code:"",label:"",providerId:data.providers.find(p=>p.status==="active")?.id||""})}>+ Novo código</button>
  </div>
  <div className="panel codepanel"><div className="codeheads"><b>Código</b><b>Descrição</b><b>Servidores do código</b><b>Status</b></div>
   {visibleCodes.map(c=><div className="coderow" key={c.id}>
    <div><small className="m-label">Código</small><b className="mono">{c.code}</b></div>
    <div><small className="m-label">Descrição</small>{c.label||"Sem descrição"}</div>
    <div><small className="m-label">URLs vinculadas</small><div className="code-actions"><span className="pill checking">{c.serverIds.length} URL(s)</span>
      {canPoolEdit&&<button className="outline" onClick={()=>setPoolForm({id:c.id,code:c.code,serverIds:[...c.serverIds]})}>Configurar URLs</button>}<span className="pill checking">{c.credits?.available||0} créditos · {c.activationCount||0}{c.maxActivations!=null?`/${c.maxActivations}`:""} ativações</span><button className="outline" onClick={()=>setAllocation(c)}>Alocar créditos</button></div></div>
    <div><small className="m-label">Status</small><span className="pill healthy">{c.status}</span>
      {c.status==="active"&&<button className="revoke" onClick={()=>revoke(c)}>Revogar</button>}</div>
   </div>)}
   {!visibleCodes.length&&<div className="empty">Nenhum código encontrado.</div>}
  </div>
  <div className="pagination"><span>{codes.count} código(s) • página {codes.page}</span>
   <div><button className="outline" disabled={codePage<=1} onClick={()=>setCodePage(v=>Math.max(1,v-1))}>Anterior</button>
    <button className="outline" disabled={codePage*25>=codes.count} onClick={()=>setCodePage(v=>v+1)}>Próxima</button></div>
  </div>
 </>}

 </div></section>{form&&<div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setForm(null)}}><form className="modal" onSubmit={saveServer}><div className="between"><h2>{form.id?"Editar servidor":"Novo servidor"}</h2><button type="button" className="close" onClick={()=>setForm(null)}>×</button></div><Label>Nome do servidor</Label><input required maxLength="120" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/><Label>URL base do servidor</Label><input required type="url" placeholder="https://servidor.exemplo.com" value={form.baseUrl} onChange={e=>setForm({...form,baseUrl:e.target.value})}/><div className="rowfields"><div><Label>Prioridade (menor primeiro)</Label><input type="number" min="0" max="1000" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}/></div><div><Label>Situação</Label><select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="active">Ativo</option><option value="disabled">Desativado</option></select></div></div><div className="modalfoot"><button type="button" className="outline" onClick={()=>setForm(null)}>Cancelar</button><button className="primary" disabled={saving}>{saving?"Salvando…":"Salvar servidor"}</button></div></form></div>}{codeForm&&<div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setCodeForm(null)}}><form className="modal" onSubmit={createCode}><div className="between"><h2>Novo código de parceria</h2><button type="button" className="close" onClick={()=>setCodeForm(null)}>×</button></div><Label>Código (deixe vazio para gerar)</Label><input maxLength="12" placeholder="Gerar automaticamente" value={codeForm.code} onChange={e=>setCodeForm({...codeForm,code:e.target.value})}/><Label>Descrição</Label><input maxLength="120" value={codeForm.label} onChange={e=>setCodeForm({...codeForm,label:e.target.value})}/><Label>Servidor de destino</Label><select required value={codeForm.providerId} onChange={e=>setCodeForm({...codeForm,providerId:e.target.value})}><option value="">Selecione</option>{data.providers.filter(p=>p.status==="active").map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="modalfoot"><button type="button" className="outline" onClick={()=>setCodeForm(null)}>Cancelar</button><button className="primary" disabled={saving||!codeForm.providerId}>{saving?"Salvando…":"Criar código"}</button></div></form></div>}{allocation&&<CreditAllocationModal code={allocation} onClose={()=>setAllocation(null)} onSaved={()=>{setAllocation(null);reloadCodeList()}}/>}
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