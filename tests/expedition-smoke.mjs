import {createSaveSession} from '../src/save-session.js';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const read=p=>readFileSync(p,'utf8');
const load=p=>import('data:text/javascript;charset=utf-8,'+encodeURIComponent(read(p)));
const {EXPEDITION_ROUTES,FINALE_ID,FINALE_PREREQUISITES,FINALE_VOWS,canStartFinale,
 chooseFinaleVow,awardFinaleCard,emptyExpedition,sanitizeExpedition,startExpedition,
 abandonExpedition,armExpedition,expeditionStage,expeditionVictory,expeditionSummary}=await load('src/expeditions.js');
const {trialScore,trialReward,recordTrialWin}=await load('src/trial-progress.js');
const {recordPersonalBest,sanitizedTrialRecords}=await load('src/trial-records.js');
const {sanitizeMilestoneClaims}=await load('src/collection-milestones.js');
const {sanitizeAlchemyKnown}=await load('src/alchemy-rituals.js');
const {CARDS}=await load('src/data.js');
assert.equal(EXPEDITION_ROUTES.length,4);
assert.deepEqual(EXPEDITION_ROUTES.map(r=>r.stages.map(s=>s.game)),[[0,3,4],[1,2,4],[1,0,2],[1,3,0,4]]);
assert.ok(EXPEDITION_ROUTES.every(r=>(r.id===FINALE_ID?r.stages.length===4:r.stages.length===3)&&r.fragment&&r.ending&&r.prologue));
assert.ok(EXPEDITION_ROUTES.flatMap(r=>r.stages).every(s=>s.title&&s.text&&s.after));
assert.deepEqual(emptyExpedition(),{route:null,step:0,mode:null,armed:false,completedRoutes:[]});
assert.deepEqual(sanitizeExpedition(null),emptyExpedition());
const start=startExpedition(null,'verriers','aventure');
assert.equal(start.route,'verriers');
assert.equal(start.step,0);
assert.equal(start.mode,'aventure');
assert.equal(start.armed,false);
assert.equal(expeditionStage(start).game,0);
assert.equal(expeditionSummary(start).discovered,0);
assert.equal(expeditionVictory(start,0,'aventure').advanced,false,'Unarmed normal wins never count');
assert.equal(expeditionVictory(armExpedition(start),1,'aventure').advanced,false,'Wrong trial never advances');
assert.equal(expeditionVictory(armExpedition(start),0,'initiation').advanced,false,'Easy mode cannot substitute the chosen difficulty');
let current=armExpedition(start);
for(let step=0;step<3;step++){
 const required=EXPEDITION_ROUTES[0].stages[step].game;
 const result=expeditionVictory(current,required,'aventure');
 assert.equal(result.advanced,true);
 assert.equal(result.finished,step===2);
 assert.equal(result.state.step,step+1);
 assert.equal(result.state.armed,false);
 if(step<2){
  assert.equal(expeditionStage(result.state).game,EXPEDITION_ROUTES[0].stages[step+1].game);
  assert.equal(expeditionVictory(result.state,EXPEDITION_ROUTES[0].stages[step+1].game,'aventure').advanced,false);
 }
 current=armExpedition(result.state);
}
assert.deepEqual(current.completedRoutes,['verriers']);
assert.equal(expeditionSummary(current).complete,true);
assert.equal(expeditionVictory(current,4,'aventure').advanced,false,'Finished route cannot repeat rewards');
const left=abandonExpedition(current);
assert.equal(left.route,null);
assert.deepEqual(left.completedRoutes,['verriers']);
const replay=startExpedition(left,'verriers','maitrise');
assert.equal(replay.step,0);
assert.equal(replay.mode,'maitrise');
assert.deepEqual(replay.completedRoutes,['verriers'],'Replaying does not erase a discovered fragment');
let echoes=startExpedition(left,'veilleurs','initiation');
for(const game of [1,2,4]){
 echoes=expeditionVictory(armExpedition(echoes),game,'initiation').state;
}
assert.equal(expeditionSummary(echoes).complete,true);
assert.deepEqual(echoes.completedRoutes,['verriers','veilleurs']);
assert.equal(expeditionSummary(echoes).discovered,2);
assert.equal(expeditionSummary(echoes).total,4);
assert.equal(expeditionSummary(echoes).discovered,2,'Earlier routes remain completed');
// New Revers route uses exactly the existing Memory, Runes and Lock challenges.
let revers=startExpedition(echoes,'traversee-reflets','maitrise');
assert.deepEqual(revers.completedRoutes,['verriers','veilleurs'],'New route preserves earlier trophies');
assert.equal(revers.step,0);
assert.equal(expeditionStage(revers).game,1);
for(const [index,game] of [1,0,2].entries()){
  assert.equal(expeditionStage(revers).game,game);
  assert.equal(expeditionVictory(revers,game,'maitrise').advanced,false,
    'Completing a trial without first entering from the expedition cannot advance it');
  const incorrect=expeditionVictory(armExpedition(revers),game,'aventure');
  assert.equal(incorrect.advanced,false,'A different, easier mode cannot skip the stage');
  const result=expeditionVictory(armExpedition(revers),game,'maitrise');
  assert.equal(result.advanced,true);
  assert.equal(result.finished,index===2);
  assert.equal(result.state.step,index+1);
  revers=result.state;
}
assert.deepEqual(revers.completedRoutes,['verriers','veilleurs','traversee-reflets']);
assert.equal(expeditionSummary(revers).total,4);
assert.equal(expeditionSummary(revers).discovered,3);
assert.equal(expeditionSummary(revers).complete,true);
assert.equal(expeditionVictory(revers,2,'maitrise').advanced,false,
  'Replaying the last minigame cannot grant a second discovery');
