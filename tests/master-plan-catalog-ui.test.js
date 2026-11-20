import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=readFileSync(new URL('../src/PlanUpgrade.jsx',import.meta.url),'utf8');
const style=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');

test('catálogo informa a origem Master, plano atual e benefícios das ofertas',()=>{
 assert.match(src,/Planos oferecidos pelo seu Master/);
 assert.match(src,/master\?\.name/);
 assert.match(src,/data\.current\.contractPriceCents/);
 assert.match(src,/SEU PLANO ATUAL/);
 for(const field of ['DNS por código','Ativações','Validade do plano','Failover automático',
  'Prioridade automática de DNS','Alertas por e-mail','Histórico detalhado'])assert.ok(src.includes(field),field);
 assert.match(src,/data\?\.plans\.map/);
 assert.match(style,/\.plan-market-grid\{display:grid/);
});

test('só mostra botão de contratar quando backend autoriza upgrade; preço vem da prévia',()=>{
 assert.match(src,/p\.canUpgrade\?<button/);
 assert.match(src,/p\.isCurrent\?'Você já utiliza este plano'/);
 assert.match(src,/previewFingerprint:quote\.previewFingerprint/);
 assert.match(src,/money\(quote\.amountCents\)/);
 assert.doesNotMatch(src,/amountCents:selected/);
});

test('página de planos não repete o painel legado Contrato e licenças',()=>{
 const app=readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8');
 assert.match(app,/screen==="plans"&&<PlanUpgrade/);
 assert.doesNotMatch(app,/screen==="plans"&&<><CommercialOverview/);
});
