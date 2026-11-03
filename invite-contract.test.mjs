import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const app=fs.readFileSync(new URL('./src/App.jsx',import.meta.url),'utf8');
const form=fs.readFileSync(new URL('./src/InviteRegistration.jsx',import.meta.url),'utf8');
test('convite é capturado uma vez fora do inicializador do StrictMode',()=>{
 assert.match(app,/const INITIAL_INVITE = consumeInviteRequest\(\);/);
 assert.match(app,/useState\(INITIAL_INVITE\)/);
});
test('fluxo público não monta o painel ou o websocket antes da validação',()=>{
 assert.match(app,/if\(invite\)return <InviteRegistration token=\{invite.token\}/);
 assert.match(app,/return <PartnerPortalApp\/>/);
});
test('formulário só aparece após o verify na API',()=>{
 assert.match(form,/verifyPartnerInvite\(token\)/);
 assert.match(form,/validation.state !== "valid"/);
 assert.match(form,/Conclua seu cadastro/);
 assert.match(form,/completePartnerInvite\(\{ token,/);
});
