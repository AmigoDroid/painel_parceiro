import {useEffect,useState} from 'react';
import {api} from './api.js';
const categories=[['technical','Problema técnico'],['dns','DNS e servidores'],['activations','Ativações e dispositivos'],['billing','Pagamento ou renovação'],['network','Minha rede'],['other','Outros assuntos']];
const date=s=>new Date(s).toLocaleString('pt-BR');
export default function TicketCenter(){
 const [tickets,setTickets]=useState([]),[selected,setSelected]=useState(null),[form,setForm]=useState({destination:'deltatv',category:'technical',priority:'normal',subject:'',message:''});
 const [message,setMessage]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[note,setNote]=useState('');
 const load=()=>api('/content-partner/portal-sales/support/tickets').then(r=>setTickets(r.items||[])).catch(e=>setError(e.message));
 useEffect(()=>{void load();},[]);
 const exec=async(task)=>{setBusy(true);setError('');setNote('');try{const result=await task();setNote('Solicitação registrada.');await load();return result;}catch(e){setError(e.message||'Não foi possível completar.');return null;}finally{setBusy(false)}};
 const open=async id=>{const r=await exec(()=>api(`/content-partner/portal-sales/support/tickets/${id}`));if(r)setSelected(r);};
 return <div style={{display:'grid',gap:16,maxWidth:1050}}>
  <header><h2>Central de Suporte DeltaTV</h2><p className="muted">Abra um chamado para seu Master responsável ou para a DeltaTV. Acompanhe as respostas e o histórico no próprio painel.</p></header>
  {error&&<p className="alert" role="alert">{error}</p>}{note&&<p className="notice" role="status">{note}</p>}
  <section className="panel" style={{padding:18,display:'grid',gap:12}}><h3>Novo chamado</h3>
   <form style={{display:'grid',gap:12}} onSubmit={async e=>{e.preventDefault();const result=await exec(()=>api('/content-partner/portal-sales/support/tickets',{method:'POST',body:form}));if(result){setForm({destination:'deltatv',category:'technical',priority:'normal',subject:'',message:''});void open(result.id);}}}>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,220px),1fr))',gap:12}}>
     <label style={{display:'grid',gap:6}}>Destinatário<select value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})}><option value="deltatv">Suporte oficial DeltaTV</option><option value="master">Meu Master responsável</option></select></label>
     <label style={{display:'grid',gap:6}}>Assunto<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{categories.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>
     <label style={{display:'grid',gap:6}}>Prioridade<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></select></label>
    </div>
    <label style={{display:'grid',gap:6}}>Título<input required minLength="4" maxLength="160" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} placeholder="Resuma o problema"/></label>
    <label style={{display:'grid',gap:6}}>Descrição<textarea required rows="4" minLength="5" maxLength="8000" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Descreva o problema e o que já tentou fazer"/></label>
    <div><button className="primary" disabled={busy}>Abrir chamado</button></div>
   </form>
  </section>
  <section className="panel" style={{padding:18,display:'grid',gap:12}}><h3>Meus chamados e atendimentos</h3>
   {!tickets.length&&<p className="muted">Nenhum chamado registrado.</p>}
   <div style={{display:'grid',gap:8}}>{tickets.map(t=><button key={t.id} type="button" className="outline" style={{textAlign:'left',padding:12}} onClick={()=>void open(t.id)}><b>#{t.protocol} — {t.subject}</b><div style={{fontSize:12,opacity:.8,marginTop:6}}>{t.creator_name} · {t.assigned_name||'DeltaTV'} · {t.status} · {date(t.created_at)}</div></button>)}</div>
  </section>
  {selected&&<section className="panel" style={{padding:18,display:'grid',gap:12}}><h3>Chamado #{selected.ticket.protocol}</h3>
   {selected.messages.map(m=><div key={m.id} className="notice" style={{whiteSpace:'pre-wrap'}}>{m.body}<small style={{display:'block'}}>{date(m.created_at)}</small></div>)}
   <form style={{display:'grid',gap:10}} onSubmit={async e=>{e.preventDefault();const result=await exec(()=>api(`/content-partner/portal-sales/support/tickets/${selected.ticket.id}/reply`,{method:'POST',body:{body:message}}));if(result){setMessage('');void open(selected.ticket.id);}}}>
    <textarea rows="3" required value={message} maxLength={8000} onChange={e=>setMessage(e.target.value)} placeholder="Escreva sua resposta"/><div><button className="primary" disabled={busy||!message.trim()}>Enviar resposta</button></div>
   </form>
  </section>}
 </div>;
}
