import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { consumeInviteRequest } from './src/invite-link.js';

const html = fs.readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const snippet = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(snippet, 'index.html deve capturar o token antes do bundle');
function boot(href) {
 const win={location:new URL(href),history:{state:null,replaceState(_a,_b,path){win.location=new URL(path,href)}}};
 vm.runInNewContext(snippet,{window:win,URL,URLSearchParams});
 return win;
}
const tok='A'.repeat(43);
for (const [description,url] of [
 ['nova rota por caminho',`https://parceiro.deltatv.com.br/convite/${tok}`],
 ['link via query antiga',`https://parceiro.deltatv.com.br/?convite=${tok}`],
 ['fragmento antigo',`https://parceiro.deltatv.com.br/#convite=${tok}`],
]) test(`HTML captura ${description} antes do React`,()=>{
 const win=boot(url);
 assert.equal(win.location.href,'https://parceiro.deltatv.com.br/');
 assert.equal(consumeInviteRequest(win)?.token,tok);
 assert.equal('__DELTA_PARTNER_INVITE_REQUEST__' in win,false);
});
test('HTML trata rota de convite sem token como convite inválido, não login',()=>{
 const win=boot('https://parceiro.deltatv.com.br/convite/');
 assert.equal(consumeInviteRequest(win)?.token,'');
});
test('HTML deixa URLs comuns inalteradas',()=>{
 const win=boot('https://parceiro.deltatv.com.br/?utm_source=chatgpt.com');
 assert.equal(consumeInviteRequest(win),null);
 assert.equal(win.location.search,'?utm_source=chatgpt.com');
});
