import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
test('tour do parceiro deixa o destaque tocável e permite recolher instruções', () => {
  const tour = read('../src/HelpExperience.jsx');
  const shell = read('../src/App.jsx');
  const css = read('../src/help-experience.css');
  assert.match(tour, /help17-tour-minimized/);
  assert.match(tour, /help17-tour-\$\{mobilePlacement\}/);
  assert.match(tour, /querySelectorAll/);
  assert.match(tour, /deltatv-help-open-menu/);
  assert.match(shell, /addEventListener\("deltatv-help-open-menu"/);
  assert.match(css, /@media\(max-width:720px\)/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /overflow-x:auto/);
});
