import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const sim=readFileSync(new URL('../src/RokuSimulator.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/roku-simulator.css',import.meta.url),'utf8');
const studio=readFileSync(new URL('../src/AppearanceStudio.jsx',import.meta.url),'utf8');
test('controle virtual tem teclas e simulação pausável, sem IPTV real',()=>{
 for(const key of ['up','down','left','right','ok','back']) assert.match(sim,new RegExp("remote\\('"+key+"'\\)"));
 for(const str of ['Rodar','Parar','Reiniciar','SIM_SCREENS','rs-paused','Simulação sem autenticação']) assert.ok(sim.includes(str),str);
 assert.ok(!sim.includes('player_api.php'));
});
test('novas interfaces têm composições distintas e coexistem com editor',()=>{
 for(const key of ['minimal','mosaic','library']) assert.match(css,new RegExp('rs-template-'+key));
 assert.match(studio,/<StudioWorkspace config=\{draft\}/);
 assert.match(readFileSync(new URL('../src/StudioWorkspace.jsx',import.meta.url),'utf8'),/Publicar/);
 assert.match(studio,/Gerar ZIP Premium/);
});