assert.deepEqual(sanitizeExpedition(JSON.parse(JSON.stringify(revers))),revers,
  'New Revers route and discoveries round-trip without save format migration');
const reversReplay=startExpedition(revers,'traversee-reflets','initiation');
assert.equal(reversReplay.step,0);
assert.deepEqual(reversReplay.completedRoutes,['verriers','veilleurs','traversee-reflets'],
  'Replaying the new route cannot erase previously completed expeditions');
assert.deepEqual(sanitizeExpedition(JSON.parse(JSON.stringify(echoes))),echoes,'All expedition progress round-trips locally');
const bad=sanitizeExpedition({route:'hacker',mode:'maitrise',step:999,
 armed:true,completedRoutes:['veilleurs','veilleurs','fake','verriers']});
assert.equal(bad.route,null);
assert.deepEqual(bad.completedRoutes,['verriers','veilleurs'],'Only supported fragment IDs survive');
assert.equal(sanitizeExpedition({route:'verriers',mode:'maitrise',step:3,
 completedRoutes:[]}).route,null,'A corrupted finished step cannot invent a fragment');
assert.equal(sanitizeExpedition({route:'verriers',mode:'hacker',step:1,
 armed:true,completedRoutes:['veilleurs']}).route,null);
assert.equal(sanitizeExpedition({route:'verriers',mode:'aventure',step:2,
 armed:true}).armed,true,'Checkpoint can resume after reload');
assert.deepEqual(startExpedition(start,'wrong','maitrise'),start);
assert.equal(sanitizeExpedition({route:'traversee-reflets',mode:'aventure',step:1,armed:true}).step,1,
 'New Revers expedition resumes on the old save schema');
assert.deepEqual(armExpedition(emptyExpedition()),emptyExpedition());

