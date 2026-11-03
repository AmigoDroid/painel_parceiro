import React, { useEffect, useState } from "react";
import { completePartnerInvite, verifyPartnerInvite } from "./api.js";
import "./invite.css";

const TOKEN_FORMAT = /^[A-Za-z0-9_-]{32,100}$/;

export default function InviteRegistration({ token, onBack }) {
  const [validation, setValidation] = useState({ state: "checking", data: null, message: "" });
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [done, setDone] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setValidation({ state: "checking", data: null, message: "" });
    setSubmitError("");
    if (!TOKEN_FORMAT.test(token)) {
      setValidation({ state: "invalid", data: null, message: "Este link de convite está incompleto ou inválido. Peça um novo convite à administração." });
      return () => { active = false; };
    }
    // Endpoint público: POST /api/v1/auth/partner-invite/verify.
    // O formulário só é exibido após a resposta positiva do servidor.
    verifyPartnerInvite(token)
      .then((data) => {
        if (!active) return;
        if (!data?.name || !data?.email || !data?.expiresAt) throw new Error("O servidor retornou um convite incompleto.");
        setCompanyName(data.name);
        setValidation({ state: "valid", data, message: "" });
      })
      .catch((error) => {
        if (!active) return;
        const retryable = error?.status === 0 || error?.status === 429 || error?.status >= 500;
        setValidation({
          state: retryable ? "retry" : "invalid", data: null,
          message: retryable
            ? "Não foi possível consultar a API agora. Tente validar o convite novamente."
            : "Convite inválido, expirado, cancelado ou já utilizado. Solicite um novo convite ao administrador."
        });
      });
    return () => { active = false; };
  }, [token, attempt]);

  async function submit(event) {
    event.preventDefault();
    if (validation.state !== "valid" || saving) return;
    if (password.length < 12 || password !== confirmPassword) {
      setSubmitError("A senha deve ter pelo menos 12 caracteres e as duas senhas devem ser iguais.");
      return;
    }
    setSaving(true);
    setSubmitError("");
    try {
      await completePartnerInvite({ token, companyName: companyName.trim(), password });
      try { sessionStorage.removeItem("delta-partner-pending-invite"); } catch {}
      setPassword("");
      setConfirmPassword("");
      setDone(true);
    } catch (error) {
      setSubmitError(error?.message || "Não foi possível concluir o cadastro.");
    } finally {
      setSaving(false);
    }
  }

  return <main className="invite-wrap"><div className="invite-card">
    <div className="brandico" aria-hidden="true">D</div>
    <p className="invite-eyebrow">DELTA TV · PARCEIROS</p>
    {done ? <>
      <h1>Cadastro concluído!</h1>
      <p>Sua conta foi criada. Entre usando seu e-mail e a senha que acabou de definir.</p>
      <button type="button" className="primary wide" onClick={onBack}>Ir para o login</button>
    </> : validation.state === "checking" ? <>
      <h1>Verificando convite</h1>
      <p role="status">Consultando a Delta TV para verificar se o convite existe, está ativo e ainda não expirou…</p>
      <div className="invite-progress" aria-hidden="true" />
    </> : validation.state !== "valid" ? <>
      <h1>Não foi possível abrir o cadastro</h1>
      <div role="alert" className="alert">{validation.message}</div>
      {validation.state === "retry" && <button type="button" className="primary wide" onClick={()=>setAttempt(n=>n+1)}>Tentar novamente</button>}
      <button type="button" className="invite-back" onClick={onBack}>Ir para o login</button>
    </> : <>
      <h1>Conclua seu cadastro</h1>
      <p>Seu convite foi confirmado. Defina os dados da sua conta de parceiro.</p>
      <form onSubmit={submit}>
        <label className="label" htmlFor="invite-person">Nome do responsável</label>
        <input id="invite-person" readOnly value={validation.data.name} />
        <label className="label" htmlFor="invite-email">E-mail do convite</label>
        <input id="invite-email" readOnly value={validation.data.email} />
        <label className="label" htmlFor="invite-company">Nome da parceria ou empresa</label>
        <input id="invite-company" required minLength={2} maxLength={160} autoComplete="organization" value={companyName} onChange={e=>setCompanyName(e.target.value)} />
        <label className="label" htmlFor="invite-password">Crie uma senha</label>
        <input id="invite-password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} />
        <label className="label" htmlFor="invite-confirm">Confirme a senha</label>
        <input id="invite-confirm" type="password" required minLength={12} maxLength={128} autoComplete="new-password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} />
        <p className="invite-help">Este convite expira em {new Date(validation.data.expiresAt).toLocaleString("pt-BR")}. A senha deve ter pelo menos 12 caracteres.</p>
        {submitError && <div className="alert" role="alert">{submitError}</div>}
        <button className="primary wide" type="submit" disabled={saving}>{saving ? "Criando sua conta…" : "Concluir cadastro"}</button>
      </form>
      <button type="button" className="invite-back" onClick={onBack}>Voltar ao login</button>
    </>}
  </div></main>;
}
