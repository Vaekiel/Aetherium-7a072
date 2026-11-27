import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8'),css=readFileSync('src/trial-viewport.css','utf8'),js=readFileSync('src/main.js','utf8');
assert.ok(html.includes('src/trial-viewport.css?v=3'));
assert.ok(css.includes('height:100dvh;min-height:0'));
assert.ok(css.includes('body:has(#page-jouer.active[data-trial-view="hub"])'));
assert.ok(css.includes('var(--aetherium-mobile-nav-height,64px) + var(--aetherium-footer-height,44px)'));
assert.ok(css.includes('grid-template-rows:repeat(2,minmax(0,1fr))'));
assert.ok(css.includes('grid-template-columns:repeat(5,minmax(0,1fr))'));
assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))'));
assert.ok(css.includes('position:absolute;inset:0;grid-column:auto'));
for(const id of ['game-picker','difficulty-options','expedition-shortcut','circuit-shortcut','confrontation-shortcut','return-to-title'])assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,id);
assert.ok(js.includes("window.matchMedia('(max-height:520px) and (orientation:landscape)').matches)openTrial();"));
console.log('Trial viewport: dynamic height, scoped scroll lock, adaptive grids, preserved controls and navigation.');

assert.ok(css.includes("difficultes-fresque.webp")&&css.includes("gap:0;grid-template-columns:repeat(4,minmax(0,1fr))"));
assert.ok(css.includes("box-shadow:none;opacity:1")&&css.includes("button.is-active"));
console.log('Continuous difficulty panorama: shared image, live difficulty states and responsive heights.');