const main=read('src/main.js'),html=read('index.html'),css=read('src/expedition.css');
assert.ok(main.includes("from './expeditions.js?v=dernier-accord-1'"));
assert.ok(main.includes('expedition:{route:null,step:0,mode:null,armed:false,completedRoutes:[]}'));
assert.ok(main.includes('if(raw.expedition)s.expedition=sanitizeExpedition(raw.expedition)'));
assert.ok(main.includes('const expeditionResult=state.expedition?.route?'));
assert.ok(main.includes('state.expedition=expeditionResult.state;'));
assert.ok(main.includes('awardFinaleCard(state,expeditionResult)'),'Only finishing the final story can grant the Signature');
assert.ok(main.includes('if(expeditionResult.advanced){\n    renderExpedition();'), 'Progression refreshes the story and exposes a return action');
assert.ok(main.includes('state.expedition=armExpedition(state.expedition)'));
assert.ok(main.includes('trialStarters[stage.game]()'));
assert.ok(main.includes('selectGame(stage.game)'));
assert.ok(main.includes('state.difficulty=view.current.mode'));
assert.ok(main.includes('state.expedition=abandonExpedition(state.expedition)'));
assert.ok(main.includes('function renderExpedition(){'));
assert.ok(main.includes('renderExpedition();\nupdate();'));
assert.ok(html.includes('id="expedition-panel"'));
assert.ok(html.includes('id="expedition-content"'));
assert.ok(html.includes('src/main.js?v='));
assert.ok(html.includes('src/expedition.css?v=revers-expedition-1'));
const playStart=html.indexOf('<section id="page-jouer"');
const journeyStart=html.indexOf('<section id="page-expeditions"');
const boosterStart=html.indexOf('<section id="page-boosters"');
const chapterPosition=html.indexOf('id="expedition-panel"');
assert.ok(playStart>=0&&playStart<journeyStart&&journeyStart<chapterPosition&&chapterPosition<boosterStart,
  'The chapter is hosted on an independent screen, not above the mini-games');
assert.equal((html.match(/id="expedition-panel"/g)||[]).length,1);
assert.ok(html.includes('id="expedition-shortcut"')&&html.includes('data-go="expeditions"'),
  'The classic play page keeps a discreet link to the chapter');
assert.ok(html.includes('data-go="jouer"')&&html.includes('expedition-back'),
  'A return control remains visible on the separate expedition page');
assert.ok(main.includes("const APP_PAGES=[...MAIN_PAGES,'succes','expeditions'];"));
assert.ok(main.includes("if(page==='expeditions')renderExpedition()"));
assert.ok(main.includes("navigate('jouer');\n    const target=mini[stage.game].card;"),
  'The journey launches the original mini-games on their proper page');
assert.ok(main.includes("g.actions?.append(button('✧ Suite de l’expédition'"),
  'A qualifying victory offers a manual return to the adventure');
assert.ok(css.includes(':is(#page-expeditions,#arcane-circuits) .expedition-panel'));
assert.ok(css.includes(':is(#page-expeditions,#arcane-circuits) .expedition-hero'));
assert.ok(css.includes('#page-jouer .expedition-portal'));
assert.ok(!css.includes('#page-jouer .expedition-panel'),
  'The full chapter must no longer style the classic challenge screen');
assert.ok(css.includes('@media(max-width:850px)'));
assert.ok(css.includes('@media(max-width:520px)'));
assert.ok(css.includes('.expedition-choice.is-reflets'),'The Revers route has its own accent without another interface');
assert.ok(css.includes('@media(min-width:1100px)'));
assert.ok(css.includes('prefers-reduced-motion'));
const freshCode=main.slice(main.indexOf('const fresh='),main.indexOf('function load(){'));
const loadCode=main.slice(main.indexOf('function load(){'),main.indexOf('let state=load();'));
function restore(raw){
 return runInNewContext(freshCode+loadCode+'load()',{
  CARDS,SAVE:'aetherium-save-v1',sanitizeMilestoneClaims,
  sanitizedTrialRecords,sanitizeAlchemyKnown,sanitizeExpedition,
  saveSession:createSaveSession(()=>({getItem:()=>JSON.stringify(raw)}),CARDS.map(c=>c.id))
 });
}
const legacy={coins:570,dust:25,wins:4,earned:800,opened:5,owned:{1:2},
 shiny:{1:true},alchemyKnown:[0,1],titleId:null};
const old=restore(legacy);
assert.equal(old.coins,570);
assert.equal(old.dust,25);
assert.equal(old.opened,5);
assert.equal(old.owned[1],2);
assert.equal(old.shiny[1],true);
assert.equal(old.expedition.route,null,'Legacy save may have no chapter');
const resumable=restore({...legacy,expedition:armExpedition(start)});
assert.equal(resumable.expedition.route,'verriers');
assert.equal(resumable.expedition.step,0);
assert.equal(resumable.expedition.armed,true);
const finished=restore({...legacy,expedition:echoes});
assert.deepEqual(Array.from(finished.expedition.completedRoutes),['verriers','veilleurs']);
assert.equal(finished.expedition.step,3);

