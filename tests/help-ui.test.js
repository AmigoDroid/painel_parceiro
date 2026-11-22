import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from './read-source.js';
const read = f => readFileSync(new URL(f, import.meta.url), 'utf8');
test('parceiro exibe ajuda contextual e tutorial persistido, sem HTML remoto', () => {
  const app=read('../src/App.jsx'); const guide=read('../src/HelpExperience.jsx');
  assert.match(app, /"help","Guias e tutoriais"/);
  assert.match(app, /href=\{`https:\/\/wa\.me\/\$\{masterWhatsapp\}`\}/);
  assert.match(app, /Contate o Suporte/);
  assert.doesNotMatch(app, /\["tickets","Central de Suporte","help"\]/);
  assert.match(app, /data-help-target/);
  assert.match(guide, /"\/partner\/help"/);
  assert.match(guide, /welcome-seen/);
  assert.match(guide, /\/progress/);
  assert.match(guide, /"deltatv-help-context"/);
  assert.match(guide, /onNavigate/);
  assert.doesNotMatch(guide, /dangerouslySetInnerHTML/);
});

test('suporte na página inicial usa telefone do Master pelo WhatsApp, sem número fixo', () => {
  const app=read('../src/App.jsx');
  assert.match(app,/api\('\/partner\/network-charges\/master'\)/);
  assert.match(app,/masterDigits=String\(master\?\.phone\|\|''\)/);
  assert.match(app,/href=\{`https:\/\/wa\.me\/\$\{masterWhatsapp\}`\}/);
  assert.match(app,/target="_blank" rel="noopener noreferrer"/);
  assert.doesNotMatch(app,/onClick=\{\(\)=>navigate\("tickets"\)\}>Chamar Suporte/);
  assert.doesNotMatch(app,/className="master-contact"/);
});
