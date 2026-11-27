import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';

const read=path=>readFileSync(path,'utf8');
const h=read('index.html'),ui=read('src/ui-harmony.css');
const css=read('src/header-relics.css');
const fx=read('src/fullscreen.js'),reward=read('src/header-relics.js');
const main=read('src/main.js');
const icon='assets/ui/header-relics.png';
const png=readFileSync(icon);
assert.equal(png.subarray(1,4).toString('ascii'),'PNG');
assert.equal(png.readUInt32BE(16),128);
assert.equal(png.readUInt32BE(20),128);
assert.ok(statSync(icon).size>2000,'The icon atlas has real pixel illustrations');
assert.ok(ui.includes('@import "./header-relics.css?v=relics-3";'));
assert.ok(h.includes('relics=3'));
assert.ok(h.includes('src/header-relics.js?v=relics-1'));
for(const name of ['crown','shard','honors','expand']){
 assert.ok(h.includes('relic-icon--'+name),'The '+name+' sprite is in the header');
 assert.ok(css.includes('.relic-icon--'+name),'The '+name+' sprite has a position');
}
assert.ok(h.includes('<span class="brand-wordmark">AETHERIUM</span>'),
 'AETHERIUM stays visible as the unique header wordmark');
assert.ok(!h.includes('<small>Chroniques des Arcanes</small>'),
 'The redundant subtitle is gone from the header');
assert.ok(css.includes('.brand .brand-wordmark::after'),
 'Decorative gold line attaches to the text instead of flex width');
assert.ok(css.includes('.brand::after{\n  content:none;\n  display:none;'),
 'The old misaligned underline is no longer drawn');
assert.ok(css.includes('image-rendering:pixelated'));
assert.ok(css.includes('background-size:200% 200%'));
assert.ok(css.includes('safe-area-inset-left')&&css.includes('safe-area-inset-right'));
assert.ok(css.includes('@media(max-width:850px)'));
assert.ok(css.includes('@media(max-width:360px)'));
assert.ok(css.includes('prefers-reduced-motion:reduce'));
for(const id of ['coins','dust','chroniques-link','immersive-toggle'])
 assert.ok(h.includes('id="'+id+'"'));
assert.ok(h.includes('data-go="boosters"'));
assert.ok(h.includes('data-go="atelier"'));
assert.ok(h.includes('data-go="succes"'));
assert.ok(fx.includes("immersiveButton.classList.toggle('is-exiting',active)"),
 'Fullscreen uses the pixel icon and correct state instead of Unicode');
assert.ok(!fx.includes("textContent=active?'⤡'"));
assert.ok(reward.includes("new MutationObserver("));
assert.ok(reward.includes("next>previous"));
assert.ok(!reward.includes('localStorage')&&!reward.includes('AudioContext'));
assert.ok(main.includes("const SAVE='aetherium-save-v1'"));
assert.ok(!h.includes('id="audio-toggle"'),'Removed audio button must not reappear');
console.log('AETHERIUM — 4 sprite relics, counters, fullscreen, adaptive header and saves OK');

const resourceIconRule=css.match(/\.wallet \.wallet-link \.relic-icon\s*\{([^}]+)\}/)?.[1]||'';
for(const property of ['padding:0','border:0','border-radius:0','background-color:transparent','box-shadow:none']) assert.ok(resourceIconRule.includes(property),'Resource icons reset legacy chip style: '+property);
