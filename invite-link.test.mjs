import test from "node:test";
import assert from "node:assert/strict";
import { consumeInviteToken } from "./src/invite-link.js";

function fakeWindow(url, bootstrap) {
  const loc = new URL(url);
  const win = {
    location: loc,
    history: { state: null, replaceState(_a, _b, newUrl) { win.location = new URL(newUrl, loc.origin); } },
  };
  if (bootstrap) win.__DELTA_PARTNER_INVITE_TOKEN__ = bootstrap;
  return win;
}

test("link por query lê o token e limpa a barra de endereço", () => {
  const win = fakeWindow("https://parceiro.deltatv.com.br/?convite=segredo&origem=email");
  assert.equal(consumeInviteToken(win), "segredo");
  assert.equal(win.location.href, "https://parceiro.deltatv.com.br/?origem=email");
});
test("link legado com fragmento continua funcionando", () => {
  const win = fakeWindow("https://parceiro.deltatv.com.br/#convite=segredo");
  assert.equal(consumeInviteToken(win), "segredo");
  assert.equal(win.location.href, "https://parceiro.deltatv.com.br/");
});
test("o token pré-capturado pelo HTML é consumido sem ficar exposto em global", () => {
  const win = fakeWindow("https://parceiro.deltatv.com.br/", "segredo");
  assert.equal(consumeInviteToken(win), "segredo");
  assert.equal("__DELTA_PARTNER_INVITE_TOKEN__" in win, false);
});
test("navegação normal não abre o convite", () => {
  const win = fakeWindow("https://parceiro.deltatv.com.br/");
  assert.equal(consumeInviteToken(win), null);
});
