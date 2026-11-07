import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = f => readFileSync(new URL(f, import.meta.url), 'utf8');
test('parceiro exibe ajuda contextual e tutorial persistido, sem HTML remoto', () => {
  const app=read('../src/App.jsx'); const guide=read('../src/HelpExperience.jsx');
  assert.match(app, /"help","Central de Ajuda"/);
  assert.match(app, /data-help-target/);
  assert.match(guide, /"\/partner\/help"/);
  assert.match(guide, /welcome-seen/);
  assert.match(guide, /\/progress/);
  assert.match(guide, /"deltatv-help-context"/);
  assert.match(guide, /onNavigate/);
  assert.doesNotMatch(guide, /dangerouslySetInnerHTML/);
});