// Run the real victory handler: a normal victory is credited once, while an
// armed matching checkpoint also advances the chapter without extra coins.
const completeCode=main.slice(main.indexOf('function complete(i,description,performance={}){'),
 main.indexOf('const runeNames=',main.indexOf('function complete(i,description,performance={}){')));
assert.ok(completeCode.startsWith('function complete(i,description,performance={}){'));
const games=Array.from({length:5},(_,i)=>({
 mode:'aventure',ended:false,reward:[35,45,50,65,60][i],status:{textContent:''},
 actions:{children:[],append(button){this.children.push(button)}}
}));
const state={trialStats:[],trialRecords:[],expedition:startExpedition(null,'verriers','aventure')};
let earned=0,rendered=0,wins=0;
const returned=[];
const gameSandbox={mini:games,state,expeditionVictory,trialScore,trialReward,
 recordTrialWin,recordPersonalBest,
 grant(value){earned+=value;wins++},
 recordCircuitVictory(){},
 renderTrialMastery(){},
 renderExpedition(){rendered++},
 button(label,handler){return {textContent:label,click:handler}},
 navigate(page){returned.push(page)}
};
function complete(index,performance={}){
 gameSandbox.index=index;gameSandbox.performance=performance;
 runInNewContext(completeCode+'complete(index,\'Victoire\',performance);',gameSandbox);
}
complete(0,{errors:0});
assert.equal(state.expedition.step,0,'Normal victory before arming never starts expedition');
assert.equal(earned,40,'Original Aventure reward retained (35 + 5 for flawless win)');
assert.equal(rendered,0);
games[0].ended=false;
state.expedition=armExpedition(state.expedition);
complete(0,{errors:0});
assert.equal(state.expedition.step,1);
assert.equal(state.expedition.armed,false);
assert.equal(earned,80,'Expedition gives no extra Couronnes on top of the original victory');
assert.equal(rendered,1);
assert.equal(games[0].actions.children.length,1,'A new return link appears after a completed stage');
games[0].actions.children[0].click();
assert.deepEqual(returned,['expeditions'],'Return link navigates to the story, not another mini-game');
assert.equal(state.expedition.step,1,'Returning does not replay or reset progress');
complete(0,{errors:0});
assert.equal(earned,80,'Completed game cannot pay twice');
assert.equal(state.expedition.step,1);
games[3].ended=false;
state.expedition=armExpedition(state.expedition);
complete(3,{hints:2});
assert.equal(state.expedition.step,2);
assert.equal(earned,145,'Normal Fouilles reward retained');
games[4].ended=false;
state.expedition=armExpedition(state.expedition);
complete(4,{errors:0});
assert.equal(state.expedition.step,3);
assert.deepEqual(state.expedition.completedRoutes,['verriers']);
assert.equal(earned,210,'Normal laboratory reward only');
assert.equal(rendered,3);
assert.equal(state.trialStats[0].wins,2);
assert.equal(state.trialRecords[4].aventure.wins,1);

// The actual UI controls must offer a route, arm a stage and allow quitting.
function uiNode(tag='div',klass='',value=''){
 const tokens=new Set(klass.split(/\s+/).filter(Boolean));
 return {tagName:tag,className:klass,textContent:value,children:[],
  attrs:{},events:{},dataset:{},
  classList:{contains:t=>tokens.has(t)},
  append(...items){this.children.push(...items)},
  replaceChildren(...items){this.children=[...items]},
  setAttribute(key,value){this.attrs[key]=String(value)},
  addEventListener(type,fn){this.events[type]=fn},
  click(){this.events.click?.()}
 };
}
const chapterContent=uiNode('div'),chapterCounter=uiNode('span');
const domState={difficulty:'maitrise',expedition:emptyExpedition()};
const calls={saved:0,started:[],selected:[],rendered:0,navigated:[],scrolled:[]};
const cards=Array.from({length:5},(_,index)=>({card:{
 querySelector:()=>null,
 scrollIntoView(){calls.scrolled.push(index)}
}}));
const choicesSandbox={
 state:domState,EXPEDITION_ROUTES,FINALE_ID,FINALE_PREREQUISITES,FINALE_VOWS,
 canStartFinale,chooseFinaleVow,expeditionSummary,startExpedition,
 abandonExpedition,armExpedition,DIFFICULTIES:[
 {id:'initiation',label:'Initiation'},
 {id:'aventure',label:'Aventure'},
 {id:'maitrise',label:'Maîtrise'}],
 mini:cards,mobileView:{matches:false},
 definitions:[{name:'Chemin runique'},{name:'Mémoire ancienne'},{name:'Serrure d’Éther'},
 {name:'Fouilles interdites'},{name:'Laboratoire arcanique'}],
 trialStarters:Array.from({length:5},(_,i)=>()=>calls.started.push(i)),
 renderTrialMastery(){calls.rendered++},
 circuitSession:{pause(){calls.circuitPaused=(calls.circuitPaused||0)+1}},
 renderDifficultyChoice(){},
 selectGame(i){calls.selected.push(i)},
 save(){calls.saved++},
 navigate(page){calls.navigated.push(page)},
 openTrial(){calls.opened=(calls.opened||0)+1},
 el:uiNode,
 button(label,fn,klass){const b=uiNode('button',klass,label);b.addEventListener('click',fn);return b},
 $:selector=>selector==='#expedition-content'?chapterContent:
  selector==='#expedition-counter'?chapterCounter:
  null
};
const uiCode=main.slice(main.indexOf('function renderExpedition(){'),
 main.indexOf('function makeCard(',main.indexOf('function renderExpedition(){')));
