import {mountConfrontations} from './confrontations.js?v=1';
import {mountTrialMobilePlay} from './trial-mobile-play.js?v=2';
import {ARCANE_CIRCUITS,createCircuitSession} from './arcane-circuits.js?v=1';
import {journeyProgress} from './journey-progress.js?v=1';
import {loreArchive} from './lore-archive.js?v=1';
import {completionPlan,completionRecipes,filterCompletionRecipes} from './collection-completion.js?v=1';
import {beginnerGuide,readGuideDismissal,writeGuideDismissal} from './onboarding.js?v=1';
import {createCardFront,attachRectoLabInspector} from './recto-lab.js?v=recto-uniforme-3';
import {RARITIES,PACK_PRICE} from './data.js?v=booster-variety-1';
import {CARDS,CARD_BY_ID,drawCollectionPack} from './collection-data.js?v=seasons-09';
import {BOOSTER_VIEWS,boosterView} from './booster-views.js?v=2';
import {CRAFT_COSTS,getCraftCost,craftCard} from './crafting.js';
import {getFinishCraftCost,canCraftFinish,craftFinish} from './finish-crafting.js?v=forge-finish-1';
import {duplicateDustReward} from './duplicate-rewards.js';
import {boosterMoment} from './booster-feedback.js?v=booster-polish-1';
import {applyCardIllustration,upgradeCodexIllustration,hasApprovedArt,CARD_ART} from './card-art.js?v=seasons-09&chromatic=audit-1&codex=2-5';
import {reconcileCodexGrid,createCodexViewport} from './codex-performance.js?v=1';
import {codexProgress,filterCodex} from './codex.js';
import {finishObjective} from './finish-objectives.js?v=signature-targets-1';
import {FINISHES,FINISH_KEYS,restoreFinishCounts,synchronizeFinishCounts,finishQuantity,preferredFinish} from './finishes.js?v=finish-order-2';
import {enableHolographicInspection} from './finish-interaction.js';
import {sanitizeRecentFinds,recordRecentFind,buildLivingArchive} from './living-archives.js?v=seasons-09';
import {createBackup,decodeBackup,installImportedSave,restorePreviousSave,PREVIOUS_SAVE_KEY,MAX_BACKUP_SIZE,GAME_SAVE_KEY,DEV_PREVIEW} from './save-backup.js';
import {createSaveSession,parseStoredSave} from './save-session.js?v=save-safety-1';
import {SEASONS,seasonById,collectionById,cardsForCollection,collectionForCard,seasonProgress} from './seasons.js?v=seasons-09';
import {mountRefletsGallery} from './reflets-gallery.js?v=reflets-final-24';
import {mountAuDelaGallery} from './au-dela-gallery.js?v=au-dela-lot-3';
import {milestonesFor,sanitizeMilestoneClaims,uniqueCardsOwned,collectionMilestoneStatus,claimCollectionMilestone} from './collection-milestones.js?v=au-dela-journal-1';
import {DIFFICULTIES,validDifficulty,trialRules,trialObjective,trialScore,trialReward,emptyTrialStats,sanitizedTrialStats,recordTrialWin,masteryLevel} from './trial-progress.js?v=mastery-balance-2';
import {TRIAL_RECORD_MODES,TRIAL_RECORD_METRICS,sanitizedTrialRecords,recordPersonalBest,recordMetricLabel} from './trial-records.js';
import {trialChallengesFor} from './trial-challenges.js';
import {TRIAL_TITLES,earnedTrialTitles,validEquippedTitle,toggleEquippedTitle} from './trial-titles.js';
import {EXPEDITION_ROUTES,FINALE_ID,FINALE_PREREQUISITES,FINALE_VOWS,canStartFinale,chooseFinaleVow,awardFinaleCard,sanitizeExpedition,startExpedition,abandonExpedition,armExpedition,expeditionVictory,expeditionSummary} from './expeditions.js?v=dernier-accord-1';
import {nextRuneRitual,runeExpectedAt} from './rune-rituals.js?v=variety-06';
import {makeEtherPuzzle,etherRule,evaluateEtherAttempt,etherAttemptFeedback} from './ether-lock-puzzles.js';
import {nextMemoryRitual,buildMemoryDeck} from './memory-rituals.js?v=variety-06';
import {makeExcavationSite,chooseExcavationGuide} from './excavation-sites.js';
import {ALCHEMY_ESSENCES,ALCHEMY_MODES,ALCHEMY_RECIPE_COUNT,alchemyClue,recipeIndex,rememberAlchemyRecipe,sanitizeAlchemyKnown,selectAlchemyRecipes} from './alchemy-rituals.js?v=variety-06';

const $=(q,root=document)=>root.querySelector(q);
const $$=(q,root=document)=>Array.from(root.querySelectorAll(q));
const mobileView=window.matchMedia('(max-width:850px)');
const sheetScrim=$('#sheet-scrim'), filterDrawer=$('#collection-filters'), inspectorShell=$('#inspector-shell');
let sheetReturnFocus=null;
function closeSheets(restoreFocus=true){
  if(restoreFocus&&mobileView.matches)enableHolographicInspection(null);
  // A mobile Codex inspection lives in the browser top layer, not inside
  // the animated page stacking context beneath the blurred scrim.
  if(typeof inspectorShell.hidePopover==='function'&&inspectorShell.matches(':popover-open'))inspectorShell.hidePopover();
  document.body.classList.remove('sheet-open');
  sheetScrim.hidden=true;
  filterDrawer.classList.remove('is-open');
  inspectorShell.classList.remove('is-open');
  $('#filter-open').setAttribute('aria-expanded','false');
  if(mobileView.matches){
    filterDrawer.inert=true;
    inspectorShell.inert=true;
    filterDrawer.setAttribute('aria-hidden','true');
    inspectorShell.setAttribute('aria-hidden','true');
  }
  if(restoreFocus&&sheetReturnFocus?.isConnected)sheetReturnFocus.focus({preventScroll:true});
  sheetReturnFocus=null;
}
function openSheet(kind){
  if(!mobileView.matches)return;
  const previousFocus=document.activeElement;
  closeSheets(false);
  sheetReturnFocus=previousFocus;
  const target=kind==='filters'?filterDrawer:inspectorShell;
  target.inert=false;
  target.setAttribute('aria-hidden','false');
  target.classList.add('is-open');
  // Native popover top layer is always in front of backdrop-filter and the
  // animated Codex page; its content never receives background blur.
  if(kind==='inspector'&&typeof target.showPopover==='function')target.showPopover();
  sheetScrim.hidden=false;
  document.body.classList.add('sheet-open');
  if(kind==='filters')$('#filter-open').setAttribute('aria-expanded','true');
  (kind==='filters'?$('#filter-close'):$('#inspect-close')).focus({preventScroll:true});
}
function syncMobileSheets(){
  closeSheets(false);
  for(const target of [filterDrawer,inspectorShell]){
    if(mobileView.matches){
      if(target===inspectorShell)target.setAttribute('popover','manual');
      target.setAttribute('role','dialog');
      target.setAttribute('aria-modal','true');
      target.setAttribute('aria-hidden','true');
      target.inert=true;
    }else{
      if(target===inspectorShell)target.removeAttribute('popover');
      target.removeAttribute('role');
      target.removeAttribute('aria-modal');
      target.removeAttribute('aria-hidden');
      target.inert=false;
    }
  }
  selectGame(selectedGame);
}
$('#filter-open').addEventListener('click',()=>openSheet('filters'));
$('#filter-close').addEventListener('click',()=>closeSheets());
$('#filter-done').addEventListener('click',()=>closeSheets());
$('#inspect-close').addEventListener('click',()=>closeSheets());
sheetScrim.addEventListener('click',()=>closeSheets());
document.addEventListener('keydown',event=>{
  if(!document.body.classList.contains('sheet-open'))return;
  if(event.key==='Escape'){event.preventDefault();closeSheets();return}
  if(event.key!=='Tab')return;
  const active=filterDrawer.classList.contains('is-open')?filterDrawer:inspectorShell;
  const items=$$('button:not([disabled]),input:not([disabled]),a[href]',active).filter(x=>!x.hidden);
  if(!items.length)return;
  const first=items[0],last=items[items.length-1];
  if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
  else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
});
mobileView.addEventListener('change',syncMobileSheets);

// The first art atlas uses twelve reference illustrations cropped from the
// approved Collection mockup. These are *visual placeholders*, not final art
// for the corresponding 24 catalogue entries. All gameplay/save data is unchanged.
const SAVE=GAME_SAVE_KEY;
if(DEV_PREVIEW){
  document.title='[DEV] '+document.title;
  const brand=document.querySelector('.brand-wordmark');
  if(brand){brand.textContent='AETHERIUM · DEV';brand.title='Version de test : progression et monnaies isolées';}
}
const saveCardIds=CARDS.map(card=>card.id);
const saveSession=createSaveSession(()=>localStorage,saveCardIds);
const circuitSession=createCircuitSession();
const fresh=()=>({coins:300,dust:0,owned:{},shiny:{},wins:0,earned:0,opened:0,goalId:null,difficulty:'aventure',trialStats:[],collectionMilestones:{},recentFinds:[],alchemyKnown:[],trialRecords:[],titleId:null,expedition:{route:null,step:0,mode:null,armed:false,completedRoutes:[]}});
function load(){try{const raw=saveSession.rawState;if(!raw||typeof raw!=='object')return fresh();const s=fresh();for(const field of ['coins','dust','wins','earned','opened'])if(Number.isSafeInteger(raw[field])&&raw[field]>=0&&raw[field]<1e9)s[field]=raw[field];for(const c of CARDS){const n=raw.owned?.[c.id];if(Number.isSafeInteger(n)&&n>0&&n<1e6)s.owned[c.id]=n;if(raw.shiny?.[c.id]===true&&s.owned[c.id])s.shiny[c.id]=true}if(Number.isSafeInteger(raw.goalId)&&CARDS.some(c=>c.id===raw.goalId&&c.signature!==true)&&!s.owned[raw.goalId])s.goalId=raw.goalId;if(['initiation','aventure','maitrise'].includes(raw.difficulty))s.difficulty=raw.difficulty;if(Array.isArray(raw.trialStats))s.trialStats=raw.trialStats;if(Array.isArray(raw.trialRecords))s.trialRecords=sanitizedTrialRecords(raw.trialRecords);s.collectionMilestones=sanitizeMilestoneClaims(raw.collectionMilestones);if(Array.isArray(raw.recentFinds))s.recentFinds=sanitizeRecentFinds(raw.recentFinds);if(Array.isArray(raw.alchemyKnown))s.alchemyKnown=sanitizeAlchemyKnown(raw.alchemyKnown);if(Number.isInteger(raw.titleId)&&raw.titleId>=0&&raw.titleId<5)s.titleId=raw.titleId;if(raw.expedition)s.expedition=sanitizeExpedition(raw.expedition);return s}catch{saveSession.block();return fresh()}}
let state=load();
// Adopt legacy cards without altering the original key or owned quantities.
// Existing 'shiny' booleans map to at least one Chromatique; new saves have
// exact quantities per finish and are restored without guessing.
try{
  const old=saveSession.rawState;
  state.finishCounts=restoreFinishCounts(state.owned,state.shiny,old?.finishCounts);
}catch{
  saveSession.block();
  state.finishCounts=restoreFinishCounts(state.owned,state.shiny);
}
synchronizeFinishCounts(state);
state.trialStats=sanitizedTrialStats(state.trialStats);
state.trialRecords=sanitizedTrialRecords(state.trialRecords);
state.titleId=validEquippedTitle(state.titleId,state.trialStats,state.trialRecords);
state.expedition=sanitizeExpedition(state.expedition);
let boosterBusy=false;
let guideDismissed=false,guideManual=false;
try{guideDismissed=readGuideDismissal(localStorage)}catch{}
function rememberGuideDismissal(value){guideDismissed=value;try{writeGuideDismissal(localStorage,value)}catch{}}
function renderBeginnerGuide(){
 const guide=$('#beginner-guide');
 const progress=beginnerGuide(state,PACK_PRICE);
 guide.hidden=!!saveSession.problem||(!guideManual&&(guideDismissed||progress.complete));
 $('#trial-guide-shortcut').hidden=guide.hidden;
 $('#guide-pack-step').textContent=progress.collected?'✓ Premières cartes':'◇ Découvrir des cartes';
 $('#guide-trial-step').textContent=progress.won?'✓ Première victoire':'◇ Remporter une épreuve';
 $('#guide-title').textContent=progress.complete?'Ton aventure continue':progress.collected?'Tes premières archives':'Bienvenue dans les Marches de Verre';
 $('#guide-copy').textContent=progress.complete?'Explore les collections, relève les défis et utilise la Forge pour compléter ton Codex.':progress.stage==='pack'?'Tu disposes de '+state.coins+' Couronnes : de quoi ouvrir '+Math.floor(state.coins/PACK_PRICE)+' booster'+(Math.floor(state.coins/PACK_PRICE)>1?'s':'')+'. Chaque paquet coûte '+PACK_PRICE+' Couronnes et révèle cinq cartes.':progress.collected?'Gagne des Couronnes en remportant une épreuve. Choisis Initiation si tu souhaites découvrir les règles à ton rythme.':'Remporte une épreuve pour réunir les Couronnes nécessaires à ton premier booster.';
 $('#guide-action').textContent=progress.complete?'Explorer le Codex ›':progress.stage==='pack'?'Découvrir les boosters ›':'Choisir une épreuve ›';
 $('#guide-dismiss').textContent=progress.complete?'Fermer':'Masquer le guide';
 const funds=$('#booster-funds');
 funds.hidden=boosterBusy||progress.canBuy;
 $('#booster-funds-text').textContent='Il te manque '+Math.max(0,PACK_PRICE-state.coins)+' Couronnes pour ce booster.';
}
function showSaveWarning(message=''){
  const warning=$('#save-warning');
  warning.textContent=message;
  warning.hidden=!message;
}
function save(){
  synchronizeFinishCounts(state);
  try{saveSession.write(state);showSaveWarning()}
  catch(error){showSaveWarning(error.message)}
}
window.addEventListener('storage',event=>{
  if(event.key!==null&&event.key!==SAVE)return;
  try{saveSession.assertCurrent()}
  catch(error){showSaveWarning(error.message)}
});
let toastTimer;
function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3000)}
function update(){if(state.goalId&&state.owned[state.goalId])state.goalId=null;save();$('#coins').textContent=state.coins.toLocaleString('fr-FR');$('#dust').textContent=state.dust.toLocaleString('fr-FR');$('#buy').disabled=state.coins<PACK_PRICE||boosterBusy;for(const control of $$('.booster-choice'))control.disabled=boosterBusy;$('#collection-progress').textContent=Object.keys(state.owned).length+' / '+CARDS.length;
$('#mobile-collection-progress').textContent=Object.keys(state.owned).length+' / '+CARDS.length+' obtenues';
  $('#codex-card-count').textContent=Object.keys(state.owned).length+' / '+CARDS.length;
  for(const finish of FINISH_KEYS){
    const {unique,total,copies}=finishObjective(CARDS,state.finishCounts,finish);
    const el=document.querySelector('#codex-'+finish+'-count');
    if(el)el.textContent=unique+' / '+total+' · '+copies+' ex.';
    const mobile=document.querySelector('#mobile-'+finish+'-count');
    if(mobile)mobile.textContent=FINISHES[finish].symbol+' '+unique+' / '+total+(finish==='chromatic'?' Chromatiques':'');
  }
  renderBeginnerGuide();
  if($('#page-succes').classList.contains('active'))renderAchievements();
  if($('#page-atelier').classList.contains('active'))renderAtelier()}
function grant(value){state.coins+=value;state.earned+=value;state.wins++;update();notify('+'+value+' Couronnes remportées !')}
const MAIN_PAGES=['jouer','boosters','collection','atelier'];
const APP_PAGES=[...MAIN_PAGES,'succes','expeditions'];
let forgeSelectedId=null;
let forgeFilter='all';
let pendingCraftId=null;
let forgeMode='discovery',pendingCraftFinish=null;
const forgeCost=card=>forgeMode==='discovery'?getCraftCost(card):getFinishCraftCost(card,forgeMode);
const forgeModeLabel=()=>forgeMode==='discovery'?'Carte manquante':FINISHES[forgeMode].label;

function renderAtelier(){
  $('#atelier-dust').textContent=state.dust.toLocaleString('fr-FR');
  $('#atelier-collected').textContent=Object.keys(state.owned).length+' / '+CARDS.length;
  const duplicates=Object.values(state.owned).reduce((sum,n)=>sum+Math.max(0,n-1),0);
  $('#atelier-duplicates').textContent=duplicates.toLocaleString('fr-FR');

  // Keep a wanted card visible between sessions, even after a page reload.
  const goal=CARDS.find(card=>card.id===state.goalId&&!state.owned[card.id]&&getCraftCost(card)!==null);
  const summary=$('#atelier-goal-summary');
  summary.replaceChildren();
  if(goal){
    const cost=getCraftCost(goal);
    const remaining=Math.max(0,cost-state.dust);
    summary.append(el('strong','atelier-goal-name',goal.name));
    const progress=el('div','atelier-goal-meter');
    progress.setAttribute('role','progressbar');
    progress.setAttribute('aria-label','Progression vers '+goal.name);
    progress.setAttribute('aria-valuemin','0');
    progress.setAttribute('aria-valuemax',String(cost));
    progress.setAttribute('aria-valuenow',String(Math.min(state.dust,cost)));
    const fill=el('span');
    fill.style.width=Math.min(100,(state.dust/cost)*100)+'%';
    progress.append(fill);
    summary.append(progress,el('p','',remaining?remaining+' Éclats manquants sur '+cost:'Tu peux fabriquer cette carte !'));
    summary.append(button('Voir mon objectif ›',()=>{
      forgeSelectedId=goal.id;
      forgeMode='discovery';$('#atelier-mode').value=forgeMode;
      forgeFilter='all';
      $('#atelier-filter').value='all';
      renderAtelier();
      $('#atelier-card-details').scrollIntoView({behavior:'smooth',block:'nearest'});
    },'secondary atelier-side-link'));
  }else summary.append(el('p','atelier-goal-placeholder','Choisis une carte manquante et désigne-la comme objectif. Ta progression sera conservée.'));

  const missing=CARDS.filter(card=>forgeMode==='discovery'?(!state.owned[card.id]&&getCraftCost(card)!==null):canCraftFinish(state,card,forgeMode));
  const visible=missing.filter(card=>
    forgeFilter==='all'||(forgeFilter==='affordable'?state.dust>=forgeCost(card):card.rarity===forgeFilter));
  $('#atelier-rarity-note').textContent='Coûts · '+forgeModeLabel()+' : '+Object.keys(CRAFT_COSTS).map(r=>RARITIES[r].label+' '+forgeCost({id:1,rarity:r})).join(' · ')+' Éclats.';
  $('#atelier-card-list').setAttribute('aria-label','Recettes disponibles · '+forgeModeLabel());
  const chooseFrom=visible.find(c=>c.id===forgeSelectedId)
    ||visible.find(c=>c.id===state.goalId)
    ||visible[0]||null;
  forgeSelectedId=chooseFrom?.id??null;
  const gallery=$('#atelier-card-list');
  gallery.replaceChildren();
  $('#atelier-empty').hidden=visible.length>0;
  $('#atelier-empty').textContent=missing.length===0
    ?(forgeMode==='discovery'?'Tu possèdes toutes les cartes disponibles en booster ou à la Forge. La Signature du dernier chapitre se mérite en aventure.':'Aucune finition manquante sur les cartes découvertes. Les cartes inédites doivent d’abord être découvertes.')
    :'Aucune recette ne correspond à ce filtre.';
  for(const card of visible){
    const selected=card.id===forgeSelectedId;
    const wish=forgeMode==='discovery'&&card.id===state.goalId;
    const cost=forgeCost(card);
    const tile=el('button','atelier-craft-tile'+(selected?' is-selected':'')+(wish?' is-wished':''));
    tile.type='button';
    tile.dataset.cardId=String(card.id);
    tile.setAttribute('aria-pressed',String(selected));
    tile.setAttribute('aria-label',card.name+', '+RARITIES[card.rarity].label+', '+cost+' Éclats'+(wish?', carte convoitée':''));
    tile.style.setProperty('--rarity-color',RARITIES[card.rarity].color);
    const art=el('img','atelier-craft-art');
    applyCardIllustration(art,card,{shiny:false,size:'thumbnail'});
    art.alt='';
    const label=el('span','atelier-craft-name',card.name);
    const costLine=el('span','atelier-craft-cost','✦ '+cost+' Éclats');
    tile.append(art,label,costLine);
    if(wish)tile.append(el('span','atelier-wish-badge','✧ OBJECTIF'));
    if(state.dust>=cost)tile.classList.add('is-affordable');
    tile.addEventListener('click',()=>{
      forgeSelectedId=card.id;
      renderAtelier();
      if(mobileView.matches)$('#atelier-card-details').scrollIntoView({behavior:'smooth',block:'start'});
      else gallery.querySelector('[data-card-id="'+card.id+'"]')?.focus({preventScroll:true});
    });
    gallery.append(tile);
  }

  const details=$('#atelier-card-details');
  details.replaceChildren();
  if(!chooseFrom){
    const text=missing.length===0
      ?(forgeMode==='discovery'?'Toutes les cartes accessibles à la Forge ont rejoint ton Codex. Choisis une finition pour poursuivre ta collection.':'Toutes les recettes accessibles de cette finition sont déjà possédées, ou aucune carte éligible n’a été découverte.')
      :'Modifie le filtre pour choisir une carte à fabriquer.';
    details.append(el('p','kicker','LES FORGES DES ARCHIVES'),el('h3','',missing.length?'Aucune recette affichée':'Aucune recette manquante'),el('p','atelier-detail-placeholder',text));
    if(missing.length===0)details.append(button('Explorer mon Codex ›',()=>navigate('collection'),'secondary atelier-detail-link'));
    return;
  }
  const cost=forgeCost(chooseFrom);
  const remaining=Math.max(0,cost-state.dust);
  const art=el('img','atelier-detail-art');
  applyCardIllustration(art,chooseFrom,{shiny:false,size:'full'});
  art.alt='Illustration de '+chooseFrom.name;
  const frame=el('div','atelier-detail-frame');
  frame.style.setProperty('--rarity-color',RARITIES[chooseFrom.rarity].color);
  frame.append(art);
  const meter=el('div','atelier-detail-meter');
  meter.setAttribute('role','progressbar');
  meter.setAttribute('aria-label','Éclats pour fabriquer '+chooseFrom.name);
  meter.setAttribute('aria-valuemin','0');
  meter.setAttribute('aria-valuemax',String(cost));
  meter.setAttribute('aria-valuenow',String(Math.min(cost,state.dust)));
  const fill=el('span');fill.style.width=Math.min(100,state.dust/cost*100)+'%';
  meter.append(fill);
  const craft=button('Forger · '+cost+' Éclats',()=>forgeMode==='discovery'?askCraft(chooseFrom.id):askFinishCraft(chooseFrom.id,forgeMode),'primary atelier-craft-action');
  craft.disabled=state.dust<cost;
  craft.title=remaining?'Encore '+remaining+' Éclats nécessaires':'Forger cette carte et dépenser '+cost+' Éclats';
  const goalButton=button(state.goalId===chooseFrom.id?'Retirer mon objectif':'✧ Choisir comme objectif',()=>{
    const added=state.goalId!==chooseFrom.id;
    state.goalId=added?chooseFrom.id:null;
    update();
    notify(added?'Carte convoitée : '+chooseFrom.name:'Objectif retiré.');
  },'secondary atelier-goal-action');
  goalButton.setAttribute('aria-pressed',String(state.goalId===chooseFrom.id));
  const count=el('div','atelier-detail-count','✦ '+state.dust+' / '+cost+' Éclats');
  const message=el('p','atelier-detail-progress',remaining?remaining+' Éclats encore nécessaires':'La Forge peut accueillir cette carte.');
  details.append(el('p','kicker','FICHE DE FABRICATION'),frame,
    el('h3','',chooseFrom.name),
    el('p','atelier-detail-rarity',RARITIES[chooseFrom.rarity].label+' · '+chooseFrom.type+' · '+forgeModeLabel()),
    el('p','atelier-detail-lore','« '+chooseFrom.lore+' »'),
    count,meter,message,craft);
  if(forgeMode==='discovery')details.append(goalButton);
  else details.append(el('p','atelier-detail-progress','Ajoute un exemplaire de cette finition. Tes autres exemplaires restent intacts.'));
}

