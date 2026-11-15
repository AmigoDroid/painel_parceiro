import {useCallback,useEffect,useState} from 'react';
import {api} from './api.js';
const brl=v=>Number(v||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cents=v=>Math.round(Number(String(v).replace(',','.'))*100);
const date=v=>v?new Date(v).toLocaleDateString('pt-BR'):'—';
function Label({children}){return <label style={{display:'grid',gap:5,minWidth:0}}>{children}</label>}
export default function PortalSales(){
 const [data,setData]=useState(null),[error,setError]=useState(''),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const [transfer,setTransfer]=useState({buyerPartnerId:'',planCode:'',quantityMonths:1,price:''});
 const [renew,setRenew]=useState({customerPartnerId:'',months:1,price:''});
 const [transferRequestId,setTransferRequestId]=useState(()=>crypto.randomUUID());
 const [renewRequestId,setRenewRequestId]=useState(()=>crypto.randomUUID());
 const load=useCallback(async()=>{setData(await api('/content-partner/portal-sales'));},[]);
 useEffect(()=>{load().catch(e=>setError(e.message));},[load]);
 const act=async(url,body)=>{setBusy(true);setError('');setNotice('');try{await api(url,{method:'POST',body});setNotice('Operação registrada e auditada.');await load();return true;}catch(e){setError(e.message);return false;}finally{setBusy(false)}};
 if(!data)return <div className="panel" style={{padding:18}}>{error||'Carregando sua rede comercial…'}</div>;
 const stock=data.stock||[],children=data.children||[],contracts=data.contracts||[];
 const selected=contracts.find(c=>c.customer_partner_id===renew.customerPartnerId);
 return <div style={{display:'grid',gap:16}}>
  <div className="panel" style={{padding:18}}><h2>Minha rede de venda do Painel do Parceiro</h2><p className="muted">Distribua acessos ao portal de parceiros, não licenças de TV. Seu perfil comercial: <strong>{data.seller.role==='master'?'Master':'Submaster'}</strong>.</p><p className="muted">Compras de estoque e pagamentos são liberados pelo Superadmin após confirmação do recebimento. As revendas de TVs permanecem separadas.</p></div>
  {error&&<div className="alert" role="alert">{error}</div>}{notice&&<div className="notice" role="status">{notice}</div>}
  <div className="stats">{stock.map(s=><div key={s.plan_code} className="stat"><small>{s.plan_name}</small><strong>{s.available_months}</strong><span>meses pré-pagos disponíveis</span></div>)}{!stock.length&&<div className="stat"><strong>0</strong><span>Solicite estoque ao Superadmin</span></div>}</div>
  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,270px),1fr))',gap:14}}>
   <section className="panel" style={{padding:18,display:'grid',gap:12}}><h3>Transferir meses para Submaster</h3><p className="muted">Só é possível transferir estoque já adquirido ao seu Submaster direto.</p>
    <form style={{display:'grid',gap:12}} onSubmit={e=>{e.preventDefault();if(!window.confirm('Transferir estes meses de acesso do seu estoque?'))return;void act('/content-partner/portal-sales/transfers',{buyerPartnerId:transfer.buyerPartnerId,planCode:transfer.planCode,quantityMonths:Number(transfer.quantityMonths),unitResaleCents:cents(transfer.price),requestId:transferRequestId}).then(ok=>{if(ok)setTransferRequestId(crypto.randomUUID())});}}>
     <Label>Submaster<select required value={transfer.buyerPartnerId} onChange={e=>setTransfer({...transfer,buyerPartnerId:e.target.value})}><option value="">Selecionar</option>{children.filter(c=>c.active).map(c=><option key={c.partner_id} value={c.partner_id}>{c.name}</option>)}</select></Label>
     <Label>Plano<select required value={transfer.planCode} onChange={e=>setTransfer({...transfer,planCode:e.target.value})}><option value="">Selecionar</option>{stock.filter(s=>Number(s.available_months)>0).map(s=><option key={s.plan_code} value={s.plan_code}>{s.plan_name} ({s.available_months} meses)</option>)}</select></Label>
     <Label>Meses<input required type="number" min="1" max="100000" value={transfer.quantityMonths} onChange={e=>setTransfer({...transfer,quantityMonths:e.target.value})}/></Label>
     <Label>Valor de revenda por mês (R$)<input required inputMode="decimal" value={transfer.price} onChange={e=>setTransfer({...transfer,price:e.target.value})}/></Label>
     <button className="primary" disabled={busy||!data.seller.canSell||!children.length}>Transferir estoque</button>
    </form>
   </section>
   <section className="panel" style={{padding:18,display:'grid',gap:12}}><h3>Renovar acesso de cliente</h3><p className="muted">Primeiro vínculo exige Superadmin. Você pode renovar clientes já vinculados à sua conta.</p>
    <form style={{display:'grid',gap:12}} onSubmit={e=>{e.preventDefault();if(!selected)return;void act('/content-partner/portal-sales/renewals',{customerPartnerId:selected.customer_partner_id,planCode:selected.plan_code,months:Number(renew.months),unitResaleCents:cents(renew.price),monthlyFeeCents:Number(selected.monthly_fee_cents),requestId:renewRequestId}).then(ok=>{if(ok)setRenewRequestId(crypto.randomUUID())});}}>
     <Label>Cliente do Painel do Parceiro<select required value={renew.customerPartnerId} onChange={e=>setRenew({...renew,customerPartnerId:e.target.value})}><option value="">Selecionar</option>{contracts.map(c=><option key={c.id} value={c.customer_partner_id}>{c.customer_name} · vence {date(c.expires_at)}</option>)}</select></Label>
     <Label>Meses adicionais<input required type="number" min="1" max="120" value={renew.months} onChange={e=>setRenew({...renew,months:e.target.value})}/></Label>
     <Label>Preço declarado ao cliente por mês (R$)<input required inputMode="decimal" value={renew.price} onChange={e=>setRenew({...renew,price:e.target.value})}/></Label>
     <button className="primary" disabled={busy||!data.seller.canSell||!selected}>Renovar com meu estoque</button>
    </form>
   </section>
  </div>
  <section className="panel" style={{padding:18}}><h3>Clientes vinculados</h3><div style={{overflowX:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Parceiro</th><th>Plano</th><th>Meses pagos</th><th>Vencimento</th></tr></thead><tbody>{contracts.map(c=><tr key={c.id}><td>{c.customer_name}</td><td>{c.plan_code}</td><td>{c.months_paid}</td><td>{date(c.expires_at)}</td></tr>)}</tbody></table></div>{!contracts.length&&<p className="muted">Sem clientes vinculados. Solicite à administração o primeiro vínculo após a compra de estoque.</p>}</section>
  <section className="panel" style={{padding:18}}><h3>Movimentações da sua rede</h3>{(data.transfers||[]).slice(0,20).map(t=><p key={t.id} className="muted">{date(t.created_at)} · {t.seller_partner_id===data.seller.partnerId?'Enviado':'Recebido'} · {t.quantity_months} mês(es) · {brl(t.declared_total_cents)} declarado</p>)}{!(data.transfers||[]).length&&<p className="muted">Sem transferências registradas.</p>}<p className="muted">Valores de revenda são somente declarados; não equivalem a pagamentos comprovados.</p></section>
 </div>;
}
