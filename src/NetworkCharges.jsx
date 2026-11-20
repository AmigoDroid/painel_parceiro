import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { qrMatrix } from './qr.js';
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(n||0)/100);
const status={pending:'Aguardando pagamento',paid:'Pago',cancelled:'Cancelado',expired:'Expirado',review:'Em conciliação',failed:'Falhou',creating:'Preparando',needs_review:'Pagamento em conferência'};
function LocalQr({value}){
 const matrix=useMemo(()=>{try{return value?qrMatrix(value):[]}catch{return []}},[value]);
 const size=matrix.length;
 if(!size)return <p role="alert">QR indisponível. Utilize o código de pagamento abaixo.</p>;
 return <svg aria-label="Código QR de pagamento" role="img" viewBox={`-4 -4 ${size+8} ${size+8}`} width="220" height="220" style={{maxWidth:'100%',background:'#fff',padding:10}} shapeRendering="crispEdges">
  <rect x={-4} y={-4} width={size+8} height={size+8} fill="#fff"/>
  {matrix.flatMap((row,y)=>row.map((on,x)=>on?<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#000"/>:null))}
 </svg>;
}
export default function NetworkCharges(){
 const [charges,setCharges]=useState([]),[pricing,setPricing]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[copyMsg,setCopyMsg]=useState('');
 const reload=async()=>{setBusy(true);try{const res=await api('/partner/network-charges');setCharges(res.data||[]);try{setPricing(await api('/partner/network-charges/pricing'))}catch{setPricing(null)}setError('')}catch(e){setError(e.message)}finally{setBusy(false)}};
 useEffect(()=>{void reload()},[]);
 // Atualiza a situação ao retornar do checkout e enquanto houver cobrança aguardando confirmação.
 const hasPending=charges.some(c=>['creating','pending'].includes(c.status));
 useEffect(()=>{if(!hasPending)return;
  const refresh=()=>{if(!document.hidden)void reload()};
  const timer=setInterval(refresh,20000);window.addEventListener('focus',refresh);
  return()=>{clearInterval(timer);window.removeEventListener('focus',refresh)};
 },[hasPending]);
 const copy=async value=>{try{await navigator.clipboard.writeText(value);setCopyMsg('Copiado.')}catch{setCopyMsg('Não foi possível copiar automaticamente. Selecione o texto abaixo.')}};
 return <section><div className="heading"><h2>Cobranças e pagamentos da minha conta</h2><button className="outline" onClick={reload} disabled={busy}>Atualizar pagamentos</button></div>
 <p>As cobranças são registradas pelo seu Master. O acesso só é prorrogado depois da confirmação do recebimento.</p>
 {pricing&&<article className="servercard"><h3>Meu plano{pricing.planName?` · ${pricing.planName}`:""} — condições da renovação</h3><p>{pricing.conditions}</p>
   {pricing.renewalAvailable===false&&<p role="status"><strong>Plano reservado ao Master.</strong> {pricing.reason}</p>}
   {pricing.renewalAvailable!==false&&<>
   {pricing.breakdown?.earlyDiscountCents>0&&<strong>Antecipe o pagamento até {new Date(pricing.earlyDiscountDeadline).toLocaleDateString('pt-BR',{timeZone:'America/Sao_Paulo'})} e economize {money(pricing.breakdown.earlyDiscountCents)}: renovação por {money(pricing.amountCents)}.</strong>}
   <div>Conta estimada hoje: {money(pricing.amountCents)}. O valor definitivo será confirmado antes de gerar uma cobrança.</div></>}</article>}
 {error&&<div role="alert" className="alert">{error}</div>}{copyMsg&&<p role="status">{copyMsg}</p>}
 <div className="cards two-cols">{charges.map(c=>{
  const text=c.pixCode||c.checkoutUrl||'';
  return <article className="servercard" key={c.id}><div className="between"><b>{c.kind==='one_off'?`Cobrança avulsa · ${c.description||'Serviço adicional'}`:`${c.kind==='renewal'?'Renovação':'Upgrade'} · ${c.planTo}`}</b><span className={`pill ${c.status==='paid'?'active':'checking'}`}>{status[c.status]||c.status}</span></div>
   <p><strong>{money(c.amountCents)}</strong></p>{c.breakdown?.totalCents>0&&<div aria-label="Composição da cobrança">
    <div>{c.kind==='one_off'?'Serviço':'Plano/base'}: {money(c.breakdown.baseCents)}</div>
    {c.breakdown.earlyDiscountCents>0&&<div>Desconto antecipado: −{money(c.breakdown.earlyDiscountCents)}</div>}
    {c.breakdown.manualDiscountCents>0&&<div>Desconto concedido: −{money(c.breakdown.manualDiscountCents)}</div>}
    {c.breakdown.lateFeeCents>0&&<div>Multa {c.breakdown.lateFeePct}%: {money(c.breakdown.lateFeeCents)}</div>}
    {c.breakdown.interestCents>0&&<div>Juros de {c.breakdown.daysLate} dia(s): {money(c.breakdown.interestCents)}</div>}
    {(c.breakdown.waiverFeeCents+c.breakdown.waiverInterestCents)>0&&<div>Abono de encargos: −{money(c.breakdown.waiverFeeCents+c.breakdown.waiverInterestCents)}</div>}
    <div><b>Total: {money(c.breakdown.totalCents)}</b></div></div>}
   <p>Vence em {new Date(c.expiresAt).toLocaleString('pt-BR')}</p>
   {text&&<div style={{display:'grid',gap:12,justifyItems:'start'}}><LocalQr value={text}/><p>{c.pixCode?'Pix copia e cola':'QR do checkout seguro. O texto abaixo é um link, não um código Pix BR.'}</p>
    <textarea className="break" aria-label={c.pixCode?'Pix copia e cola':'Link de pagamento'} value={text} readOnly rows={3} style={{width:'100%',maxWidth:430}}/>
    <button className="primary" type="button" onClick={()=>copy(text)}>{c.pixCode?'Copiar Pix':'Copiar link de pagamento'}</button>
    {c.checkoutUrl&&<a className="outline" href={c.checkoutUrl} target="_blank" rel="noopener noreferrer">Abrir pagamento</a>}
   </div>}
   {c.status==='pending'&&!text&&<p>Aguardando conferência manual pelo responsável da rede.</p>}
  </article>})}</div>
 {!charges.length&&!busy&&<p>Nenhuma cobrança registrada.</p>}
 </section>;
}
