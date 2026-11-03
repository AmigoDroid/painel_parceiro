import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { consumeInviteToken } from "./src/invite-link.js";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const snippet = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(snippet, "HTML de captura antecipada do convite deve existir");
function boot(href) {
 const win = { location: new URL(href), history: {state:null,replaceState(_a,_b, path){win.location = new URL(path, href)}} };
 vm.runInNewContext(snippet, { window: win, URL, URLSearchParams });
 return win;
}
test("HTML captura query e limpa token antes dos módulos do React", () => {
 const win = boot("https://parceiro.deltatv.com.br/?convite=tokenABC&x=1");
 assert.equal(win.location.href, "https://parceiro.deltatv.com.br/?x=1");
 assert.equal(consumeInviteToken(win),"tokenABC");
 assert.equal("__DELTA_PARTNER_INVITE_TOKEN__" in win, false);
});
test("HTML captura o formato antigo #convite", () => {
 const win = boot("https://parceiro.deltatv.com.br/#convite=tokenABC");
 assert.equal(win.location.href, "https://parceiro.deltatv.com.br/");
 assert.equal(consumeInviteToken(win),"tokenABC");
});
test("HTML não interfere no login normal", () => {
 const win = boot("https://parceiro.deltatv.com.br/");
 assert.equal(consumeInviteToken(win),null);
});
