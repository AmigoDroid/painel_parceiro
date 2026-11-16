import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {formatBRL} from '../shared/ui/src/money.js';
import {safeTotal} from '../../backend/src/modules/partner-portal-sales/sales.rules.js';

const source=rel=>readFileSync(new URL(`../src/${rel}`,import.meta.url),'utf8');

test('R$150 por 1 mês permanece 15000 centavos e aparece como R$150,00',()=>{
 const unitCents=150*100;
 const totalCents=safeTotal(unitCents,1);
 assert.equal(totalCents,15000);
 assert.equal(formatBRL(totalCents).replace(/\u00a0/g,' '),'R$ 150,00');
 assert.equal(formatBRL(safeTotal(unitCents,2)).replace(/\u00a0/g,' '),'R$ 300,00');
 assert.equal(formatBRL(15050).replace(/\u00a0/g,' '),'R$ 150,50');
});

test('cadastro comercial usa formatador de centavos; nunca interpreta totalCents como reais',()=>{
 const component=source('CommercialInviteRegistration.jsx');
 assert.match(component,/import \{formatBRL\} from ['"]@deltatv\/ui\/money['"]/);
 assert.match(component,/formatBRL\(data\.totalCents\)/);
 assert.doesNotMatch(component,/Number\(data\.totalCents\|\|0\)\.toLocaleString/);
 assert.doesNotMatch(component,/reservados do estoque pré-pago/i);
});

test('API mantém centavos até o Mercado Pago e InfinitePay; sem multiplicação extra',()=>{
 const backend=readFileSync(new URL('../../backend/src/modules/partner-portal-sales/resale-payments.service.js',import.meta.url),'utf8');
 assert.match(backend,/amountCents:Number\(row\.payment_total_cents\)/);
 assert.doesNotMatch(backend,/amountCents:Number\(row\.payment_total_cents\)\s*\*\s*100/);
});
