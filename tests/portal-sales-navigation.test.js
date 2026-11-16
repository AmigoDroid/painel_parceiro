import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const src=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('Painel do Parceiro não possui menus ou páginas de revenda e planos',()=>{
 const app=src('../src/App.jsx');
 assert.doesNotMatch(app,/PortalSales|MyServicePackage|commercialPermissions|portalAccess/);
 assert.doesNotMatch(app,/\[\["portal-sales"|\[\["package"|screen==="package"|screen==="portal-sales"/);
 assert.equal(existsSync(new URL('../src/PortalSales.jsx',import.meta.url)),false);
});
test('convites legados podem ser concluídos sem reabrir novas vendas',()=>{
 const app=src('../src/App.jsx');
 const registration=src('../src/CommercialInviteRegistration.jsx');
 assert.match(app,/CommercialInviteRegistration/);
 assert.match(registration,/completePortalSalesInvite/);
 const routes=src('../../backend/src/modules/partner-portal-sales/sales.routes.js');
 assert.match(routes,/PARTNER_RESALE_DISABLED/);
 assert.match(routes,/publicPortalSalesInvitations\.post\('\/complete'/);
});
