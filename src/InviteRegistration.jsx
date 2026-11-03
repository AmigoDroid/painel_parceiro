import { useEffect, useState } from "react";
import { completePartnerInvite, verifyPartnerInvite } from "./api.js";
import "./invite.css";

export default function InviteRegistration({ token, onBack }) {
  const [invitation, setInvitation] = useState(null);
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true);
    verifyPartnerInvite(token)
      .then((d) => { if (active) { setInvitation(d); setCompanyName(d.name); } })
      .catch((e) => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);
  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 12 || password !== confirmPassword) { setError("A senha deve ter pelo menos 12 caracteres e as duas senhas devem ser iguais."); return; }
    setSaving(true); setError("");
    try { await completePartnerInvite({ token, companyName: companyName.trim(), password }); setDone(true); setPassword(""); setConfirmPassword(""); }
    catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };
  return <main className="invite-wrap"><div className="invite-card">
    <div className="brandico" aria-hidden="true">D</div>
    <p className="invite-eyebrow">DELTA TV · PARCEIROS</p>
    {done ? <><h1>Cadastro concluído!</h1><p>Agora você pode entrar com o e-mail e a senha que acabou de criar. Seu contrato e os servidores serão configurados pela administração.</p><button type="button" className="primary wide" onClick={onBack}>Ir para o login</button></> :
      <><h1>Conclua seu cadastro</h1><p>Você foi convidado para criar sua conta de parceiro Delta TV.</p>
        {loading ? <p role="status">Verificando convite…</p> : invitation ?
          <form onSubmit={submit}>
            <label className="label" htmlFor="invite-person">Nome do responsável</label><input id="invite-person" readOnly value={invitation.name} />
            <label className="label" htmlFor="invite-email">E-mail confirmado pelo convite</label><input id="invite-email" readOnly value={invitation.email} />
            <label className="label" htmlFor="invite-company">Nome da parceria ou empresa</label><input id="invite-company" required minLength={2} maxLength={160} autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <label className="label" htmlFor="invite-password">Crie uma senha</label><input id="invite-password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <label className="label" htmlFor="invite-confirm">Repita a senha</label><input id="invite-confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <p className="invite-help">O convite expira em {new Date(invitation.expiresAt).toLocaleString("pt-BR")}. A senha deve conter pelo menos 12 caracteres.</p>
            {error && <div className="alert" role="alert">{error}</div>}
            <button type="submit" className="primary wide" disabled={saving}>{saving ? "Criando sua conta…" : "Concluir cadastro"}</button>
          </form> : <><div className="alert" role="alert">{error || "Não foi possível validar o convite."}</div><p>Solicite ao administrador que envie um novo convite.</p></>}
        <button className="invite-back" type="button" onClick={onBack}>Voltar ao login</button>
      </>}
  </div></main>;
}
