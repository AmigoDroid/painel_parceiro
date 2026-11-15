import {useCallback,useEffect,useState} from 'react';
import {api} from './api.js';
const monthNow=()=>new Date().toISOString().slice(0,7);
const gb=x=>Number(x||0).toLocaleString('pt-BR',{maximumFractionDigits:3})+' GB';
const textKind={live:'TV ao vivo',hls:'Segmentos HLS',movie:'Filmes',series:'Séries',api:'Catálogo/API',epg:'EPG'};
export default function PortalUsage(){
 const [month,setMonth]=useState(monthNow),[view,setView]=useState(null),[top,setTop]=useState([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const load=useCallback(async()=>{setBusy(true);setError('');try{const query={month};const [reportResult,deviceResult]=await Promise.allSettled([
  api('/content-partner/portal-sales/usage',{query}),api('/content-partner/portal-sales/usage/devices',{query})]);
  setView(reportResult.status==='fulfilled'?reportResult.value:null);
  setTop(deviceResult.status==='fulfilled'?deviceResult.value.items||[]:[]);
  const failed=[reportResult,deviceResult].filter(r=>r.status==='rejected');
  if(failed.length)setError(failed.map(r=>r.reason?.message||'Não foi possível consultar o consumo.').join(' | '));
 }catch(ex){setView(null);setTop([]);setError(ex.message)}finally{setBusy(false)}},[month]);
 useEffect(()=>{void load()},[load]);
 return <section className="panel" style={{padding:18,display:'grid',gap:12}}>
  <h3>Consumo de infraestrutura da minha rede</h3>
  <p className="muted">Acompanhe a utilização do proxy Node pelo PlayerWeb pertencente aos seus parceiros e descendentes. Não representa compra de licenças de TV nem cobrança financeira automática.</p>
  <div style={{display:'flex',gap:10,alignItems:'end',flexWrap:'wrap'}}><label style={{display:'grid',gap:4}}>Mês (UTC)<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label><button type="button" onClick={()=>void load()} disabled={busy}>Atualizar</button></div>
  {error&&<p role="alert" className="alert">{error}</p>}
  {view&&<>
    <div className="stats" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:10}}>
     <div className="stat"><small>Saída Node medida</small><strong>{gb(view.totals.nodeGb)}</strong><span>Inclui HLS</span></div>
     <div className="stat"><small>Proxy Nginx</small><strong>{view.totals.nginxUnmeteredRequests}</strong><span>Requisições sem bytes medidos</span></div>
     <div className="stat"><small>Redirects</small><strong>{view.totals.redirectRequests}</strong><span>Mídia entregue pela origem</span></div>
    </div>
    {(view.alerts||[]).map((x,i)=><p key={i} role="status" className="notice">{x.message}</p>)}
    <h4>Consumo por parceiro da minha rede</h4>
    <div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Parceiro proprietário</th><th>GB Node</th><th>Nginx sem medição</th></tr></thead><tbody>{(view.byPartner||[]).map(x=><tr key={x.partnerId}><td><code>{x.partnerId}</code></td><td>{gb(x.nodeBytes/1e9)}</td><td>{x.nginxUnmeteredRequests}</td></tr>)}</tbody></table></div>
    <details><summary>Até 50 dispositivos com maior tráfego Node</summary><div style={{overflowX:'auto',marginTop:10}}><table><thead><tr><th>Parceiro</th><th>Dispositivo</th><th>GB Node</th></tr></thead><tbody>{top.map(x=><tr key={`${x.partnerId}/${x.deviceId}`}><td>{x.partnerId}</td><td><code>{x.deviceId}</code></td><td>{gb(x.nodeGb)}</td></tr>)}</tbody></table></div></details>
    <p className="muted">A medida é parcial: transmissões delegadas ao Nginx aparecem como não medidas. O número de requisições não representa GB ou espectadores únicos. Dados de outras redes, custos internos do Superadmin e IPs não são exibidos.</p>
   </>}
 </section>;
}
