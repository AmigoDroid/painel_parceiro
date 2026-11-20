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

test('contato do Master fica na página inicial, fora do menu lateral',()=>{
 const app=read('App.jsx');
 assert.doesNotMatch(app,/className="master-contact"/);
 assert.match(app,/screen==="overview"&&master&&<section className="master-home-contact"/);
 assert.ok(app.indexOf('<AppInstallSpotlight')<app.indexOf('className="master-home-contact"'));
 assert.ok(app.indexOf('className="master-home-contact"')<app.indexOf('<EasyStart role="partner"'));
 assert.match(app,/master\.name\|\|'Master'/);
 assert.match(app,/master\.phone\|\|'Telefone ainda não cadastrado'/);
});

test('botão de WhatsApp só aparece para telefone brasileiro válido e abre endereço seguro',()=>{
 const app=read('App.jsx');
 const css=read('style.css');
 assert.match(app,/masterDigits=String\(master\?\.phone\|\|''\)\.replace\(\/\\D\/g,''\)/);
 assert.match(app,/\^55\\d\{10,11\}\$/);
 assert.match(app,/href=\{`https:\/\/wa\.me\/\$\{masterWhatsapp\}`\}/);
 assert.match(app,/masterWhatsapp\?<a className="master-home-whatsapp"/);
 assert.match(app,/target="_blank" rel="noopener noreferrer"/);
 assert.match(css,/\.master-home-contact\{display:flex/);
 assert.match(css,/@media\(max-width:720px\)\{\.master-home-contact/);
});
