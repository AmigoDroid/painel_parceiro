import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const html = fs.readFileSync(new URL("./index.html", import.meta.url), "utf8");
const bootstrap = html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
assert.ok(bootstrap, "bootstrap inline encontrado");
function run(path, store = new Map()) {
  const states=[];
  const url = new URL(path, "https://parceiro.deltatv.com.br");
  const ctx={window:{location:{href:url.href},history:{state:null,replaceState:(_s,_title,next)=>states.push(next)}},sessionStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)}, URL, URLSearchParams, decodeURIComponent};
  vm.runInNewContext(bootstrap,ctx);
  return {request:ctx.window.__DELTA_PARTNER_INVITE_REQUEST__,states,store};
}
test("rota convite mostra /convite e captura segredo",()=>{
 const x=run("/convite/ABCdef123_-",new Map());
 assert.equal(x.request.token,"ABCdef123_-");
 assert.equal(x.states[0],"/convite");
});
test("recarrega pagina convite e recupera token da aba",()=>{
 const store=new Map();run("/convite/ABCdef123_-",store);
 const x=run("/convite",store);
 assert.equal(x.request.token,"ABCdef123_-");
});
test("portal normal nao recebe fluxo convite",()=>{
 const x=run("/",new Map());
 assert.equal(x.request,undefined); assert.equal(x.states.length,0);
});
test("link antigo via query preserva caminho convite",()=>{
 const x=run("/?convite=abcDEF123",new Map());
 assert.equal(x.request.token,"abcDEF123"); assert.equal(x.states[0],"/convite");
});