function askCraft(cardId){
  const card=CARDS.find(c=>c.id===cardId&&!state.owned[c.id]&&!c.signature);
  if(!card)return notify('Cette carte se trouve déjà dans ton Codex.');
  const cost=getCraftCost(card);
  if(cost===null)return notify('Cette carte est réservée à une aventure, elle ne peut pas être fabriquée.');
  if(state.dust<cost)return notify('Tu ne possèdes pas encore assez d’Éclats.');
  pendingCraftId=card.id;pendingCraftFinish=null;
  $('#atelier-confirm-text').textContent='Fabriquer « '+card.name+' » pour '+cost+' Éclats ? Solde actuel : '+state.dust+' Éclats.';
  const modal=$('#atelier-confirm');
  if(typeof modal.showModal==='function')modal.showModal();
  else if(window.confirm('Fabriquer '+card.name+' pour '+cost+' Éclats ?'))completeCraft();
  else pendingCraftId=null;
}

function askFinishCraft(cardId,finish){
  const card=CARDS.find(c=>c.id===cardId);
  if(!canCraftFinish(state,card,finish))return notify('Cette recette n’est plus disponible.');
  const cost=getFinishCraftCost(card,finish);
  if(state.dust<cost)return notify('Tu ne possèdes pas encore assez d’Éclats.');
  pendingCraftId=cardId;pendingCraftFinish=finish;
  $('#atelier-confirm-text').textContent='Forger « '+card.name+' » · '+FINISHES[finish].label+' pour '+cost+' Éclats ? Solde actuel : '+state.dust+' Éclats.';
  const modal=$('#atelier-confirm');
  if(typeof modal.showModal==='function')modal.showModal();
  else if(window.confirm('Forger cette finition pour '+cost+' Éclats ?'))completeCraft();
  else{pendingCraftId=null;pendingCraftFinish=null;}
}
function completeCraft(){
  const cardId=pendingCraftId,finish=pendingCraftFinish;
  pendingCraftId=null;pendingCraftFinish=null;
  const modal=$('#atelier-confirm');
  if(modal.open)modal.close();
  const card=CARDS.find(c=>c.id===cardId);
  if(finish!==null){
    const result=craftFinish(state,card,finish);
    if(!result.ok)return notify(result.reason);
    state=result.state;
    state.recentFinds=recordRecentFind(state.recentFinds,card.id,finish==='chromatic'?'chromatic':'forge');
    forgeSelectedId=null;
    update();
    renderCollection();
    const report=$('#atelier-result');report.hidden=false;
    report.textContent='✧ '+card.name+' · '+FINISHES[finish].label+' forgée ! −'+result.cost+' Éclats.';
    notify('Finition forgée : '+FINISHES[finish].label+' !');
    return;
  }
  const result=craftCard(state,card);
  if(!result.ok)return notify(result.reason);
  state=result.state;
  state.recentFinds=recordRecentFind(state.recentFinds,card.id,'forge');
  forgeSelectedId=null;
  update(); // Saves the new card and the spent Éclats in one state update.
  renderCollection();
  const report=$('#atelier-result');
  report.hidden=false;
  report.textContent='✧ '+card.name+' rejoint ton Codex ! −'+result.cost+' Éclats.';
  notify('Carte fabriquée : '+card.name+' !');
}
$('#atelier-mode').addEventListener('change',event=>{
  const value=event.target.value;
  forgeMode=value==='discovery'||FINISH_KEYS.includes(value)?value:'discovery';
  forgeSelectedId=null;forgeFilter='all';$('#atelier-filter').value='all';
  $('#atelier-result').hidden=true;renderAtelier();
});
$('#atelier-filter').addEventListener('change',event=>{
  forgeFilter=event.target.value;
  forgeSelectedId=null;
  renderAtelier();
});
$('#atelier-jump').addEventListener('click',()=>{
  $('#atelier-catalogue-title').scrollIntoView({behavior:'smooth',block:'start'});
  $('#atelier-catalogue-title').focus({preventScroll:true});
});
$('#atelier-confirm-cancel').addEventListener('click',()=>{
  pendingCraftId=null;pendingCraftFinish=null;
  $('#atelier-confirm').close();
});
$('#atelier-confirm-accept').addEventListener('click',completeCraft);
$('#atelier-confirm').addEventListener('close',()=>{pendingCraftId=null;pendingCraftFinish=null});
function navigate(page){
  if(!APP_PAGES.includes(page))return;
  if(page!=='collection')enableHolographicInspection(null);
  closeSheets(false);
  if(typeof boosterDialog!=='undefined'&&boosterDialog.open)closeBoosterDialog();
  $$('.page').forEach(el=>el.classList.toggle('active',el.id==='page-'+page));
  $$('nav [data-page]').forEach(el=>{
    const active=el.dataset.page===page;
    el.classList.toggle('active',active);
    if(active)el.setAttribute('aria-current','page');
    else el.removeAttribute('aria-current');
  });
  $('#chroniques-link').classList.toggle('active',page==='succes');
  if(page==='collection')renderCollection();
  if(page==='jouer'){setTrialView('hub');renderBeginnerGuide();renderCircuits();refreshTrialPreview();}
  if(page==='atelier')renderAtelier();
  if(page==='succes')renderAchievements();
  if(page==='expeditions')renderExpedition();
  history.replaceState(null,'','#'+page);
  if(mobileView.matches)window.scrollTo(0,0);
}
$$('nav [data-page]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function el(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node}
function button(text,handler,className='secondary'){const b=el('button',className,text);b.type='button';b.addEventListener('click',handler);return b}
function tileGrid(host,values,columns,handler){host.replaceChildren();host.style.setProperty('--cols',columns);for(let i=0;i<values.length;i++){const t=button(String(values[i]),()=>handler(values[i],i,t),'tile');host.append(t)}}
const definitions=[
{name:'Chemin runique',description:'Active 12 runes dans l’ordre. Trois erreurs et le sceau se brise.',reward:35},
{name:'Mémoire ancienne',description:'Retourne les tablettes des Archives et retrouve les huit paires runiques.',reward:45},
{name:'Serrure d’Éther',description:'Choisis trois cristaux pour atteindre la valeur cible en trois tentatives.',reward:50},
{name:'Fouilles interdites',description:'Ouvre dix cases sans déclencher les cinq pièges cachés. Les nombres donnent les pièges voisins.',reward:65},
{name:'Laboratoire arcanique',description:'Déduis deux ingrédients du nom de chaque potion et mémorise les mélanges réussis.',reward:60}
];
const mini=[];
definitions.forEach((d,i)=>{
  const card=el('article','game');
  const descriptionEl=el('p','trial-objective',trialObjective(i,state.difficulty));
  const rewardEl=el('div','reward','♛ +'+d.reward+' Couronnes');
  const masteryEl=el('div','trial-mastery');
  const recordsEl=el('details','trial-records');
  const recordsHeader=el('summary','trial-records-summary');
  recordsHeader.append(el('span','trial-records-symbol','✧'),
    el('span','trial-records-heading','Records'),
    el('span','trial-records-current'),
    el('span','trial-challenges-summary'));
  const recordsTable=el('table','trial-records-table');
  recordsTable.setAttribute('aria-label','Records personnels par difficulté');
  const recordsHead=el('thead');
  const headerRow=el('tr');
  for(const name of ['Mode','Victoires','Score',TRIAL_RECORD_METRICS[i].label]){
    headerRow.append(el('th','',name));
  }
  recordsHead.append(headerRow);
  recordsTable.append(recordsHead,el('tbody'));
  const challengePanel=el('section','trial-challenges');
  challengePanel.setAttribute('aria-label','Défis des Maîtres');
  challengePanel.append(el('strong','trial-challenges-heading','Défis des Maîtres'),
    el('div','trial-challenges-list'));
  recordsEl.append(recordsHeader,recordsTable,challengePanel);
  const status=el('div','status');status.setAttribute('aria-live','polite');
  const board=el('div','board'),actions=el('div','small-actions');
  const switcher=el('div','trial-switcher');
  switcher.setAttribute('role','group');
  switcher.setAttribute('aria-label','Navigation entre les épreuves');
  const previous=button('‹',()=>selectGame(i-1,{jumpToStage:true,focusTrial:true}),'trial-switch-button');
  previous.disabled=i===0;
  previous.setAttribute('aria-label',i===0?'Première épreuve':('Épreuve précédente : '+definitions[i-1].name));
  previous.title=i===0?'Première épreuve':'Épreuve précédente';
  const counter=el('span','trial-switch-count',String(i+1).padStart(2,'0')+' / '+String(definitions.length).padStart(2,'0'));
  counter.setAttribute('aria-label','Épreuve '+(i+1)+' sur '+definitions.length);
  const following=button('›',()=>selectGame(i+1,{jumpToStage:true,focusTrial:true}),'trial-switch-button');
  following.disabled=i===definitions.length-1;
  following.setAttribute('aria-label',i===definitions.length-1?'Dernière épreuve':('Épreuve suivante : '+definitions[i+1].name));
  following.title=i===definitions.length-1?'Dernière épreuve':'Épreuve suivante';
  switcher.append(previous,counter,following);
  card.id='trial-panel-'+i;
  const trialTitle=el('h3','trial-title',String(i+1).padStart(2,'0')+' · '+d.name);
  trialTitle.id='trial-title-'+i;
  trialTitle.tabIndex=-1;
  card.setAttribute('aria-labelledby',trialTitle.id);
  const trialMeta=el('div','trial-meta');
  trialMeta.append(rewardEl,masteryEl);
  const trialHeading=el('div','trial-card-heading');
  trialHeading.append(trialTitle,trialMeta);
  // Game first, optional personal records after the actions.
  card.append(trialHeading,descriptionEl,board,status,actions,switcher,recordsEl);
  $('#games').append(card);
  mini.push({card,board,status,actions,reward:d.reward,rewardEl,masteryEl,recordsEl,descriptionEl,mode:state.difficulty,ended:false});
});
function renderTrialMastery(){
  const stats=sanitizedTrialStats(state.trialStats);
  mini.forEach((g,index)=>{
    const entry=stats[index],level=masteryLevel(entry.wins);
    g.descriptionEl.textContent=trialObjective(index,g.mode);
    g.masteryEl.textContent='✧ '+level.title+(entry.wins?' · '+entry.wins+' victoire'+(entry.wins>1?'s':''):'');
    g.masteryEl.setAttribute('aria-label','Maîtrise de '+definitions[index].name+' : '+level.title+
      ', '+entry.wins+' victoires, meilleur score '+entry.bestScore+' sur 100');
    const record=sanitizedTrialRecords(state.trialRecords)[index];
    const current=record[g.mode];
    $('.trial-records-current',g.recordsEl).textContent=current.wins?
      current.bestScore+'/100':'—';
    const body=$('tbody',g.recordsEl);
    body.replaceChildren();
    TRIAL_RECORD_MODES.forEach(mode=>{
      const best=record[mode],row=el('tr',mode===g.mode?'is-current':'');
      const label=DIFFICULTIES.find(d=>d.id===mode).label;
      row.append(el('th','',label),
        el('td','',String(best.wins)),
        el('td','',best.bestScore===null?'—':best.bestScore+'/100'),
        el('td','',recordMetricLabel(index,best.bestMetric)));
      body.append(row);
    });
    const medals=trialChallengesFor(index,entry,record);
    const medalCount=medals.filter(item=>item.earned).length;
    $('.trial-challenges-summary',g.recordsEl).textContent='✦ '+medalCount+'/3';
    const challengeList=$('.trial-challenges-list',g.recordsEl);
    challengeList.replaceChildren();
    for(const medal of medals){
      const line=el('div','trial-challenge'+(medal.earned?' is-earned':''));
      line.dataset.grade=medal.id;
      line.setAttribute('aria-label',medal.name+' · '+medal.description+
        ' · '+(medal.earned?'obtenue':'à débloquer'));
      const sign=el('span','trial-challenge-medal',medal.earned?'✦':'◇');
      sign.setAttribute('aria-hidden','true');
      line.append(sign,el('strong','trial-challenge-name',medal.name),
        el('span','trial-challenge-goal',medal.description),
        el('span','trial-challenge-status',medal.earned?'✓':'—'));
      challengeList.append(line);
    }
    const metric=TRIAL_RECORD_METRICS[index];
    g.recordsEl.setAttribute('aria-label','Carnet des records de '+definitions[index].name+
      ' · '+metric.label+' · '+current.wins+' victoires dans la difficulté actuelle');
    const levelMode=DIFFICULTIES.find(d=>d.id===g.mode)||DIFFICULTIES[1];
    const low=trialReward(g.reward,g.mode,0),high=trialReward(g.reward,g.mode,100);
    g.rewardEl.textContent='♛ '+low+(high>low?'–'+high:'')+' Couronnes';
    g.rewardEl.title='Mode '+levelMode.label+' · '+low+' Couronnes par victoire'+(high>low?' · +5 si score ≥ 90/100':'');
    g.rewardEl.setAttribute('aria-label',g.rewardEl.title);
  });
}
function complete(i,description,performance={}){
  const g=mini[i];if(g.ended)return;
  g.ended=true;
  const score=trialScore(i,performance);
  const earned=trialReward(g.reward,g.mode,score);
  state.trialStats=recordTrialWin(state.trialStats,i,g.mode,score);
  state.trialRecords=recordPersonalBest(state.trialRecords,i,g.mode,score,performance);
  const expeditionResult=state.expedition?.route?
    expeditionVictory(state.expedition,i,g.mode):{advanced:false};
  let finaleAward=null;
  if(expeditionResult.advanced){
    state.expedition=expeditionResult.state;
    if(expeditionResult.finished&&state.expedition.route==='dernier-accord'){
      finaleAward=awardFinaleCard(state,expeditionResult);
      if(finaleAward.normal)state.recentFinds=recordRecentFind(state.recentFinds,72,'new');
      if(finaleAward.chromatic)state.recentFinds=recordRecentFind(state.recentFinds,72,'chromatic');
    }
  }
  g.status.textContent='✓ '+description+' · '+score+'/100 · +'+earned+' Couronnes';
  grant(earned); // Persists the completed act and the Signature in the same save.
  if(!expeditionResult.advanced)recordCircuitVictory(i,g.mode,score,g);
  if(finaleAward?.chromatic)notify('✧ Cœur des Marches Chromatique obtenu !');
  else if(finaleAward?.normal)notify('✦ Cœur des Marches rejoint ton Codex !');
  renderTrialMastery();
  if(expeditionResult.advanced){
    renderExpedition();
    // The victory belongs to the original mini-game; the player chooses
    // when to return to the story instead of losing the result screen.
    g.actions?.append(button('✧ Suite de l’expédition',()=>navigate('expeditions'),
      'secondary expedition-return'));
  }
}
const runeNames=['Soleil','Lune','Constellations','Œil','Spirale','Arbre','Rose des vents','Étoiles','Montagne','Vagues','Sablier','Flamme'];
let previousRuneRitual=null;
function startRunes(){
  const g=mini[0];
  g.ended=false;g.mode=state.difficulty;
  const ritual=nextRuneRitual(g.mode,previousRuneRitual);
  previousRuneRitual=ritual.id;
  const blind=g.mode==='maitrise';
  const maxErrors=trialRules(0,g.mode).maxErrors;
  g.card.classList.add('rune-trial');
  g.board.classList.add('rune-board');
  g.status.classList.add('rune-statusline');
  g.status.classList.remove('is-complete','is-failed');
  let step=0,next=runeExpectedAt(ritual,0),errors=0;
  let hud=g.card.querySelector('.rune-hud');
  if(!hud){
    hud=el('div','rune-hud');
    const left=el('div','rune-goal');
    left.append(el('span','', 'Rune suivante : '),el('strong','rune-target'));
    hud.append(left,el('span','rune-faults'));
    const meter=el('div','rune-meter');
    meter.setAttribute('aria-hidden','true');
    for(let index=0;index<12;index++)meter.append(el('span'));
    const banner=el('div','rune-ritual');
    banner.append(el('span','rune-ritual-glyph','✧'),
      el('div','rune-ritual-copy'));
    $('.rune-ritual-copy',banner).append(el('strong','rune-ritual-name'),
      el('span','rune-ritual-rule'));
    g.board.before(banner,hud,meter);
  }
  const ritualBanner=g.card.querySelector('.rune-ritual');
  $('.rune-ritual-name',ritualBanner).textContent=ritual.title;
  $('.rune-ritual-rule',ritualBanner).textContent=ritual.rule;
  const meter=g.card.querySelector('.rune-meter');
  const updateHud=()=>{
    $('.rune-target',hud).textContent=step===12?'12 / 12 ✓':
      blind?'Étape '+String(step+1).padStart(2,'0')+' / 12':
      String(next).padStart(2,'0')+' / 12';
    $('.rune-faults',hud).textContent='Erreurs : '+errors+' / '+maxErrors;
    [...meter.children].forEach((node,i)=>node.classList.toggle('filled',i<step));
  };
  g.board.replaceChildren();
  g.board.style.setProperty('--cols',4);
  const order=shuffle(Array.from({length:12},(_,i)=>i+1));
  for(const value of order){
    const b=button('',()=>{},'tile rune-tile');
    b.setAttribute('aria-label','Rune '+value+' sur 12 : '+runeNames[value-1]);
    b.setAttribute('title','Rune '+value+' · '+runeNames[value-1]);
    b.style.setProperty('--rune-x',((value-1)%4/3*100)+'%');
    b.style.setProperty('--rune-y',(Math.floor((value-1)/4)/2*100)+'%');
    const art=el('span','rune-art');
    art.setAttribute('aria-hidden','true');
    b.append(art,el('span','rune-number',String(value).padStart(2,'0')));
    b.addEventListener('click',()=>{
      if(g.ended||b.disabled)return;
      if(value===next){
        b.disabled=true;
        b.classList.add('done');
        step++;
        next=runeExpectedAt(ritual,step);
        updateHud();
        if(step===12){
          g.status.classList.add('is-complete');
          complete(0,'Sceau restauré ! Les douze runes brillent de nouveau.',{errors});
        }else g.status.textContent=blind?
          'Rune '+value+' activée · poursuis le rituel.':
          'Rune '+value+' activée · cherche la '+next+'.';
      }else{
        errors++;
        b.classList.remove('wrong');
        void b.offsetWidth;
        b.classList.add('wrong');
        setTimeout(()=>b.classList.remove('wrong'),360);
        updateHud();
        if(errors>=maxErrors){
          g.ended=true;
          g.status.classList.add('is-failed');
          g.status.textContent='Le sceau s’est brisé. Relance une grille pour réessayer.';
        }else g.status.textContent=blind?
          'La rune ne répond pas · '+errors+'/'+maxErrors+' erreurs.':
          'Ce n’est pas la rune '+next+' · '+errors+'/'+maxErrors+' erreurs.';
      }
    });
    g.board.append(b);
  }
  updateHud();
  g.status.textContent=blind?
    'Observe la règle du rituel : le prochain numéro n’est pas indiqué en Maîtrise.':
    'Observe le rituel et suis l’ordre indiqué pour réveiller les pierres.';
  g.actions.replaceChildren(button('✧ Nouvelle grille',startRunes));
}
const memoryRunes=[
  {id:'sun',label:'Soleil',sprite:1},
  {id:'moon',label:'Lune',sprite:2},
  {id:'stars',label:'Constellations',sprite:3},
  {id:'eye',label:'Œil ancien',sprite:4},
  {id:'spiral',label:'Spirale',sprite:5},
  {id:'tree',label:'Arbre-mémoire',sprite:6},
  {id:'compass',label:'Rose des vents',sprite:7},
  {id:'flare',label:'Étoiles jumelles',sprite:8}
];

let memorySession=0;
let memoryTurnTimer=null;
let previousMemoryRitual=null;
function startMemory(){
  const g=mini[1];
  g.mode=state.difficulty;
  const maxMoves=trialRules(1,g.mode).maxMoves;
  const ritual=nextMemoryRitual(g.mode,previousMemoryRitual);
  previousMemoryRitual=ritual.id;
  const session=++memorySession;
  if(memoryTurnTimer!==null){clearTimeout(memoryTurnTimer);memoryTurnTimer=null;}
  g.ended=false;
  g.card.classList.add('memory-trial');
  g.board.classList.add('memory-board');
  g.status.classList.add('memory-statusline');
  g.status.classList.remove('is-complete','is-failed');

  let first=null, second=null, lock=false, moves=0, matches=0, mistakes=0;

  let hud=g.card.querySelector('.memory-hud');
  if(!hud){
    hud=el('div','memory-hud');
    const stats=el('div','memory-stats');
    stats.append(
      el('span','memory-label','Paires : '),
      el('strong','memory-pairs','0 / 8'),
      el('span','memory-gap',' · '),
      el('span','memory-label','Coups : '),
      el('strong','memory-moves','0')
    );
    const faults=el('span','memory-faults','Erreurs : 0');
    hud.append(stats,faults);
    const meter=el('div','memory-meter');
    meter.setAttribute('aria-hidden','true');
    for(let i=0;i<8;i++)meter.append(el('span'));
    const banner=el('div','memory-ritual');
    banner.append(el('span','memory-ritual-glyph','✦'));
    const copy=el('div','memory-ritual-copy');
    copy.append(el('strong','memory-ritual-title'),el('span','memory-ritual-rule'));
    banner.append(copy);
    const fresco=el('section','memory-fresco');
    fresco.setAttribute('aria-label','Fresque ancienne : 0 fragment sur 8 retrouvé');
    const frescoHeading=el('div','memory-fresco-header');
    frescoHeading.append(el('strong','memory-fresco-title','La Fresque oubliée'),
      el('span','memory-fresco-count','0 / 8 fragments'));
    const frescoGrid=el('div','memory-fresco-grid');
    frescoGrid.setAttribute('aria-hidden','true');
    for(let i=0;i<8;i++)frescoGrid.append(el('span','memory-fresco-piece'));
    fresco.append(frescoHeading,frescoGrid);
    g.board.before(banner,hud,meter,fresco);
  }
  $('.memory-ritual-title',g.card).textContent=ritual.title;
  $('.memory-ritual-rule',g.card).textContent=ritual.rule;
  const fresco=g.card.querySelector('.memory-fresco');
  const frescoPieces=Array.from(fresco.querySelectorAll('.memory-fresco-piece'));
  fresco.classList.remove('is-restored');
  frescoPieces.forEach(piece=>piece.classList.remove('is-revealed'));
  $('.memory-fresco-count',fresco).textContent='0 / 8 fragments';
  fresco.setAttribute('aria-label','Fresque ancienne : 0 fragment sur 8 retrouvé');
  const meter=g.card.querySelector('.memory-meter');
  const updateHud=()=>{
    $('.memory-pairs',hud).textContent=`${matches} / 8`;
    $('.memory-moves',hud).textContent=String(moves)+(maxMoves===null?'':' / '+maxMoves);
    $('.memory-faults',hud).textContent=`Erreurs : ${mistakes}`;
    [...meter.children].forEach((node,i)=>node.classList.toggle('filled',i<matches));
    frescoPieces.forEach((piece,i)=>piece.classList.toggle('is-revealed',i<matches));
    fresco.classList.toggle('is-restored',matches===8);
    $('.memory-fresco-count',fresco).textContent=matches===8?
      'Fresque restaurée · 8 / 8':matches+' / 8 fragments';
    fresco.setAttribute('aria-label','Fresque ancienne : '+matches+' fragment'+
      (matches>1?'s':'')+' sur 8 retrouvé'+(matches>1?'s':''));
  };

  const tiles=buildMemoryDeck(memoryRunes,ritual,shuffle);

  const reveal=(button)=>{
    button.disabled=true;
    button.classList.add('is-revealed');
    button.setAttribute('aria-pressed','true');
    button.setAttribute('aria-label',button.dataset.label+' — révélée');
  };
  const conceal=(button)=>{
    button.disabled=false;
    button.classList.remove('is-revealed');
    button.setAttribute('aria-pressed','false');
    button.setAttribute('aria-label',button.dataset.hiddenLabel);
  };
  const markMatched=(a,b)=>{
    a.classList.add('is-matched');
    b.classList.add('is-matched');
    a.setAttribute('aria-label',a.dataset.label+' — paire trouvée');
    b.setAttribute('aria-label',b.dataset.label+' — paire trouvée');
  };

  g.board.replaceChildren();
  g.board.style.setProperty('--cols',4);
  g.board.setAttribute('role','group');
  g.board.setAttribute('aria-label','Table de mémoire : seize tablettes runiques à associer en huit paires');

  tiles.forEach((item,index)=>{
    const buttonTile=el('button','tile memory-tile');
    buttonTile.type='button';
    buttonTile.dataset.id=item.id;
    buttonTile.dataset.label=item.label;
    buttonTile.dataset.sprite=String(item.sprite);
    buttonTile.dataset.hiddenLabel=`Tuile mémoire ${index+1} : face cachée`;
    buttonTile.setAttribute('aria-label',buttonTile.dataset.hiddenLabel);
    buttonTile.setAttribute('aria-pressed','false');
    buttonTile.style.setProperty('--sprite-x',((item.sprite-1)%4/3*100)+'%');
    buttonTile.style.setProperty('--sprite-y',(Math.floor((item.sprite-1)/4)/2*100)+'%');

    const shell=el('span','memory-shell');
    const back=el('span','memory-face memory-back');
    back.append(el('span','memory-back-glyph','✧'));
    const front=el('span','memory-face memory-front');
    front.append(el('span','memory-front-art'));
    shell.append(back,front);
    buttonTile.append(shell);

    buttonTile.addEventListener('click',()=>{
      if(g.ended||lock||buttonTile.classList.contains('is-revealed')||buttonTile.classList.contains('is-matched'))return;
      reveal(buttonTile);

      if(!first){
        first=buttonTile;
        g.status.textContent='Choisis une seconde tablette pour retrouver le symbole.';
        return;
      }

      second=buttonTile;
      lock=true;
      moves++;
      updateHud();

      if(first.dataset.id===second.dataset.id){
        markMatched(first,second);
        matches++;
        g.status.textContent=`Paire trouvée : ${first.dataset.label}.`;
        first=null; second=null; lock=false;
        updateHud();

        if(matches===8){
          g.status.classList.add('is-complete');
          complete(1,'La Mémoire ancienne est restaurée ! Les huit paires scintillent de nouveau.',{moves,errors:mistakes});
        }
      }else{
        mistakes++;
        g.status.textContent='Les deux reliques ne résonnent pas ensemble.';
        g.card.querySelector('.memory-faults').textContent=`Erreurs : ${mistakes}`;
        const pair=[first,second];
        pair.forEach(tile=>tile.classList.add('is-wrong'));
        memoryTurnTimer=setTimeout(()=>{
          memoryTurnTimer=null;
          if(session!==memorySession||g.ended)return;
          pair.forEach(tile=>{tile.classList.remove('is-wrong');conceal(tile)});
          first=null;second=null;lock=false;
          g.status.textContent='Observe bien les symboles et retrouve leurs paires.';
        },560);
      }
      if(maxMoves!==null&&moves>=maxMoves&&!g.ended){
        g.ended=true;
        g.status.classList.add('is-failed');
        g.status.textContent='Limite de '+maxMoves+' coups atteinte. Lance une nouvelle table pour réessayer.';
      }
    });

    g.board.append(buttonTile);
  });

  updateHud();
  g.status.textContent='Retrouve les huit paires pour reconstituer la fresque.'+
    (maxMoves===null?'':' Objectif Maîtrise : '+maxMoves+' coups maximum.');
  g.actions.replaceChildren(button('✧ Nouvelle table',startMemory));
  if(ritual.previewMs){
    // The opening glimpse is non-interactive. Restart or difficulty changes
    // cancel its timeout and invalidate it by session ID.
    lock=true;
    g.board.classList.add('is-previewing');
    g.status.textContent='Souffle du passé : observe les seize symboles avant que le voile retombe.';
    memoryTurnTimer=setTimeout(()=>{
      memoryTurnTimer=null;
      if(session!==memorySession||g.ended)return;
      g.board.classList.remove('is-previewing');
      lock=false;
      g.status.textContent='Le voile est retombé. Retrouve les huit paires de mémoire.';
    },ritual.previewMs);
  }else g.board.classList.remove('is-previewing');
}

/* Serrure d'Éther — a three-crystal sum lock with authentic illustrated sprites. */
function startLock(){
  const g=mini[2];
  g.ended=false;g.mode=state.difficulty;
  g.card.classList.add('lock-trial');
  g.board.classList.add('ether-lock-board');
  g.status.classList.add('ether-lock-status');
  g.status.classList.remove('is-complete','is-failed');

  // Each public sum + rule uniquely identifies one possible trio.
  // Feedback is informative rather than an arbitrary trial-and-error trap.
  const puzzle=makeEtherPuzzle(g.mode);
  const target=puzzle.target;
  const numbers=puzzle.values;
  let selected=[],tries=0;
  const totalAttempts=trialRules(2,g.mode).maxAttempts;

  let hud=g.card.querySelector('.ether-lock-hud');
  if(!hud){
    hud=el('div','ether-lock-hud');
    const dial=el('div','ether-lock-dial');
    dial.setAttribute('aria-hidden','true');
    const readout=el('div','ether-lock-readout');
    const label=el('span','ether-label','OBJECTIF DU SCEAU');
    const objective=el('strong','ether-target');
    const counters=el('div','ether-counters');
    counters.append(el('span','ether-sum'),el('span','ether-attempts'));
    const slots=el('div','ether-slots');
    slots.setAttribute('aria-label','Trois emplacements pour les cristaux sélectionnés');
    for(let i=0;i<3;i++)slots.append(el('span','ether-slot','◇'));
    readout.append(label,objective,counters,slots);
    hud.append(dial,readout);
    const briefing=el('div','ether-lock-rule');
    briefing.append(el('strong','ether-lock-rule-title','✧ Règle du sceau'),
      el('span','ether-lock-rule-text'));
    g.board.before(hud,briefing);
  }
  const dial=$('.ether-lock-dial',hud);
  dial.classList.remove('is-open','is-broken','is-warning');
  $('.ether-lock-rule-text',g.card).textContent=etherRule(puzzle);
  const targetEl=$('.ether-target',hud);
  targetEl.textContent=String(target);
  const sumEl=$('.ether-sum',hud);
  const attemptsEl=$('.ether-attempts',hud);
  const slots=$$('.ether-slot',hud);

  let validateButton;
  const updateHud=()=>{
    const sum=selected.reduce((n,i)=>n+numbers[i],0);
    sumEl.textContent='Somme : '+sum+' / '+target;
    attemptsEl.textContent='Essais : '+(totalAttempts-tries)+' / '+totalAttempts;
    slots.forEach((slot,i)=>{
      const filled=i<selected.length;
      slot.classList.toggle('filled',filled);
      slot.textContent=filled?String(numbers[selected[i]]):'◇';
    });
    if(validateButton)validateButton.disabled=g.ended||selected.length!==3;
  };
  const updateChoice=(index,element)=>{
    if(g.ended)return;
    dial.classList.remove('is-warning');
    const existing=selected.indexOf(index);
    if(existing!==-1){
      selected.splice(existing,1);
      element.classList.remove('selected');
      element.setAttribute('aria-pressed','false');
    }else if(selected.length<3){
      selected.push(index);
      element.classList.add('selected');
      element.setAttribute('aria-pressed','true');
    }else{
      g.status.textContent='Trois cristaux maximum : retire une pierre pour en choisir une autre.';
      return;
    }
    updateHud();
    g.status.textContent=selected.length===3
      ?'Trois cristaux prêts : active le mécanisme.'
      :'Choisis '+(3-selected.length)+' cristal'+(3-selected.length>1?'s':'')+' supplémentaire'+(3-selected.length>1?'s':'')+'.';
  };

  g.board.replaceChildren();
  g.board.setAttribute('role','group');
  g.board.setAttribute('aria-label','Six cristaux numérotés, choisis-en trois pour atteindre le nombre cible');
  g.board.style.setProperty('--cols',3);
  const crystalTypes=['Azur','Améthyste','Ambre','Émeraude','Givre','Prisme'];
  numbers.forEach((value,index)=>{
    const crystal=el('button','tile ether-crystal');
    crystal.type='button';
    crystal.setAttribute('aria-pressed','false');
    crystal.setAttribute('aria-label','Cristal '+crystalTypes[index]+' de valeur '+value);
    crystal.style.setProperty('--ether-x',((index+1)%3/2*100)+'%');
    crystal.style.setProperty('--ether-y',(Math.floor((index+1)/3)/2*100)+'%');
    const artwork=el('span','ether-crystal-art');
    artwork.setAttribute('aria-hidden','true');
    const number=el('span','ether-crystal-value',String(value));
    number.setAttribute('aria-hidden','true');
    crystal.append(artwork,number);
    crystal.addEventListener('click',()=>updateChoice(index,crystal));
    g.board.append(crystal);
  });

  validateButton=button('✦ Activer le sceau',()=>{
    if(g.ended||selected.length!==3)return;
    const result=evaluateEtherAttempt(puzzle,selected);
    if(!result)return;
    if(result.won){
      dial.classList.add('is-open');
      g.card.classList.add('lock-solved');
      g.status.classList.add('is-complete');
      validateButton.disabled=true;
      complete(2,'Serrure d’Éther ouverte ! Les trois cristaux sont alignés.',{attempts:tries});
      return;
    }
    tries++;
    selected=[];
    $$('.ether-crystal',g.board).forEach(crystal=>{
      crystal.classList.remove('selected');
      crystal.setAttribute('aria-pressed','false');
    });
    if(tries>=totalAttempts){
      g.ended=true;
      g.status.classList.add('is-failed');
      dial.classList.remove('is-warning');
      dial.classList.add('is-broken');
      g.status.textContent=etherAttemptFeedback(puzzle,result)+
        ' Le mécanisme s’est figé. Relance une nouvelle serrure.';
    }else{
      dial.classList.remove('is-warning');
      void dial.offsetWidth;
      dial.classList.add('is-warning');
      g.status.textContent=etherAttemptFeedback(puzzle,result)+
        ' Encore '+(totalAttempts-tries)+' essai'+(totalAttempts-tries>1?'s':'')+'.';
    }
    updateHud();
  },'primary');
  g.actions.replaceChildren(validateButton,button('Nouveau mécanisme',()=>{g.card.classList.remove('lock-solved');startLock()}));
  g.card.classList.remove('lock-solved');
  updateHud();
  g.status.textContent=g.mode==='initiation'
    ?'Choisis trois cristaux pour atteindre la somme indiquée.'
    :'Trouve les trois cristaux qui satisfont la somme ET la règle du sceau.';
}

/* Fouilles interdites: three archaeological sites, always 25 tiles and five traps. */
let previousExcavationSite=null;
function startMines(){
  const g=mini[3];
  g.ended=false;g.mode=state.difficulty;
  const safeTarget=trialRules(3,g.mode).safeTarget;
  g.card.classList.add('excavation-trial');
  g.board.classList.add('excavation-board');
  g.status.classList.add('excavation-status');
  g.status.classList.remove('is-complete','is-failed');

  const site=makeExcavationSite(previousExcavationSite);
  previousExcavationSite=site.id;
  g.card.dataset.excavationSite=site.id;
  const bombs=site.bombs;
  const countNearby=i=>site.numbers[i];
  const dug=new Set();
  let safe=0,sondes=0;
  let guidedIndex=null;
  const setArtwork=(tile,index)=>{
    tile.style.setProperty('--exc-x',((index%3)/2*100)+'%');
    tile.style.setProperty('--exc-y',(Math.floor(index/3)/2*100)+'%');
  };

  let hud=g.card.querySelector('.excavation-hud');
  if(!hud){
    hud=el('div','excavation-hud');
    const relic=el('div','excavation-relic');
    relic.setAttribute('aria-hidden','true');
    const stats=el('div','excavation-stats');
    stats.append(
      el('span','excavation-kicker','FOUILLES DES ARCHIVES'),
      el('div','excavation-counter'),
      el('span','excavation-danger','5 pièges dissimulés')
    );
    hud.append(relic,stats);
    const sitePanel=el('div','excavation-site-panel');
    sitePanel.append(el('span','excavation-site-kicker','✧ CARNET DE FOUILLES'),
      el('strong','excavation-site-name'),
      el('p','excavation-site-description'),
      el('span','excavation-artifact-note'));
    g.board.before(sitePanel,hud);
  }
  const sitePanel=$('.excavation-site-panel',g.card);
  $('.excavation-site-name',sitePanel).textContent=site.title;
  $('.excavation-site-description',sitePanel).textContent=site.description;
  const artifactNote=$('.excavation-artifact-note',sitePanel);
  artifactNote.textContent='◇ Vestige facultatif à découvrir · sans bonus de Couronnes';
  const relic=$('.excavation-relic',hud);
  relic.classList.remove('is-victorious','is-failed');
  const updateHud=()=>{
    $('.excavation-counter',hud).textContent=safe+' / '+safeTarget+' cases sûres';
    $('.excavation-danger',hud).textContent=g.ended
      ?(safe===safeTarget?'Fouille accomplie':'Piège déclenché'):'5 pièges dissimulés';
  };

  g.board.replaceChildren();
  g.board.style.setProperty('--cols',5);
  g.board.setAttribute('role','group');
  g.board.setAttribute('aria-label','Site de fouilles : vingt-cinq dalles, cinq pièges dissimulés');
  const tiles=[];
  const clearGuide=()=>{
    if(guidedIndex===null)return;
    const old=tiles[guidedIndex];
    if(old&&!old.disabled){
      old.classList.remove('is-guided');
      old.setAttribute('aria-label','Fouiller la dalle '+(guidedIndex+1));
    }
    guidedIndex=null;
  };
  const markGuide=(hint)=>{
    clearGuide();
    if(!hint||g.ended)return;
    guidedIndex=hint.index;
    const tile=tiles[guidedIndex];
    tile.classList.add('is-guided');
    tile.setAttribute('aria-label','Dalle '+(guidedIndex+1)+' : passage sûr repéré par la sonde');
    g.status.textContent=hint.deduction
      ?'Les dalles déjà observées indiquent un passage sûr. Suis la lueur turquoise.'
      :'La sonde a repéré un passage sûr. Suis la lueur turquoise.';
  };
  for(let i=0;i<25;i++){
    const tile=el('button','tile excavation-tile');
    tile.type='button';
    tile.setAttribute('aria-label','Fouiller la dalle '+(i+1));
    tile.setAttribute('title','Dalle '+(i+1));
    setArtwork(tile,0);
    const sprite=el('span','excavation-art');
    sprite.setAttribute('aria-hidden','true');
    tile.append(sprite);
    tile.addEventListener('click',()=>{
      if(g.ended||tile.disabled)return;
      clearGuide();
      dug.add(i);
      tile.disabled=true;
      tile.classList.add('is-dug');
      if(bombs.has(i)){
        g.ended=true;
        relic.classList.add('is-failed');
        g.status.classList.add('is-failed');
        // After a failure reveal the hidden traps, but do not alter prior discoveries.
        for(const position of bombs){
          const dangerTile=tiles[position];
          dangerTile.disabled=true;
          dangerTile.classList.add('is-trap');
          if(position===i)dangerTile.classList.add('is-triggered');
          setArtwork(dangerTile,3);
          dangerTile.setAttribute('aria-label','Dalle '+(position+1)+' : piège runique');
        }
        tiles.forEach(b=>b.disabled=true);
        if(sondeButton)sondeButton.disabled=true;
        updateHud();
        g.status.textContent='Une rune corrompue s’est éveillée. Les cinq pièges sont révélés : recommence une fouille.';
        return;
      }
      const adjacent=countNearby(i);
      // Empty sites occasionally display a glowing discovery; numbered clues remain crystal-clear.
      const discoveries=[1,2,4,5,6];
      setArtwork(tile,adjacent===0?discoveries[(i*7)%discoveries.length]:1);
      tile.classList.add('is-safe');
      tile.setAttribute('aria-label','Dalle '+(i+1)+' fouillée : '+(adjacent?adjacent+' piège'+(adjacent>1?'s':'')+' voisin'+(adjacent>1?'s':''):'aucun piège voisin'));
      if(adjacent){
        const clue=el('span','excavation-clue',String(adjacent));
        clue.setAttribute('aria-hidden','true');
        tile.append(clue);
      }
      if(i===site.artifactIndex){
        tile.classList.add('is-artifact');
        const mark=el('span','excavation-artifact-mark','✧');
        mark.setAttribute('aria-hidden','true');
        tile.append(mark);
        artifactNote.textContent='✧ Vestige retrouvé : '+site.artifact;
        tile.setAttribute('aria-label',tile.getAttribute('aria-label')+' · vestige retrouvé');
      }
      safe++;
      updateHud();
      if(safe===safeTarget){
        relic.classList.add('is-victorious');
        g.status.classList.add('is-complete');
        tiles.forEach(b=>b.disabled=true);
        if(sondeButton)sondeButton.disabled=true;
        complete(3,'Fouille accomplie ! '+safeTarget+' dalles sûres ont été explorées.',{hints:sondes});
      }else g.status.textContent='Dalle '+(i+1)+' : '+(adjacent?adjacent+' piège(s) voisin(s).':'aucun piège adjacent.')+' Continue la fouille.';
    });
    g.board.append(tile);
    tiles.push(tile);
  }
  updateHud();
  let sondeButton=button('✧ Sonder un passage',()=>{
    if(g.ended)return;
    const hint=chooseExcavationGuide(site,dug);
    if(hint){sondes++;markGuide(hint)}
    else g.status.textContent='Tous les passages sûrs ont été explorés.';
  });
  sondeButton.title='Repère une dalle sûre · chaque sonde retire 10 points au score, jamais de Couronnes au gain de base.';
  sondeButton.setAttribute('aria-label','Sonder un passage sûr : moins 10 points au score');
  g.actions.replaceChildren(sondeButton,button('✧ Nouvelle fouille',startMines));
  markGuide({index:site.entrance,deduction:false});
}

const ingredients=[['☘','Mousse'],['☀','Soleil'],['◈','Cristal'],['☾','Lune'],['✿','Fleur'],['❄','Givre']];
const recipes=[
['Élixir de Vie',[0,4]],['Sérum solaire',[1,2]],['Souffle lunaire',[3,5]],['Sève d’Aurore',[0,1]],['Nectar cristallin',[2,4]],
['Rosée de Cristal',[0,2]],['Floraison Solaire',[1,4]],['Givre de Verre',[2,5]],['Brume des Racines',[0,3]],['Braise d’Hiver',[1,5]],['Éclipse Florale',[3,4]],['Pétales de Givre',[4,5]],
['Couronne des Trois Saisons',[0,1,5]],['Essence du Verre',[0,2,5]],['Sceau de l’Équinoxe',[1,3,4]],['Sève des Constellations',[0,1,2]],['Prisme du Crépuscule',[2,3,4]],['Aube des Ronces',[0,3,5]],['Couronne du Solstice',[1,4,5]],['Rituel des Trois Astres',[1,2,3]]
];
/* Laboratoire arcanique: three recipes, two ingredients each, three mistakes maximum.
   HD sprites are presentation only; the five original recipes and reward are retained. */
let alchemySession=0;
let alchemyTimer=null;
function startAlchemy(){
  const g=mini[4];
  g.mode=state.difficulty;
  const maxErrors=trialRules(4,g.mode).maxErrors;
  const session=++alchemySession;
  if(alchemyTimer!==null){clearTimeout(alchemyTimer);alchemyTimer=null}
  g.ended=false;
  g.card.classList.add('alchemy-trial');
  g.board.classList.add('alchemy-board');
  g.status.classList.add('alchemy-status');
  g.status.classList.remove('is-complete','is-failed');
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const requiredIngredients=g.mode==='maitrise'?3:2;
  const selectedRecipes=selectAlchemyRecipes(recipes,requiredIngredients,state.alchemyKnown,shuffle);
  let round=0,errors=0,selected=[],busy=false;

  let hud=g.card.querySelector('.alchemy-hud');
  if(!hud){
    hud=el('div','alchemy-hud');
    const cauldron=el('div','alchemy-cauldron');
    cauldron.setAttribute('aria-hidden','true');
    const panel=el('div','alchemy-recipe');
    panel.append(
      el('span','alchemy-kicker','GRIMOIRE DES ARCHIVES'),
      el('strong','alchemy-name'),
      el('div','alchemy-counters'),
      el('div','alchemy-slots')
    );
    const counters=$('.alchemy-counters',panel);
    counters.append(el('span','alchemy-round'),el('span','alchemy-errors'));
    const slots=$('.alchemy-slots',panel);
    slots.setAttribute('aria-label','Emplacements pour les ingrédients sélectionnés');
    for(let i=0;i<3;i++)slots.append(el('span','alchemy-slot','◇'));
    hud.append(cauldron,panel);
    const meter=el('div','alchemy-meter');
    meter.setAttribute('aria-hidden','true');
    for(let i=0;i<3;i++)meter.append(el('span'));
    const hint=el('div','alchemy-ritual');
    hint.append(el('span','alchemy-ritual-icon','✧'));
    const hintCopy=el('div','alchemy-ritual-copy');
    hintCopy.append(el('strong','alchemy-ritual-title'),el('span','alchemy-ritual-clue'));
    hint.append(hintCopy);
    const family=el('p','alchemy-family-legend',
      'Essences : Végétales — Mousse, Fleur · Astrales — Soleil, Lune · Minérales — Cristal, Givre');
    g.board.before(hud,meter,hint,family);
  }
  let grimoire=g.card.querySelector('.alchemy-grimoire');
  if(!grimoire){
    grimoire=el('details','alchemy-grimoire');
    const head=el('summary','alchemy-grimoire-head');
    head.append(el('span','alchemy-grimoire-symbol','✦'));
    const headText=el('span','alchemy-grimoire-heading');
    headText.append(el('strong','', 'Le Grimoire retrouvé'),el('small','alchemy-grimoire-count'));
    head.append(headText);
    grimoire.append(head,el('p','muted','Les formules encore inconnues sont proposées en priorité, selon la difficulté choisie.'),el('div','alchemy-grimoire-list'));
    g.actions.before(grimoire);
  }
  const renderGrimoire=()=>{
    const known=state.alchemyKnown||[];
    $('.alchemy-grimoire-count',grimoire).textContent=known.length+' / '+recipes.length+' formules retrouvées';
    const list=$('.alchemy-grimoire-list',grimoire);
    list.replaceChildren();
    recipes.forEach((recipe,index)=>{
      const advanced=recipe[1].length===3;
      if(index===0||index===12){
        list.append(el('div','alchemy-grimoire-section',
          advanced?'✦ FORMULES DU GRAND ŒUVRE · MAÎTRISE':'✧ FORMULES DES ARCHIVES · INITIATION ET AVENTURE'));
      }
      const discovered=known.includes(index);
      const entry=el('div','alchemy-grimoire-entry'+(discovered?' is-known':'')+(advanced?' is-advanced':''));
      const title=el('strong','alchemy-grimoire-recipe',
        discovered?'✧ '+recipe[0]:(advanced?'◇ Grand Œuvre scellé '+(index-11):'◇ Formule scellée '+(index+1)));
      const detail=el('span','alchemy-grimoire-detail',
        discovered?recipe[1].map(i=>ingredients[i][1]).join(' + '):
          (advanced?'Une alchimie à trois essences reste à découvrir.':'Réussis cette potion pour en conserver la formule.'));
      entry.append(title,detail);
      list.append(entry);
    });
  };
  renderGrimoire();
  const cauldron=$('.alchemy-cauldron',hud);
  const meter=g.card.querySelector('.alchemy-meter');
  const slots=$$('.alchemy-slot',hud);
  slots.forEach((slot,index)=>slot.hidden=index>=requiredIngredients);
  $('.alchemy-slots',hud).style.setProperty('--alchemy-slot-count',requiredIngredients);
  const ingredientNames=ingredients.map(item=>item[1]);
  const symbols=['Mousse','Soleil','Cristal','Lune','Fleur','Givre'];
  const ingredientButtons=[];
  let mixButton;

  const updateHud=()=>{
    const [name]=selectedRecipes[Math.min(round,2)];
    $('.alchemy-name',hud).textContent=name;
    $('.alchemy-round',hud).textContent='Potion '+Math.min(round+1,3)+' / 3';
    $('.alchemy-errors',hud).textContent='Erreurs '+errors+' / '+maxErrors;
    [...meter.children].forEach((node,i)=>node.classList.toggle('filled',i<round));
    slots.forEach((slot,i)=>{
      const filled=i<selected.length;
      slot.classList.toggle('filled',filled);
      slot.textContent=filled?ingredientNames[selected[i]]:'◇';
    });
    ingredientButtons.forEach((button,index)=>{
      const active=selected.includes(index);
      button.classList.toggle('selected',active);
      button.setAttribute('aria-pressed',String(active));
    });
    if(mixButton)mixButton.disabled=g.ended||busy||selected.length!==requiredIngredients;
  };

  g.board.replaceChildren();
  g.board.setAttribute('role','group');
  g.board.setAttribute('aria-label','Six ingrédients magiques : choisis '+requiredIngredients+' ingrédients pour chaque potion');
  g.board.style.setProperty('--cols',3);
  for(let i=0;i<ingredients.length;i++){
    const tile=el('button','tile alchemy-ingredient');
    tile.type='button';
    tile.setAttribute('aria-label','Sélectionner '+ingredientNames[i]+', sceau '+(i+1)+', essence '+ALCHEMY_ESSENCES[i]);
    tile.setAttribute('title',ingredientNames[i]+' · Sceau '+(i+1)+' · Essence '+ALCHEMY_ESSENCES[i]);
    tile.setAttribute('aria-pressed','false');
    tile.style.setProperty('--alchemy-x',((i%3)/2*100)+'%');
    tile.style.setProperty('--alchemy-y',(Math.floor(i/3)/2*100)+'%');
    const artwork=el('span','alchemy-art');
    artwork.setAttribute('aria-hidden','true');
    tile.append(artwork,el('span','alchemy-ingredient-name',symbols[i]),
      el('span','alchemy-seal-number',String(i+1)));
    tile.addEventListener('click',()=>{
      if(g.ended||busy)return;
      const prior=selected.indexOf(i);
      if(prior!==-1)selected.splice(prior,1);
      else if(selected.length<requiredIngredients)selected.push(i);
      else{
        g.status.textContent=requiredIngredients+' ingrédients maximum : retire une sélection pour la remplacer.';
        return;
      }
      updateHud();
      g.status.textContent=selected.length===requiredIngredients
        ?'Les essences sont prêtes : active le chaudron.'
        :'Sélectionne '+(requiredIngredients-selected.length)+' essence'+
          (requiredIngredients-selected.length>1?'s':'')+' supplémentaire'+
          (requiredIngredients-selected.length>1?'s':'')+'.';
    });
    ingredientButtons.push(tile);
    g.board.append(tile);
  }
  const showRecipe=()=>{
    if(g.ended)return;
    selected=[];busy=false;
    cauldron.classList.remove('is-success','is-error','is-brewing');
    g.status.classList.remove('is-complete','is-failed');
    updateHud();
    const clue=alchemyClue(g.mode,selectedRecipes[round],round+session);
    $('.alchemy-ritual-title',g.card).textContent=clue.title+' · '+ALCHEMY_MODES[clue.mode].title;
    $('.alchemy-ritual-clue',g.card).textContent=clue.detail;
    g.status.textContent=g.mode==='maitrise'?
      'Le Grand Œuvre exige trois essences : recoupe les indices pour trouver la seule combinaison juste.':
      'Déduis deux ingrédients grâce aux indices du sceau et conserve les formules dans ton grimoire.';
  };
  const mix=()=>{
    if(g.ended||busy||selected.length!==requiredIngredients)return;
    busy=true;
    updateHud();
    cauldron.classList.remove('is-success','is-error');
    cauldron.classList.add('is-brewing');
    g.status.textContent='Le mélange entre en résonance…';
    const choice=[...selected];
    const [name,required]=selectedRecipes[round];
    alchemyTimer=setTimeout(()=>{
      alchemyTimer=null;
      if(session!==alchemySession||g.ended)return;
      cauldron.classList.remove('is-brewing');
      const success=choice.every(i=>required.includes(i));
      if(success){
        const knownId=recipeIndex(recipes,name);
        const remembered=rememberAlchemyRecipe(state.alchemyKnown,knownId);
        if(remembered.length>state.alchemyKnown.length){
          state.alchemyKnown=remembered;
          save(); // Preserve discoveries immediately, even if this trial later fails.
          renderGrimoire();
        }
        round++;
        cauldron.classList.add('is-success');
        updateHud();
        if(round===3){
          g.status.classList.add('is-complete');
          ingredientButtons.forEach(button=>button.disabled=true);
          complete(4,'Alchimie maîtrisée ! Trois potions créées dans les Archives.',{errors});
          if(mixButton)mixButton.disabled=true;
          return;
        }
        g.status.textContent='✓ '+name+' réussie ! Retiens ce mélange pour la prochaine fois…';
      }else{
        errors++;
        cauldron.classList.add('is-error');
        updateHud();
        if(errors===maxErrors){
          g.ended=true;
          g.status.classList.add('is-failed');
          ingredientButtons.forEach(button=>button.disabled=true);
          g.status.textContent='Mélange instable : le laboratoire est scellé. Recommence une nouvelle session.';
          if(mixButton)mixButton.disabled=true;
          return;
        }
        g.status.textContent='Mélange instable : il reste '+(maxErrors-errors)+' erreur'+(maxErrors-errors>1?'s':'')+' possible'+(maxErrors-errors>1?'s':'')+'.';
      }
      alchemyTimer=setTimeout(()=>{
        alchemyTimer=null;
        if(session===alchemySession)showRecipe();
      },reduced?170:850);
    },reduced?30:570);
  };
  mixButton=button('✦ Mélanger',mix,'primary');
  g.actions.replaceChildren(mixButton,button('Nouvelle session',startAlchemy));
  showRecipe();
}

const trialStarters=[startRunes,startMemory,startLock,startMines,startAlchemy];
trialStarters.forEach(fn=>fn());
renderTrialMastery();
const picker=$('#game-picker');
let selectedGame=0;
const trialSubtitles=['Ordre & observation','Mémoire & association','Logique des cristaux','Exploration & prudence','Recettes & alchimie'];
definitions.forEach((entry,index)=>{
  const control=button('',()=>{selectGame(index);if(mobileView.matches||window.matchMedia('(max-height:520px) and (orientation:landscape)').matches)openTrial();},'game-choice');
  // Individual landscape artworks progressively replace the emblem atlas.
  // Until a given artwork is published, the original emblem remains visible.
  const artwork=['chemin-runique.webp','memoire-ancienne.webp','serrure-ether.webp','fouilles-interdites-768.webp','laboratoire-arcanique.webp'][index];
  if(artwork){
    const art=el('img','trial-choice-art');
    art.alt='';
    art.decoding='async';
    art.hidden=true;
    art.addEventListener('load',()=>{
      art.hidden=false;
      control.classList.add('has-trial-art');
    });
    art.addEventListener('error',()=>{
      art.hidden=true;
      control.classList.remove('has-trial-art');
    });
    const shade=el('span','trial-art-shade');
    shade.setAttribute('aria-hidden','true');
    control.append(art,shade);
    art.src='./assets/minigames/'+artwork;
  }
  control.append(el('span','game-choice-name',entry.name));
  control.setAttribute('aria-label','Choisir '+entry.name);
  control.setAttribute('aria-controls','trial-panel-'+index);
  control.setAttribute('aria-pressed',String(index===0));
  picker.append(control);
});
function setTrialView(view){
  const page=$('#page-jouer');
  page.dataset.trialView=view;
  $('.trial-subpage-back',page).hidden=view==='hub'||view==='circuits';
  window.scrollTo(0,0);
}
function refreshTrialPreview(){
  const g=mini[selectedGame];
  if(!g)return;
  $('#trial-preview-name').textContent='✧ '+definitions[selectedGame].name;
  $('#trial-preview-hint').textContent=trialSubtitles[selectedGame];
  $('#trial-preview-reward').textContent=g.rewardEl.textContent;
  $('#trial-preview-mastery').textContent=g.masteryEl.textContent;
  $('#trial-preview-objective').textContent=trialObjective(selectedGame,state.difficulty);
}
function openTrial(focus=false){
  setTrialView('play');
  if(focus)$('#trial-title-'+selectedGame)?.focus({preventScroll:true});
}
$('#trial-launch').addEventListener('click',()=>openTrial(true));
$('#trial-guide-shortcut').addEventListener('click',()=>{setTrialView('guide');$('#guide-title').focus({preventScroll:true})});
$('#trial-return').addEventListener('click',()=>{setTrialView('hub');picker.children[selectedGame]?.focus({preventScroll:true})});
$('#circuit-shortcut').addEventListener('click',showCircuits);
$('#circuit-hub-back').addEventListener('click',()=>{setTrialView('hub');$('#circuit-shortcut').focus({preventScroll:true})});
function selectGame(index,{jumpToStage=false,focusTrial=false}={}){
  if(index<0||index>=mini.length)return;
  if(mini[index].mode!==state.difficulty){trialStarters[index]();renderTrialMastery();}
  selectedGame=index;
  mini.forEach((item,i)=>item.card.classList.toggle('mobile-active',i===index));
  const choices=Array.from(picker.children);
  choices.forEach((b,i)=>{
    b.classList.toggle('active',i===index);
    b.setAttribute('aria-pressed',String(i===index));
  });
  // Keep the selected tile visible horizontally without scrolling the page back up.
  const selected=choices[index];
  if(picker.scrollWidth>picker.clientWidth+3){
    const delta=selected.getBoundingClientRect().left-picker.getBoundingClientRect().left;
    const left=picker.scrollLeft+delta-(picker.clientWidth-selected.clientWidth)/2;
    picker.scrollTo({left,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  refreshTrialPreview();
  if(jumpToStage){
    openTrial(focusTrial);
    const card=mini[index].card;
    if(focusTrial)$('#trial-title-'+index).focus({preventScroll:true});
    if(!mobileView.matches)card.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
}
selectGame(0);
setTrialView('hub');
const difficultyButtons=$$('#difficulty-options [data-difficulty]');
function renderDifficultyChoice(){
  for(const control of difficultyButtons){
    const active=control.dataset.difficulty===state.difficulty;
    control.classList.toggle('is-active',active);
    control.setAttribute('aria-pressed',String(active));
  }
  const mode=DIFFICULTIES.find(d=>d.id===state.difficulty);
  $('#difficulty-hint').textContent=mode.description;
  refreshTrialPreview();
}
difficultyButtons.forEach(control=>control.addEventListener('click',()=>{
  const next=validDifficulty(control.dataset.difficulty);
  if(next===state.difficulty)return;
  state.difficulty=next;
  trialStarters[selectedGame]();
  renderDifficultyChoice();
  renderTrialMastery();
  save();
  refreshTrialPreview();
  notify('Mode '+DIFFICULTIES.find(d=>d.id===next).label+' · épreuve relancée.');
}));
renderDifficultyChoice();
function showCircuits(){
  setTrialView('circuits');
  $('#circuit-view-title').focus({preventScroll:true});
}
function renderCircuits(){
  const root=$('#circuit-content');
  const v=circuitSession.view();
  const blocked=state.expedition?.armed===true;
  $('#circuit-summary').textContent=v?(v.finished?'Achevé · '+v.total+'/'+v.max:'Étape '+(v.step+1)+'/'+v.circuit.games.length):'3 circuits permanents';
  const reading=$('#circuit-reading-routes');
  reading.replaceChildren();
  for(const c of ARCANE_CIRCUITS){
    const detail=el('section','circuit-reading-route');
    detail.append(el('h3','',c.title),el('p','',c.description),
      el('p','',DIFFICULTIES.find(d=>d.id===c.mode).label+' · '+c.games.map(i=>definitions[i].name).join(' → ')));
    reading.append(detail);
  }
  root.replaceChildren();
  if(blocked)root.append(el('p','circuit-notice','Une étape d’expédition est engagée. Termine-la ou quitte le parcours avant de lancer une étape de circuit.'));
  if(!v){
    const lead=el('div','expedition-lead');
    const copy=el('div','expedition-lead-text');
    copy.append(el('span','expedition-kicker','LES CIRCUITS · MARCHES DE VERRE'),el('h3','expedition-title','Choisis ton circuit'));
    lead.append(copy);root.append(lead);
    const choices=el('div','expedition-choices circuit-route-choices');
    for(const c of ARCANE_CIRCUITS){
      const mode=DIFFICULTIES.find(d=>d.id===c.mode).label;
      const previous=circuitSession.best(c.id);
      const pick=button('',()=>{if(circuitSession.start(c.id)){renderCircuits();showCircuits()}},'expedition-choice circuit-route-choice');
      pick.dataset.circuit=c.id;
      const symbol=c.id==='lumieres'?'✧':c.id==='passeurs'?'◇':'✦';
      const text=el('span','expedition-choice-copy');
      text.append(el('strong','',c.title),el('small','',mode+' · '+c.games.length+' épreuves'+(previous===null?'':' · Record '+previous+'/300')));
      pick.append(el('span','expedition-choice-symbol',symbol),text,el('span','expedition-choice-status','›'));
      pick.setAttribute('aria-label',c.title+', '+mode+', '+c.games.length+' épreuves');
      choices.append(pick);
    }
    root.append(choices);
    return;
  }
  const lead=el('div','expedition-lead');
  const title=el('div','expedition-lead-text');
  title.append(el('span','expedition-kicker','CIRCUIT · '+DIFFICULTIES.find(d=>d.id===v.circuit.mode).label.toUpperCase()),el('h3','expedition-title',v.circuit.title));
  lead.append(title);root.append(lead);
  root.append(el('p','expedition-chapter',v.total+' / '+v.max+' points'+(v.best===null?'':' · Record : '+v.best+'/'+v.max)));
  const steps=el('ol','circuit-steps');
  v.circuit.games.forEach((game,index)=>{
    const row=el('li',index<v.step?'is-done':index===v.step?'is-current':'');
    row.append(el('span','expedition-progress-step circuit-step-number'+(index<v.step?' is-done':index===v.step?' is-now':''),index<v.step?'✓':String(index+1)),
      el('strong','',definitions[game].name),
      el('small','',index<v.step?v.scores[index]+'/100':index===v.step?'À jouer':'À venir'));
    steps.append(row);
  });
  root.append(steps);
  const actions=el('div','expedition-actions circuit-compact-actions');
  if(v.finished){
    root.append(el('p','circuit-result','✦ Circuit achevé ! '+v.total+' / '+v.max+' points. Record de cette session : '+v.best+' / '+v.max+'.'));
    actions.append(button('Rejouer ce circuit',()=>{circuitSession.start(v.circuit.id);renderCircuits()},'primary expedition-continue circuit-replay'));
  }else{
    const play=button(v.armed?'Relancer l’étape':'Jouer l’étape '+(v.step+1),()=>{
      const next=circuitSession.view();
      if(!next||!circuitSession.arm(state.expedition?.armed===true))return;
      if(state.difficulty!==next.circuit.mode){
        state.difficulty=next.circuit.mode;renderDifficultyChoice();save();
      }
      trialStarters[next.game]();
      selectGame(next.game,{jumpToStage:true,focusTrial:true});
      renderTrialMastery();renderCircuits();
    },'primary expedition-continue circuit-play');
    play.disabled=blocked;
    actions.append(play);
    if(v.armed)actions.append(button('Mettre en pause',()=>{circuitSession.pause();renderCircuits()},'secondary expedition-leave circuit-pause'));
  }
  actions.append(button(v.finished?'Autres circuits':'Quitter le circuit',()=>{
    circuitSession.leave();renderCircuits();
  },'secondary expedition-leave circuit-leave'));
  root.append(actions);
}
function recordCircuitVictory(index,mode,score,game){
  const result=circuitSession.victory(index,mode,score,state.expedition?.armed===true);
  if(!result.advanced)return;
  renderCircuits();
  game.actions?.append(button(result.finished?'✦ Voir le résultat du circuit':'✧ Étape suivante du circuit',showCircuits,'secondary circuit-return'));
}
function renderExpedition(){
  const view=expeditionSummary(state.expedition);
  $('#expedition-counter').textContent=view.discovered+'/'+view.total+' fragments';
  const host=$('#expedition-content');
  host.replaceChildren();
  const lead=el('div','expedition-lead');
  const leadText=el('div','expedition-lead-text');
  const isRevers=view.route?.id==='traversee-reflets';
  const isFinale=view.route?.id===FINALE_ID;
  leadText.append(el('span','expedition-kicker',!view.route?'LES EXPÉDITIONS · MARCHES DE VERRE':
    isFinale?'FINALE · AU-DELÀ DU VERRE':
    isRevers?'CHAPITRE II · LES REFLETS BRISÉS':'CHAPITRE I · LE SEUIL DES VERRIERS'),
    el('h3','expedition-title',!view.route?'Les Chemins des Marches':
      isFinale?'Le Dernier Accord':isRevers?'Le Passage du Revers':'Le Seuil des Verriers'));
  lead.append(leadText);
  host.append(lead);
  const startRoute=routeId=>{
    const isNewFinale=routeId===FINALE_ID&&!view.current.completedRoutes.includes(FINALE_ID);
    const isMasteryReprise=routeId===FINALE_ID&&!isNewFinale&&!state.shiny?.[72];
    const mode=isMasteryReprise?'maitrise':
      isNewFinale&&state.difficulty==='maitrise'?'aventure':state.difficulty;
    state.expedition=startExpedition(state.expedition,routeId,mode);
    save();
    renderExpedition();
  };
  const chooser=heading=>{
    if(heading)host.append(el('p','expedition-description',heading));
    const choices=el('div','expedition-choices');
    EXPEDITION_ROUTES.forEach(route=>{
      const done=view.current.completedRoutes.includes(route.id);
      const locked=route.id===FINALE_ID&&!canStartFinale(view.current);
      const pick=button('',()=>{if(!locked)startRoute(route.id)},
        'expedition-choice'+(done?' is-discovered':'')+
        (route.id==='traversee-reflets'?' is-reflets':'')+
        (route.id===FINALE_ID?' is-finale':''));
      pick.disabled=locked;
      pick.append(el('span','expedition-choice-symbol',route.symbol));
      const copy=el('span','expedition-choice-copy');
      let hint=route.hint;
      if(route.id===FINALE_ID){
        const have=FINALE_PREREQUISITES.filter(id=>view.current.completedRoutes.includes(id)).length;
        hint=locked?'Scellé · '+have+'/3 expéditions achevées':
          done&&!state.shiny?.[72]?'✧ Rejouer en Maîtrise pour la Chromatique':
          done?'La Signature est acquise · chapitre rejouable':'Le dernier chemin est prêt à être exploré.';
      }
      copy.append(el('strong','',route.name),el('small','',hint));
      pick.append(copy,el('span','expedition-choice-status',locked?'🔒':done?'✓':'›'));
      pick.setAttribute('aria-label',route.name+', '+hint+(done?', parcours déjà découvert':''));
      choices.append(pick);
    });
    host.append(choices);
  };
  if(!view.route){
    chooser('Les trois premiers chemins conduisent à la Convergence. Termine les expéditions des Verriers, des Veilleurs et du Revers pour ouvrir Le Dernier Accord.');
    return;
  }
  if(view.complete){
    host.append(el('p','expedition-chapter',view.route.symbol+' '+view.route.name+' · parcours achevé'),
      el('h4','expedition-fragment','✦ '+view.route.fragment),
      el('p','expedition-description',view.route.ending));
    if(isFinale){
      const vow=FINALE_VOWS.find(item=>item.id===view.current.choice);
      if(vow)host.append(el('p','expedition-after',vow.ending));
      if(state.owned?.[72]){
        const reward=el('div','expedition-finale-reward');
        const art=el('img','expedition-finale-art');
        applyCardIllustration(art,CARD_BY_ID.get(72),{shiny:!!state.shiny?.[72],size:'thumbnail'});
        art.alt='Cœur des Marches'+(state.shiny?.[72]?' Chromatique':'');
        const text=el('div','expedition-finale-copy');
        text.append(el('small','expedition-finale-eyebrow','✦ RÉCOMPENSE UNIQUE · ARCHIVE 072'),
          el('h4','',state.shiny?.[72]?'Cœur des Marches · Chromatique':'Cœur des Marches'),
          el('p','expedition-description',state.shiny?.[72]
            ?'Le serment a traversé le rite de Maîtrise. La Signature Chromatique est désormais gravée dans ton Codex.'
            :'La Signature a rejoint ton Codex. Reviens en difficulté Maîtrise pour éveiller sa version Chromatique.'));
        const see=button('Voir la Signature dans le Codex',()=>{
          activeSeason='marches-de-verre';
          activeCollection='au-dela-du-verre';
          navigate('collection');
          inspect(CARD_BY_ID.get(72),!!state.shiny?.[72]);
        },'secondary expedition-finale-link');
        text.append(see);
        reward.append(art,text);
        host.append(reward);
      }
    }
    chooser(isFinale?'Le chemin reste ouvert. Tu peux rejouer l’aventure ou explorer les autres routes.':
      'Choisis un autre itinéraire, ou repars sur celui-ci.');
    return;
  }
  const stage=view.stage,mode=DIFFICULTIES.find(d=>d.id===view.current.mode).label;
  host.append(el('p','expedition-chapter',view.route.symbol+' '+view.route.name+
    ' · '+mode+' · étape '+(view.current.step+1)+'/'+view.route.stages.length));
  const progress=el('div','expedition-progress');
  progress.setAttribute('role','list');
  view.route.stages.forEach((item,index)=>{
    const label=el('span','expedition-progress-step'+
      (index<view.current.step?' is-done':index===view.current.step?' is-now':''),
      index<view.current.step?'✓':String(index+1));
    label.setAttribute('role','listitem');
    label.setAttribute('aria-label',item.title+(index<view.current.step?' terminée':
      index===view.current.step?' en cours':' à venir'));
    progress.append(label);
  });
  host.append(progress);
  if(view.current.step===0){
    host.append(el('p','expedition-description',view.route.prologue));
  }else{
    host.append(el('p','expedition-after',view.route.stages[view.current.step-1].after));
  }
  host.append(el('h4','expedition-stage-title',stage.title),
    el('p','expedition-description',stage.text));
  if(isFinale&&view.current.step===3){
    host.append(el('p','expedition-description',
      'Néméria t’écoute. Il n’existe pas de mauvaise réponse : ce choix façonnera l’épilogue, sans modifier la récompense.'));
    const vows=el('div','expedition-final-vows');
    for(const vow of FINALE_VOWS){
      const active=view.current.choice===vow.id;
      const pick=button('',()=>{
        state.expedition=chooseFinaleVow(state.expedition,vow.id);
        save();
        renderExpedition();
      },'expedition-vow'+(active?' is-selected':''));
      pick.setAttribute('aria-pressed',String(active));
      pick.append(el('strong','',vow.name),el('small','',vow.text));
      vows.append(pick);
    }
    host.append(vows);
  }
  const controls=el('div','expedition-actions');
  const play=button(view.current.armed?'↻ Rejouer l’étape':'✧ Rejoindre l’épreuve',()=>{
    // The route remembers its starting difficulty; an easier win cannot skip a stage.
    if(state.difficulty!==view.current.mode){
      state.difficulty=view.current.mode;
      renderDifficultyChoice();
    }
    state.expedition=armExpedition(state.expedition);
    if(!state.expedition.armed)return;
    circuitSession.pause(); // Never count an expedition stage towards a circuit.
    save();
    trialStarters[stage.game]();
    selectGame(stage.game);
    renderTrialMastery();
    renderExpedition();
    navigate('jouer');
    openTrial();
    const target=mini[stage.game].card;
    if(!mobileView.matches)target.scrollIntoView({behavior:'smooth',block:'start'});
    target.querySelector('button:not([disabled])')?.focus({preventScroll:true});
  },'primary expedition-continue');
  play.disabled=isFinale&&view.current.step===3&&!view.current.choice;
  controls.append(play,button('Quitter le parcours',()=>{
    state.expedition=abandonExpedition(state.expedition);
    save();
    renderExpedition();
  },'secondary expedition-leave'));
  host.append(controls);
}
function makeCard(c,isShiny=false,locked=false,delivery='default'){
  const finish=typeof isShiny==='string'?isShiny:(isShiny?'chromatic':'normal');
  const chromatic=finish==='chromatic'&&!locked;
  const holographic=finish==='holographic'&&!locked;
  const calligraphic=finish==='calligraphic'&&!locked;
  // A sealed card never exposes its art, title or rarity in the Codex.
  const reallyLocked=locked;
  const b=el('button','card'+(reallyLocked?' is-sealed':'')+(chromatic?' is-chromatic':'')+
    (holographic?' is-holographic':'')+(calligraphic?' is-calligraphic':''));
  b.type='button';
  b.dataset.cardId=String(c.id);
  // Show rarity only on revealed art; sealed archives keep their neutral frame.
  if(!reallyLocked)b.dataset.rarity=c.rarity;
  b.style.setProperty('--edge',reallyLocked?'#8790a2':RARITIES[c.rarity].color);
  if(reallyLocked){
    const art=el('span','codex-sealed-art');
    art.setAttribute('aria-hidden','true');
    art.append(el('span','codex-sealed-glyph','✧'),
      el('span','codex-sealed-number','ARCHIVE '+String(c.id).padStart(3,'0')));
    b.append(art);
  }else{
    const img=el('img');
    applyCardIllustration(img,c,{shiny:chromatic,size:'thumbnail',delivery});
    if(chromatic){
      const art=el('span','chromatic-art-window');
      art.append(img);b.append(art);
    }else if(holographic||calligraphic){
      const art=el('span','finish-art-window');
      art.append(img);b.append(art);
    }else b.append(img);
  }
  const meta=el('div','info');
  meta.append(el('div','name',reallyLocked?'Archive scellée':c.name),
    el('div','meta',reallyLocked?'À découvrir':RARITIES[c.rarity].label+' · '+c.type));
  b.append(meta);
  if(!locked&&finishQuantity(state.finishCounts,finish,c.id))
    b.append(el('span','amount','×'+finishQuantity(state.finishCounts,finish,c.id)));
  if(chromatic)b.append(el('span','shine chromatic-seal','✧ CHROMATIQUE'));
  if(holographic)b.append(el('span','shine holographic-seal','◈ HOLOGRAPHIQUE'));
  if(calligraphic)b.append(el('span','shine calligraphic-seal','✒ CALLIGRAPHIQUE'));
  if(reallyLocked){
    b.setAttribute('aria-label','Archive '+String(c.id).padStart(3,'0')+', non découverte : ouvrir la fiche scellée');
  }else if(chromatic){
    b.setAttribute('aria-label',c.name+' — version Chromatique, '+RARITIES[c.rarity].label);
  }else if(holographic||calligraphic){
    b.setAttribute('aria-label',c.name+' — version '+FINISHES[finish].label+', '+RARITIES[c.rarity].label);
  }
  b.addEventListener('click',()=>{
    if($('#page-boosters').classList.contains('active')){
      const chapter=collectionForCard(c);
      if(chapter){activeSeason=chapter.season.id;activeCollection=chapter.collection.id;}
      navigate('collection');
    }
    if(reallyLocked)inspectSealed(c);
    else inspect(c,chromatic,true,false,finish);
  });
  return b;
}
let filterType='all',filterRarity='all',filterFinish='all',selectedCard=null;
let activeSeason=SEASONS[0].id,activeCollection=SEASONS[0].collections[0].id;
let discoveryFilter='all',codexVisibleCards=[],missingFinish='all';
const codexViewport=createCodexViewport(upgradeCodexIllustration);
function markCodexSelected(id){
  $$('#card-grid .card').forEach(tile=>{
    const selected=Number(tile.dataset.cardId)===id;
    tile.classList.toggle('is-selected',selected);
    tile.setAttribute('aria-pressed',String(selected));
  });
}
function codexBrowseTo(card){
  if(!card)return;
  const locked=!state.owned[card.id];
  if(locked)inspectSealed(card,false);
  else{
    const finish=FINISHES[filterFinish]?filterFinish:preferredFinish(state.finishCounts,card.id);
    inspect(card,finish==='chromatic',false,false,finish);
  }
}
function addCodexNavigation(panel,c){
  const index=codexVisibleCards.findIndex(item=>item.id===c.id);
  if(index<0)return;
  const nav=el('div','codex-inspector-navigation');
  nav.setAttribute('aria-label','Feuilleter les archives affichées');
  const previous=button('‹ Précédente',()=>browse(index-1),'codex-inspector-prev');
  const next=button('Suivante ›',()=>browse(index+1),'codex-inspector-next');
  previous.disabled=index===0;
  next.disabled=index===codexVisibleCards.length-1;
  nav.append(previous,el('small','',String(index+1)+' / '+codexVisibleCards.length),next);
  panel.append(nav);
  function browse(target){
    codexBrowseTo(codexVisibleCards[target]);
    const heading=$('#inspector h2');
    if(heading){heading.tabIndex=-1;heading.focus({preventScroll:true})}
  }
}
function inspectSealed(c,scroll=true){
  selectedCard={id:c.id,shiny:false,sealed:true};
  const panel=$('#inspector');
  panel.replaceChildren();
  // Sealed archives keep the original neutral inspection layout.
  panel.classList.remove('is-card-polished','recto-lab-mode-new');
  enableHolographicInspection(null);
  delete panel.dataset.rarity;
  panel.classList.remove('is-chromatic','is-holographic','is-calligraphic');
  const seal=el('div','codex-sealed-inspector');
  seal.setAttribute('aria-hidden','true');
  seal.append(el('span','','✧'),el('span','','ARCHIVE '+String(c.id).padStart(3,'0')));
  const location=collectionForCard(c);
  const collectionLabel=location?'Saison '+location.season.number+' · '+location.collection.title:'Les Archives';
  const copy=el('div','inspector-copy');
  copy.append(
    el('p','kicker','ARCHIVE '+String(c.id).padStart(3,'0')),
    el('h2','','Archive non découverte'),
    el('p','codex-inspector-chapter',collectionLabel),
    el('p','muted',c.signature
      ?'Cette archive renferme un secret. Poursuis ton aventure pour le découvrir.'
      :'Cette page est encore scellée. Découvre cette carte dans les boosters ou façonne-la dans l’Atelier.'),
    ...(c.signature
      ?[button('Voir les expéditions',()=>navigate('expeditions'),'secondary')]
      :[button('Ouvrir des boosters',()=>navigate('boosters'),'secondary'),button('Explorer l’Atelier',()=>navigate('atelier'),'secondary')]));
  addCodexNavigation(copy,c);
  panel.append(seal,copy);
  markCodexSelected(c.id);
  if(scroll){
    if(mobileView.matches)openSheet('inspector');
    else if(matchMedia('(max-width:1050px)').matches)panel.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
}
function inspect(c,shiny=false,scroll=true,chromaticPreview=false,finishOverride=null){
  // Covers direct calls, Codex pagination and keyboard interactions alike.
  // Never render HD artwork or effect controls for an undiscovered archive.
  if(!state.owned[c.id])return inspectSealed(c,scroll);
  // Retained legacy preview parameter is ignored: only acquired finishes render.
  const requestedFinish=FINISHES[finishOverride]?finishOverride:(shiny?'chromatic':'normal');
  const requestedOwned=finishQuantity(state.finishCounts,requestedFinish,c.id)>0;
  const fallback=preferredFinish(state.finishCounts,c.id);
  // Unowned finishes never render, even on an already discovered card.
  const activeFinish=requestedOwned?requestedFinish:
    (state.owned[c.id]?fallback:'normal');
  const chromatic=activeFinish==='chromatic';
  selectedCard={id:c.id,shiny:chromatic,preview:false,finish:activeFinish};
  const panel=$('#inspector');
  panel.replaceChildren();
  // Shared approved Codex presentation: all discovered cards, not sealed archives.
  panel.classList.add('is-card-polished');
  panel.dataset.rarity=c.rarity;
  panel.classList.toggle('is-chromatic',activeFinish==='chromatic');
  panel.classList.toggle('is-holographic',activeFinish==='holographic');
  panel.classList.toggle('is-calligraphic',activeFinish==='calligraphic');
  panel.style.setProperty('--edge',RARITIES[c.rarity].color);
  const img=el('img');
  applyCardIllustration(img,c,{shiny:chromatic,size:'full'});
  img.alt='Illustration de '+c.name+(chromatic?', version Chromatique':'');
  const artwork=el('div','inspector-art-shell'+(chromatic?' is-chromatic':'')+
    (activeFinish==='holographic'?' is-holographic':'')+
    (activeFinish==='calligraphic'?' is-calligraphic':''));
  artwork.append(img);
  if(chromatic)artwork.append(el('span','inspector-chromatic-seal','✧ CHROMATIQUE'));

  const kicker=el('p','kicker','ARCHIVE '+String(c.id).padStart(3,'0')+' · '+RARITIES[c.rarity].label);
  const title=el('h2','',c.name);
  const location=collectionForCard(c);
  const chapterLabel=el('p','codex-inspector-chapter',location?'Saison '+location.season.number+' · '+location.collection.title:'Les Archives');
  const desc=el('p','','« '+c.lore+' »');
  const stats=el('div','stats');
  // All discovered cards share the approved three-stat layout.
  // Éclat/Garde reuse existing attack/health; Flux is display-only and never saved.
  const flux=Math.max(1,Math.round((c.attack+c.health)/4));
  const visualStats=[
    ['eclat','Éclat',c.attack,'./assets/icons/stat-eclat-hd.webp'],
    ['garde','Garde',c.health,'./assets/icons/stat-garde-hd.webp'],
    ['flux','Flux',flux,'./assets/icons/stat-flux-hd.webp']
  ];
  for(const [kind,label,value,src] of visualStats){
    const cell=el('span','stat-stat '+kind);
    cell.setAttribute('aria-label',label+' : '+value+
      (kind==='flux'?' (indicateur visuel provisoire)':''));
    const glyph=el('img','stat-glyph');
    glyph.src=src;glyph.alt='';glyph.setAttribute('aria-hidden','true');
    glyph.loading='eager';
    cell.append(glyph,el('span','stat-name',label),el('strong','stat-value',String(value)));
    stats.append(cell);
  }
  const copy=el('div','inspector-copy');
  copy.append(kicker,title,chapterLabel,el('p','muted',c.type+
    ' · '+FINISHES[activeFinish].symbol+' Version '+FINISHES[activeFinish].label),desc,stats);
  const owned=el('p','stat-inventory-total');
  owned.append(el('span','stat-inventory-heading','Collection'),
    el('strong','','Possédées : ×'+(state.owned[c.id]||0)));
  copy.append(owned);
  const ledger=el('div','variant-ledger');
  ledger.setAttribute('aria-label','Quantités possédées par finition');
  for(const finish of FINISH_KEYS){
    const entry=el('span','');
    entry.append(el('strong','',FINISHES[finish].symbol+' '+FINISHES[finish].label+': '),
      document.createTextNode('×'+finishQuantity(state.finishCounts,finish,c.id)));
    ledger.append(entry);
  }
  copy.append(ledger);
  const picker=el('div','finish-picker');
  picker.setAttribute('role','group');
  picker.setAttribute('aria-label','Choisir une finition de cette carte');
  for(const finish of FINISH_KEYS){
    const quantity=finishQuantity(state.finishCounts,finish,c.id);
    const selected=activeFinish===finish;
    const selector=button(FINISHES[finish].symbol+' '+FINISHES[finish].label,
      ()=>{if(quantity)inspect(c,finish==='chromatic',false,false,finish)},
      'secondary finish-choice');
    selector.disabled=quantity===0;
    selector.setAttribute('aria-pressed',String(selected));
    const unavailable=c.signature&&(finish==='calligraphic'||finish==='holographic');
    const evolved=c.signature&&finish==='normal'&&state.shiny?.[c.id]===true;
    const lockedLabel=unavailable?'Non disponible pour la Signature':evolved?'Évoluée en Chromatique':'Non possédée · verrouillée';
    selector.setAttribute('aria-label',FINISHES[finish].label+
      (quantity?' · Possédée, '+quantity+' exemplaire(s)':' · '+lockedLabel));
    selector.append(el('span','finish-state',quantity?'Possédée · ×'+quantity:lockedLabel));
    picker.append(selector);
  }
  copy.append(picker);
  const recipes=completionRecipes(state,c);
  if(recipes.length){
    const plan=el('details','codex-card-recipes');
    plan.append(el('summary','','Finitions à forger · '+recipes.length));
    for(const recipe of recipes){
      const label=FINISHES[recipe.finish].symbol+' '+FINISHES[recipe.finish].label+' · '+recipe.cost+' Éclats';
      const action=button(label,()=>openCompletionRecipe(c,recipe.finish),'secondary codex-recipe-link');
      action.setAttribute('aria-label','Voir la recette '+label+' dans l’Atelier');
      plan.append(action);
    }
    copy.append(plan);
  }
  addCodexNavigation(copy,c);
  panel.append(artwork,copy);
  const front=attachRectoLabInspector({panel,card:c,finish:activeFinish,artwork});
  enableHolographicInspection(activeFinish==='holographic'?front:null);
  markCodexSelected(c.id);
  if(scroll){
    if(mobileView.matches)openSheet('inspector');
    else if(matchMedia('(max-width:1050px)').matches)panel.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
}
function openCompletionRecipe(card,finish){
  if(!canCraftFinish(state,card,finish))return notify('Cette recette n’est plus disponible.');
  forgeSelectedId=card.id;
  forgeMode=finish;forgeFilter='all';
  $('#atelier-mode').value=finish;$('#atelier-filter').value='all';
  navigate('atelier');
  $('#atelier-card-details').scrollIntoView({block:'start',behavior:'auto'});
}
function renderCompletionPanel(cards){
  const rows=completionPlan(cards,state);
  const host=$('#codex-completion-rows');
  const fragment=document.createDocumentFragment();
  for(const row of rows){
    const line=el('div','codex-completion-row');
    const label=el('div','codex-completion-label');
    label.append(el('strong','',FINISHES[row.finish].symbol+' '+FINISHES[row.finish].plural),
      el('small','',row.unique+' / '+row.total+' obtenues'));
    const track=el('span','codex-completion-track');
    track.setAttribute('role','progressbar');track.setAttribute('aria-label',FINISHES[row.finish].plural+' de cette collection');
    track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(Math.max(1,row.total)));track.setAttribute('aria-valuenow',String(row.unique));
    const fill=el('span');fill.style.width=row.percent+'%';track.append(fill);
    label.append(track);
    const info=el('div','codex-completion-info');
    info.append(el('small','',row.recipes?row.cost.toLocaleString('fr-FR')+' Éclats pour ces recettes':row.missing?'Aucune recette accessible pour le moment':'Objectif atteint'));
    const action=button('Voir '+row.recipes+' recette'+(row.recipes===1?'':'s'),()=>showCompletionRecipes(row.finish),'secondary codex-completion-action');
    action.disabled=row.recipes===0;
    action.setAttribute('aria-label','Afficher les '+row.recipes+' recettes '+FINISHES[row.finish].plural+' manquantes');
    info.append(action);line.append(label,info);fragment.append(line);
  }
  host.replaceChildren(fragment);
  $('#codex-completion-count').textContent=rows.reduce((n,r)=>n+r.recipes,0)+' recettes accessibles';
}
function showCompletionRecipes(finish){
  // A completion shortcut deliberately starts with clean, compatible filters.
  filterFinish=filterRarity=filterType=discoveryFilter='all';
  $('#search').value='';
  for(const attr of ['type','rarity','finish','discovery']){
    $$('button[data-'+attr+']',attr==='discovery'?$('.codex-discovery-tabs'):$('#collection-filters')).forEach(control=>{
      const active=control.dataset[attr]==='all';
      control.classList.toggle(attr==='discovery'?'is-active':'active',active);
      control.setAttribute('aria-pressed',String(active));
    });
  }
  missingFinish=finish;renderCodexResults();
  $('#codex-completion-clear').focus({preventScroll:true});
  $('#codex-completion-clear').scrollIntoView({block:'nearest',behavior:'auto'});
}
function renderCodexSeasons(){
  const seasons=$('#codex-season-list');
  if(!seasons.childElementCount){
    for(const season of SEASONS){
      const control=button('',()=>{
        if(activeSeason===season.id)return;
        closeSheets(false);
        activeSeason=season.id;
        activeCollection=season.collections[0].id;
        selectedCard=null;
        renderCollection();
      },'codex-season');
      control.dataset.season=season.id;
      control.append(el('span','codex-season-number','SAISON '+String(season.number).padStart(2,'0')),
        el('strong','codex-season-name',season.title),
        el('span','codex-season-state'));
      seasons.append(control);
    }
  }
  for(const control of $$('.codex-season',seasons)){
    const season=seasonById(control.dataset.season);
    const progress=seasonProgress(CARDS,state.owned,state.shiny,season.id);
    const active=season.id===activeSeason;
    control.classList.toggle('is-active',active);
    control.setAttribute('aria-pressed',String(active));
    control.setAttribute('aria-label','Saison '+season.number+' : '+season.title+
      ', '+progress.released+' cartes publiées sur '+progress.planned);
    $('.codex-season-state',control).textContent=
      progress.released?progress.collectionsReleased+' / '+progress.collectionsPlanned+' collections disponibles':'À venir';
  }
  const season=seasonById(activeSeason);
  const progress=seasonProgress(CARDS,state.owned,state.shiny,activeSeason);
  $('#codex-season-title').textContent='Saison '+season.number+' — '+season.title;
  $('#codex-season-description').textContent=season.subtitle;
  $('#codex-season-publication').textContent=progress.released+' / '+progress.planned+' cartes publiées';
  $('#codex-season-published-fill').style.width=progress.percentReleased+'%';
  $('#codex-season-published-track').setAttribute('aria-valuenow',String(progress.released));
  $('#codex-season-published-track').setAttribute('aria-valuemax',String(progress.planned));
  $('#codex-season-discovered').textContent=progress.discovered+' cartes obtenues';
  $('.collection-edition').textContent='✧ Saison '+season.number+' · '+season.title;

  const partHolder=$('#codex-collection-list');
  partHolder.replaceChildren();
  for(const part of season.collections){
    const active=part.id===activeCollection;
    const partCards=cardsForCollection(CARDS,season.id,part.id);
    const stats=codexProgress(partCards,state.owned,state.shiny);
    const tile=button('',()=>{
      if(activeCollection===part.id)return;
      closeSheets(false);
      activeCollection=part.id;
      selectedCard=null;
      renderCollection();
    },'codex-chapter'+(active?' is-active':'')+(part.released&&stats.total===stats.discovered?' is-complete':'')+(part.released?'':' is-upcoming'));
    tile.dataset.collection=part.id;
    tile.setAttribute('aria-pressed',String(active));
    tile.setAttribute('aria-label','Partie '+part.number+' : '+part.title+
      (part.released?', '+stats.discovered+' cartes obtenues sur '+stats.total:', à venir'));
    const eyebrow=el('span','codex-chapter-eyebrow','✦ PARTIE '+part.number);
    const title=el('span','codex-chapter-name',part.title);
    const count=el('span','codex-chapter-count',
      part.released?stats.discovered+' / '+part.plannedCards+' · ✧ '+stats.chromatic:'À venir · '+part.plannedCards+' cartes');
    tile.append(eyebrow,title,count);
    if(part.signature)tile.append(el('span','codex-part-signature','✧ Carte Signature'));
    if(part.released){
      const track=el('span','codex-chapter-track');
      track.setAttribute('aria-hidden','true');
      const fill=el('span');fill.style.width=stats.percent+'%';
      track.append(fill);tile.append(track);
    }
    partHolder.append(tile);
  }
  const collection=collectionById(activeSeason,activeCollection);
  $('#codex-chapter-title').textContent='Partie '+collection.number+' · '+collection.title;
  $('#codex-chapter-subtitle').textContent=collection.subtitle+(collection.id==='au-dela-du-verre'?' · 23 cartes en booster, une Signature à mériter lors du final.':'');
  const chapterCards=season.collections.flatMap(part=>cardsForCollection(CARDS,season.id,part.id));
  const stats=codexProgress(chapterCards,state.owned,state.shiny);
  $('#codex-progress-discovered').textContent=stats.discovered+' / '+stats.total;
  $('#codex-signature-note').hidden=!chapterCards.some(card=>card.signature);
  for(const finish of FINISH_KEYS){
    const {unique,total,percent}=finishObjective(chapterCards,state.finishCounts,finish);
    const target=document.querySelector('#codex-progress-'+finish);
    if(target)target.textContent=unique+' / '+total;
    const fill=document.querySelector('#codex-'+finish+'-fill');
    if(fill)fill.style.width=percent+'%';
    const track=document.querySelector('#codex-'+finish+'-track');
    if(track){
      track.setAttribute('aria-valuenow',String(unique));
      track.setAttribute('aria-valuemax',String(Math.max(total,1)));
    }
  }
  $('#codex-progress-fill').style.width=stats.percent+'%';
  $('#codex-progress-track').setAttribute('aria-valuenow',String(stats.discovered));
  $('#codex-progress-track').setAttribute('aria-valuemax',String(Math.max(stats.total,1)));
}
function claimDiscoveryFragment(threshold){
  const cards=cardsForCollection(CARDS,activeSeason,activeCollection);
  const result=claimCollectionMilestone({
    seasonId:activeSeason,collectionId:activeCollection,threshold,
    cards,owned:state.owned,claims:state.collectionMilestones
  });
  if(!result.ok){notify(result.reason);return}
  const reward=result.milestone.reward;
  // All changes happen in one synchronous update, saved before confirmation.
  state.collectionMilestones=result.claims;
  if(reward.currency==='coins'){
    state.coins+=reward.amount;
    state.earned+=reward.amount;
  }else state.dust+=reward.amount;
  update();
  renderCollection();
  notify('✧ '+result.milestone.title+' · +'+reward.amount+
    (reward.currency==='coins'?' Couronnes':' Éclats')+' !');
}
function renderCollectionMilestones(cards){
  const journal=$('#codex-milestones');
  const entries=milestonesFor(activeSeason,activeCollection);
  journal.hidden=!entries.length;
  if(!entries.length)return;
  const count=uniqueCardsOwned(cards,state.owned);
  const statuses=collectionMilestoneStatus(
    activeSeason,activeCollection,cards,state.owned,state.collectionMilestones);
  const recovered=statuses.filter(entry=>entry.status==='claimed').length;
  const pending=statuses.filter(entry=>entry.status==='claimable').length;
  $('#codex-milestones-count').textContent=pending
    ?pending+' fragment'+(pending>1?'s':'')+' à révéler'
    :recovered+' / '+entries.length+' fragments retrouvés';
  $('#codex-milestones-progress').textContent=count+' / '+cards.length+' cartes différentes';
  const holder=$('#codex-milestones-list');
  holder.replaceChildren();
  for(const entry of statuses){
    const unlocked=entry.status!=='locked';
    const claimed=entry.status==='claimed';
    const tile=el('article','codex-milestone-card'+(unlocked?' is-unlocked':'')+
      (claimed?' is-claimed':''));
    const number=el('span','codex-milestone-number',
      '✧ '+String(entry.threshold).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0'));
    const title=el('strong','codex-milestone-title',unlocked?entry.title:'Fragment scellé');
    const award=el('span','codex-milestone-award','+'+entry.reward.amount+
      (entry.reward.currency==='coins'?' Couronnes':' Éclats'));
    tile.append(number,title,award);
    if(claimed){
      tile.append(el('p','codex-milestone-story','« '+entry.fragment+' »'),
        el('span','codex-milestone-state','✦ Fragment retrouvé'));
    }else if(unlocked){
      tile.append(el('p','codex-milestone-message','Une page des Archives attend ton regard.'));
      tile.append(button('✧ Révéler le fragment',()=>claimDiscoveryFragment(entry.threshold),
        'codex-milestone-claim'));
    }else tile.append(el('p','codex-milestone-message',
      'Encore '+(entry.threshold-count)+' carte'+(entry.threshold-count>1?'s':'')+' à découvrir.'));
    holder.append(tile);
  }
}
function renderLivingArchives(cards){
  const panel=$('#codex-living');
  panel.hidden=!cards.length;
  if(!cards.length)return;
  const archive=buildLivingArchive(cards,CARDS,state.owned,state.shiny,state.recentFinds);
  $('#living-summary').textContent=archive.discovered+' / '+cards.length+
    ' cartes · '+archive.completed.length+' / '+archive.publishedCount+' collection'+
    (archive.publishedCount>1?'s':'')+' complète'+(archive.publishedCount>1?'s':'');
  $('#living-recent-caption').textContent=archive.recent.length
    ?'Les nouveaux trésors du registre':'À partir de ta prochaine trouvaille';
  const recentHolder=$('#living-recent');
  const featuredHolder=$('#living-featured');
  recentHolder.replaceChildren();
  featuredHolder.replaceChildren();

  const addCard=(holder,card,note)=>{
    const chromatic=!!state.shiny[card.id];
    const tile=button('',()=>inspect(card,chromatic),
      'living-tile'+(chromatic?' is-chromatic':''));
    tile.style.setProperty('--living-edge',RARITIES[card.rarity].color);
    tile.setAttribute('aria-label','Voir '+card.name+' · '+RARITIES[card.rarity].label+
      (chromatic?' · Chromatique':''));
    const art=el('img');
    applyCardIllustration(art,card,{shiny:chromatic,size:'thumbnail'});
    art.alt='';
    art.loading='lazy';
    const info=el('span','living-tile-info');
    info.append(el('strong','living-tile-name',card.name),
      el('span','living-tile-note',note));
    tile.append(art,info);
    holder.append(tile);
  };
  if(archive.recent.length){
    for(const event of archive.recent){
      const note=event.kind==='forge'?'Façonnée à la Forge':
        event.kind==='chromatic'?'✧ Découverte Chromatique':'Première découverte';
      addCard(recentHolder,event.card,note);
    }
  }else recentHolder.append(el('p','living-empty',
    'Tes prochaines découvertes apparaîtront ici. Tes anciennes cartes sont toujours présentes dans le Codex.'));
  if(archive.featured.length){
    for(const card of archive.featured)addCard(featuredHolder,card,
      RARITIES[card.rarity].label+(state.shiny[card.id]?' · ✧ Chromatique':''));
  }else featuredHolder.append(el('p','living-empty',
    'Les cartes les plus précieuses de ta collection prendront place ici.'));

  const rarityHolder=$('#living-rarities');
  rarityHolder.replaceChildren();
  for(const entry of archive.rarities){
    const line=el('div','living-rarity-line');
    const label=el('div','living-rarity-label');
    label.append(el('span','',entry.label),
      el('strong','',entry.collected+' / '+entry.total));
    const track=el('div','living-rarity-track');
    track.setAttribute('role','progressbar');
    track.setAttribute('aria-label',entry.label+' découvertes');
    track.setAttribute('aria-valuemin','0');
    track.setAttribute('aria-valuemax',String(entry.total));
    track.setAttribute('aria-valuenow',String(entry.collected));
    const fill=el('span');
    fill.style.width=(100*entry.collected/entry.total)+'%';
    track.append(fill);
    line.append(label,track);
    rarityHolder.append(line);
  }
  $('#living-complete-count').textContent=archive.completed.length+
    ' / '+archive.publishedCount+' disponibles';
  const completeHolder=$('#living-completions');
  completeHolder.replaceChildren();
  if(archive.completed.length){
    for(const item of archive.completed)completeHolder.append(
      el('span','living-complete-badge',
        '✦ Saison '+item.season.number+' · '+item.collection.title+' achevée'));
  }else completeHolder.append(el('p','living-completion-note',
    'Rassemble toutes les cartes d’une collection pour voir son sceau apparaître ici.'));
}
function renderCollection(){
  renderCodexSeasons();
  const selectedPart=collectionById(activeSeason,activeCollection);
  const availableCards=cardsForCollection(CARDS,activeSeason,activeCollection);
  const isUpcoming=!selectedPart.released;
  $('#codex-upcoming').hidden=!isUpcoming;
  const showRefletsPreview=isUpcoming&&activeSeason==='marches-de-verre'&&selectedPart.id==='reflets-brises';
  const showAuDelaTeaser=isUpcoming&&activeSeason==='marches-de-verre'&&selectedPart.id==='au-dela-du-verre';
  $('#au-dela-teaser').hidden=!showAuDelaTeaser;
  $('#au-dela-gallery').hidden=!showAuDelaTeaser;
  if(showAuDelaTeaser)mountAuDelaGallery($('#au-dela-gallery-grid'));
  $('#reflets-art-preview').hidden=!showRefletsPreview;
  $('#reflets-gallery').hidden=!showRefletsPreview;
  if(showRefletsPreview)mountRefletsGallery($('#reflets-gallery-grid'));
  $('#collection-layout').hidden=isUpcoming;
  if(isUpcoming){
    enableHolographicInspection(null);
    $('#codex-milestones').hidden=true;
    $('#codex-living').hidden=true;
    $('#codex-upcoming-title').textContent='Partie '+selectedPart.number+' · '+selectedPart.title;
    $('#codex-upcoming-description').textContent=selectedPart.subtitle;
    $('#codex-upcoming-note').textContent=selectedPart.signature
      ?'24 cartes prévues, dont une carte Signature obtenue par accomplissement. Aucun booster disponible pour le moment.'
      :'24 cartes prévues. Cette collection sera disponible dans une prochaine mise à jour.';
    selectedCard=null;
    codexVisibleCards=[];
    codexViewport.clear();$('#card-grid').replaceChildren();
    update();
    return;
  }
  renderCollectionMilestones(availableCards);
  renderLivingArchives(availableCards);
  renderCompletionPanel(availableCards);
  renderCodexResults();
  update();
}
function renderCodexResults(){
  if(!collectionById(activeSeason,activeCollection)?.released)return;
  const availableCards=cardsForCollection(CARDS,activeSeason,activeCollection);
  const gallery=$('#card-grid');
  const q=$('#search').value.trim();
  const filtered=filterCodex(availableCards,{type:filterType,rarity:filterRarity,
    finish:filterFinish,discovery:discoveryFilter,query:q,owned:state.owned,shiny:state.shiny,
    finishCounts:state.finishCounts});
  const cards=filterCompletionRecipes(filtered,state,missingFinish);
  const completionFilter=$('#codex-completion-clear');
  completionFilter.hidden=missingFinish==='all';
  completionFilter.textContent=missingFinish==='all'?'':FINISHES[missingFinish].symbol+' '+FINISHES[missingFinish].plural+' à forger · Effacer ×';
  codexVisibleCards=cards;
  const entries=cards.map(card=>{
    const finish=filterFinish==='normal'?'normal':(FINISHES[filterFinish]?filterFinish:preferredFinish(state.finishCounts,card.id));
    const locked=!state.owned[card.id];
    return {card,finish,locked,key:locked?'sealed':finish+':'+finishQuantity(state.finishCounts,finish,card.id)};
  });
  reconcileCodexGrid(gallery,entries,entry=>makeCard(entry.card,entry.finish,entry.locked,'codex'),
    tile=>codexViewport.remove(tile),tile=>codexViewport.add(tile));
  const inChapter=availableCards.length;
  $('#codex-results').textContent=cards.length+' / '+inChapter+' archives';
  const empty=$('#empty');
  empty.classList.add('codex-empty');
  empty.hidden=cards.length>0;
  empty.textContent=cards.length?'':missingFinish!=='all'?'Aucune recette accessible ne correspond à ces filtres.':filterFinish==='chromatic'?
    'Aucune Chromatique ne correspond à ces filtres. Essaie une autre rareté ou une autre collection.':
    (filterFinish==='holographic'||filterFinish==='calligraphic')?
    'Aucune '+FINISHES[filterFinish].label+' possédée pour cette collection.':
    discoveryFilter==='collected'?'Aucune carte découverte ne correspond à ces critères.':
    'Aucune archive ne correspond à cette recherche.';
  const appliedFilters=(filterType!=='all'?1:0)+(filterRarity!=='all'?1:0)+
    (filterFinish!=='all'?1:0)+(discoveryFilter!=='all'?1:0)+(missingFinish!=='all'?1:0);
  const filterCount=$('#filter-count');
  filterCount.hidden=appliedFilters===0;
  filterCount.textContent=String(appliedFilters);
  const next=cards.find(c=>c.id===selectedCard?.id)||cards[0];
  if(next&&mobileView.matches&&!inspectorShell.classList.contains('is-open')){
    // The full-size recto is built only when the mobile reader is opened.
    enableHolographicInspection(null);
    selectedCard=selectedCard?.id===next.id?selectedCard:null;
    markCodexSelected(selectedCard?.id??null);
  }else if(next){
    const revealed=!!state.owned[next.id];
    if(!revealed)inspectSealed(next,false);
    else{
      const finish=FINISHES[filterFinish]?filterFinish:
        (selectedCard?.id===next.id&&selectedCard.finish?selectedCard.finish:
          preferredFinish(state.finishCounts,next.id));
      const chromatic=finish==='chromatic';
      inspect(next,chromatic,false,false,finish);
    }
  }else{
    enableHolographicInspection(null);
    selectedCard=null;
    const panel=$('#inspector');
    panel.classList.remove('is-chromatic','is-holographic','is-calligraphic');
    delete panel.dataset.rarity;
    panel.replaceChildren(el('p','muted','Choisis une autre collection ou ajuste les filtres pour feuilleter les archives.'));
  }
}
$('#search').addEventListener('input',renderCodexResults);
$('#codex-completion-clear').addEventListener('click',()=>{missingFinish='all';renderCodexResults();$('#search').focus({preventScroll:true})});
$$('[data-type]').forEach(b=>b.addEventListener('click',()=>{
  filterType=b.dataset.type;
  $$('[data-type]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});
  renderCodexResults();
}));
$$('[data-rarity]').forEach(b=>b.addEventListener('click',()=>{
  filterRarity=b.dataset.rarity;
  $$('[data-rarity]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});
  renderCodexResults();
}));
$$('[data-finish]').forEach(b=>b.addEventListener('click',()=>{
  missingFinish='all';filterFinish=b.dataset.finish;
  $$('[data-finish]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});
  renderCodexResults();
}));
$$('[data-discovery]').forEach(b=>b.addEventListener('click',()=>{
  missingFinish='all';discoveryFilter=b.dataset.discovery;
  $$('[data-discovery]').forEach(x=>{
    x.classList.toggle('is-active',x===b);
    x.setAttribute('aria-pressed',String(x===b));
  });
  renderCodexResults();
}));

/* Season I boosters: one sealed card at a time, from a five-card stack.
   A purchase is saved before presentation; revealing never re-rolls or charges. */
const boosterArt=$('#booster-pack'),boosterOpening=$('#booster-opening');
const boosterGrid=$('#pulls'),boosterProgress=$('#booster-progress'),boosterProgressFill=$('#booster-progress span');
const boosterActions=$('#booster-actions'),boosterSummary=$('#booster-summary');
const revealAllButton=$('#reveal-all'),nextPullButton=$('#next-pull'),boosterStep=$('#booster-step');
const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
// The packet seal and the first card are one sequence; no additional roll
// or payment happens while the foil animation is running.
const BOOSTER_UNSEAL_MS=980;
const boosterTimers=new Set();
let currentDraw=[],drawSummary=null,currentIndex=0,cardFaceUp=false,changingCard=false;
let selectedBooster='origines';
function afterBooster(ms,action){
  const id=setTimeout(()=>{boosterTimers.delete(id);action()},ms);
  boosterTimers.add(id);
}
function cancelBoosterTimers(){for(const id of boosterTimers)clearTimeout(id);boosterTimers.clear()}
function clearBoosterScene(){
  cancelBoosterTimers();
  boosterBusy=false;
  currentDraw=[];drawSummary=null;currentIndex=0;cardFaceUp=false;changingCard=false;
  boosterArt.classList.remove('is-opening');
  boosterOpening.classList.remove('is-unsealing');
  boosterGrid.classList.remove('booster-pulls','booster-single','booster-gallery');
  boosterGrid.replaceChildren();
  boosterProgress.hidden=true;
  boosterProgressFill.style.width='0%';
  boosterStep.hidden=true;
  boosterActions.hidden=true;
  nextPullButton.hidden=true;
  boosterSummary.hidden=true;
  $('#booster-codex-action').hidden=true;
  boosterSummary.replaceChildren();
}
/* Switch only between complete released collections. Never change a purchased
   draw during its animation or re-roll cards on edition change. */
function selectBooster(edition){
  const view=boosterView(edition);
  if(boosterBusy||!view)return;
  selectedBooster=edition;
  clearBoosterScene();
  boosterArt.classList.toggle('pack-reflets',view.theme==='reflets');
  boosterArt.classList.toggle('pack-au-dela',view.theme==='au-dela');
  boosterArt.classList.toggle('reliquaire-origines',view.theme==='origines'||view.theme==='standard');
  if(view.theme==='origines'||view.theme==='standard'){
    const image=$('.pack-artwork:not(.pack-artwork-reflets):not(.pack-artwork-au-dela)',boosterArt);
    if(image&&image.getAttribute('src')!==view.art)image.setAttribute('src',view.art);
  }
  boosterArt.classList.toggle('reliquaire-reflets',view.theme==='reflets');
  boosterArt.classList.toggle('reliquaire-au-dela',view.theme==='au-dela');
  $('#booster-pack .pack-title').textContent=view.title;
  $('#booster-pack .pack-edition').textContent=view.edition;
  $('#booster-pack .pack-collection').textContent=view.season.title.toLocaleUpperCase('fr-FR');
  $('#booster-collection-kicker').textContent=view.kicker;
  $('#booster-family-title').textContent=view.label;
  $('#booster-family-description').textContent=view.description;
  for(const control of $$('.booster-choice')){
    const active=control.dataset.booster===edition;
    control.classList.toggle('is-selected',active);
    control.setAttribute('aria-pressed',String(active));
  }
  $('#pack-title').textContent=view.message;
  $('#pack-msg').textContent='Un rituel, cinq révélations. À toi de jouer.';
  update();
}
// Preserve the original three approved tiles. Future released collections
// reuse the same markup and packaging without requiring a new HTML block.
function mountReleasedBoosterChoices(){
  const template=$('.booster-choice');
  if(!template)return;
  const existing=new Set($$('.booster-choice').map(control=>control.dataset.booster));
  for(const id of Object.keys(BOOSTER_VIEWS)){
    if(existing.has(id))continue;
    const view=boosterView(id);
    if(!view||view.theme!=='standard')continue;
    const control=template.cloneNode(true);
    control.classList.remove('is-selected');
    control.hidden=false;
    control.dataset.booster=id;
    control.dataset.season=view.season.id;
    control.dataset.seasonTitle=view.seasonLabel;
    control.setAttribute('aria-pressed','false');
    control.setAttribute('aria-label',view.label+' · '+PACK_PRICE+' Couronnes · voir le paquet');
    const pack=$('.booster-tile-pack',control);
    pack.classList.remove('reliquaire-reflets','reliquaire-au-dela');
    pack.classList.add('reliquaire-origines');
    $('.pack-collection',pack).textContent=view.season.title.toLocaleUpperCase('fr-FR');
    $('.pack-scene img',pack).setAttribute('src',view.art);
    $('.pack-title',pack).textContent=view.title;
    $('.pack-edition',pack).textContent=view.edition;
    $('.booster-tile-chapter',control).textContent='PARTIE '+view.collection.number;
    $('.booster-tile-caption strong',control).textContent=view.collection.title;
    $('.booster-tile-price',control).textContent=PACK_PRICE+' ♛';
    template.parentNode.append(control);
    existing.add(id);
  }
}
mountReleasedBoosterChoices();
$$('.booster-choice').forEach(control=>control.addEventListener('click',
  ()=>{selectBooster(control.dataset.booster);if(typeof openBoosterDialog==='function')openBoosterDialog(control)}));

/** The face-up card is decorative: tapping it should not leave the reveal sequence.
 * Loading the artwork eagerly is important: on Android WebView a lazy image
 * inside an initially hidden, flipping card can remain a blank rectangle. */
function boosterCardArtwork(item){
  const buttonCard=makeCard(item.card,item.finish??item.shiny);
  const artwork=el('div',buttonCard.className);
  artwork.style.cssText=buttonCard.style.cssText;
  // Preserve the displayed card's metadata when replacing its interactive
  // Codex button with a decorative booster face. Rarity frames rely on it.
  Object.assign(artwork.dataset,buttonCard.dataset);
  while(buttonCard.firstChild)artwork.append(buttonCard.firstChild);
  // Use the full-size art, not the Codex thumbnail, and request it before
  // the player turns the face up. Keep applyCardIllustration's error fallback.
  const revealedImage=artwork.querySelector('img');
  if(revealedImage){
    revealedImage.loading='eager';
    revealedImage.decoding='sync';
    revealedImage.fetchPriority='high';
    applyCardIllustration(revealedImage,item.card,{shiny:item.shiny,size:'full'});
    // The shared helper normally decodes asynchronously. Only the booster
    // preview needs synchronous paint immediately after reveal.
    revealedImage.loading='eager';
    revealedImage.decoding='sync';
    revealedImage.fetchPriority='high';
    revealedImage.alt='Illustration de '+item.card.name;
  }
  return createCardFront({card:item.card,finish:item.finish??(item.shiny?'chromatic':'normal'),artwork});
}
function showBoosterCard(index,focus=true){
  if(!boosterBusy||index<0||index>=currentDraw.length)return;
  currentIndex=index;cardFaceUp=false;changingCard=false;
  const item=currentDraw[index];
  boosterGrid.classList.remove('booster-gallery');
  boosterGrid.classList.add('booster-pulls','booster-single');
  boosterGrid.replaceChildren();
  const tile=el('div','pull-flip');
  tile.dataset.rarity=item.card.rarity;
  tile.style.setProperty('--pull-edge',RARITIES[item.card.rarity].color);
  tile.classList.toggle('is-chromatic',item.shiny);
  tile.classList.toggle('is-holographic',item.finish==='holographic');
  tile.classList.toggle('is-calligraphic',item.finish==='calligraphic');
  const frame=el('div','pull-frame');
  const back=el('button','pull-back');
  back.type='button';
  back.setAttribute('aria-label','Retourner la carte '+(index+1)+' sur '+currentDraw.length);
  // Le dos commun est dessiné par CSS ; son libellé accessible est conservé.
  back.addEventListener('click',()=>revealBoosterCard());
  const front=el('div','pull-front');
  front.inert=true;front.setAttribute('aria-hidden','true');
  front.append(boosterCardArtwork(item));
  frame.append(back,front);
  const specialFinish=item.finish&&item.finish!=='normal'?item.finish:(item.shiny?'chromatic':null);
  const tag=el('div','pull-tag'+(item.shiny?' is-chromatic':item.isNew?' is-new':' is-duplicate'),
    specialFinish?FINISHES[specialFinish].symbol+' CARTE '+FINISHES[specialFinish].label.toUpperCase():
    item.isNew?'✧ Nouvelle carte':'Doublon · +'+item.dustGain+' Éclats');
  tile.append(frame,tag);
  boosterGrid.append(tile);
  boosterProgressFill.style.width=(index/currentDraw.length*100)+'%';
  boosterStep.hidden=false;
  boosterStep.textContent='Carte '+(index+1)+' / '+currentDraw.length;
  nextPullButton.hidden=true;
  $('#pack-title').textContent='Carte '+(index+1)+' sur '+currentDraw.length;
  $('#pack-msg').textContent='Touche le dos de la carte pour révéler son illustration.';
  if(focus)back.focus({preventScroll:true});
}
function revealBoosterCard(){
  if(!boosterBusy||cardFaceUp||changingCard)return;
  const tile=boosterGrid.querySelector('.pull-flip');
  if(!tile)return;
  cardFaceUp=true;
  tile.classList.add('is-revealed');
  if(currentDraw[currentIndex].shiny)tile.classList.add('chromatic-unveiling');
  const back=tile.querySelector('.pull-back'),front=tile.querySelector('.pull-front');
  back.disabled=true;back.tabIndex=-1;back.setAttribute('aria-hidden','true');
  front.inert=false;front.removeAttribute('aria-hidden');
  boosterProgressFill.style.width=((currentIndex+1)/currentDraw.length*100)+'%';
  const item=currentDraw[currentIndex];
  $('#pack-title').textContent=item.card.name;
  $('#pack-msg').textContent=RARITIES[item.card.rarity].label+
    ((item.finish&&item.finish!=='normal')?' · '+FINISHES[item.finish].symbol+' '+FINISHES[item.finish].label.toUpperCase()+' !':
      item.shiny?' · ✧ CHROMATIQUE !':'')+
    (item.isNew?' · Nouvelle carte':' · Doublon (+'+item.dustGain+' Éclats)');
  nextPullButton.textContent=currentIndex===currentDraw.length-1?'Voir les cinq cartes':'Carte suivante ›';
  nextPullButton.hidden=false;
  // Keep the card on screen until the player chooses to continue.
  if(reducedMotion.matches)nextPullButton.focus({preventScroll:true});
  else afterBooster(item.shiny?950:420,()=>{if(boosterBusy&&cardFaceUp)nextPullButton.focus({preventScroll:true})});
}
function completeBoosterReveal(){
  if(!boosterBusy)return;
  cancelBoosterTimers();
  boosterBusy=false;changingCard=false;
  boosterArt.classList.remove('is-opening');
  boosterOpening.classList.remove('is-unsealing');
  boosterActions.hidden=true;nextPullButton.hidden=true;boosterStep.hidden=true;
  boosterGrid.classList.remove('booster-pulls','booster-single');
  boosterGrid.classList.add('booster-gallery');
  boosterGrid.replaceChildren(...currentDraw.map(item=>makeCard(item.card,item.finish??item.shiny)));
  boosterSummary.hidden=false;
  $('#booster-codex-action').hidden=false;
  // A single, late reveal highlight for exceptional finds. Never preview
  // hidden cards or alter the already-saved purchase and shard rewards.
  const moment=boosterMoment(currentDraw);
  const momentNote=moment?el('div','booster-moment booster-moment-'+moment.kind):null;
  if(momentNote){
    const copy=el('div','booster-moment-copy');
    copy.append(el('strong','booster-moment-title',moment.title),
      el('small','booster-moment-detail',moment.detail));
    const mark=el('span','booster-moment-mark',moment.symbol);
    mark.setAttribute('aria-hidden','true');
    momentNote.append(mark,copy);
  }
  boosterSummary.replaceChildren(
    ...(momentNote?[momentNote]:[]),
    el('span','',drawSummary.newCount+' nouvelle(s)'),
    el('span','',drawSummary.duplicates+' doublon(s) · +'+drawSummary.dustEarned+' Éclats'),
    el('span',drawSummary.calligraphicCount?'booster-star':'',drawSummary.calligraphicCount+' Calligraphique(s)'),
    el('span',drawSummary.shinyCount?'booster-star':'',drawSummary.shinyCount+' Chromatique(s)'),
    el('span',drawSummary.holographicCount?'booster-star':'',drawSummary.holographicCount+' Holographique(s)')
  );
  $('#pack-title').textContent='Archive ouverte · '+state.opened;
  $('#pack-msg').textContent='Voici tes cinq cartes. Touche une carte pour la retrouver dans le Codex.';
  boosterProgressFill.style.width='100%';
  update();
}
function advanceBoosterCard(){
  if(!boosterBusy||!cardFaceUp||changingCard)return;
  if(currentIndex===currentDraw.length-1){completeBoosterReveal();return}
  changingCard=true;
  cancelBoosterTimers();
  nextPullButton.disabled=true;
  const oldTile=boosterGrid.querySelector('.pull-flip');
  if(oldTile)oldTile.classList.add('is-leaving');
  const next=()=>{
    nextPullButton.disabled=false;
    if(boosterBusy)showBoosterCard(currentIndex+1);
  };
  if(reducedMotion.matches)next();
  else afterBooster(235,next);
}
function revealBoosterAll(){
  if(!boosterBusy)return;
  // Skipping the presentation does not change the already-saved five cards.
  completeBoosterReveal();
}
function openOriginesBooster(){
  if(boosterBusy||state.coins<PACK_PRICE)return;
  const edition=selectedBooster;
  if(!boosterView(edition))return;
  const results=drawCollectionPack(edition);
  cancelBoosterTimers();
  boosterBusy=true;
  state.coins-=PACK_PRICE;
  state.opened++;
  let newCount=0,duplicates=0,shinyCount=0,dustEarned=0;
  let holographicCount=0,calligraphicCount=0;
  currentDraw=results.map(item=>{
    const card=CARD_BY_ID.get(item.id);
    const isNew=!state.owned[card.id];
    const dustGain=isNew?0:duplicateDustReward(card);
    if(isNew)newCount++;else{duplicates++;state.dust+=dustGain;dustEarned+=dustGain}
    state.owned[card.id]=(state.owned[card.id]||0)+1;
    const finish=item.finish||(item.shiny?'chromatic':'normal');
    if(!state.finishCounts)state.finishCounts={normal:{},chromatic:{},holographic:{},calligraphic:{}};
    const finishInventory=state.finishCounts[finish]||state.finishCounts.normal;
    finishInventory[card.id]=(finishInventory[card.id]||0)+1;
    const firstChromatic=item.shiny&&!state.shiny[card.id];
    if(item.shiny){state.shiny[card.id]=true;shinyCount++}
    if(finish==='holographic')holographicCount++;
    if(finish==='calligraphic')calligraphicCount++;
    if(firstChromatic||isNew){
      state.recentFinds=recordRecentFind(state.recentFinds,card.id,
        firstChromatic?'chromatic':'new');
    }
    return {...item,finish,card,isNew,dustGain};
  });
  drawSummary={newCount,duplicates,shinyCount,holographicCount,calligraphicCount,dustEarned};
  update(); // Persists the purchase before any animation or navigation.
  boosterSummary.hidden=true;
  $('#booster-codex-action').hidden=true;
  boosterSummary.replaceChildren();
  boosterGrid.replaceChildren();
  boosterGrid.classList.remove('booster-gallery');
  boosterActions.hidden=false;nextPullButton.hidden=true;
  boosterProgress.hidden=false;boosterProgressFill.style.width='0%';
  boosterStep.hidden=false;boosterStep.textContent='Préparation des cartes…';
  $('#pack-title').textContent=edition==='au-dela-du-verre'?'Les deux horizons s’accordent…':edition==='origines'?'Le sceau des Origines s’éveille…':'Le sceau des Reflets brisés s’éveille…';
  $('#pack-msg').textContent='Le paquet s’ouvre : cinq découvertes t’attendent.';
  boosterOpening.classList.add('is-unsealing');
  boosterArt.classList.add('is-opening');
  const startReveal=()=>{
    if(!boosterBusy)return;
    boosterArt.classList.remove('is-opening');
    boosterOpening.classList.remove('is-unsealing');
    showBoosterCard(0,false);
    if(mobileView.matches&&$('#page-boosters').classList.contains('active')&&!reducedMotion.matches)
      boosterOpening.scrollIntoView({behavior:'smooth',block:'start'});
  };
  if(reducedMotion.matches)startReveal();
  else{
    afterBooster(370,()=>{
      if(boosterBusy)$('#pack-msg').textContent='Le sceau se brise…';
    });
    afterBooster(BOOSTER_UNSEAL_MS,startReveal);
  }
}
$('#buy').addEventListener('click',openOriginesBooster);
/* Galerie extensible: chaque paquet publié porte son identifiant et sa saison.
   Ajouter une collection consiste à ajouter sa tuile, son visuel HD et son
   moteur de tirage; aucune grille ou navigation par saison n'est à recoder. */
const boosterDialog=$('#booster-dialog');
const boosterChoices=$$('.booster-choice');
const boosterSeasonTabs=$('#booster-season-tabs');
function selectBoosterSeason(season){
  for(const control of boosterChoices){
    control.hidden=control.dataset.season!==season;
  }
  for(const control of $$('.booster-season-choice')){
    const active=control.dataset.season===season;
    control.classList.toggle('is-active',active);
    control.setAttribute('aria-pressed',String(active));
  }
}
function renderBoosterSeasons(){
  const seasons=new Map();
  for(const control of boosterChoices){
    const season=control.dataset.season;
    if(season&&!seasons.has(season)){
      seasons.set(season,control.dataset.seasonTitle||season);
    }
  }
  boosterSeasonTabs.replaceChildren();
  for(const [season,title] of seasons){
    const tab=button('✧ '+title,()=>selectBoosterSeason(season),'booster-season-choice');
    tab.dataset.season=season;
    tab.setAttribute('aria-pressed','false');
    boosterSeasonTabs.append(tab);
  }
  const first=seasons.keys().next().value;
  if(first)selectBoosterSeason(first);
}
function closeBoosterDialog(){
  if(boosterBusy)completeBoosterReveal();
  if(boosterDialog.open)boosterDialog.close();
}
function openBoosterDialog(control){
  if(boosterBusy||!boosterView(control.dataset.booster))return;
  if(selectedBooster!==control.dataset.booster)selectBooster(control.dataset.booster);
  $('#booster-dialog-kicker').textContent=control.dataset.seasonTitle||'LES ARCHIVES';
  boosterDialog.classList.remove('has-results');
  if(!boosterDialog.open)boosterDialog.showModal();
  ($('#buy').disabled?$('#booster-funds-action'):$('#buy')).focus({preventScroll:true});
}

$('#booster-close').addEventListener('click',closeBoosterDialog);
boosterDialog.addEventListener('cancel',event=>{
  event.preventDefault();
  closeBoosterDialog();
});
boosterDialog.addEventListener('click',event=>{
  if(event.target===boosterDialog)closeBoosterDialog();
});
boosterDialog.addEventListener('close',()=>{
  // Native 'close' is queued; a quick new selection can reopen the same
  // dialog before the old close event arrives. Never clear a live draw.
  if(boosterDialog.open)return;
  // A purchase has already been saved; closing only resets the presentation.
  if(boosterBusy)completeBoosterReveal();
  clearBoosterScene();
  boosterDialog.classList.remove('has-results');
  update();
});
renderBoosterSeasons();

// The original handler has already saved the purchase: presentation can expand
// after it, without entering the isolated gameplay handler tested by old suites.
$('#buy').addEventListener('click',()=>{
  if(boosterBusy)boosterDialog.classList.add('has-results');
});
$('#guide-action').addEventListener('click',()=>{
 const progress=beginnerGuide(state,PACK_PRICE);
 if(progress.complete)navigate('collection');
 else if(progress.stage==='pack')navigate('boosters');
 else{
  // Offer the difficulty controls; do not silently change a player's choice.
  setTrialView('hub');
  const target=$('#difficulty-options button[data-difficulty="initiation"]');
  target.focus({preventScroll:true});
  target.scrollIntoView({block:'nearest',behavior:'auto'});
 }
});
$('#guide-dismiss').addEventListener('click',()=>{guideManual=false;rememberGuideDismissal(true);renderBeginnerGuide();setTrialView('hub');$('#difficulty-options button.is-active')?.focus({preventScroll:true})});
$('#guide-reopen').addEventListener('click',()=>{guideManual=beginnerGuide(state,PACK_PRICE).complete;rememberGuideDismissal(false);navigate('jouer');setTrialView('guide');$('#guide-title').focus({preventScroll:true});$('#beginner-guide').scrollIntoView({block:'nearest',behavior:'auto'})});
$('#booster-funds-action').addEventListener('click',()=>navigate('jouer'));
$('#booster-codex-action').addEventListener('click',()=>{
 if(boosterBusy||!currentDraw.length)return;
 const chapter=collectionForCard(currentDraw[0].card);
 if(chapter){activeSeason=chapter.season.id;activeCollection=chapter.collection.id;selectedCard=null;}
 navigate('collection');
});
revealAllButton.addEventListener('click',revealBoosterAll);
nextPullButton.addEventListener('click',advanceBoosterCard);

const success=[['Premiers pas','Terminer une épreuve',()=>state.wins>=1],['Explorateur','Terminer 10 épreuves',()=>state.wins>=10],['Archéologue','Terminer 50 épreuves',()=>state.wins>=50],['Curieux','Ouvrir son premier booster',()=>state.opened>=1],['Collectionneur','Découvrir 12 cartes',()=>Object.keys(state.owned).length>=12],['Archiviste','Découvrir les 24 cartes',()=>Object.keys(state.owned).length>=24],['Éclat rare','Trouver une carte Chromatique',()=>Object.keys(state.shiny).length>=1],['Pactole','Gagner 1 000 Couronnes',()=>state.earned>=1000],['Chasseur de légendes','Obtenir une carte légendaire',()=>CARDS.some(c=>c.rarity==='legendary'&&state.owned[c.id])]];
function renderHonorifics(){
  const titles=earnedTrialTitles(state.trialStats,state.trialRecords);
  const equipped=validEquippedTitle(state.titleId,state.trialStats,state.trialRecords);
  const current=equipped===null?null:titles[equipped];
  const active=$('#honorific-active');
  active.textContent=current?'✦ '+current.name:'Aucun titre équipé';
  const list=$('#honorific-list');
  list.replaceChildren();
  titles.forEach(title=>{
    const selected=equipped===title.id;
    const tile=button('',()=>{
      if(!title.earned)return;
      const next=toggleEquippedTitle(state.titleId,title.id,state.trialStats,state.trialRecords);
      if(next===state.titleId)return;
      state.titleId=next;
      save();
      renderHonorifics();
      notify(next===null?'Titre retiré.':'Titre équipé : '+title.name);
    },'honorific'+(title.earned?' is-unlocked':' is-locked')+(selected?' is-equipped':''));
    tile.disabled=!title.earned;
    tile.setAttribute('aria-pressed',String(selected));
    tile.setAttribute('aria-label',title.earned?title.name+' · '+(selected?'équipé, retirer le titre':'obtenu, équiper le titre'):'Titre scellé · médaille d’Or requise');
    tile.append(
      el('span','honorific-symbol',title.earned?title.symbol:'◇'),
      el('span','honorific-name',title.earned?title.name:'Titre scellé'),
      el('span','honorific-state',selected?'Équipé':title.earned?'Choisir':'À débloquer')
    );
    list.append(tile);
  });
}
function renderJourney(){
  const groups=journeyProgress(CARDS,state);
  const root=$('#journey-groups');
  // Keep the player's expanded sections while refreshing actual progress.
  const expanded=new Map(Array.from(root.children).map(section=>[section.dataset.journeyGroup,section.open]));
  const fragment=document.createDocumentFragment();
  for(const group of groups){
    const section=el('details','journey-group');
    section.dataset.journeyGroup=group.id;
    section.open=expanded.has(group.id)?expanded.get(group.id):group.id==='collection';
    const earned=group.tracks.reduce((n,t)=>n+t.achieved,0);
    const total=group.tracks.reduce((n,t)=>n+t.targets.length,0);
    const summary=el('summary','journey-summary');
    summary.append(el('strong','',group.label),el('small','',earned+' / '+total+' paliers'));
    section.append(summary);
    for(const entry of group.tracks){
      const row=el('article','journey-track'+(entry.complete?' is-complete':''));
      row.dataset.journeyTrack=entry.id;
      const title=el('div','journey-track-title');
      title.append(el('h3','',entry.label),el('strong','journey-value',entry.current.toLocaleString('fr-FR')+' / '+entry.total.toLocaleString('fr-FR')));
      row.append(title,el('p','',entry.description));
      const meter=el('div','journey-meter');
      meter.setAttribute('role','progressbar');meter.setAttribute('aria-label',entry.label);
      meter.setAttribute('aria-valuemin','0');meter.setAttribute('aria-valuemax',String(entry.total));meter.setAttribute('aria-valuenow',String(Math.min(entry.current,entry.total)));
      const fill=el('span');fill.style.width=entry.percent+'%';meter.append(fill);row.append(meter);
      const milestones=el('div','journey-milestones');milestones.setAttribute('aria-label','Paliers permanents');
      for(const value of entry.targets){
        const done=entry.current>=value;
        const mark=el('span',done?'is-earned':'',(done?'✓ ':'◇ ')+value.toLocaleString('fr-FR'));
        mark.setAttribute('aria-label',value+' · '+(done?'atteint':'à atteindre'));
        milestones.append(mark);
      }
      const foot=el('div','journey-track-foot');
      foot.append(el('small','',entry.complete?'✦ Parcours achevé':'Prochain palier : '+entry.next.toLocaleString('fr-FR')));
      if(!entry.complete){
        const label=entry.page==='collection'?'Ouvrir le Codex':entry.page==='expeditions'?'Explorer':'Jouer';
        foot.append(button(label+' ›',()=>navigate(entry.page),'secondary journey-link'));
      }
      row.append(milestones,foot);section.append(row);
    }
    fragment.append(section);
  }
  root.replaceChildren(fragment);
  $('#journey-count').textContent=groups.flatMap(g=>g.tracks).reduce((n,t)=>n+t.achieved,0)+' paliers atteints';
}
function renderLoreBook(){
  const groups=loreArchive(CARDS,state);
  const root=$('#lore-groups');
  const opened=new Set(Array.from(root.querySelectorAll('details[open]')).map(node=>node.dataset.loreKey));
  const firstRender=!root.childElementCount;
  const fragment=document.createDocumentFragment();
  for(const group of groups){
    const section=el('details','lore-group');
    section.dataset.loreKey=group.id;
    section.open=opened.has(group.id)||(firstRender&&group.id==='echoes');
    const summary=el('summary','lore-group-summary');
    summary.append(el('strong','',group.label),el('small','',group.unlocked+' / '+group.total));
    section.append(summary);
    for(const entry of group.entries){
      if(!entry.unlocked){
        const sealed=el('div','lore-sealed');
        sealed.append(el('strong','','◇ '+entry.title),el('small','',entry.progress));
        section.append(sealed);continue;
      }
      const page=el('details','lore-page');
      page.dataset.loreKey=entry.id;page.open=opened.has(entry.id);
      page.append(el('summary','','✦ '+entry.title));
      const story=el('div','lore-story');
      story.append(el('p','lore-source',entry.source),el('p','lore-text',entry.body));
      if(entry.cards.length){
        story.append(el('p','lore-source','Archives liées'));
        const links=el('div','lore-card-links');
        for(const related of entry.cards){
          const card=CARDS.find(c=>c.id===related.id);
          if(!card||!state.owned[card.id])continue;
          links.append(button(related.name,()=>openLoreCard(card),'secondary lore-card-link'));
        }
        story.append(links);
      }
      page.append(story);section.append(page);
    }
    fragment.append(section);
  }
  root.replaceChildren(fragment);
  $('#lore-count').textContent=groups.reduce((n,g)=>n+g.unlocked,0)+' / '+groups.reduce((n,g)=>n+g.total,0)+' récits retrouvés';
}
function openLoreCard(card){
  if(!state.owned[card.id])return;
  const chapter=collectionForCard(card);
  if(!chapter)return;
  activeSeason=chapter.season.id;activeCollection=chapter.collection.id;selectedCard=null;
  navigate('collection');
  inspect(card,!!state.shiny[card.id]);
}
function openLoreBook(){
  navigate('succes');
  const book=$('#lore-book');
  book.open=true;
  const summary=book.querySelector('summary');
  summary.focus({preventScroll:true});summary.scrollIntoView({block:'start',behavior:'auto'});
}
function renderAchievements(){
  const root=$('#achievements');
  root.replaceChildren();
  for(const [index,[title,description,test]] of success.entries()){
    const done=test();
    const box=el('article','achievement'+(done?'':' locked'));
    box.append(el('h3','',done?'✦ '+title:'◇ Succès '+String(index+1).padStart(2,'0')+' · scellé'),
      el('p','',done?description:'Poursuis tes découvertes pour le révéler.'),
      el('small','muted',done?'Accompli':'À découvrir'));
    root.append(box);
  }
  renderHonorifics();
  renderJourney();
  renderLoreBook();
}
$('#lore-from-journal').addEventListener('click',openLoreBook);
$('#lore-from-expedition').addEventListener('click',openLoreBook);
// Save transfer remains opt-in and cannot interfere with game loops or rewards.
const backupDialog=$('#backup-dialog');
const backupStatus=$('#backup-status');
const backupFile=$('#backup-file');
const backupRestore=$('#backup-restore');
let backupBusy=false;
function backupMessage(message,error=false){
  backupStatus.textContent=message;
  backupStatus.classList.toggle('is-error',error);
}
function syncBackupRestore(){
  try{backupRestore.disabled=localStorage.getItem(PREVIOUS_SAVE_KEY)===null}
  catch{backupRestore.disabled=true}
}
$('#backup-open').addEventListener('click',()=>{
  backupMessage(saveSession.problem,!!saveSession.problem);
  $('#backup-export').textContent=saveSession.needsRecovery?'Télécharger les données brutes':'Télécharger ma sauvegarde';
  syncBackupRestore();
  backupDialog.showModal();
});
$('#backup-close').addEventListener('click',()=>backupDialog.close());
$('#backup-export').addEventListener('click',async()=>{
  if(backupBusy)return;
  backupBusy=true;
  const control=$('#backup-export');
  control.disabled=true;
  backupMessage('Préparation du fichier de sauvegarde…');
  try{
    const recovery=saveSession.needsRecovery;
    const json=recovery?saveSession.raw:await createBackup(state,CARDS.map(card=>card.id));
    const file=new Blob([json],{type:'application/json;charset=utf-8'});
    const url=URL.createObjectURL(file);
    try{
      const link=document.createElement('a');
      link.href=url;
      link.download=(DEV_PREVIEW?'DEV-':'')+(recovery?'Aetherium-recuperation-brute-':'Aetherium-sauvegarde-')+new Date().toISOString().slice(0,10)+(recovery?'.txt':'.json');
      document.body.append(link);
      link.click();
      link.remove();
    }finally{
      setTimeout(()=>URL.revokeObjectURL(url),60000);
    }
    backupMessage(recovery?'Données brutes conservées. Ce fichier est destiné à la récupération technique, pas à l’import direct.':'Fichier préparé. Conserve-le dans un emplacement sûr.');
  }catch(error){
    backupMessage(error?.message||'Exportation impossible dans ce navigateur.',true);
  }finally{
    backupBusy=false;
    control.disabled=false;
  }
});
$('#backup-import').addEventListener('click',()=>{
  if(!backupBusy)backupFile.click();
});
backupFile.addEventListener('change',async()=>{
  const file=backupFile.files?.[0];
  backupFile.value='';
  if(!file||backupBusy)return;
  backupBusy=true;
  const control=$('#backup-import');
  control.disabled=true;
  backupMessage('Vérification du fichier…');
  try{
    if(file.size>MAX_BACKUP_SIZE)
      throw new Error('Fichier trop volumineux (maximum : 1 Mo).');
    const parsed=await decodeBackup(await file.text(),CARDS.map(card=>card.id));
    const {stats,createdAt}=parsed;
    const date=new Date(createdAt).toLocaleString('fr-FR');
    const message='Sauvegarde du '+date+'\n\n'+
      stats.cards+' cartes · '+stats.chromatic+' Chromatiques\n'+
      stats.crowns+' Couronnes · '+stats.shards+' Éclats\n'+
      stats.opened+' boosters ouverts\n\n'+
      'Remplacer la progression de ce navigateur par cette sauvegarde ?\n'+
      'La progression actuelle sera conservée localement pour annuler cet import.';
    if(!window.confirm(message)){
      backupMessage('Importation annulée : ta progression n’a pas été modifiée.');
      return;
    }
    saveSession.assertCurrent();
    installImportedSave(localStorage,parsed.state);
    window.location.reload(); // Reload the normal, already-tested game loader.
  }catch(error){
    backupMessage(error?.message||'Fichier invalide : aucune modification effectuée.',true);
  }finally{
    backupBusy=false;
    control.disabled=false;
    syncBackupRestore();
  }
});
backupRestore.addEventListener('click',()=>{
  if(backupBusy||backupRestore.disabled)return;
  if(!window.confirm('Restaurer la sauvegarde d’avant le dernier import ? La progression actuelle sera remplacée.'))return;
  try{
    saveSession.assertCurrent();
    parseStoredSave(localStorage.getItem(PREVIOUS_SAVE_KEY),saveCardIds);
    restorePreviousSave(localStorage);
    window.location.reload();
  }catch(error){
    backupMessage(error?.message||'Restauration impossible.',true);
    syncBackupRestore();
  }
});
$('#reset').addEventListener('click',()=>{if(!confirm('Effacer définitivement les cartes et la progression sauvegardées sur cet appareil ?'))return;try{saveSession.write(fresh(),{replace:true})}catch(error){showSaveWarning(error.message);return}clearBoosterScene();enableHolographicInspection(null);try{localStorage.removeItem(PREVIOUS_SAVE_KEY)}catch{}state=fresh();circuitSession.reset();renderCircuits();missingFinish='all';guideManual=false;rememberGuideDismissal(false);state.trialStats=sanitizedTrialStats(state.trialStats);trialStarters.forEach(start=>start());renderTrialMastery();renderDifficultyChoice();renderExpedition();selectedCard=null;forgeSelectedId=null;forgeFilter='all';forgeMode='discovery';$('#atelier-mode').value=forgeMode;$('#atelier-filter').value='all';$('#atelier-result').hidden=true;$('#inspector').replaceChildren(el('p','muted','Sélectionne une carte découverte pour l’admirer.'));$('#pulls').replaceChildren();$('#pack-title').textContent='Les archives attendent leur voyageur.';$('#pack-msg').textContent='Gagne des Couronnes en jouant pour ouvrir des boosters.';update();renderCollection();notify('Progression réinitialisée.')});
syncMobileSheets();
selectBooster('origines');
renderExpedition();
update();
navigate(APP_PAGES.includes(location.hash.slice(1))?location.hash.slice(1):'jouer');
mountTrialMobilePlay();
window.addEventListener('hashchange',()=>{
  const page=location.hash.slice(1);
  if(APP_PAGES.includes(page)&&!$('#page-'+page).classList.contains('active'))navigate(page);
});

mountConfrontations({cards:CARDS,getOwned:()=>state.owned,openBoosters:()=>navigate('boosters')});
