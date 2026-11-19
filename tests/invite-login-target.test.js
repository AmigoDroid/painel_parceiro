import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveInviteLoginTarget } from '../src/invite-login-target.js';

test('M3: revenda usa origem configurada de login e não a raiz do parceiro', () => {
  assert.equal(resolveInviteLoginTarget('reseller', { resellerOrigin: 'https://revenda.exemplo.test' }), 'https://revenda.exemplo.test/');
  assert.equal(resolveInviteLoginTarget('reseller', { resellerOrigin: 'http://localhost:5199', dev: true }), 'http://localhost:5199/');
});

test('M3: parceiro continua na raiz do próprio portal', () => {
  assert.equal(resolveInviteLoginTarget('partner', { resellerOrigin: 'https://revenda.exemplo.test' }), '/');
  assert.equal(resolveInviteLoginTarget('content', { resellerOrigin: 'https://revenda.exemplo.test' }), '/');
});

test('M3: configuração ausente ou insegura tem destino conhecido por ambiente', () => {
  assert.equal(resolveInviteLoginTarget('reseller', { dev: true }), 'http://localhost:5175/');
  assert.equal(resolveInviteLoginTarget('reseller'), 'https://revenda.deltatv.com.br/');
  assert.equal(resolveInviteLoginTarget('reseller', { resellerOrigin: 'javascript:alert(1)' }), 'https://revenda.deltatv.com.br/');
  assert.equal(resolveInviteLoginTarget('reseller', { resellerOrigin: 'http://revenda.exemplo.test' }), 'https://revenda.deltatv.com.br/');
});

test('M3: formulário concluído envia o tipo da conta ao callback de navegação', () => {
  const component = readFileSync(new URL('../src/AdminNetworkInviteRegistration.jsx', import.meta.url), 'utf8');
  const entry = readFileSync(new URL('../src/invite-entry.jsx', import.meta.url), 'utf8');
  assert.match(component, /onRegistered\(info\?\.kind\)/);
  assert.match(entry, /onRegistered=\{goToRegistrationLogin\}/);
});
