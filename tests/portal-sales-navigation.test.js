import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = rel => readFileSync(new URL(`../src/${rel}`, import.meta.url), 'utf8');

test('a página de vendas não depende de estado ausente para mostrar os pacotes', () => {
  const content = source('PortalSales.jsx');
  assert.match(content, /const \[packages, setPackages\] = useState\(\[\]\)/);
  assert.match(content, /setPackages\(results\[5\]\.value\.items/);
  assert.match(content, /packages\.map\(/);
  assert.doesNotMatch(content, /availablePackages/);
});

test('venda de acesso usa pacote, preço e convite sem exigir estoque', () => {
  const content = source('PortalSales.jsx');
  assert.match(content, /Criar convite de acesso/);
  assert.match(content, /planCode: form\.planCode, months, unitResaleCents/);
  assert.match(content, /paymentMode: form\.paymentMode/);
  assert.doesNotMatch(content, /Distribuir estoque|Reservar meses|stock_reserved/);
});

test('as seções comerciais dependem de permissões; quem não pode confirmar Pix não vê a ação', () => {
  const app = source('App.jsx');
  const content = source('PortalSales.jsx');
  assert.match(app, /commercialPermissions\.canSell\|\|commercialPermissions\.canCreateSubmasters/);
  assert.match(content, /canConfirmExternal &&/);
  assert.match(content, /permissions\.canManageGateways/);
  assert.match(content, /permissions\.canViewFinance/);
});
