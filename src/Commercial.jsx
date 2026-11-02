import React,{useCallback,useEffect,useState} from "react";
import {api} from "./api.js";
const BASE="/content-partner";
const MODES={legacy:"Contrato anterior (sem consumo)",credits:"Créditos por ativação",fixed_unlimited:"Mensalidade fixa · ilimitadas",fixed_limited:"Mensalidade fixa · limite contratado"};
export const fmt=(n)=>new Intl.NumberFormat("pt-BR").format(Number(n)||0);
const money=(c)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format((Number(c)||0)/100);
export function CommercialOverview(){
 const [data,setData]=useState(null),[plan,setPlan]=useState(null),[error,setError]=useState("");
 const load=useCallback(()=>Promise.all([api(BASE+"/commercial"),api(BASE+"/service-plan")]).then(([d,p])=>{setData(d);setPlan(p)}).catch(e=>setError(e.message)),[]);
 useEffect(()=>{void load()},[load]);
 return <div className="panel commerce"><div className="panelhead"><div><h2>Contrato e licenças</h2><p>Condições definidas pela administração da Delta TV</p></div><button className="outline" onClick={load}>Atualizar</button></div>
  {error&&<div className="alert">{error}</div>}
  {!data?<div className="empty">Carregando condições comerciais…</div>:<>
   <div className="commercial-stats">
    {[ ["Ativações em uso",fmt(data.activeDevices)], ["Créditos na carteira",fmt(data.creditBalance)], ["Alocados nos códigos",fmt(data.availableCodeCredits)], ["Créditos consumidos",fmt(data.spentCredits)] ].map(([l,n])=><div className="commercial-stat" key={l}><small>{l}</small><b>{n}</b></div>)}
   </div><div className="commercial-info"><b>Plano de recursos:</b> {plan?.features?.label||"—"} · {plan?.features?.maxServers == null ? "URLs ilimitadas" : `${plan.features.maxServers} URL(s)`} por código · Failover {plan?.features?.autoFailover?"incluído":"não incluído"}</div>
   <div className="commercial-info"><b>Modalidade comercial:</b> {MODES[data.terms.mode]||data.terms.mode}</div>
   {(data.terms.mode==="credits"||data.terms.mode==="fixed_limited")&&<div className="commercial-info"><b>Licenças/ativações restantes:</b> {fmt(data.remainingActivations)}</div>}
   {data.terms.mode==="fixed_limited"&&<div className="commercial-info"><b>Limite de ativações:</b> {fmt(data.terms.activationLimit)} · Restantes: {fmt(data.remainingActivations)}</div>}
   {data.terms.mode.startsWith("fixed_")&&<div className="commercial-info"><b>Mensalidade negociada:</b> {money(data.terms.fixedFeeCents)}</div>}
   {data.terms.mode==="credits"&&<div className="commercial-info"><b>Créditos por nova ativação:</b> {data.terms.creditsPerActivation}. Faça a reserva no código antes de ativar clientes.</div>}
   <div className="commercial-info"><b>Licença:</b> {data.terms.licensePolicy==="partner_only"?"Vinculada à parceria — perder o vínculo remove o acesso desta ativação":"Política padrão"}</div>
   <p className="hint">Licenças e ativações de outras parcerias ou licenças independentes não são afetadas por este contrato.</p>
  </>}</div>
}
export function PartnerDevices(){
 const [q,setQ]=useState(""),[page,setPage]=useState(1),[data,setData]=useState({data:[],meta:{total:0,totalPages:1}}),[error,setError]=useState(""),[busy,setBusy]=useState(null),[tick,setTick]=useState(0);
 useEffect(()=>{let cancelled=false;const timer=setTimeout(()=>{api(BASE+"/devices",{query:{q,page,pageSize:20}}).then(r=>{if(!cancelled){setData(r);setError("")}}).catch(e=>{if(!cancelled)setError(e.message)})},250);return()=>{cancelled=true;clearTimeout(timer)}},[q,page,tick]);
 const unlink=async d=>{
  if(!window.confirm(`Desvincular ${d.mac} da sua parceria? O acesso desta lista será encerrado e as credenciais apagadas. Não há reembolso automático de créditos.`))return;
  const reason=window.prompt("Motivo do desvínculo (obrigatório):", "Cliente saiu da parceria");if(!reason||reason.trim().length<3)return;
  setBusy(d.id);try{await api(`${BASE}/devices/${d.id}/revoke`,{method:"POST",body:{reason}});setTick(n=>n+1)}catch(e){setError(e.message)}finally{setBusy(null)};
 };
 return <section><div className="heading"><p>Ativações dos códigos desta parceria. Pesquisa no servidor e páginas de 20 para economizar memória.</p><input className="search" placeholder="Buscar MAC" value={q} onChange={e=>{setQ(e.target.value);setPage(1)}}/></div>
  {error&&<div className="alert">{error}</div>}
  <div className="device-list">{data.data.map(d=><article className="device-row" key={d.id}>
   <div className="device-top"><b className="mono break">{d.mac}</b><span className={`pill ${d.status==="active"?"healthy":d.status==="blocked"?"suspect":"down"}`}>{d.status}</span></div>
   <div className="device-meta"><div><small>Código</small><strong>{d.code||"Não informado"}</strong></div><div><small>Ativado em</small><strong>{new Date(d.activatedAt).toLocaleString("pt-BR")}</strong></div><div><small>Origem da licença</small><strong>{d.licenseSource==="reseller_stock"?"Estoque de revenda":"Parceria"}</strong></div></div>
   {d.status!=="revoked"&&<button className="outline device-action" disabled={busy===d.id} onClick={()=>unlink(d)}>{busy===d.id?"Processando…":"Desvincular desta parceria"}</button>}
  </article>)}{!data.data.length&&<div className="empty">Nenhum dispositivo encontrado.</div>}</div>
  <div className="pagination"><span>{fmt(data.meta.total)} registro(s) · Página {page}/{data.meta.totalPages}</span><div><button className="outline" disabled={page<=1} onClick={()=>setPage(x=>x-1)}>Anterior</button><button className="outline" disabled={page>=data.meta.totalPages} onClick={()=>setPage(x=>x+1)}>Próxima</button></div></div>
 </section>;
}
export function CreditAllocationModal({code,onClose,onSaved}){
 const [quantity,setQuantity]=useState(1),[busy,setBusy]=useState(false),[error,setError]=useState("");
 async function save(e){e.preventDefault();setBusy(true);setError("");try{await api(`${BASE}/codes/${code.id}/credits`,{method:"POST",body:{quantity:Number(quantity)}});onSaved();}catch(e){setError(e.message)}finally{setBusy(false)}}
 return <div className="overlay" onClick={onClose}><form className="modal" onClick={e=>e.stopPropagation()} onSubmit={save}>
 <div className="between"><h2>Créditos · {code.code}</h2><button type="button" className="close" onClick={onClose}>×</button></div>
 <p className="modalhelp">Aloque créditos da carteira a este código. Digite um valor negativo para devolver somente créditos não utilizados à carteira.</p>
 <div className="commercial-info">Disponíveis neste código: <b>{code.credits?.available||0}</b> · Consumidos: {code.credits?.spent||0}</div>
 <label className="label">Quantidade (+ alocar / − devolver)</label><input required type="number" min="-100000" max="100000" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/>
 {error&&<div className="alert">{error}</div>}
 <div className="modalfoot"><button type="button" className="outline" onClick={onClose}>Cancelar</button><button className="primary" disabled={busy||!Number(quantity)}>{busy?"Salvando…":"Confirmar"}</button></div>
 </form></div>;
}
