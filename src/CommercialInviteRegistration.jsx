import React,{useEffect,useState} from 'react';
import {completePortalSalesInvite,verifyPortalSalesInvite} from './api.js';
import './invite.css';

const validToken=/^[A-Za-z0-9_-]{32,100}$/;
export default function CommercialInviteRegistration({token,onBack}){
 const [data,setData]=useState(null),[status,setStatus]=useState('checking'),[error,setError]=useState('');
 const [name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
 const [busy,setBusy]=useState(false);
 useEffect(()=>{let alive=true;setData(null);setError('');setStatus('checking');
  if(!validToken.test(token)){setStatus('invalid');return()=>{alive=false};}
  verifyPortalSalesInvite(token).then(r=>{if(!alive)return;setData(r);setName(r.name||'');setStatus('valid')}).catch(()=>{if(alive)setStatus('invalid')});
  return()=>{alive=false};
 },[token]);
 const submit=async e=>{e.preventDefault();setError('');if(password.length<12||password!==confirm){setError('A senha deve ter pelo menos 12 caracteres e coincidir com a confirmação.');return;}
  setBusy(true);try{await completePortalSalesInvite({token,companyName:name.trim(),password});setPassword('');setConfirm('');setStatus('done');
   try{sessionStorage.removeItem('delta-partner-pending-commercial-invite')}catch{}
  }catch(ex){setError(ex.message||'Não foi possível concluir o cadastro.')}finally{setBusy(false)};
 };
 return <main className="invite-wrap"><div className="invite-card"><div className="brandico" aria-hidden="true">D</div>
  <p className="invite-eyebrow">DELTA TV · ACESSO AO PAINEL DO PARCEIRO</p>
  {status==='checking'?<><h1>Validando convite comercial</h1><p>Conferindo validade e reserva de acesso…</p></>
  :status==='invalid'?<><h1>Convite indisponível</h1><p role="alert">O convite expirou, já foi usado ou não é válido. Solicite outro ao seu Master.</p><button className="primary wide" onClick={onBack}>Ir para o login</button></>
  :status==='done'?<><h1>Conta criada!</h1><p>Seu acesso ao Painel do Parceiro está disponível pelo período contratado. Entre com e-mail e senha.</p><button className="primary wide" onClick={onBack}>Ir para o login</button></>
  :<><h1>Ativar acesso ao Painel do Parceiro</h1><p>Convite: <strong>{data.inviteType==='submaster'?'Submaster':'Parceiro'}</strong>, plano <strong>{data.planName}</strong>, com <strong>{data.months} mês(es)</strong> de acesso reservado.</p>
    <form onSubmit={submit} style={{display:'grid',gap:10}}>
     <label className="label">Responsável<input value={data.name} readOnly/></label>
     <label className="label">E-mail<input value={data.email} readOnly/></label>
     <label className="label">Nome da empresa/parceria<input required value={name} minLength={2} maxLength={160} autoComplete="organization" onChange={e=>setName(e.target.value)}/></label>
     <label className="label">Crie uma senha<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)}/></label>
     <label className="label">Confirme a senha<input required type="password" minLength={12} maxLength={128} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
     <p className="invite-help">Expira em {new Date(data.expiresAt).toLocaleString('pt-BR')}. Os meses foram reservados do estoque pré-pago do vendedor. A conta não recebe licenças de TV.</p>
     {error&&<div className="alert" role="alert">{error}</div>}
     <button className="primary wide" disabled={busy}>{busy?'Criando conta…':'Criar minha conta de Parceiro'}</button>
    </form><button type="button" className="invite-back" onClick={onBack}>Voltar ao login</button></>}
 </div></main>;
}
