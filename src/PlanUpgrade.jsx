import { useEffect, useState } from 'react';
import { api } from './api.js';

const money=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(cents||0)/100);
const limit=n=>n==null?'Sem limite':String(n);
export default function PlanUpgrade({onPayment}) {
 const [data,setData]=useState(null),[selected,setSelected]=useState(''),[quote,setQuote]=useState(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{try{setData(await api('/partner/network-charges/upgrade-options'));setError('')}catch(e){setError(e.message)}};
 useEffect(()=>{void load()},[]);
 const preview=async planTo=>{setBusy(true);setError('');setSelected(planTo);setQuote(null);
  try{setQuote(await api('/partner/network-charges/upgrade/preview',{method:'POST',body:{planTo}}))}
  catch(e){setError(e.message)}finally{setBusy(false)};
 };
 const pay=async()=>{if(!quote||quote.planTo!==selected)return;setBusy(true);setError('');
  try{await api('/partner/network-charges/upgrade',{method:'POST',body:{planTo:selected,previewFingerprint:quote.previewFingerprint}});onPayment()}
  catch(e){setQuote(null);setError(`${e.message} Atualize a prévia para conferir o valor.`)}finally{setBusy(false)};
 };
 return <section className="panel plan-upgrade"><div className="panelhead"><div><h2>Upgrade de plano</h2><p>Escolha um plano superior. O novo plano será aplicado após a confirmação do Pix.</p></div><button className="outline" type="button" onClick={load} disabled={busy}>Atualizar planos</button></div>
  {error&&<p role="alert" className="alert">{error}</p>}
  {!data&&!error&&<div className="empty">Consultando planos disponíveis…</div>}
  {data?.current&&<div className="commercial-info"><b>Seu plano atual:</b> {data.current.name} · {money(data.current.monthlyPriceCents)}/mês</div>}
  {data&&!data.available&&<p className="commercial-info">O upgrade automático está disponível apenas para contratos ativos sem condições personalizadas. Para alterar seu plano, fale com seu Master.</p>}
  {data?.available&&!data.plans.length&&<p className="commercial-info">Não há planos superiores disponíveis para contratação automática. Para mudança de plano, fale com seu Master.</p>}
  <div className="upgrade-grid">{data?.plans.map(p=><article className="servercard" key={p.key}><h3>{p.name}</h3><p>{p.description||'Plano da sua rede'}</p><strong>{money(p.monthlyPriceCents)}/mês</strong><div className="two"><span>DNS por código</span><b>{limit(p.maxServers)}</b></div><div className="two"><span>Ativações</span><b>{limit(p.activationLimit)}</b></div><div className="two"><span>Validade</span><b>{p.validityDays} dias</b></div><div className="two"><span>Failover</span><b>{p.autoFailover?'Incluído':'Não incluído'}</b></div><button className="primary" type="button" disabled={busy} onClick={()=>preview(p.key)}>Selecionar plano</button></article>)}</div>
  {quote&&<div className="upgrade-confirm" role="region" aria-label="Confirmar valor do upgrade"><h3>Confirmar upgrade</h3><p>Valor proporcional calculado pelo sistema: <strong>{money(quote.amountCents)}</strong>.</p><p>O plano só será alterado depois da confirmação do pagamento. Você será encaminhado às faturas para pagar.</p><button className="primary" type="button" disabled={busy} onClick={pay}>{busy?'Processando…':'Gerar cobrança e pagar'}</button></div>}
  <p className="commercial-info">Não é possível trocar para um plano inferior por esta tela. Para downgrade, entre em contato com seu <strong>Master</strong>.</p>
 </section>;
}
