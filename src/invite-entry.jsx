import React from "react";
import { createRoot } from "react-dom/client";
import InviteRegistration from "./InviteRegistration.jsx";
import "./style.css";

const STORAGE_KEY = "delta-partner-pending-invite";
const request = window.__DELTA_PARTNER_INVITE_REQUEST__ || { token: "" };

function goToLogin() {
  try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  window.location.replace("/");
}

class InviteErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error) { console.error("[partner-invite] Render falhou", error); }
  render() {
    if (this.state.failed) return <main className="invite-wrap"><div className="invite-card">
      <h1>Não foi possível abrir o cadastro</h1>
      <p>O formulário não pôde ser carregado. Atualize a página ou entre em contato com a administração.</p>
      <button type="button" className="primary wide" onClick={goToLogin}>Ir para login</button>
    </div></main>;
    return this.props.children;
  }
}

createRoot(document.getElementById("root")).render(
  <InviteErrorBoundary>
    <InviteRegistration token={request.token} onBack={goToLogin} />
  </InviteErrorBoundary>
);
