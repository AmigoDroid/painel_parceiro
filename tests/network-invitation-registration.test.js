import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
test('rota de convite-rede abre formulário independente e remove token do URL',()=>{
 for(const file of ['index.html','src/invite-link.js'])assert.ok(src(file).includes('convite-rede'),file);
 assert.ok(src('src/invite-entry.jsx').includes('AdminNetworkInviteRegistration')); 
 assert.ok(src('index.html').includes('history.replaceState'));
 assert.match(src('src/AdminNetworkInviteRegistration.jsx'),/verifyAdminNetworkInvite/);
 assert.match(src('src/AdminNetworkInviteRegistration.jsx'),/completeAdminNetworkInvite/);
});