assert.ok(uiCode.startsWith('function renderExpedition(){'));
const ui=runInNewContext(uiCode+'({renderExpedition})',choicesSandbox);
ui.renderExpedition();
assert.equal(chapterCounter.textContent,'0/4 fragments');
assert.ok(html.includes('<span>4 itinéraires</span>'),'Stable hub label');
const choiceBlock=chapterContent.children.find(e=>e.classList.contains('expedition-choices'));
assert.equal(choiceBlock.children.length,4);
choiceBlock.children[1].click();
assert.equal(domState.expedition.route,'veilleurs');
assert.equal(domState.expedition.mode,'maitrise');
assert.equal(domState.expedition.step,0);
assert.equal(calls.saved,1);
assert.equal(domState.expedition.step,0,'Current step remains in expedition state');
const actions=chapterContent.children.find(e=>e.classList.contains('expedition-actions'));
assert.equal(actions.children.length,2);
actions.children[0].click();
assert.equal(domState.expedition.armed,true);
assert.deepEqual(calls.started,[1],'Launching Veilleurs restarts the actual Memory trial');
assert.deepEqual(calls.selected,[1],'The selected mini-game becomes visible');
assert.deepEqual(calls.navigated,['jouer'],'A stage launch leaves the expedition screen and reveals the game');
assert.deepEqual(calls.scrolled,[1],'The targeted game is scrolled into view on desktop and mobile');
assert.equal(calls.saved,2);
const cancel=chapterContent.children.find(e=>e.classList.contains('expedition-actions')).children[1];
cancel.click();
assert.equal(domState.expedition.route,null);
assert.equal(calls.saved,3);
// Real screen selection + stage launch for the Revers route, on the same controls.
const afterExit=chapterContent.children.find(e=>e.classList.contains('expedition-choices'));
assert.equal(afterExit.children.length,4);
afterExit.children[2].click();
assert.equal(domState.expedition.route,'traversee-reflets');
assert.equal(domState.expedition.mode,'maitrise');
assert.equal(calls.saved,4);
assert.ok(chapterContent.children.some(e=>e.classList.contains('expedition-lead')));
assert.equal(domState.expedition.route,'traversee-reflets','The route remains available inside the expedition');
const reversActions=chapterContent.children.find(e=>e.classList.contains('expedition-actions'));
reversActions.children[0].click();
assert.equal(domState.expedition.armed,true);
assert.deepEqual(calls.started,[1,1],'Revers opens Memory in the original mini-game screen');
assert.deepEqual(calls.selected,[1,1]);
assert.equal(calls.saved,5);
assert.deepEqual(calls.navigated,['jouer','jouer']);
assert.deepEqual(calls.scrolled,[1,1]);
assert.equal(calls.opened,2,'Both expedition stages enter the dedicated trial view');
assert.ok(html.includes('Les Itinéraires des Marches'),'The expedition header includes all three routes');
console.log('AETHERIUM — 3 parcours historiques + Le Dernier Accord, checkpoints, navigation et sauvegardes compatibles');
