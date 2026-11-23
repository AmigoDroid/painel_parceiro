import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const first = html.match(/<script>([\s\S]*?)<\/script>/)[1];
test('QR com app MAC token limpos da barra antes de abrir o SPA', () => {
 const url = 'https://parceiro.deltatv.com.br/upload/playlist?app=dreamplayer&mac=001122334455&t=abcXYZ_1234567890123456789012';
 const win = {};const replaced=[];const location = new URL(url);
 const document={title:'Painel do Parceiro'};
 runInNewContext(first, {window:win, location, history:{state:{},replaceState:(_state,_title,path)=>replaced.push(path)},document,URL,URLSearchParams});
 assert.equal(win.__PUBLIC_APP_QR__.app,'dreamplayer');assert.equal(win.__PUBLIC_APP_QR__.mac,'001122334455');
 assert.equal(win.__PUBLIC_APP_QR__.token,'abcXYZ_1234567890123456789012');
 assert.deepEqual(replaced,['/upload/playlist']);assert.equal(document.title,'Cadastro de lista');
 assert.equal(win.__DELTA_PARTNER_INVITE_REQUEST__,undefined);
});
test('Página pública carrega por módulo separado sem montar App.jsx',()=>{
 assert.match(html,/isPublicQr \? import\("\.\/src\/public-upload-entry\.jsx"\)/);
 const entry=readFileSync(new URL('../src/public-upload-entry.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(entry,/App\.jsx|WebSocket|localStorage/);
});
test('Página não inclui segredo no GET e só solicita usuário e senha',()=>{
 const page=readFileSync(new URL('../src/PublicUploadPlaylist.jsx',import.meta.url),'utf8');
 assert.match(page, /method: 'POST'/);assert.match(page,/body: JSON\.stringify\(\{ mac, token \}\)/);
 assert.match(page,/readOnly value=\{formatMac\(mac\)\}/);
 assert.match(page,/readOnly value=\{meta\.name\}/);
 assert.match(page,/type="password"/);
 assert.doesNotMatch(page,/localStorage|sessionStorage/);
});
