import {useCallback,useEffect,useState} from 'react';
import {api} from './api.js';
import PortalUsage from './PortalUsage.jsx';
const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cents=v=>Math.round(Number(String(v).replace(',','.'))*100);
const date=v=>v?new Date(v).toLocaleDateString('pt-BR'):'—';
function Label({children}){return <label style={{display:'grid',gap:5,minWidth:0}}>{children}</label>}
export default function PortalSales({canOperate=true}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [transfer,setTransfer]=useState({buyerPartnerId:'',planCode:'',quantityMonths:1,price:''});
 const [renew,setRenew]=useState({customerPartnerId:'',months:1,price:''});
 const [transferRequestId,setTransferRequestId]=useState(()=>crypto.randomUUID());
 const [renewRequestId,setRenewRequestId]=useState(()=>crypto.randomUUID());
 const [invite,setInvite]=useState({invitedName:'',invitedEmail:'',inviteType:'customer',planCode:'',months:1,price:'',monthly:'0'});
 const [invitations,setInvitations]=useState([]),[networkTree,setNetworkTree]=useState([]),[createdInvite,setCreatedInvite]=useState(null);
 const [sectionErrors,setSectionErrors]=useState([]);
 const [returnProcessed,setReturnProcessed]=useState(false);
 const load=useCallback(async()=>{
   const [overview,history,tree]=await Promise.allSettled([
     api('/content-partner/portal-sales'),
     api('/content-partner/portal-sales/invitations'),
     api('/content-partner/portal-sales/tree')
   ]);
   const issues=[];
   if(overview.status==='fulfilled')setData(overview.value);
   else issues.push(`Resumo comercial: ${overview.reason?.message||'falha ao consultar'}`);
   if(history.status==='fulfilled')setInvitations(history.value.items||[]);
   else issues.push(`Convites: ${history.reason?.message||'falha ao consultar'}`);
   if(tree.status==='fulfilled')setNetworkTree(tree.value.items||[]);
   else issues.push(`Árvore: ${tree.reason?.message||'falha ao consultar'}`);
   setSectionErrors(issues);
   if(overview.status==='rejected')throw overview.reason;
 },[]);
 useEffect(()=>{load().catch(e=>setError(e.message));},[load]);
 useEffect(()=>{const timer=setInterval(()=>{if(document.visibilityState==='visible')load().catch(()=>{});},30000);
  return()=>clearInterval(timer);},[load]);
 // Retorno do navegador não é prova de pagamento: backend consulta /payment_check.
 useEffect(()=>{if(returnProcessed)return;
   const params=new URLSearchParams(window.location.search);
   const id=params.get('portal_sales_order'),transactionNsu=params.get('transaction_nsu'),slug=params.get('slug');
   if(!id)return;
   setReturnProcessed(true);
   window.history.replaceState(window.history.state,'',window.location.pathname+'#/portal-sales');
   if(!transactionNsu||!slug){setNotice('Se você concluiu o pagamento, aguarde a confirmação automática pela InfinitePay.');return;}
   api(`/content-partner/portal-sales/orders/${encodeURIComponent(id)}/confirm-return`,{method:'POST',body:{transactionNsu,slug}})
     .then(result=>{setNotice(result.paid?'Pagamento verificado e estoque liberado.':'Pagamento ainda não confirmado.');return load();})
     .catch(e=>setError(e.message));
 },[returnProcessed,load]);
 const act=async(url,body)=>{setBusy(true);setError('');setNotice('');try{await api(url,{method:'POST',body});setNotice('Operação registrada e auditada.');await load();return true;}catch(e){setError(e.message);return false;}finally{setBusy(false)}};
 if(!data)return <div className="panel" style={{padding:18}}>{error||'Carregando sua rede comercial…'}</div>;
 const stock=data.stock||[],children=data.children||[],contracts=data.contracts||[];
 const sellingEnabled=Boolean(canOperate&&data.seller.active&&data.seller.canSell);
 const selected=contracts.find(c=>c.customer_partner_id===renew.customerPartnerId);
 return <div style={{display:'grid',gap:16}}>
  <div className="panel" style={{padding:18}}><h2>Minha rede de venda do Painel do Parceiro</h2><p className="muted">Distribua acessos ao portal de parceiros, não licenças de TV. Seu perfil comercial: <strong>{data.seller.role==='master'?'Master':'Submaster'}</strong>.</p><p className="muted">Pedidos com checkout automático liberam meses após conferência na API do gateway; pedidos manuais exigem confirmação do Superadmin. Revendas de TVs permanecem separadas.</p></div>
  <nav aria-label="Atalhos da rede comercial" style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    {[["portal-network-invites","Convidar parceiro"],["portal-network-stock","Estoque"],["portal-network-tree","Árvore da rede"],["portal-network-clients","Clientes"]].map(([id,label])=><button key={id} type="button" className="outline" onClick={()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}>{label}</button>)}
  </nav>
  {!sellingEnabled&&<div className="notice" role="status">A rede está disponível para consulta, mas novas vendas e transferências estão suspensas até a autorização do Superadmin.</div>}
  <PortalUsage/>
  {sectionErrors.length>0&&<div className="alert" role="alert">Algumas consultas da rede falharam: {sectionErrors.join(' · ')}. As outras informações permanecem disponíveis.</div>}
  {error&&<div className="alert" role="alert">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}
  <section id="portal-network-stock" className="panel" style={{padding:18,display:'grid',gap:10}}><h3>Meus pedidos de estoque para o Painel do Parceiro</h3>
    <p className="muted">O Superadmin emite o pedido conforme o gateway padrão. Ao receber o checkout, você pode pagar pela InfinitePay (Pix/cartão) ou pelo Mercado Pago (Pix). Estoque somente após confirmação do provedor.</p>
    <div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Plano</th><th>Meses</th><th>Valor</th><th>Meio</th><th>Situação</th><th>Pagar</th></tr></thead><tbody>{(data.orders||[]).map(o=><tr key={o.id}>
      <td>{o.plan_code}</td><td>{o.quantity_months}</td><td>{brl(o.total_cents)}</td><td>{o.payment_gateway||'manual'}</td><td>{o.status}</td><td>
       {o.status==='pending'&&o.payment_gateway!=='manual'&&<button disabled={busy} onClick={()=>act(`/content-partner/portal-sales/orders/${o.id}/checkout`,{})}>Gerar / atualizar link</button>}
       {o.checkout_url&&<a href={o.checkout_url} rel="noreferrer" target="_blank">Abrir checkout</a>}
       {o.pix_copy_paste&&<details><summary>Pix copia e cola</summary><textarea readOnly value={o.pix_copy_paste} onFocus={e=>e.target.select()}/></details>}
      </td>
    </tr>)}</tbody></table></div>
  </section>
  <div className="stats">{stock.map(s=><div key={s.plan_code} className="stat"><small>{s.plan_name}</small><strong>{s.available_months}</strong><span>meses pré-pagos disponíveis</span></div>)}{!stock.length&&<div className="stat"><strong>0</strong><span>Solicite estoque ao Superadmin</span></div>}</div>
  <section id="portal-network-invites" className="panel" style={{padding:18,display:'grid',gap:12}}>
   <h3>Cadastrar parceiro ou Submaster por convite</h3>
   <p className="muted">O link cria uma conta do <strong>Painel do Parceiro</strong>, não uma revenda de TVs. Ao emitir, os meses informados são reservados do seu estoque. Se o convite expirar ou for cancelado, os meses retornam. Inclusive Submasters precisam de acesso pré-pago para entrar no próprio painel.</p>
   <form style={{display:'grid',gap:10,gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,210px),1fr))'}} onSubmit={async e=>{
    e.preventDefault();if(!window.confirm(`Reservar ${invite.months} mês(es) do seu estoque para convidar ${invite.invitedEmail}?`))return;
    setBusy(true);setError('');setNotice('');setCreatedInvite(null);
    try{const result=await api('/content-partner/portal-sales/invitations',{method:'POST',body:{
      invitedName:invite.invitedName,invitedEmail:invite.invitedEmail,inviteType:invite.inviteType,
      planCode:invite.planCode,months:Number(invite.months),unitResaleCents:cents(invite.price),monthlyFeeCents:cents(invite.monthly)
    }});setCreatedInvite(result);setNotice(result.emailSent?'Convite enviado ao e-mail do cliente.':'Convite reservado. Envie o link ao cliente com segurança.');await load();}
    catch(ex){setError(ex.message)}finally{setBusy(false)};
   }}>
    <Label>Responsável<input required maxLength={160} minLength={2} value={invite.invitedName} onChange={e=>setInvite({...invite,invitedName:e.target.value})}/></Label>
    <Label>E-mail do novo parceiro<input required type="email" maxLength={200} value={invite.invitedEmail} onChange={e=>setInvite({...invite,invitedEmail:e.target.value})}/></Label>
    <Label>Tipo de conta<select value={invite.inviteType} onChange={e=>setInvite({...invite,inviteType:e.target.value})}><option value="customer">Parceiro (cliente do painel)</option><option value="submaster">Submaster (revenderá acessos)</option></select></Label>
    <Label>Plano<select required value={invite.planCode} onChange={e=>setInvite({...invite,planCode:e.target.value})}><option value="">Selecionar</option>{stock.filter(s=>Number(s.available_months)>0).map(s=><option key={s.plan_code} value={s.plan_code}>{s.plan_name} · {s.available_months} meses disponíveis</option>)}</select></Label>
    <Label>Meses de acesso<input type="number" required min="1" max="120" value={invite.months} onChange={e=>setInvite({...invite,months:e.target.value})}/></Label>
    <Label>Preço de revenda por mês (R$)<input required inputMode="decimal" value={invite.price} onChange={e=>setInvite({...invite,price:e.target.value})}/></Label>
    <Label>Mensalidade extra declarada (R$)<input inputMode="decimal" value={invite.monthly} onChange={e=>setInvite({...invite,monthly:e.target.value})}/></Label>
    <button className="primary" disabled={busy||!sellingEnabled||!stock.some(s=>Number(s.available_months)>=Number(invite.months))}>Reservar estoque e criar convite</button>
   </form>
   <p className="muted">Preços são valores comerciais declarados; a plataforma não confirma automaticamente o recebimento do comprador nem cobra a mensalidade extra. Não envie o link antes de acertar o pagamento com o cliente.</p>
   {createdInvite&&<div className="notice" style={{display:'grid',gap:8}}><strong>Convite gerado — copie agora (o link não poderá ser recuperado depois)</strong><input aria-label="Link do convite comercial" readOnly value={createdInvite.link} onFocus={e=>e.target.select()}/>
    <button type="button" onClick={()=>navigator.clipboard?.writeText(createdInvite.link).then(()=>setNotice('Link copiado.')).catch(()=>setNotice('Selecione o campo e copie o link.'))}>Copiar link</button>
    <small>{createdInvite.warning||'O convite também foi enviado por e-mail quando o SMTP estava configurado.'}</small></div>}
   <h4>Convites e reservas</h4>
   <div style={{overflowX:'auto',maxWidth:'100%'}}><table style={{width:'100%'}}><thead><tr><th>Destinatário</th><th>Tipo</th><th>Plano</th><th>Meses reservados</th><th>Estado</th><th>Validade</th><th>Ações</th></tr></thead><tbody>
     {invitations.map(i=><tr key={i.id}><td>{i.invited_name}<br/><small>{i.invited_email}</small></td><td>{i.invite_type==='submaster'?'Submaster':'Parceiro'}</td><td>{i.plan_code}</td><td>{i.months}</td><td>{({pending:'Aguardando',accepted:'Aceito',revoked:'Cancelado',expired:'Expirado'})[i.status]||i.status}</td><td>{date(i.expires_at)}</td><td>{i.status==='pending'&&<button type="button" disabled={busy} onClick={()=>{if(!window.confirm('Cancelar convite e devolver meses ao estoque?'))return;void act(`/content-partner/portal-sales/invitations/${i.id}/revoke`,{});}}>Cancelar</button>}</td></tr>)}
    </tbody></table></div>
   {!invitations.length&&<p className="muted">Ainda não há convites nesta conta.</p>}
  </section>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,270px),1fr))',gap:14}}>
   <section className="panel" style={{padding:18,display:'grid',gap:12}}><h3>Transferir meses para Submaster</h3><p className="muted">Só é possível transferir estoque já adquirido ao seu Submaster direto.</p>
    <form style={{display:'grid',gap:12}} onSubmit={e=>{e.preventDefault();if(!window.confirm('Transferir estes meses de acesso do seu estoque?'))return;void act('/content-partner/portal-sales/transfers',{buyerPartnerId:transfer.buyerPartnerId,planCode:transfer.planCode,quantityMonths:Number(transfer.quantityMonths),unitResaleCents:cents(transfer.price),requestId:transferRequestId}).then(ok=>{if(ok)setTransferRequestId(crypto.randomUUID())});}}>
     <Label>Submaster<select required value={transfer.buyerPartnerId} onChange={e=>setTransfer({...transfer,buyerPartnerId:e.target.value})}><option value="">Selecionar</option>{children.filter(c=>c.active).map(c=><option key={c.partner_id} value={c.partner_id}>{c.name}</option>)}</select></Label>
     <Label>Plano<select required value={transfer.planCode} onChange={e=>setTransfer({...transfer,planCode:e.target.value})}><option value="">Selecionar</option>{stock.filter(s=>Number(s.available_months)>0).map(s=><option key={s.plan_code} value={s.plan_code}>{s.plan_name} ({s.available_months} meses)</option>)}</select></Label>
     <Label>Meses<input required type="number" min="1" max="100000" value={transfer.quantityMonths} onChange={e=>setTransfer({...transfer,quantityMonths:e.target.value})}/></Label>
     <Label>Valor de revenda por mês (R$)<input required inputMode="decimal" value={transfer.price} onChange={e=>setTransfer({...transfer,price:e.target.value})}/></Label>
     <button className="primary" disabled={busy||!sellingEnabled||!children.length}>Transferir estoque</button>
    </form>
   </section>
   <section className="panel" style={{padding:18,display:'grid',gap:12}}><h3>Renovar acesso de cliente</h3><p className="muted">O primeiro vínculo de um cliente novo pode ser feito por convite pré-pago. Para clientes já existentes, o primeiro vínculo ainda exige Superadmin.</p>
    <form style={{display:'grid',gap:12}} onSubmit={e=>{e.preventDefault();if(!selected)return;void act('/content-partner/portal-sales/renewals',{customerPartnerId:selected.customer_partner_id,planCode:selected.plan_code,months:Number(renew.months),unitResaleCents:cents(renew.price),monthlyFeeCents:Number(selected.monthly_fee_cents),requestId:renewRequestId}).then(ok=>{if(ok)setRenewRequestId(crypto.randomUUID())});}}>
     <Label>Cliente do Painel do Parceiro<select required value={renew.customerPartnerId} onChange={e=>setRenew({...renew,customerPartnerId:e.target.value})}><option value="">Selecionar</option>{contracts.map(c=><option key={c.id} value={c.customer_partner_id}>{c.customer_name} · vence {date(c.expires_at)}</option>)}</select></Label>
     <Label>Meses adicionais<input required type="number" min="1" max="120" value={renew.months} onChange={e=>setRenew({...renew,months:e.target.value})}/></Label>
     <Label>Preço declarado ao cliente por mês (R$)<input required inputMode="decimal" value={renew.price} onChange={e=>setRenew({...renew,price:e.target.value})}/></Label>
     <button className="primary" disabled={busy||!sellingEnabled||!selected}>Renovar com meu estoque</button>
    </form>
   </section>
  </div>
  <section id="portal-network-tree" className="panel" style={{padding:18}}><h3>Árvore da minha rede</h3>
   <p className="muted">Somente a sua estrutura comercial do Painel do Parceiro; outros Masters não são exibidos. Não há limite comercial de níveis de Submasters.</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Distribuidor</th><th>Papel</th><th>Meses disponíveis</th><th>Clientes diretos</th><th>Situação</th></tr></thead><tbody>{networkTree.map(s=><tr key={s.partner_id}><td><span style={{paddingLeft:Math.min(s.depth,12)*14}}>{s.depth?'↳ ':''}{s.name}</span></td><td>{s.role==='master'?'Master':'Submaster'}</td><td>{s.available_months}</td><td>{s.direct_customers}</td><td>{s.active&&s.can_sell&&s.status==='active'?'Autorizado':'Bloqueado'}</td></tr>)}</tbody></table></div>
  </section>
  <section id="portal-network-clients" className="panel" style={{padding:18}}><h3>Clientes vinculados</h3><div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Parceiro</th><th>Plano</th><th>Meses pagos</th><th>Vencimento</th></tr></thead><tbody>{contracts.map(c=><tr key={c.id}><td>{c.customer_name}</td><td>{c.plan_code}</td><td>{c.months_paid}</td><td>{date(c.expires_at)}</td></tr>)}</tbody></table></div>{!contracts.length&&<p className="muted">Sem clientes vinculados. Convide um novo parceiro acima ou solicite ao Superadmin a vinculação de uma conta antiga.</p>}</section>
  <section className="panel" style={{padding:18}}><h3>Movimentações da sua rede</h3>{(data.transfers||[]).slice(0,20).map(t=><p key={t.id} className="muted">{date(t.created_at)} · {t.seller_partner_id===data.seller.partnerId?'Enviado':'Recebido'} · {t.quantity_months} mês(es) · {brl(t.declared_total_cents)} declarado</p>)}{!(data.transfers||[]).length&&<p className="muted">Sem transferências registradas.</p>}<p className="muted">Valores de revenda são somente declarados; não equivalem a pagamentos comprovados.</p></section>
 </div>;
}
