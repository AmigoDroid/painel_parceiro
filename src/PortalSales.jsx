import {useCallback,useEffect,useState} from 'react';
import {api} from './api.js';
import PortalUsage from './PortalUsage.jsx';
const money=n=>Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cents=n=>Math.round(Number(String(n).replace(',','.'))*100);
const date=s=>s?new Date(s).toLocaleDateString('pt-BR'):'—';
const Label=({children})=><label style={{display:'grid',gap:6,fontSize:14}}>{children}</label>;
const Grid=({children})=><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,225px),1fr))',gap:12}}>{children}</div>;
const Box=({title,sub,children})=><section className="panel" style={{padding:18,display:'grid',gap:12,minWidth:0}}><div><h3>{title}</h3>{sub&&<p className="muted">{sub}</p>}</div>{children}</section>;
const permissionLabels={canSell:'Vender Pacotes de Serviço',canCreateSubmasters:'Criar Submasters',canTransferStock:'Distribuir estoque',canViewFinance:'Consultar financeiro',canManageGateways:'Configurar gateways'};
export function MyServicePackage(){
 const [info,setInfo]=useState(null),[error,setError]=useState('');
 useEffect(()=>{api('/content-partner/portal-sales/my-package').then(setInfo).catch(e=>setError(e.message));},[]);
 if(error)return <div className="alert">{error}</div>;
 if(!info)return <div className="panel">Carregando seu Pacote de Serviço…</div>;
 const p=info.package,usage=info.activations;
 return <div style={{display:'grid',gap:14}}>
  <Box title={`Meu Pacote de Serviço — ${info.packageName}`} sub="Os recursos abaixo pertencem ao seu acesso ao Painel do Parceiro, não ao painel de Revenda de TV.">
   <Grid><div className="stat"><small>Meu ID DeltaTV (permanente)</small><strong>{info.publicId||'—'}</strong><button type="button" className="outline" onClick={()=>navigator.clipboard?.writeText(info.publicId||'')}>Copiar ID</button></div>
    <div className="stat"><small>DNS permitidos por código</small><strong>{info.dns.limit===null?'Ilimitados':info.dns.limit}</strong><span>DNS é a forma de exibição dos servidores/URLs da parceria</span></div>
    <div className="stat"><small>Ativações</small><strong>{usage.used} / {usage.limit===null?'Ilimitadas':usage.limit}</strong><span>Ativações atualmente registradas</span></div>
    <div className="stat"><small>Validade do acesso</small><strong>{date(info.expiresAt)}</strong><span>{info.legacy?'Contrato legado preservado':'Prazo contratado'}</span></div></Grid>
   <div><h4>Benefícios atuais</h4>{[['autoFailover','Failover automático'],['autoPriority','Prioridade automática de DNS'],['emailAlerts','Alertas por e-mail'],['detailedHistory','Histórico detalhado']].map(([key,label])=><p key={key} style={{margin:'7px 0'}}>{info.features?.[key]?'✓':'—'} {label}</p>)}</div>
   {info.legacy&&<p className="notice">{info.note}</p>}
  </Box>
 </div>;
}
export default function PortalSales({canOperate=true}){
 const [tab,setTab]=useState('dashboard'),[data,setData]=useState(null),[perms,setPerms]=useState(null),[tree,setTree]=useState([]),[invitations,setInvitations]=useState([]),[relocations,setRelocations]=useState([]),[gateways,setGateways]=useState(null);
 const [invite,setInvite]=useState({invitedName:'',invitedEmail:'',inviteType:'customer',planCode:'',months:'1',price:'',monthly:'0',paymentMode:'manual'});
 const [transfer,setTransfer]=useState({buyerPartnerId:'',planCode:'',quantityMonths:'1',price:''});
 const [relocation,setRelocation]=useState({code:''}),[transferCode,setTransferCode]=useState(null);
 const [gateway,setGateway]=useState({provider:'mercadopago',accessToken:'',handle:'',webhookSecret:'',currentPassword:''});
 const [createdInvite,setCreatedInvite]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [externalPayment,setExternalPayment]=useState(null);
 const refresh=useCallback(async()=>{
  const r=await Promise.allSettled([api('/content-partner/portal-sales'),api('/content-partner/portal-sales/permissions'),api('/content-partner/portal-sales/tree'),api('/content-partner/portal-sales/invitations'),api('/content-partner/portal-sales/reparent-requests')]);
  if(r[0].status==='fulfilled')setData(r[0].value);
  if(r[1].status==='fulfilled')setPerms(r[1].value);
  if(r[2].status==='fulfilled')setTree(r[2].value.items||[]);
  if(r[3].status==='fulfilled')setInvitations(r[3].value.items||[]);
  if(r[4].status==='fulfilled')setRelocations(r[4].value.items||[]);
  if(r[1].status==='fulfilled'&&r[1].value?.permissions?.canManageGateways){try{setGateways(await api('/content-partner/portal-sales/gateways'))}catch{/* Ignorar falha de gateway sem derrubar a rede */}}
  if(r[0].status==='rejected')setError(r[0].reason.message||'Erro ao carregar a rede.');
 },[]);
 useEffect(()=>{void refresh();},[refresh]);
 const act=async(path,body,method='POST')=>{setError('');setNotice('');setBusy(true);try{const value=await api(`/content-partner/portal-sales${path}`,{method,body});setNotice('Operação concluída e auditada.');await refresh();return value;}catch(e){setError(e.message||'Não foi possível salvar.');return null;}finally{setBusy(false)}};
 if(!data||!perms)return <div className="panel" style={{padding:18}}>{error||'Carregando sua rede comercial…'}</div>;
 const p=perms.permissions||{},enabled=canOperate&&perms.enabled,stock=data.stock||[],children=data.children||[],contracts=data.contracts||[];
 const tabs=[['dashboard','Visão geral'],...(p.canSell?[['sales','Vender acessos']]:[]),...(p.canTransferStock?[['stock','Distribuir estoque']]:[]),['network','Minha rede'],...(p.canManageGateways?[['gateway','Meus gateways']]:[]),...(p.canViewFinance?[['finance','Financeiro']]:[])];
 const allowed= tabs.some(([id])=>id===tab)?tab:'dashboard';
 const accounts=tree.filter(x=>x.depth>0);
 return <div style={{display:'grid',gap:16}}>
  <header><h2>Minha rede de parceiros</h2><p className="muted">Revenda acessos ao <b>Painel do Parceiro DeltaTV</b>. Cada conta recebe seu Pacote de Serviço. Seu perfil: {data.seller.role==='master'?'Master':'Submaster'}.</p></header>
  <nav aria-label="Seções comerciais autorizadas" style={{display:'flex',gap:8,flexWrap:'wrap'}}>{tabs.map(([id,label])=><button type="button" key={id} className={allowed===id?'primary':'outline'} onClick={()=>setTab(id)}>{label}</button>)}</nav>
  {!enabled&&<p className="notice">A distribuição comercial desta conta está suspensa. Consulte a DeltaTV ou seu Master.</p>}
  {error&&<div role="alert" className="alert">{error}</div>}{notice&&<div role="status" className="notice">{notice}</div>}
  {allowed==='dashboard'&&<>
   <Grid><div className="stat"><small>Parceiros diretos</small><strong>{children.length}</strong></div><div className="stat"><small>Integrantes da rede</small><strong>{accounts.length}</strong></div><div className="stat"><small>Clientes diretos</small><strong>{contracts.length}</strong></div><div className="stat"><small>Meses pré-pagos disponíveis</small><strong>{stock.reduce((n,x)=>n+Number(x.available_months),0)}</strong></div></Grid>
   <MyServicePackage/>
   {p.canSell&&<Box title="Começar uma nova venda"><p className="muted">Escolha um Pacote de Serviço com estoque disponível, negocie o valor e envie um convite. O cadastro reserva os meses contratados.</p><button type="button" className="primary" onClick={()=>setTab('sales')}>Vender Pacote de Serviço</button></Box>}
   <Box title="Estoque disponível">{stock.map(s=><p key={s.plan_code}>{s.plan_name} — <b>{s.available_months}</b> mês(es)</p>)}{!stock.length&&<p className="muted">Seu estoque está vazio. Solicite meses de acesso à DeltaTV ou ao Master responsável.</p>}</Box>
  </>}
  {allowed==='sales'&&p.canSell&&<>
   <Box title="Convidar novo cliente" sub="O cliente recebe acesso ao painel, sem criar conta no sistema de Revendas de TV. Submasters só podem ser cadastrados com permissão específica.">
    <form style={{display:'grid',gap:14}} onSubmit={async e=>{e.preventDefault();if(!window.confirm(`Reservar ${invite.months} mês(es) para este convite?`))return;
      const result=await act('/invitations',{invitedName:invite.invitedName,invitedEmail:invite.invitedEmail,inviteType:invite.inviteType,planCode:invite.planCode,
       months:Number(invite.months),unitResaleCents:cents(invite.price),monthlyFeeCents:cents(invite.monthly),paymentMode:invite.paymentMode});if(result)setCreatedInvite(result);}}>
     <Grid><Label>Nome do responsável<input minLength="2" maxLength="160" required value={invite.invitedName} onChange={e=>setInvite({...invite,invitedName:e.target.value})}/></Label>
      <Label>E-mail<input type="email" maxLength="200" required value={invite.invitedEmail} onChange={e=>setInvite({...invite,invitedEmail:e.target.value})}/></Label>
      <Label>Tipo de acesso<select value={invite.inviteType} onChange={e=>setInvite({...invite,inviteType:e.target.value})}><option value="customer">Parceiro — cliente</option>{p.canCreateSubmasters&&<option value="submaster">Submaster — pode revender</option>}</select></Label>
      <Label>Pacote de Serviço<select required value={invite.planCode} onChange={e=>setInvite({...invite,planCode:e.target.value})}><option value="">Selecionar</option>{stock.filter(s=>Number(s.available_months)>0).map(s=><option key={s.plan_code} value={s.plan_code}>{s.plan_name} — {s.available_months} meses disponíveis</option>)}</select></Label>
      <Label>Meses de acesso<input type="number" min="1" max="120" required value={invite.months} onChange={e=>setInvite({...invite,months:e.target.value})}/></Label>
      <Label>Valor negociado por mês (R$)<input type="number" min="0" step="0.01" required value={invite.price} onChange={e=>setInvite({...invite,price:e.target.value})}/></Label></Grid>
     <Label>Como o cliente vai pagar?
      <select value={invite.paymentMode} onChange={e=>setInvite({...invite,paymentMode:e.target.value})}>
       <option value="manual">Pagamento externo recebido por mim</option>
       {p.canManageGateways&&gateways?.defaultGateway&&<option value="gateway">Checkout no meu {gateways.defaultGateway==='infinitepay'?'InfinitePay':'Mercado Pago'}</option>}
      </select>
     </Label>
     <p className="muted">Os meses são reservados na emissão. Com gateway, só a confirmação do provedor libera o acesso. Com Pix externo, confirme o dinheiro na sua conta em Convites e reservas: enviar comprovante não libera acesso.</p>
     <button className="primary" disabled={busy||!enabled}>Reservar meses e emitir convite</button>
    </form>
    {createdInvite&&<div className="notice" style={{display:'grid',gap:8}}><strong>Convite criado</strong>
     {createdInvite.warning&&<p role="alert">{createdInvite.warning}</p>}
     <label>Link seguro de cadastro<input readOnly value={createdInvite.link} onFocus={e=>e.target.select()}/></label>
     <button type="button" className="outline" onClick={()=>navigator.clipboard?.writeText(createdInvite.link)}>Copiar convite</button>
     {createdInvite.checkoutUrl&&<a target="_blank" rel="noreferrer" href={createdInvite.checkoutUrl}>Abrir checkout do meu gateway</a>}
     {createdInvite.pixCode&&<><textarea value={createdInvite.pixCode} rows={2} readOnly/><button className="outline" type="button" onClick={()=>navigator.clipboard?.writeText(createdInvite.pixCode)}>Copiar código Pix</button></>}
    </div>}
   </Box>
   <Box title="Convites e reservas"><div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Convidado</th><th>Pacote</th><th>Meses</th><th>Situação</th><th>Validade</th><th></th></tr></thead><tbody>{invitations.map(i=><tr key={i.id}><td>{i.invited_email}</td><td>{i.plan_code}</td><td>{i.months}</td><td>{i.payment_status==='paid'?'Pagamento confirmado':i.payment_gateway==='manual'?'Pix externo pendente':'Aguardando gateway'} · {i.status}</td><td>{date(i.expires_at)}</td><td><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
    {i.status==='pending'&&i.payment_gateway==='manual'&&i.payment_status!=='paid'&&p.canViewFinance&&<button type="button" className="outline" disabled={busy} onClick={()=>setExternalPayment({id:i.id,email:i.invited_email,reference:'',password:'',received:false})}>Confirmar Pix recebido</button>}
    {i.status==='pending'&&i.payment_gateway!=='manual'&&i.payment_status!=='paid'&&<>
      {i.checkout_url?<a href={i.checkout_url} target="_blank" rel="noreferrer">Pagar</a>:<button type="button" className="outline" disabled={busy} onClick={()=>void act(`/invitations/${i.id}/checkout`,{})}>Gerar checkout</button>}
      <button type="button" className="outline" disabled={busy} onClick={()=>{const transactionNsu=i.payment_gateway==='infinitepay'?window.prompt('transaction_nsu retornado pela InfinitePay'):undefined;const slug=i.payment_gateway==='infinitepay'?window.prompt('slug da InfinitePay'):undefined;if(i.payment_gateway==='infinitepay'&&(!transactionNsu||!slug))return;void act(`/invitations/${i.id}/recheck`,{...(transactionNsu?{transactionNsu,slug}:{})});}}>Conferir pagamento</button>
    </>}
    {i.status==='pending'&&i.payment_status!=='paid'&&<button className="outline" disabled={busy} onClick={()=>{if(window.confirm('Cancelar este convite e devolver os meses ao estoque?'))void act(`/invitations/${i.id}/revoke`,{});}}>Cancelar</button>}
   </div></td></tr>)}</tbody></table></div>
    {externalPayment&&<form className="panel" style={{padding:14,display:'grid',gap:8}} onSubmit={async e=>{e.preventDefault();if(!externalPayment.received)return;const result=await act(`/invitations/${externalPayment.id}/confirm-external`,{reference:externalPayment.reference,currentPassword:externalPayment.password,confirmReceived:true});if(result)setExternalPayment(null);}}>
      <strong>Confirmar Pix externo recebido</strong><p className="muted">Convidado: {externalPayment.email}. Confira o crédito no extrato bancário. Comprovante enviado pelo cliente não basta.</p>
      <Label>Referência bancária<input required minLength={6} maxLength={120} value={externalPayment.reference} onChange={e=>setExternalPayment(v=>({...v,reference:e.target.value}))}/></Label>
      <Label>Sua senha do Painel do Parceiro<input required type="password" autoComplete="current-password" value={externalPayment.password} onChange={e=>setExternalPayment(v=>({...v,password:e.target.value}))}/></Label>
      <label><input type="checkbox" required checked={externalPayment.received} onChange={e=>setExternalPayment(v=>({...v,received:e.target.checked}))}/> Confirmo que o valor entrou na minha conta.</label>
      <div style={{display:'flex',gap:8}}><button type="submit" className="primary" disabled={busy||!externalPayment.received}>Registrar recebimento</button><button type="button" className="outline" onClick={()=>setExternalPayment(null)}>Cancelar</button></div>
    </form>}
   </Box>
  </>}
  {allowed==='stock'&&p.canTransferStock&&<>
   <Box title="Transferir estoque para Submaster" sub="A transferência usa somente meses já adquiridos. Não cria novos meses nem confirma um recebimento financeiro.">
    <form style={{display:'grid',gap:12}} onSubmit={e=>{e.preventDefault();if(!window.confirm('Transferir os meses do seu estoque?'))return;void act('/transfers',{buyerPartnerId:transfer.buyerPartnerId,planCode:transfer.planCode,quantityMonths:Number(transfer.quantityMonths),unitResaleCents:cents(transfer.price),requestId:crypto.randomUUID()});}}>
     <Grid><Label>Submaster direto<select required value={transfer.buyerPartnerId} onChange={e=>setTransfer({...transfer,buyerPartnerId:e.target.value})}><option value="">Selecionar</option>{children.filter(s=>s.active).map(s=><option key={s.partner_id} value={s.partner_id}>{s.name}</option>)}</select></Label>
      <Label>Pacote<select required value={transfer.planCode} onChange={e=>setTransfer({...transfer,planCode:e.target.value})}><option value="">Selecionar</option>{stock.map(x=><option key={x.plan_code} value={x.plan_code}>{x.plan_name} · {x.available_months} meses</option>)}</select></Label>
      <Label>Meses<input type="number" min="1" max="100000" required value={transfer.quantityMonths} onChange={e=>setTransfer({...transfer,quantityMonths:e.target.value})}/></Label>
      <Label>Preço negociado por mês (R$)<input type="number" step="0.01" min="0" required value={transfer.price} onChange={e=>setTransfer({...transfer,price:e.target.value})}/></Label></Grid>
     <button className="primary" disabled={busy||!enabled}>Transferir estoque</button>
    </form>
   </Box>
  </>}
  {allowed==='network'&&<>
   <Box title="Integrantes da minha rede" sub="Você administra os Submasters diretos; todos os níveis descendentes são mostrados para acompanhamento.">
    <div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Integrante</th><th>Perfil</th><th>Meses em estoque</th><th>Clientes</th></tr></thead><tbody>{tree.map(s=><tr key={s.partner_id}><td><span style={{paddingLeft:Math.min(s.depth,10)*14}}>{s.depth?'↳ ':''}{s.name}</span></td><td>{s.role==='master'?'Master':'Submaster'}</td><td>{s.available_months}</td><td>{s.direct_customers}</td></tr>)}</tbody></table></div>
   </Box>
   {p.canCreateSubmasters&&<Box title="Permissões dos meus Submasters" sub="Uma função desautorizada desaparece do menu do Submaster. A API também impede seu uso.">
     {children.map(s=><div className="panel" key={s.partner_id} style={{padding:12}}><b>{s.name}</b><div style={{display:'flex',gap:12,flexWrap:'wrap',marginTop:8}}>{Object.entries(permissionLabels).filter(([key])=>p[key]).map(([key,label])=><label key={key}><input type="checkbox" checked={Boolean(s[({canSell:'can_sell',canCreateSubmasters:'can_create_submasters',canTransferStock:'can_transfer_stock',canViewFinance:'can_view_finance',canManageGateways:'can_manage_gateways'})[key]])} disabled={busy} onChange={e=>void act(`/submasters/${s.partner_id}/permissions`,{[key]:e.target.checked},'PATCH')}/> {label}</label>)}</div></div>)}
    </Box>}
   <Box title="Transferência de Submaster" sub="Sem códigos internos: o Submaster autoriza o recebimento com código temporário; o novo Master solicita; o Submaster confirma. A DeltaTV acompanha toda a rede.">
    {data.seller.role==='submaster'&&<>
      <button type="button" className="outline" disabled={busy} onClick={async()=>{const result=await act('/reparent-code',{});if(result)setTransferCode(result);}}>Gerar meu código de transferência</button>
      {transferCode&&<div className="notice" style={{overflowWrap:'anywhere'}}><b>Código válido até {date(transferCode.expiresAt)}</b><p>{transferCode.code}</p><button type="button" className="outline" onClick={()=>navigator.clipboard?.writeText(transferCode.code)}>Copiar código</button></div>}
    </>}
    {p.canCreateSubmasters&&<form onSubmit={e=>{e.preventDefault();void act('/reparent-requests/code',{code:relocation.code});}} style={{display:'grid',gap:8}}><Label>Código recebido do Submaster<input required minLength={20} value={relocation.code} onChange={e=>setRelocation({code:e.target.value})}/></Label><button className="outline" disabled={busy}>Solicitar recebimento do Submaster</button></form>}
    {relocations.filter(x=>x.status==='pending').map(x=><div key={x.id} className="notice"><p>{x.subject_name} → {x.destination_name}</p><small>Solicitação de {date(x.created_at)}</small>{x.requested_by!==data.seller.partnerId&&<div style={{display:'flex',gap:8}}>{[true,false].map(accept=><button key={String(accept)} type="button" className="outline" onClick={()=>{if(window.confirm(accept?'Confirmar transferência de rede?':'Recusar transferência?'))void act(`/reparent-requests/${x.id}/decision`,{accept});}}>{accept?'Aceitar':'Recusar'}</button>)}</div>}</div>)}
   </Box>
   <Box title="Clientes do meu ramo direto">{contracts.map(c=><p key={c.id}>{c.customer_name} · {c.plan_code} · vence {date(c.expires_at)}</p>)}{!contracts.length&&<p className="muted">Ainda não há clientes vinculados.</p>}</Box>
  </>}
  {allowed==='gateway'&&p.canManageGateways&&<>
   <Box title="Meus gateways" sub="Os pagamentos das suas vendas devem cair na sua própria conta, separada da DeltaTV.">
    <button className="outline" onClick={async()=>{try{setGateways(await api('/content-partner/portal-sales/gateways'))}catch(e){setError(e.message)}}}>Consultar configurações atuais</button>
    {gateways&&<div>{gateways.providers.map(g=><p key={g.provider}>{g.provider} · {g.account_ref||'Conta identificada'} · {g.active?'Ativo':'Desativado'} <button className="outline" disabled={busy} onClick={()=>void act('/gateways/default',{provider:g.provider},'PUT')}>Definir padrão</button></p>)}<small>Gateway padrão: {gateways.defaultGateway||'Ainda não configurado'}</small><div className="notice" style={{display:'grid',gap:6,marginTop:10}}><strong>Webhooks para minhas vendas</strong>
     <small>Mercado Pago: cadastre o endereço abaixo no painel do Mercado Pago e configure seu segredo acima.</small>
     <input aria-label="Webhook Mercado Pago" readOnly value={gateways.webhookUrls?.mercadopago||''} onFocus={e=>e.target.select()}/>
     <button type="button" className="outline" onClick={()=>navigator.clipboard?.writeText(gateways.webhookUrls?.mercadopago||'')}>Copiar webhook Mercado Pago</button>
     <small>InfinitePay: o endereço abaixo é enviado automaticamente na criação do checkout.</small>
     <input aria-label="Webhook InfinitePay" readOnly value={gateways.webhookUrls?.infinitepay||''} onFocus={e=>e.target.select()}/>
     </div></div>}
    <form style={{display:'grid',gap:12}} onSubmit={async e=>{e.preventDefault();const result=await act('/gateways',{provider:gateway.provider,accessToken:gateway.accessToken,handle:gateway.handle||undefined,webhookSecret:gateway.webhookSecret||undefined,currentPassword:gateway.currentPassword},'PUT');if(result){setGateway({...gateway,accessToken:'',webhookSecret:'',currentPassword:''});setNotice('Credencial salva de forma protegida. Teste uma cobrança real antes de ativar vendas automáticas.');}}}>
     <Grid><Label>Provedor<select value={gateway.provider} onChange={e=>setGateway({...gateway,provider:e.target.value})}><option value="mercadopago">Mercado Pago</option><option value="infinitepay">InfinitePay</option></select></Label>
      {gateway.provider==='infinitepay'&&<Label>Minha InfiniteTag<input required value={gateway.handle} onChange={e=>setGateway({...gateway,handle:e.target.value})}/></Label>}
      <Label>{gateway.provider==='mercadopago'?'Access Token':'Chave API'}<input type="password" required minLength={12} autoComplete="off" value={gateway.accessToken} onChange={e=>setGateway({...gateway,accessToken:e.target.value})}/></Label>
      {gateway.provider==='mercadopago'&&<Label>Segredo de webhook<input type="password" value={gateway.webhookSecret} onChange={e=>setGateway({...gateway,webhookSecret:e.target.value})}/></Label>}
      <Label>Confirme sua senha do painel<input type="password" required value={gateway.currentPassword} onChange={e=>setGateway({...gateway,currentPassword:e.target.value})}/></Label></Grid>
     <button className="primary" disabled={busy||!enabled}>Salvar credenciais</button>
    </form>
    <p className="muted">As cobranças de clientes usam seu gateway próprio e são verificadas no provedor. A InfinitePay exige transaction_nsu e slug quando for necessário conferir o pagamento manualmente. Teste uma compra real de baixo valor antes de oferecer o serviço.</p>
   </Box>
  </>}
  {allowed==='finance'&&p.canViewFinance&&<><Box title="Meus recebimentos e compras"><p className="muted">A DeltaTV controla o que você adquiriu; o preço negociado com seus clientes é declarado separadamente.</p><div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Pacote</th><th>Meses</th><th>Valor</th><th>Estado</th><th>Checkout</th></tr></thead><tbody>{(data.orders||[]).map(o=><tr key={o.id}><td>{o.plan_code}</td><td>{o.quantity_months}</td><td>{money(o.total_cents)}</td><td>{o.status}</td><td>{o.status==='pending'&&<div style={{display:'grid',gap:6}}>
   {o.checkout_url?<a href={o.checkout_url} target="_blank" rel="noreferrer">Pagar pelo gateway DeltaTV</a>:o.payment_gateway!=='manual'?
   <button type="button" className="outline" disabled={busy} onClick={()=>void act(`/orders/${o.id}/checkout`,{})}>Gerar link de pagamento</button>:<small>Pix externo — confirmar com a DeltaTV</small>}
   {!o.checkout_url&&!o.pix_copy_paste&&!o.payment_expires_at&&<div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
     <button type="button" className="outline" disabled={busy} onClick={()=>void act(`/orders/${o.id}/payment-method`,{mode:'default'})}>Pagar pelo painel</button>
     <button type="button" className="outline" disabled={busy} onClick={()=>void act(`/orders/${o.id}/payment-method`,{mode:'manual'})}>Pix externo</button>
   </div>}
   {o.pix_copy_paste&&<><textarea value={o.pix_copy_paste} readOnly rows={2}/><button type="button" className="outline" onClick={()=>navigator.clipboard?.writeText(o.pix_copy_paste)}>Copiar Pix</button></>}
   {o.payment_gateway==='infinitepay'&&<button type="button" className="outline" onClick={()=>{const transactionNsu=window.prompt('transaction_nsu da InfinitePay:');const slug=window.prompt('slug da InfinitePay:');if(transactionNsu&&slug)void act(`/orders/${o.id}/confirm-return`,{transactionNsu,slug});}}>Já paguei — conferir</button>}
   </div>}{o.status!=='pending'?'—':null}</td></tr>)}</tbody></table></div></Box><PortalUsage/></>}
 </div>;
}
