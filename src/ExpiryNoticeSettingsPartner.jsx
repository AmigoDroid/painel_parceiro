import { useEffect, useState } from "react";
import { api } from "./api.js";

const PATH = "/content-partner/clients/expiry-notice-settings";
const DEFAULTS = {
  enabled: false, daysBefore: 3, messageMode: "service", deliveryMode: "daily",
  customBefore: "Seu acesso vence em {prazo}.",
  customToday: "Seu acesso vence hoje.",
};

function preview(s, days) {
  if (s.messageMode === "custom") {
    return (days === 0 ? s.customToday : s.customBefore)
      .replace(/\{prazo\}/g, `${days} ${days === 1 ? "dia" : "dias"}`)
      .replace(/\{dias\}/g, String(days))
      .replace(/\{data\}/g, "15/11/2026");
  }
  if (days === 0) return s.messageMode === "channels" ? "Seus canais vencem hoje." : "Seu serviço vence hoje.";
  const prefix = s.messageMode === "channels" ? "Seus canais vencem" : "Seu serviço vence";
  return `${prefix} em ${days} ${days === 1 ? "dia" : "dias"}.`;
}

export default function ExpiryNoticeSettingsPartner() {
  const [form, setForm] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const set = (field, value) => setForm(v => ({ ...v, [field]: value }));
  useEffect(() => {
    let alive = true;
    api(PATH).then(r => { if (alive) setForm({ ...DEFAULTS, ...r }); })
      .catch(e => { if (alive) setError(e.message || "Não foi possível carregar os avisos."); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);
  const submit = async e => {
    e.preventDefault(); setError(""); setMessage(""); setSaving(true);
    try {
      const updated = await api(PATH, { method: "PUT", body: form });
      setForm({ ...DEFAULTS, ...updated });
      setMessage("Regra salva para os clientes desta parceria. TVs compatíveis receberão a atualização.");
    } catch (e) { setError(e.message || "Não foi possível salvar os avisos."); }
    finally { setSaving(false); }
  };
  return <section className="panel" aria-label="Avisos de vencimento na TV" style={{ padding: 20, marginBottom: 22 }}>
    <h2>Avisos de vencimento na TV</h2>
    <p style={{ color: "#acbed8", fontSize: 13, lineHeight: 1.6 }}>
      Defina uma regra para os clientes da sua parceria. A data usada é a da ficha do cliente,
      não a validade da licença DeltaTV. Clientes de outras empresas não são afetados.
    </p>
    {error && <div role="alert" className="alert">{error}</div>}
    {message && <div role="status" style={{ color: "#65e4b9", padding: "10px 0" }}>{message}</div>}
    {loading ? <p>Carregando preferências…</p> : <form onSubmit={submit}>
      <fieldset disabled={saving} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, cursor: "pointer" }}>
          <input type="checkbox" checked={form.enabled} onChange={e => set("enabled", e.target.checked)}
            style={{ width: 18, height: 18, flexShrink: 0 }} />
          <strong>Mostrar avisos de vencimento nas TVs</strong>
        </label>
        <div className="rowfields">
          <div>
            <label className="label" htmlFor="expiry-days">Começar a avisar (dias antes)</label>
            <input id="expiry-days" type="number" min="1" max="30" step="1" required
              value={form.daysBefore} onChange={e => set("daysBefore", Math.min(30, Math.max(1, Number(e.target.value) || 1)))} />
          </div>
          <div>
            <label className="label" htmlFor="expiry-mode">Texto do aviso</label>
            <select id="expiry-mode" value={form.messageMode} onChange={e => set("messageMode", e.target.value)}>
              <option value="service">Padrão: Serviço</option>
              <option value="channels">Padrão: Canais</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
        </div>
        <div style={{ margin: "12px 0 16px" }}>
          <label className="label" htmlFor="expiry-delivery">Frequência dos avisos</label>
          <select id="expiry-delivery" value={form.deliveryMode} onChange={e => set("deliveryMode", e.target.value)}>
            <option value="daily">Uma vez por dia</option>
            <option value="every_open">Toda vez que o aplicativo abrir e conectar</option>
          </select>
          <p style={{ color: "#acbed8", fontSize: 12 }}>O aviso não se repete quando o WebSocket reconecta. Vídeos não serão interrompidos.</p>
        </div>
        {form.messageMode === "custom" && <div className="rowfields">
          <div>
            <label className="label" htmlFor="expiry-before">Antes de vencer</label>
            <input id="expiry-before" value={form.customBefore} maxLength={180} required
              onChange={e => set("customBefore", e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="expiry-today">No dia do vencimento</label>
            <input id="expiry-today" value={form.customToday} maxLength={180} required
              onChange={e => set("customToday", e.target.value)} />
          </div>
          <p style={{ color: "#acbed8", fontSize: 12, gridColumn: "1 / -1" }}>
            Variáveis disponíveis: {'{prazo}'}, {'{dias}'} e {'{data}'}.
          </p>
        </div>}
        <div style={{ margin: "20px 0", padding: 16, background: "#0b1729", border: "1px solid #31466d", borderRadius: 12 }}>
          <b>Prévia da mensagem</b>
          <p style={{ margin: "12px 0", overflowWrap: "anywhere" }}>{preview(form, Math.min(3, form.daysBefore))}</p>
          <small style={{ color: "#9db0cf" }}>No dia: {preview(form, 0)}</small>
        </div>
        <button type="submit" className="primary" disabled={saving}>{saving ? "Salvando…" : "Salvar aviso para todos os meus clientes"}</button>
        <p style={{ color: "#9db0cf", fontSize: 12, lineHeight: 1.6, marginTop: 14 }}>
          O aviso não interrompe vídeos. Aplicativos antigos seguem funcionando, mas somente builds compatíveis exibem esses avisos.
        </p>
      </fieldset>
    </form>}
  </section>;
}
