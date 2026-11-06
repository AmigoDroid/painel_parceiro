import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const app = fs.readFileSync(new URL("../src/App.jsx", import.meta.url), "utf8");
const operations = fs.readFileSync(new URL("../src/PartnerOperations.jsx", import.meta.url), "utf8");
const profile = fs.readFileSync(new URL("../src/ProfilePage.jsx", import.meta.url), "utf8");

test("parceiro mantém tela Minha conta e contato comercial após ampliação", () => {
 assert.match(app, /screen==="account"&&<PartnerAccount\/>/);
 assert.match(operations, /<ProfilePage variant="parceiro"\s*\/>/);
 assert.match(operations, /Contato comercial da parceria/);
});
test("perfil controla avatar, senha, e-mail, preferências e sessões", () => {
 for (const name of ["Dados pessoais", "Segurança", "Sessões ativas", "Histórico", "Notificações", "/auth/profile/avatar", "/auth/profile/email", "/auth/profile/sessions/revoke-others"])
  assert.ok(profile.includes(name), `Faltou ${name}`);
});
test("preferências e foto aparecem na navegação do parceiro", () => {
 assert.match(app, /showBadge&&unread>0/);
 assert.match(app, /showUnread&&unread>0/);
 assert.match(app, /profile-menu-avatar/);
});
