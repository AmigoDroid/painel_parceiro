import React,{useEffect,useState} from 'react';
import {verifyAdminNetworkInvite,completeAdminNetworkInvite} from './api.js';
import {formatBRL} from '@deltatv/ui/money';
import './invite.css';

export default function AdminNetworkInviteRegistration({token,onBack,onRegistered=onBack}){
 const [info,setInfo]=useState(null),[state,setState]=useState('loading'),[error,setError]=useState('');
 const [email,setEmail]=useState(''),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false),[createdStatus,setCreatedStatus]=useState('active');
 useEffect(()=>{
  let active=true;
  if(!/^[A-Za-z0-9_-]{32,100}$/.test(token)){setState('invalid');return()=>{active=false};}
  verifyAdminNetworkInvite(token).then(data=>{if(active){setInfo(data);setState('ready')}})
    .catch(e=>{if(active){setState('invalid');setError(e.message||'Convite indisponível.')}});
  return()=>{active=false};
 },[token]);
 async function complete(event){
  event.preventDefault();setError('');
  if(password!==confirm||password.length<12){setError('As senhas devem ser iguais e ter ao menos 12 caracteres.');return;}
  setBusy(true);
  try{const result=await completeAdminNetworkInvite({token,name:name.trim(),...(info?.email?{}:{email:email.trim()}),password});setCreatedStatus(result.status);
   setState('done');setPassword('');setConfirm('');
   try{sessionStorage.removeItem('delta-partner-pending-network-invite')}catch{}
  }catch(e){setError(e.message||'Não foi possível concluir o cadastro.');}
  finally{setBusy(false);}
 }
 return <main className="invite-wrap"><div className="invite-card">
  <div className="brandico" aria-hidden="true">D</div><p className="invite-eyebrow">DELTATV · CONVITE</p>
  {state==='loading'?<><h1>Validando convite</h1><p>Consultando as condições de sua rede…</p></>:
  state==='done'?<><h1>Cadastro concluído</h1><p>Sua conta foi vinculada à rede que enviou o convite. {createdStatus==='active'?info?.kind==='reseller'?'Acesse revenda.deltatv.com.br com seu e-mail e senha.':'Você já pode entrar com seu e-mail e senha.':'Seu plano é pago; aguarde a confirmação do pagamento pela administração para liberar o acesso.'}</p>
   <button className="primary wide" onClick={()=>onRegistered(info?.kind)}>Ir para o login</button></>:
  state!=='ready'?<><h1>Convite indisponível</h1><p role="alert">{error||'Solicite outro link.'}</p><button className="invite-back" onClick={onBack}>Voltar</button></>:
  <><h1>Crie sua conta de {info.kind==='reseller'?'Revenda':'Parceiro'}</h1><p>Seu acesso será configurado automaticamente conforme o plano escolhido pela administração.</p>
    <div className="invite-help" style={{display:'grid',gap:6,marginBottom:14}}>
      <strong>{info.planName}</strong><span>Mensalidade: {formatBRL(info.monthlyFeeCents)}</span>
      <span>DNS: {info.maxDns??'Sem limite'} · Ativações: {info.activationLimit??'Sem limite'}</span>
    </div>
    <form onSubmit={complete}>
     <label className="label">Seu nome<input required autoComplete="name" maxLength={160} minLength={2} value={name} onChange={e=>setName(e.target.value)}/></label>
     <label className="label">Seu e-mail<input required type="email" maxLength={200} autoComplete="email" readOnly={Boolean(info.email)} value={info.email||email} onChange={e=>setEmail(e.target.value)}/></label>
     <label className="label">Crie uma senha<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <label className="label">Confirme a senha<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
     <p className="invite-help">{info.remainingUses==null?'Link compartilhável sem limite de usos.':`Usos restantes: ${info.remainingUses}.`} Convite válido até {new Date(info.expiresAt).toLocaleString('pt-BR')}. A cobrança recorrente não é iniciada automaticamente neste cadastro.</p>
     {error&&<div className="alert" role="alert">{error}</div>}
     <button className="primary wide" type="submit" disabled={busy||!name.trim()}>{busy?'Criando conta…':'Concluir cadastro'}</button>
    </form><button className="invite-back" onClick={onBack}>Voltar ao login</button></>}
 </div></main>;
}
