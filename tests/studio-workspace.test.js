import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCREEN_DEFAULTS, STUDIO_FIELDS, STUDIO_SCREENS, normalizeAppearance, updateAppearanceScreen} from '../src/appearance-screen-settings.js';
const workspace=readFileSync(new URL('../src/StudioWorkspace.jsx', import.meta.url),'utf8');
const sim=readFileSync(new URL('../src/RokuSimulator.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/studio-workspace.css',import.meta.url),'utf8');
test('telas independentes: alterações não sobrescrevem as outras telas',()=>{
  const previous={template:'minimal',brandName:'Nova Marca',screens:{movies:{heading:'Cine Clube'}}};
  const next=updateAppearanceScreen(previous,'series','heading','Novelas e séries');
  assert.equal(next.screens.movies.heading,'Cine Clube');
  assert.equal(next.screens.series.heading,'Novelas e séries');
  assert.equal(next.screens.login.heading,SCREEN_DEFAULTS.login.heading);
  assert.equal(previous.screens.series,undefined);
});
test('normaliza temas salvos antes do editor sem perder a marca',()=>{
  const v=normalizeAppearance({brandName:'Canal A',template:'cinema'});
  assert.equal(v.brandName,'Canal A');
  for(const name of ['home','login','movies','series','live'])assert.ok(v.screens[name]);
});
test('editor e simulador selecionam a mesma tela e alteram os mesmos dados',()=>{
  for(const [id] of STUDIO_SCREENS.filter(([id])=>id!=='general')){
    assert.ok(STUDIO_FIELDS[id].length>0,id);
    assert.ok(sim.includes(`screenText`));
  }
  assert.match(workspace,/screen=\{activeScreen\} onScreenChange=\{setScreen\}/);
  assert.match(workspace,/onScreenField\(screen,key,e\.target\.value\)/);
  assert.match(workspace,/onScreenField\('home','showBanner',e\.target\.checked\)/);
});
test('preview e ações fixas com rolagem isolada, exportação recolhida',()=>{
  assert.match(css,/\.sw-preview\{position:sticky/);
  assert.match(css,/\.sw-scroll-content\{overflow-y:auto/);
  assert.match(css,/\.sw-toolbar\{[^}]*position:sticky/);
  assert.match(workspace,/<details className="sw-export">/);
  assert.match(css,/@media\(max-width:1000px\)/);
});
