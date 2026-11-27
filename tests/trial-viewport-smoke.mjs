import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync('index.html','utf8'),css=readFileSync('src/trial-viewport.css','utf8'),js=readFileSync('src/main.js','utf8');
assert.ok(html.includes('src/trial-viewport.css?v=7'));
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

const hubCss=readFileSync('src/trial-hub.css','utf8');
for(const obsolete of ['initiation.webp','aventure-mine.webp','maitrise.webp','ascension.webp'])assert.ok(!hubCss.includes(obsolete),'Old individual difficulty background must not obscure panorama: '+obsolete);
assert.ok(html.includes('src/trial-hub.css?v=31'));
assert.ok(css.includes('#difficulty-options>button:is([data-difficulty],.future-difficulty)')&&css.includes('center 58%/100% auto'));

assert.ok(html.indexOf('id="confrontation-shortcut"')<html.indexOf('id="expedition-shortcut"')&&html.indexOf('id="expedition-shortcut"')<html.indexOf('id="circuit-shortcut"'));
assert.ok(html.includes('class="adventures-mural"'));
assert.ok(css.includes('aventures-fresque.webp')&&css.includes('grid-column:1/-1;grid-row:1'));
assert.ok(css.includes('.expedition-mural-tile{grid-column:1;grid-row:2')&&css.includes('.circuit-mural-tile{grid-column:2;grid-row:2'));
console.log('Adventures mural: actual DOM order, shared backdrop, two-row grid and scoped responsive layout.');

assert.equal((html.match(/class="adventure-tile-title"/g)||[]).length,3);
assert.ok(!html.slice(html.indexOf('class="adventures-mural"'),html.indexOf('class="trial-subpage-back"')).includes('expedition-portal-copy'));
assert.ok(css.includes('--tile-title-size:clamp(11px,3.3vw,14px)')&&css.includes('font-size:var(--tile-title-size)'));
assert.ok(css.includes('#game-picker.game-picker .game-choice:nth-child(5) .game-choice-name,')&&css.includes('.adventures-mural .adventure-tile-title{'));
console.log('Shared typography: all twelve tiles use one viewport-driven size and one centered title.');

assert.equal((html.match(/class="adventure-emblem"/g)||[]).length,3);
for(const name of ['confrontations','expeditions','circuits'])assert.equal((html.match(new RegExp('data-emblem="'+name+'"','g'))||[]).length,1);
assert.ok(css.includes('--tile-emblem-size:')&&css.includes('width:var(--tile-emblem-size);height:var(--tile-emblem-size)'));
console.log('Adventure seals: three decorative pixel SVGs with shared responsive dimensions.');
