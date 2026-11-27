import {enemies,stats,createBattle,intent,playTurn} from './confrontation-engine.js?v=1';
const roles=['Héros','Créature','Sort','Artefact'];
export function mountConfrontations({cards,getOwned,openBoosters}){
 const shortcut=document.getElementById('confrontation-shortcut');if(!shortcut)return;
 const dialog=document.createElement('dialog');dialog.className='confrontation-dialog';dialog.setAttribute('aria-labelledby','confrontation-title');
 dialog.innerHTML='<header class="confrontation-hero"><div><p class="kicker">LES MARCHES DE VERRE · PROTOTYPE DEV</p><h2 id="confrontation-title">Les Confrontations</h2></div><button type="button" class="secondary" data-close>‹ Retour</button></header><div class="confrontation-body"></div>';
 document.body.append(dialog);const body=dialog.querySelector('.confrontation-body');let chosen={},rank=0,battle=null;
 const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n};
 const btn=(txt,fn,cls='secondary')=>{const n=el('button',cls,txt);n.type='button';n.addEventListener('click',fn);return n};
 function renderSetup(){
  battle=null;body.replaceChildren();body.append(el('p','','Compose une alliance avec les cartes de ton Codex. Une carte par catégorie, au moins un Héros ou une Créature. Aucun coût, aucune perte de carte.'));
  const owned=cards.filter(c=>getOwned()?.[c.id]>0);
  if(!owned.some(c=>['Héros','Créature'].includes(c.type))){body.append(el('p','confrontation-log','Il te faut au moins un Héros ou une Créature.'),btn('Découvrir les boosters ›',()=>{dialog.close();openBoosters()},'primary'));return}
  const grid=el('div','confrontation-team'),summary=el('p','confrontation-log');
  const start=btn('Entrer dans l’arène ›',()=>{battle=createBattle(owned.filter(c=>chosen[c.type]===c.id),rank);renderBattle()},'primary');
  function refresh(){const team=owned.filter(c=>chosen[c.type]===c.id);const valid=team.some(c=>['Héros','Créature'].includes(c.type));start.disabled=!valid;summary.textContent=valid?team.length+'/4 cartes · Garde '+team.reduce((n,c)=>n+c.health,0)+' · Adversaire '+enemies[rank].hp+' Garde':'Sélectionne un Héros ou une Créature.'}
  roles.forEach(role=>{
   const wrap=el('label','confrontation-slot');wrap.append(el('strong','',role));
   const select=el('select','');const none=el('option','','— Aucun —');none.value='';select.append(none);
   owned.filter(c=>c.type===role).forEach(c=>{const st=stats(c),op=el('option','',c.name+' · '+st.attack+'/'+st.health+'/'+st.flux);op.value=String(c.id);select.append(op)});
   select.value=String(chosen[role]||'');if(!select.value)delete chosen[role];const desc=el('small','');
   function update(){const card=owned.find(c=>String(c.id)===select.value);if(card){chosen[role]=card.id;const st=stats(card);desc.textContent='Éclat '+st.attack+' · Garde '+st.health+' · Flux '+st.flux}else{delete chosen[role];desc.textContent='Emplacement libre'}}
   select.addEventListener('change',()=>{update();refresh()});wrap.append(select,desc);grid.append(wrap);update();
  });body.append(grid);
  const label=el('label','confrontation-slot');label.append(el('strong','','Adversaire'));const select=el('select','');
  enemies.forEach((e,i)=>{const o=el('option','',['Initiation','Aventure','Maîtrise'][i]+' · '+e.name);o.value=String(i);select.append(o)});select.value=String(rank);select.addEventListener('change',()=>{rank=Number(select.value);refresh()});label.append(select);body.append(label,summary,start,el('small','confrontation-note','Combat expérimental : aucune récompense et aucune modification de ta sauvegarde.'));refresh();
 }
 function meter(name,value,max){const wrap=el('div','confrontation-meter');wrap.append(el('strong','',name+' · '+value+'/'+max));const p=el('progress','');p.max=max;p.value=value;p.setAttribute('aria-label',name);wrap.append(p);return wrap}
 function renderBattle(){
  body.replaceChildren();const b=battle,field=el('section','confrontation-field');
  field.append(el('p','kicker','TOUR '+b.turn),el('h3','',b.enemy.name),meter('Garde adverse',b.enemyHp,b.enemy.hp),meter('Garde de l’alliance',b.hp,b.maxHealth),el('p','','Réserve de Flux : '+b.energy+'/5'));
  const intentions={attaque:'Attaque imminente',charge:'Attaque renforcée imminente',garde:'Garde adverse : Éclat réduit, magie efficace'};
  if(b.status==='active')field.append(el('p','confrontation-log',intentions[intent(b)]));body.append(field);
  const log=el('p','confrontation-log',b.log);log.setAttribute('role','status');body.append(log);
  if(b.status!=='active'){body.append(el('h3','',b.status==='win'?'Victoire !':'Défaite'),btn('Recomposer mon alliance',renderSetup,'primary'));return}
  const actions=el('div','confrontation-actions');
  const act=(name,action,detail)=>{const button=btn(name,()=>{battle=playTurn(battle,action);renderBattle()},'primary');button.append(el('small','',detail));actions.append(button);return button};
  act('Éclat','attack',b.attack+' dégâts · +1 Flux');act('Flux','spell',b.spell+' dégâts · −2 Flux').disabled=b.energy<2;act('Garde','guard','−75 % dégâts · +2 Flux');
  body.append(actions,btn('Abandonner la confrontation',renderSetup));
 }
 shortcut.addEventListener('click',()=>{chosen={};renderSetup();dialog.showModal()});
 dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>{battle=null;if(shortcut.offsetParent)shortcut.focus({preventScroll:true})});
}
