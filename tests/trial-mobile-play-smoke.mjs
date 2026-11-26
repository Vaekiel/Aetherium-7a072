import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const main=read('src/main.js'),html=read('index.html'),css=read('src/trial-hub.css'),module=read('src/trial-mobile-play.js');
assert.ok(html.includes('id="trial-mobile-info"')&&html.includes('id="expedition-mobile-story"'));
assert.ok(main.includes('mountTrialMobilePlay();'));
assert.ok(module.includes('dialog.showModal()')&&module.includes('node.cloneNode(true)'),'Reading does not detach or mutate game state');
for(const selector of ['.trial-objective','.memory-fresco','.alchemy-grimoire','.trial-records','.expedition-description','.expedition-after'])assert.ok(module.includes(selector),'Reading retains '+selector);
assert.ok(module.includes('Math.max(44,'),'Never intentionally shrink interactive cells below 44px');
assert.ok(module.includes('window.visualViewport')&&module.includes('ResizeObserver'),'Recalculate after viewport and game changes');
assert.ok(css.includes('--mobile-board-width')&&css.includes('width:min(100%,'));
assert.ok(css.includes('@media(max-width:850px)'));
assert.ok(main.includes("if(!mobileView.matches)target.scrollIntoView"),'Mobile launches preserve the return control');
assert.ok(main.includes('grant(earned)'),'Rewards remain wired');
assert.ok(html.includes('class="future-difficulty" disabled'),'Ascension remains unavailable');
console.log('Mobile trial fit and reading-sheet wiring OK');

assert.ok(!main.includes("el('div','excavation-meter')"),'Fouilles no longer render the redundant progress bars');
assert.ok(main.includes("safe+' / '+safeTarget+' cases sûres'"),'The numeric counter remains live');
assert.ok(css.includes('#app:has(#page-jouer.active.mobile-play-ready[data-trial-view="play"])>footer{display:none}'),'The footer does not add a scroll tail during mobile play');
assert.ok(css.includes('min-height:100dvh')&&css.includes('padding-bottom:calc(64px + env(safe-area-inset-bottom,0px) + 6px)'),'Viewport and nav clearance are handled without locking scrolling');

const portals=html.slice(html.indexOf('<div class="trial-hub-portals">'),html.indexOf('<div class="trial-subpage-back"'));
assert.equal((portals.match(/class="expedition-portal"/g)||[]).length,2,'Both activities use the same portal card');
assert.equal((portals.match(/class="expedition-portal-button"/g)||[]).length,2,'Both cards use the same Explorer button');
assert.ok(!/shortcut-progress/.test(portals)&&!main.includes('expedition-shortcut-progress')&&!main.includes('circuit-shortcut-progress'),'No active itinerary or stage in the hub');

assert.equal((html.match(/class="difficulty-emblem"/g)||[]).length,4,'Four visual difficulty seals');
assert.ok(main.includes("el('span','game-choice-name',entry.name)"),'Clean names without duplicate numbering');
assert.ok(css.includes('repeat(6,minmax(0,1fr))')&&css.includes('grid-column:span 3'),'Portrait grid keeps all five games accessible');
assert.ok(css.includes("assets/minigames/minigame-emblems.webp")&&css.includes("assets/scenery/dusk-right.webp"),'Phase one reuses approved artwork');

assert.ok(main.includes("'chemin-runique.webp'")&&main.includes("art.addEventListener('load'")&&main.includes("art.addEventListener('error'"),'Progressive artwork with existing emblem fallback');
assert.ok(css.includes('.game-choice.has-trial-art::before{')&&css.includes('visibility:hidden;filter:none')&&css.includes('position:absolute;inset:0;width:100%;height:100%')&&css.includes('object-fit:cover'),'Individual artwork does not change the tile grid');

assert.ok(main.includes("el('span','trial-art-shade')")&&css.includes('.trial-art-shade'),'Full-card art keeps a contrast layer behind real text');
