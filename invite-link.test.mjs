import test from 'node:test';
import assert from 'node:assert/strict';
import { consumeInviteRequest, consumeInviteToken } from './src/invite-link.js';

function fakeWindow(href, preCaptured) {
 const win = { location: new URL(href), history: { state: null, replaceState(_a, _b, path) { win.location = new URL(path, win.location.origin); } } };
 if (preCaptured !== undefined) win.__DELTA_PARTNER_INVITE_REQUEST__ = { token: preCaptured };
 return win;
}
const tok = 'AZ12345678azXY_ABCDEFGHIJKLMNOPQRSTUVWXYZ1234';
test('novo link /convite/TOKEN abre fluxo mesmo com sessão e limpa URL', () => {
 const win = fakeWindow(`https://parceiro.deltatv.com.br/convite/${tok}?utm_source=email`);
 assert.equal(consumeInviteRequest(win)?.token, tok);
 assert.equal(win.location.href, 'https://parceiro.deltatv.com.br/convite?utm_source=email');
 assert.deepEqual(consumeInviteRequest(win), { token: '' });
});
test('rota /convite sem token nunca vira silenciosamente login', () => {
 const win = fakeWindow('https://parceiro.deltatv.com.br/convite/');
 assert.deepEqual(consumeInviteRequest(win), {token:''});
 assert.equal(win.location.pathname, '/convite');
});
test('link malformado de /convite não cai silenciosamente no login', () => {
 const win = fakeWindow('https://parceiro.deltatv.com.br/convite/a/b');
 assert.deepEqual(consumeInviteRequest(win), {token:''});
});
test('query antiga continua suportada sem perder outras opções', () => {
 const win = fakeWindow(`https://parceiro.deltatv.com.br/?convite=${tok}&utm_medium=mail`);
 assert.equal(consumeInviteToken(win), tok);
 assert.equal(win.location.href, 'https://parceiro.deltatv.com.br/convite?utm_medium=mail');
});
test('fragmento legado continua suportado', () => {
 const win = fakeWindow(`https://parceiro.deltatv.com.br/#convite=${tok}`);
 assert.equal(consumeInviteRequest(win)?.token, tok);
 assert.equal(win.location.href, 'https://parceiro.deltatv.com.br/convite');
});
test('token já capturado pelo index.html não é perdido', () => {
 const win = fakeWindow('https://parceiro.deltatv.com.br/', tok);
 assert.equal(consumeInviteRequest(win)?.token, tok);
 assert.equal('__DELTA_PARTNER_INVITE_REQUEST__' in win, false);
});
test('URL normal não abre fluxo de convite', () => {
 assert.equal(consumeInviteRequest(fakeWindow('https://parceiro.deltatv.com.br/?utm_source=chatgpt.com')), null);
});
