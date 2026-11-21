import { useEffect, useState } from 'react';
import { api } from './api.js';

const money=cents=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(Number(cents||0)/100);
const limit=n=>n==null?'Sem limite':String(n);

export default function PlanUpgrade({onPayment,master}) {
 const [data,setData]=useState(null),[selected,setSelected]=useState(''),[quote,setQuote]=useState(null);
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const load=async()=>{setSelected('');setQuote(null);try{setData(await api('/partner/network-charges/upgrade-options'));setError('')}catch(e){setData(null);setError(e.message)}};
 useEffect(()=>{void load()},[]);
 useEffect(()=>{if(!quote)return;const onEscape=e=>{if(e.key==='Escape'&&!busy)setQuote(null)};window.addEventListener('keydown',onEscape);return()=>window.removeEventListener('keydown',onEscape)},[quote,busy]);
 const preview=async planTo=>{setBusy(true);setError('');setSelected(planTo);setQuote(null);
  try{setQuote(await api('/partner/network-charges/upgrade/preview',{method:'POST',body:{planTo}}))}
  catch(e){setError(e.message)}finally{setBusy(false)};
 };
 const selectedPlan=data?.plans.find(p=>p.key===selected);
 const pay=async()=>{if(!quote||quote.planTo!==selected)return;setBusy(true);setError('');
  try{await api('/partner/network-charges/upgrade',{method:'POST',body:{planTo:selected,previewFingerprint:quote.previewFingerprint}});onPayment()}
  catch(e){setQuote(null);setError(`${e.message} Atualize a prévia para conferir o valor.`)}finally{setBusy(false)};
 };
 return <section className="panel plan-upgrade">
  <div className="plan-market-header">
   <div><span className="plan-market-eyebrow">{master?.name?`Planos de ${master.name}`:"Planos oferecidos pelo seu Master"}</span><h2>Encontre o plano ideal para sua operação</h2>
    <p>Compare os recursos e limites dos planos que seu Master disponibilizou. Os valores são definidos pela sua rede, não pelo catálogo da DeltaTV.</p></div>
   <button className="outline" type="button" onClick={load} disabled={busy}>Atualizar planos</button>
  </div>
  {error&&<p role="alert" className="alert">{error}</p>}
  {!data&&!error&&<div className="empty">Consultando planos do seu Master…</div>}
  {data?.current&&<div className="plan-market-current"><div><span>SEU PLANO ATUAL</span><h3>{data.current.name}</h3><p>{data.current.description||'Contrato ativo da sua rede'}</p></div><strong>{data.current.contractPriceCents!=null?`${money(data.current.contractPriceCents)}/mês`:data.current.monthlyPriceCents==null?'Valor sob consulta':`${money(data.current.monthlyPriceCents)}/mês (catálogo)`}</strong></div>}
  {data&&!data.current&&<p className="commercial-info">Ainda não há um plano vinculado ao seu contrato. Consulte seu Master para definir o plano inicial.</p>}
  {data&&!data.available&&data.current&&<p className="commercial-info">{data.reason||'Seu contrato não permite upgrade automático neste momento. Para alterar seu plano, fale com seu Master.'}</p>}
  {data&&data.plans.length===0&&<p className="commercial-info">Seu Master ainda não disponibilizou planos públicos para contratação. Entre em contato para conhecer as opções.</p>}
  {data?.plans.length>0&&<div className="plan-market-intro"><div><h3>Planos disponíveis na sua rede</h3><p>Você pode comparar todos os planos publicados. Planos com preço maior que o atual podem ser contratados como upgrade, desde que seu contrato permita. Confira os recursos antes de pagar.</p></div><span>{data.plans.length} {data.plans.length===1?'plano':'planos'}</span></div>}
  <div className="plan-market-grid">{data?.plans.map(p=><article className={`plan-market-card${p.isCurrent?' is-current':''}${p.canUpgrade?' is-upgrade':''}`} key={p.key}>
   <div className="plan-market-card-top"><span className="plan-market-tag">{p.isCurrent?'Plano atual':p.canUpgrade?'Upgrade disponível':'Consulte o Master'}</span><h3>{p.name}</h3><p>{p.description||'Plano disponibilizado pelo seu Master.'}</p></div>
   <div className="plan-market-price"><strong>{p.monthlyPriceCents==null?'Sob consulta':money(p.monthlyPriceCents)}</strong>{p.monthlyPriceCents!=null&&<span>/ mês</span>}</div>
   <div className="plan-market-divider"/>
   <dl className="plan-market-features">
    <div><dt>DNS por código</dt><dd>{limit(p.maxServers)}</dd></div>
    <div><dt>Ativações</dt><dd>{limit(p.activationLimit)}</dd></div>
    <div><dt>Validade do plano</dt><dd>{p.validityDays} dias</dd></div>
    <div><dt>Failover automático</dt><dd className={p.autoFailover?'is-included':''}>{p.autoFailover?'Incluído':'Não incluído'}</dd></div>
    <div><dt>Prioridade automática de DNS</dt><dd className={p.autoPriority?'is-included':''}>{p.autoPriority?'Incluído':'Não incluído'}</dd></div>
    <div><dt>Alertas por e-mail</dt><dd className={p.emailAlerts?'is-included':''}>{p.emailAlerts?'Incluído':'Não incluído'}</dd></div>
    <div><dt>Histórico detalhado</dt><dd className={p.detailedHistory?'is-included':''}>{p.detailedHistory?'Incluído':'Não incluído'}</dd></div>
    {p.canResellPanel&&<div><dt>Revenda do painel</dt><dd className="is-included">Incluída</dd></div>}
    {p.canCreateSubmasters&&<div><dt>Criar Submasters</dt><dd className="is-included">Incluído</dd></div>}
    {p.canViewFinance&&<div><dt>Consultas financeiras</dt><dd className="is-included">Incluídas</dd></div>}
    {p.canManageGateways&&<div><dt>Gateways próprios</dt><dd className="is-included">Incluídos</dd></div>}
   </dl>
   <div className="plan-market-action">
    {p.canUpgrade?<button className="primary" type="button" disabled={busy} onClick={()=>preview(p.key)}>Fazer upgrade</button>
     :<span>{p.isCurrent?'Você já utiliza este plano':'Para contratar ou reduzir o plano, fale com seu Master'}</span>}
   </div>
  </article>)}</div>
  {quote&&<div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget&&!busy)setQuote(null)}}>
   <div className="modal upgrade-confirm" role="dialog" aria-modal="true" aria-labelledby="upgrade-dialog-title" aria-describedby="upgrade-dialog-description">
    <div className="between"><h2 id="upgrade-dialog-title">Confirmar upgrade</h2><button type="button" className="close" aria-label="Fechar confirmação" autoFocus disabled={busy} onClick={()=>setQuote(null)}>×</button></div>
    <p>Plano escolhido: <strong>{selectedPlan?.name}</strong></p>
    {selectedPlan?.monthlyPriceCents!=null&&<p>Mensalidade do novo plano: <strong>{money(selectedPlan.monthlyPriceCents)}</strong>.</p>}
    <p id="upgrade-dialog-description">Valor proporcional a pagar agora: <strong>{money(quote.amountCents)}</strong>.</p>
    <p>Seu plano só será alterado após a confirmação do pagamento. Você será encaminhado às cobranças para pagar.</p>
    <div className="modalfoot"><button className="outline" type="button" disabled={busy} onClick={()=>setQuote(null)}>Cancelar</button><button className="primary" type="button" disabled={busy} onClick={pay}>{busy?'Processando…':'Gerar cobrança e pagar'}</button></div>
   </div>
  </div>}
  <p className="commercial-info">Não é possível trocar para um plano inferior por esta tela. Para downgrade, entre em contato com seu <strong>Master</strong>.</p>
 </section>;
}
