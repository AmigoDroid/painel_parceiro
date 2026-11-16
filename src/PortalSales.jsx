import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import PortalUsage from './PortalUsage.jsx';
import './portal-sales.css';

const moneyCents = value => (Number(value || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const asCents = value => Math.round(Number(String(value || '0').replace(',', '.')) * 100);
const date = value => value ? new Date(value).toLocaleDateString('pt-BR') : '—';
const statusLabels = { pending: 'Aguardando', accepted: 'Aceito', expired: 'Expirado', cancelled: 'Cancelado', revoked: 'Cancelado', paid: 'Pago' };
const permissionLabels = { canSell: 'Vender acessos', canCreateSubmasters: 'Criar Submasters', canViewFinance: 'Ver financeiro', canManageGateways: 'Configurar pagamentos' };
const permissionColumns = { canSell: 'can_sell', canCreateSubmasters: 'can_create_submasters', canViewFinance: 'can_view_finance', canManageGateways: 'can_manage_gateways' };
const initialInvite = { invitedName: '', invitedEmail: '', inviteType: 'customer', planCode: '', months: '1', price: '', paymentMode: 'manual' };

async function copyValue(value) {
  if (!value) return;
  if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
}
function FormField({ label, hint, children }) {
  return <label className="ps-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function Panel({ title, description, children, className = '' }) {
  return <section className={`ps-panel ${className}`}><div className="ps-panel-heading"><h3>{title}</h3>{description && <p>{description}</p>}</div>{children}</section>;
}
function EmptyState({ title, description }) {
  return <div className="ps-empty"><strong>{title}</strong><p>{description}</p></div>;
}
function PackageSummary({ item }) {
  if (!item) return <div className="ps-package-hint">Escolha o plano para visualizar os benefícios.</div>;
  return <div className="ps-package-hint"><strong>{item.name}</strong><div className="ps-benefits">
    <span>{item.maxDns == null ? 'DNS ilimitados' : `${item.maxDns} DNS por código`}</span>
    <span>{item.activationLimit == null ? 'Ativações ilimitadas' : `${item.activationLimit} ativações`}</span>
    {item.autoFailover && <span>Failover automático</span>}
    {item.autoPriority && <span>Prioridade automática</span>}
  </div></div>;
}

export function MyServicePackage() {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { let alive = true;
    api('/content-partner/portal-sales/my-package').then(value => { if (alive) setInfo(value); }).catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, []);
  if (error) return <div role="alert" className="alert">{error}</div>;
  if (!info) return <div className="ps-panel">Carregando seu plano…</div>;
  const usage = info.activations || {};
  return <Panel title={`Meu plano · ${info.packageName || 'Atual'}`} description="Benefícios e limites do seu próprio acesso ao Painel do Parceiro.">
    <div className="ps-metrics">
      <div><small>Meu ID DeltaTV</small><strong>{info.publicId || '—'}</strong><button className="ps-inline-button" type="button" onClick={() => void copyValue(info.publicId)}>Copiar ID</button></div>
      <div><small>DNS por código</small><strong>{info.dns?.limit == null ? 'Ilimitados' : info.dns.limit}</strong></div>
      <div><small>Ativações</small><strong>{usage.used ?? 0} / {usage.limit == null ? 'Ilimitadas' : usage.limit}</strong></div>
      <div><small>Validade do acesso</small><strong>{date(info.expiresAt)}</strong></div>
      <div><small>Mensalidade a {info.feeRecipient || "DeltaTV"}</small><strong>{moneyCents(info.monthlyFeeCents || 0)}</strong></div>
    </div>
    <div className="ps-benefits" aria-label="Benefícios do pacote">{[
      ['autoFailover', 'Failover'], ['autoPriority', 'Prioridade automática'], ['emailAlerts', 'Alertas por e-mail'], ['detailedHistory', 'Histórico detalhado'],
    ].filter(([key]) => info.features?.[key]).map(([key, label]) => <span key={key}>✓ {label}</span>)}</div>
    {info.pendingPayment && <div className="ps-notice"><strong>Seu acesso aguarda confirmação de pagamento</strong>
      <p>{moneyCents(info.pendingPayment.totalCents)} · {info.pendingPayment.gateway === 'manual' ? 'Pix externo com a DeltaTV' : info.pendingPayment.gateway}</p>
      {info.pendingPayment.checkoutUrl && <a href={info.pendingPayment.checkoutUrl} target="_blank" rel="noreferrer">Abrir cobrança</a>}
      {info.pendingPayment.gateway !== 'manual' && <button type="button" className="primary" disabled={busy} onClick={async () => { setBusy(true); try {
        const result = await api('/content-partner/portal-sales/my-package/checkout', { method: 'POST', body: {} });
        setInfo(prev => ({ ...prev, pendingPayment: { ...prev.pendingPayment, checkoutUrl: result.checkout_url || prev.pendingPayment.checkoutUrl } }));
        if (result.checkout_url) window.open(result.checkout_url, '_blank', 'noopener,noreferrer');
      } catch (e) { setError(e.message); } finally { setBusy(false); } }}>Gerar cobrança</button>}
      <small>Os benefícios comerciais são liberados somente após a confirmação pela DeltaTV ou pelo provedor.</small>
    </div>}
    {info.legacy && info.note && <p className="ps-muted">{info.note}</p>}
  </Panel>;
}

function SalesForm({ packages, permissions, gateways, busy, enabled, onSave, created, onClear, onCreated }) {
  const [form, setForm] = useState(initialInvite);
  const availablePlans = packages.filter(p => !p.canResellPanel || permissions.canCreateSubmasters);
  const selected = availablePlans.find(p => p.code === form.planCode);
  const total = asCents(form.price) * Number(form.months || 0);
  const canUseGateway = Boolean(permissions.canManageGateways && gateways?.defaultGateway);
  const canUseManual = Boolean(permissions.canViewFinance);
  useEffect(() => { if (!canUseManual && canUseGateway) setForm(value => value.paymentMode === 'manual' ? { ...value, paymentMode: 'gateway' } : value); }, [canUseManual, canUseGateway]);
  const submit = async event => {
    event.preventDefault();
    const months = Number(form.months);
    const unitResaleCents = asCents(form.price);
    if (!selected || !Number.isInteger(months) || months < 1 || months > 120 || !Number.isFinite(unitResaleCents) || unitResaleCents < 0) return;
    if (selected.minResaleCents != null && unitResaleCents < Number(selected.minResaleCents)) return;
    if (!window.confirm(`Criar convite de ${months} mês(es) por ${moneyCents(unitResaleCents * months)}?`)) return;
    const result = await onSave('/invitations', {
      invitedName: form.invitedName.trim(), invitedEmail: form.invitedEmail.trim(), inviteType: selected.canResellPanel ? 'submaster' : 'customer',
      planCode: form.planCode, months, unitResaleCents, monthlyFeeCents: 0, paymentMode: form.paymentMode,
    });
    if (result) { setForm(initialInvite); onCreated(result); }
  };
  return <div className="ps-sales-columns">
    <Panel title="Nova venda" description="Preencha os dados, escolha o pacote e envie o convite. Sem estoque, créditos ou cadastros paralelos.">
      <form className="ps-form" onSubmit={submit}>
        <div className="ps-step-label">1 · Quem vai receber o acesso?</div>
        <div className="ps-form-grid"><FormField label="Nome ou empresa"><input required minLength={2} maxLength={160} autoComplete="off" value={form.invitedName} onChange={e => setForm(f => ({ ...f, invitedName: e.target.value }))} placeholder="Nome do comprador" /></FormField>
          <FormField label="E-mail"><input required type="email" maxLength={200} value={form.invitedEmail} onChange={e => setForm(f => ({ ...f, invitedEmail: e.target.value }))} placeholder="cliente@empresa.com" /></FormField></div>
        <div className="ps-step-label">2 · O que será contratado?</div>
        <FormField label="Plano"><select required value={form.planCode} onChange={e => setForm(f => ({ ...f, planCode: e.target.value }))}><option value="">Selecione o plano</option>{availablePlans.map(item => <option key={item.code} value={item.code}>{item.name}{item.canResellPanel?' · permite revenda':''}</option>)}</select></FormField>
        <PackageSummary item={selected} />
        <div className="ps-form-grid"><FormField label="Valor negociado por mês (R$)"><input type="number" inputMode="decimal" required min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0,00" /></FormField>
          <FormField label="Duração (meses)"><input type="number" required min="1" max="120" value={form.months} onChange={e => setForm(f => ({ ...f, months: e.target.value }))} /></FormField></div>
        {selected?.minResaleCents != null && asCents(form.price) < Number(selected.minResaleCents) && form.price !== '' && <p role="alert" className="ps-error">Este plano exige valor mínimo de {moneyCents(selected.minResaleCents)} por mês.</p>}
        <div className="ps-step-label">3 · Como será o pagamento?</div>
        <div className="ps-payment-options">
          {canUseManual && <label className={form.paymentMode === 'manual' ? 'selected' : ''}><input type="radio" name="sale-payment" checked={form.paymentMode === 'manual'} onChange={() => setForm(f => ({ ...f, paymentMode: 'manual' }))} /><span><strong>Pix externo</strong><small>Você confirma somente depois de receber.</small></span></label>}
          {canUseGateway && <label className={form.paymentMode === 'gateway' ? 'selected' : ''}><input type="radio" name="sale-payment" checked={form.paymentMode === 'gateway'} onChange={() => setForm(f => ({ ...f, paymentMode: 'gateway' }))} /><span><strong>Pagamento online</strong><small>{gateways.defaultGateway === 'infinitepay' ? 'InfinitePay' : 'Mercado Pago'} na sua própria conta.</small></span></label>}
        </div>
        {!canUseManual && !canUseGateway && <p role="alert" className="ps-error">Você não tem permissão para confirmar Pix externo nem um gateway próprio disponível. Solicite autorização ao Master responsável.</p>}
        <div className="ps-checkout-summary"><span>Total negociado</span><strong>{Number.isFinite(total) && total >= 0 ? moneyCents(total) : '—'}</strong></div>
        <button className="primary ps-submit" disabled={busy || !enabled || !selected || !form.invitedEmail || !form.invitedName || !form.price || (!canUseManual && !canUseGateway) || (form.paymentMode === 'manual' && !canUseManual) || (form.paymentMode === 'gateway' && !canUseGateway) || (selected?.minResaleCents != null && asCents(form.price) < Number(selected.minResaleCents))}>{busy ? 'Gerando convite…' : 'Criar convite de acesso'}</button>
        <small className="ps-muted">O cliente só poderá concluir o cadastro depois da confirmação do pagamento. A venda não gera estoque de licenças.</small>
      </form>
      {created && <div className="ps-success" role="status"><div className="ps-success-head"><strong>Convite gerado</strong><button type="button" className="ps-inline-button" onClick={onClear}>Fechar</button></div>
        {created.warning && <p>{created.warning}</p>}
        <input aria-label="Link de cadastro" readOnly value={created.link || ''} onFocus={e => e.target.select()} />
        <div className="ps-actions"><button className="outline" type="button" onClick={() => void copyValue(created.link)}>Copiar convite</button>{created.checkoutUrl && <a className="ps-action-link" href={created.checkoutUrl} target="_blank" rel="noreferrer">Abrir pagamento</a>}</div>
      </div>}
    </Panel>
    <aside className="ps-sale-aside"><div className="ps-side-panel"><strong>Venda simplificada</strong><p>1. Identifique o cliente.</p><p>2. Escolha o plano e o valor.</p><p>3. Envie o convite.</p><hr /><small>DNS, ativações e benefícios são aplicados pelo Plano. Não há estoque de meses para distribuir.</small></div></aside>
  </div>;
}

function Invitations({ invitations, busy, canConfirmExternal, onAction }) {
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState(null);
  const filtered = invitations.filter(item => `${item.invited_name || ''} ${item.invited_email} ${item.plan_code}`.toLowerCase().includes(search.toLowerCase()));
  return <Panel title="Convites e pagamentos" description="Acompanhe os cadastros e confirme recebimentos externos somente após conferir seu extrato.">
    <input aria-label="Buscar convites" className="ps-search" placeholder="Buscar por cliente, e-mail ou pacote" value={search} onChange={e => setSearch(e.target.value)} />
    {!filtered.length ? <EmptyState title="Nenhum convite encontrado" description="Quando você fizer uma venda, ela aparecerá aqui." /> : <div className="ps-invite-list">{filtered.map(item => {
      const pending = item.status === 'pending' && item.payment_status !== 'paid';
      const manual = item.payment_gateway === 'manual';
      return <article key={item.id} className="ps-invite-row"><div className="ps-invite-main"><strong>{item.invited_name || item.invited_email}</strong><span>{item.invited_email}</span><small>{item.plan_code} · {item.months} {item.months === 1 ? 'mês' : 'meses'} · vence {date(item.expires_at)}</small></div>
        <div className="ps-invite-meta"><span className={`ps-status ${item.payment_status === 'paid' ? 'is-paid' : pending ? 'is-pending' : ''}`}>{item.payment_status === 'paid' ? 'Pagamento confirmado' : pending ? (manual ? 'Aguardando Pix externo' : 'Aguardando gateway') : statusLabels[item.status] || item.status}</span>
          <div className="ps-actions">{pending && manual && canConfirmExternal && <button type="button" className="outline" disabled={busy} onClick={() => setPayment({ id: item.id, email: item.invited_email, reference: '', password: '', received: false })}>Confirmar Pix recebido</button>}
            {pending && !manual && (item.checkout_url ? <a href={item.checkout_url} target="_blank" rel="noreferrer">Abrir checkout</a> : <button type="button" className="outline" disabled={busy} onClick={() => void onAction(`/invitations/${item.id}/checkout`, {})}>Gerar checkout</button>)}
            {pending && !manual && <button type="button" className="outline" disabled={busy} onClick={() => { const transactionNsu = item.payment_gateway === 'infinitepay' ? window.prompt('transaction_nsu da InfinitePay') : undefined; const slug = item.payment_gateway === 'infinitepay' ? window.prompt('slug da InfinitePay') : undefined; if (item.payment_gateway === 'infinitepay' && (!transactionNsu || !slug)) return; void onAction(`/invitations/${item.id}/recheck`, { ...(transactionNsu ? { transactionNsu, slug } : {}) }); }}>Conferir</button>}
            {pending && <button type="button" className="ps-danger-link" disabled={busy} onClick={() => { if (window.confirm('Cancelar este convite?')) void onAction(`/invitations/${item.id}/revoke`, {}); }}>Cancelar</button>}
          </div></div></article>;
    })}</div>}
    {payment && <form className="ps-external-confirm" onSubmit={async event => { event.preventDefault(); if (!payment.received) return; const result = await onAction(`/invitations/${payment.id}/confirm-external`, { reference: payment.reference.trim(), currentPassword: payment.password, confirmReceived: true }); if (result) setPayment(null); }}>
      <h4>Confirmar pagamento externo</h4><p>Cliente: {payment.email}. Verifique o crédito no extrato bancário, não apenas o comprovante.</p>
      <FormField label="Referência bancária"><input required minLength={6} maxLength={120} value={payment.reference} onChange={e => setPayment(v => ({ ...v, reference: e.target.value }))} /></FormField>
      <FormField label="Sua senha do painel"><input type="password" required autoComplete="current-password" value={payment.password} onChange={e => setPayment(v => ({ ...v, password: e.target.value }))} /></FormField>
      <label className="ps-checkbox"><input type="checkbox" required checked={payment.received} onChange={e => setPayment(v => ({ ...v, received: e.target.checked }))} />Confirmo o recebimento na minha conta</label>
      <div className="ps-actions"><button className="primary" disabled={busy || !payment.received}>Confirmar pagamento</button><button type="button" className="outline" onClick={() => setPayment(null)}>Voltar</button></div>
    </form>}
  </Panel>;
}

function Network({ data, tree, permissions, relocations, busy, onAction }) {
  const [code, setCode] = useState('');
  const [transferCode, setTransferCode] = useState(null);
  const descendants = tree.filter(item => item.depth > 0);
  return <div className="ps-stack">
    <Panel title="Integrantes da minha rede" description="Seus Submasters e descendentes, organizados por nível.">
      {descendants.length ? <div className="ps-network-list">{descendants.map(item => <div key={item.partner_id} className="ps-network-item" style={{ '--depth': Math.min(item.depth || 0, 8) }}><span>{item.name}</span><small>{item.role === 'master' ? 'Master' : 'Submaster'} · {item.direct_customers} cliente(s)</small></div>)}</div> : <EmptyState title="Sua rede ainda está vazia" description="Quando você cadastrar um Submaster, ele aparecerá aqui." />}
    </Panel>
    {permissions.canCreateSubmasters && <Panel title="Permissões dos Submasters diretos" description="Somente opções autorizadas são exibidas a cada integrante.">
      {!data.children?.length && <EmptyState title="Nenhum Submaster direto" description="Cadastre um Submaster pela área Vender acesso." />}
      {(data.children || []).map(child => <div className="ps-permission-row" key={child.partner_id}><strong>{child.name}</strong><div className="ps-permission-options">{Object.entries(permissionLabels).filter(([key]) => permissions[key]).map(([key, label]) => <label className="ps-checkbox" key={key}><input type="checkbox" checked={Boolean(child[permissionColumns[key]])} disabled={busy} onChange={event => void onAction(`/submasters/${child.partner_id}/permissions`, { [key]: event.target.checked }, 'PATCH')} />{label}</label>)}</div></div>)}
    </Panel>}
    <Panel title="Transferir Submaster" description="A transferência só acontece mediante consentimento, com código temporário.">
      <details className="ps-details"><summary>Solicitar ou autorizar transferência</summary><div className="ps-stack">
        {data.seller.role === 'submaster' && <><button className="outline" disabled={busy} onClick={async () => { const result = await onAction('/reparent-code', {}); if (result) setTransferCode(result); }}>Gerar meu código de transferência</button>{transferCode && <div className="ps-notice"><strong>Código válido até {date(transferCode.expiresAt)}</strong><p className="ps-break">{transferCode.code}</p><button type="button" className="outline" onClick={() => void copyValue(transferCode.code)}>Copiar</button></div>}</>}
        {permissions.canCreateSubmasters && <form className="ps-form" onSubmit={event => { event.preventDefault(); void onAction('/reparent-requests/code', { code }); }}><FormField label="Código fornecido pelo Submaster"><input required minLength={20} value={code} onChange={e => setCode(e.target.value)} /></FormField><button className="outline" disabled={busy}>Solicitar transferência</button></form>}
        {relocations.filter(item => item.status === 'pending').map(item => <div className="ps-notice" key={item.id}><strong>{item.subject_name} → {item.destination_name}</strong><p>Solicitada em {date(item.created_at)}</p>{item.requested_by !== data.seller.partnerId && <div className="ps-actions"><button className="outline" disabled={busy} onClick={() => { if (window.confirm('Autorizar transferência?')) void onAction(`/reparent-requests/${item.id}/decision`, { accept: true }); }}>Aceitar</button><button className="outline" disabled={busy} onClick={() => { if (window.confirm('Recusar transferência?')) void onAction(`/reparent-requests/${item.id}/decision`, { accept: false }); }}>Recusar</button></div>}</div>)}
      </div></details>
    </Panel>
  </div>;
}

function GatewaySettings({ settings, busy, onAction }) {
  const [form, setForm] = useState({ provider: 'mercadopago', handle: '', accessToken: '', webhookSecret: '', currentPassword: '' });
  const [error, setError] = useState('');
  return <Panel title="Receber pelas minhas vendas" description="Conecte o Mercado Pago ou InfinitePay da sua empresa. O dinheiro não passa pela DeltaTV.">
    {settings && <div className="ps-gateway-cards">{settings.providers?.map(item => <div key={item.provider} className="ps-gateway-card"><strong>{item.provider === 'infinitepay' ? 'InfinitePay' : 'Mercado Pago'}</strong><span>{item.active ? 'Conectado' : 'Desativado'}{item.account_ref ? ` · ${item.account_ref}` : ''}</span><button type="button" className="outline" disabled={busy || !item.active || item.provider === settings.defaultGateway} onClick={() => void onAction('/gateways/default', { provider: item.provider }, 'PUT')}>{item.provider === settings.defaultGateway ? 'Padrão atual' : 'Usar como padrão'}</button></div>)}</div>}
    <details className="ps-details" open={!settings?.providers?.some(item => item.active)}><summary>Adicionar ou atualizar gateway</summary>
      <form className="ps-form" onSubmit={async event => { event.preventDefault(); setError(''); const result = await onAction('/gateways', { provider: form.provider, accessToken: form.accessToken, ...(form.provider === 'infinitepay' ? { handle: form.handle } : { webhookSecret: form.webhookSecret }), currentPassword: form.currentPassword }, 'PUT'); if (result) setForm(old => ({ ...old, accessToken: '', webhookSecret: '', currentPassword: '' })); }}>
        <FormField label="Gateway"><select value={form.provider} onChange={e => setForm(v => ({ ...v, provider: e.target.value }))}><option value="mercadopago">Mercado Pago</option><option value="infinitepay">InfinitePay</option></select></FormField>
        {form.provider === 'infinitepay' && <FormField label="InfiniteTag"><input required value={form.handle} onChange={e => setForm(v => ({ ...v, handle: e.target.value }))} /></FormField>}
        <FormField label={form.provider === 'infinitepay' ? 'Chave API' : 'Access Token'}><input type="password" autoComplete="off" required minLength={12} value={form.accessToken} onChange={e => setForm(v => ({ ...v, accessToken: e.target.value }))} /></FormField>
        {form.provider === 'mercadopago' && <FormField label="Segredo do webhook"><input type="password" value={form.webhookSecret} onChange={e => setForm(v => ({ ...v, webhookSecret: e.target.value }))} /></FormField>}
        <FormField label="Sua senha atual"><input type="password" required autoComplete="current-password" value={form.currentPassword} onChange={e => setForm(v => ({ ...v, currentPassword: e.target.value }))} /></FormField>
        {error && <p role="alert" className="ps-error">{error}</p>}
        <button className="primary" disabled={busy}>Salvar gateway</button>
      </form>
    </details>
    {settings?.webhookUrls && <details className="ps-details"><summary>URLs de webhook</summary><div className="ps-stack"><FormField label="Mercado Pago"><input readOnly value={settings.webhookUrls.mercadopago || ''} onFocus={e => e.target.select()} /></FormField><button type="button" className="outline" onClick={() => void copyValue(settings.webhookUrls.mercadopago)}>Copiar</button><FormField label="InfinitePay"><input readOnly value={settings.webhookUrls.infinitepay || ''} onFocus={e => e.target.select()} /></FormField><small>O checkout InfinitePay recebe o webhook automaticamente.</small></div></details>}
  </Panel>;
}

function Finance({ orders, busy, onAction }) {
  return <div className="ps-stack"><Panel title="Minhas compras à DeltaTV" description="Acompanhe cobranças do seu próprio acesso. Seus clientes pagam diretamente a você.">
    {orders?.length ? <div className="ps-invite-list">{orders.map(item => <article className="ps-invite-row" key={item.id}><div className="ps-invite-main"><strong>{item.plan_code}</strong><span>{item.quantity_months} mês(es) · {moneyCents(item.total_cents)}</span><small>{statusLabels[item.status] || item.status}</small></div>{item.status === 'pending' && <div className="ps-invite-meta"><div className="ps-actions">
      {item.checkout_url ? <a href={item.checkout_url} target="_blank" rel="noreferrer">Pagar pelo painel</a> : item.payment_gateway !== 'manual' ? <button type="button" className="outline" disabled={busy} onClick={() => void onAction(`/orders/${item.id}/checkout`, {})}>Gerar checkout</button> : <span className="ps-muted">Pix externo com a DeltaTV</span>}
      {!item.checkout_url && !item.pix_copy_paste && !item.payment_expires_at && <><button type="button" className="outline" disabled={busy} onClick={() => void onAction(`/orders/${item.id}/payment-method`, { mode: 'default' })}>Pagamento online</button><button type="button" className="outline" disabled={busy} onClick={() => void onAction(`/orders/${item.id}/payment-method`, { mode: 'manual' })}>Pix externo</button></>}
      {item.payment_gateway === 'infinitepay' && <button type="button" className="outline" onClick={() => { const transactionNsu = window.prompt('transaction_nsu da InfinitePay:'); const slug = window.prompt('slug da InfinitePay:'); if (transactionNsu && slug) void onAction(`/orders/${item.id}/confirm-return`, { transactionNsu, slug }); }}>Conferir pagamento</button>}
    </div></div>}</article>)}</div> : <EmptyState title="Sem cobranças registradas" description="As cobranças da DeltaTV aparecerão aqui quando existirem." />}
  </Panel><details className="ps-details"><summary>Consumo e relatórios da minha rede</summary><PortalUsage /></details></div>;
}

export default function PortalSales({ canOperate = true }) {
  const [data, setData] = useState(null);
  const [perms, setPerms] = useState(null);
  const [tree, setTree] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [relocations, setRelocations] = useState([]);
  const [packages, setPackages] = useState([]);
  const [gateways, setGateways] = useState(null);
  const [createdInvite, setCreatedInvite] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    const tasks = [api('/content-partner/portal-sales'), api('/content-partner/portal-sales/permissions'), api('/content-partner/portal-sales/tree'), api('/content-partner/portal-sales/invitations'), api('/content-partner/portal-sales/reparent-requests'), api('/content-partner/portal-sales/packages')];
    const results = await Promise.allSettled(tasks);
    if (results[0].status === 'fulfilled') setData(results[0].value);
    if (results[1].status === 'fulfilled') setPerms(results[1].value);
    if (results[2].status === 'fulfilled') setTree(results[2].value.items || []);
    if (results[3].status === 'fulfilled') setInvitations(results[3].value.items || []);
    if (results[4].status === 'fulfilled') setRelocations(results[4].value.items || []);
    if (results[5].status === 'fulfilled') setPackages(results[5].value.items || []);
    else setPackages([]);
    if (results[0].status === 'rejected') setError(results[0].reason?.message || 'Falha ao carregar rede comercial.');
    else if (results[1].status === 'rejected') setError(results[1].reason?.message || 'Falha ao consultar permissões.');
    else if (results[5].status === 'rejected' && results[1].status === 'fulfilled' && results[1].value?.permissions?.canSell) setError('Não foi possível carregar os planos. Atualize ou procure o suporte.');
    else setError('');
    if (results[1].status === 'fulfilled' && results[1].value?.permissions?.canManageGateways) {
      try { setGateways(await api('/content-partner/portal-sales/gateways')); } catch { setGateways(null); }
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const act = async (path, body, method = 'POST') => {
    setError(''); setNotice(''); setBusy(true);
    try { const result = await api(`/content-partner/portal-sales${path}`, { method, body }); setNotice('Operação salva com sucesso.'); await refresh(); return result; }
    catch (e) { setError(e.message || 'Não foi possível concluir.'); return null; }
    finally { setBusy(false); }
  };
  if (!data || !perms) return <div className="ps-panel" role="status">{error || 'Carregando a rede comercial…'}</div>;
  const permissions = perms.permissions || {};
  const enabled = Boolean(canOperate && perms.enabled);
  return <div className="ps-shell">
    {error && <div role="alert" className="ps-error">{error} <button className="outline" type="button" onClick={() => void refresh()}>Tentar novamente</button></div>}
    {notice && <div role="status" className="ps-notice">{notice}</div>}
    {!enabled && <p role="status" className="ps-notice">A revenda de painel não está ativa para sua conta. Consulte o responsável pelo seu plano.</p>}
    {permissions.canSell && <SalesForm packages={packages} permissions={permissions} gateways={gateways} busy={busy} enabled={enabled} onSave={act} created={createdInvite} onCreated={setCreatedInvite} onClear={() => setCreatedInvite(null)} />}
    {permissions.canSell && <Panel title="Convites enviados" description="Acompanhe cobranças e cadastros nesta mesma página."><Invitations invitations={invitations} busy={busy} canConfirmExternal={permissions.canViewFinance} onAction={act} /></Panel>}
    {permissions.canCreateSubmasters && <details className="ps-details"><summary>Gerenciar minha rede</summary><Network data={data} tree={tree} permissions={permissions} relocations={relocations} busy={busy} onAction={act} /></details>}
    {permissions.canViewFinance && <details className="ps-details"><summary>Recebimentos</summary><Finance orders={data.orders || []} busy={busy} onAction={act} /></details>}
    {permissions.canManageGateways && <details className="ps-details"><summary>Meus meios de pagamento</summary><GatewaySettings settings={gateways} busy={busy} onAction={act} /></details>}
  </div>;
}
