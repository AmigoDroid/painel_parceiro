import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
test('menu remove contrato duplicado e exibe meu plano e upgrade',()=>{
 const app=read('App.jsx');
 assert.match(app,/\["licenses","Licenças e ativações","shield"\],\["plans","Meu plano e upgrade","wallet"\]/);
 assert.doesNotMatch(app,/\["commercial","Contrato e licenças"/);
 assert.match(app,/raw === 'commercial' \? 'plans'/);
 assert.match(app,/Fale com seu Master/);
});
test('valor da prévia não pode ser informado livremente pelo parceiro',()=>{
 const upgrade=read('PlanUpgrade.jsx');
 assert.match(upgrade,/upgrade\/preview/);
 assert.match(upgrade,/previewFingerprint:quote\.previewFingerprint/);
 assert.match(upgrade,/method:'POST',body:\{planTo:selected,previewFingerprint/);
 assert.match(upgrade,/Para downgrade, entre em contato com seu <strong>Master<\/strong>/);
});
