import React,{useEffect,useState} from 'react';
import {completePortalSalesInvite,verifyPortalSalesInvite,recheckPortalSalesInvite} from './api.js';
import './invite.css';
import {formatBRL} from '@deltatv/ui/money';

const validToken=/^[A-Za-z0-9_-]{32,100}$/;
export default function CommercialInviteRegistration({token,onBack}){
 const [data,setData]=useState(null),[status,setStatus]=useState('checking'),[error,setError]=useState('');
 const [name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false),[transactionNsu,setTransactionNsu]=useState(''),[slug,setSlug]=useState('');
 useEffect(()=>{let alive=true;setData(null);setError('');setStatus('checking');
  if(!validToken.test(token)){setStatus('invalid');return()=>{alive=false};}
  verifyPortalSalesInvite(token).then(r=>{if(!alive)return;setData(r);setName(r.name||'');setStatus('valid')}).catch(()=>{if(alive)setStatus('invalid')});
  return()=>{alive=false};
 },[token]);
 const paymentDue=Boolean(data?.paymentGateway&&data.paymentStatus!=='paid');
 const recheck=async()=>{setBusy(true);setError('');try{
  const result=await recheckPortalSalesInvite({token,...(transactionNsu?{transactionNsu,slug}:{})});
  if(result.paid){setData(prev=>({...prev,paymentStatus:'paid'}));}
  else setError('Pagamento ainda não confirmado. Confira na sua conta do provedor e tente novamente.');
 }catch(e){setError(e.message||'Não foi possível verificar o pagamento.')}finally{setBusy(false)}};
 const submit=async e=>{e.preventDefault();setError('');if(password.length<12||password!==confirm){setError('A senha deve ter pelo menos 12 caracteres e coincidir com a confirmação.');return;}
  setBusy(true);try{await completePortalSalesInvite({token,companyName:name.trim(),password});setPassword('');setConfirm('');setStatus('done');
   try{sessionStorage.removeItem('delta-partner-pending-commercial-invite')}catch{}
  }catch(ex){setError(ex.message||'Não foi possível concluir o cadastro.')}finally{setBusy(false)};
 };
 return <main className="invite-wrap"><div className="invite-card"><div className="brandico" aria-hidden="true">D</div>
  <p className="invite-eyebrow">DELTA TV · ACESSO AO PAINEL DO PARCEIRO</p>
  {status==='checking'?<><h1>Validando convite comercial</h1><p>Conferindo validade do convite…</p></>
  :status==='invalid'?<><h1>Convite indisponível</h1><p role="alert">O convite expirou, já foi usado ou não é válido. Solicite outro ao seu Master.</p><button className="primary wide" onClick={onBack}>Ir para o login</button></>
  :status==='done'?<><h1>Conta criada!</h1><p>Seu acesso ao Painel do Parceiro está disponível pelo período contratado. Entre com e-mail e senha.</p><button className="primary wide" onClick={onBack}>Ir para o login</button></>
  :<><h1>Ativar acesso ao Painel do Parceiro</h1><p>Convite: <strong>{data.inviteType==='submaster'?'Submaster':'Parceiro'}</strong>, plano <strong>{data.planName}</strong>, com <strong>{data.months} mês(es)</strong> de acesso contratado.</p>
    {paymentDue&&<section className="notice" style={{display:'grid',gap:10}}>
     <strong>Pagamento necessário para liberar o cadastro</strong>
     <p>Valor: {formatBRL(data.totalCents)}. O acesso só é liberado após confirmação do recebimento.</p>
     {data.paymentGateway==='manual'&&<p>Pagamento externo: seu vendedor verificará o recebimento e confirmará no painel dele. Atualize esta página após a confirmação.</p>}
     {data.checkoutUrl&&<a className="primary wide" href={data.checkoutUrl} target="_blank" rel="noreferrer">Pagar agora pelo meu Master</a>}
     {data.pixCode&&<><label className="label">Pix copia e cola<textarea readOnly rows={3} value={data.pixCode}/></label><button type="button" className="outline" onClick={()=>navigator.clipboard?.writeText(data.pixCode)}>Copiar Pix</button></>}
     {data.paymentGateway==='infinitepay'&&<><p>Se a confirmação automática não chegar, informe os dados do retorno da InfinitePay:</p>
      <label className="label">transaction_nsu<input value={transactionNsu} onChange={e=>setTransactionNsu(e.target.value)}/></label>
      <label className="label">slug<input value={slug} onChange={e=>setSlug(e.target.value)}/></label></>}
     {data.paymentGateway!=='manual'&&<button type="button" className="outline" disabled={busy} onClick={recheck}>Já paguei — conferir na API</button>}
    </section>}
    <form onSubmit={submit} style={{display:'grid',gap:10}}>
     <label className="label">Responsável<input value={data.name} readOnly/></label>
     <label className="label">E-mail<input value={data.email} readOnly/></label>
     <label className="label">Nome da empresa/parceria<input required value={name} minLength={2} maxLength={160} autoComplete="organization" onChange={e=>setName(e.target.value)}/></label>
     <label className="label">Crie uma senha<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <label className="label">Confirme a senha<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
     <p className="invite-help">Expira em {new Date(data.expiresAt).toLocaleString('pt-BR')}. O acesso ao Painel do Parceiro será liberado após a confirmação do pagamento. Esta contratação não envolve licenças de TV.</p>
     {error&&<div className="alert" role="alert">{error}</div>}
     <button className="primary wide" disabled={busy||paymentDue}>{busy?'Criando conta…':paymentDue?'Aguardando pagamento':'Criar minha conta de Parceiro'}</button>
    </form><button type="button" className="invite-back" onClick={onBack}>Voltar ao login</button></>}
 </div></main>;
}
