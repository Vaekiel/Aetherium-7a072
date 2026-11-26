/* Read-only information sheets and mobile board fitting. No game rules or saves. */
export function mountTrialMobilePlay(){
 const q=(s,r=document)=>r.querySelector(s);
 const compact=window.matchMedia('(max-width:850px)');
 const page=q('#page-jouer'), expedition=q('#page-expeditions');
 const info=q('#trial-mobile-info'), story=q('#expedition-mobile-story');
 const dialog=document.createElement('dialog');
 dialog.className='trial-reading-dialog';
 dialog.setAttribute('aria-labelledby','trial-reading-title');
 const heading=document.createElement('h2');heading.id='trial-reading-title';
 const close=document.createElement('button');close.type='button';close.className='secondary';close.textContent='Fermer';
 const body=document.createElement('div');body.className='trial-reading-content';
 dialog.append(heading,close,body);document.body.append(dialog);
 close.addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
 function read(title,nodes){
  if(!nodes.length)return;
  heading.textContent=title;
  body.replaceChildren(...nodes.map(node=>{
   const copy=node.cloneNode(true);
   for(const detail of [copy,...copy.querySelectorAll('details')])if(detail.tagName==='DETAILS')detail.open=true;
   return copy;
  }));
  dialog.showModal();
 }
 info.addEventListener('click',()=>{
  const game=q('.game.mobile-active',page);
  if(!game)return;
  read('Règles et progression',Array.from(game.querySelectorAll('.trial-objective,.trial-mastery,.memory-fresco,.excavation-site-description,.excavation-artifact-note,.alchemy-family-legend,.alchemy-grimoire,.trial-records')));
 });
 story.addEventListener('click',()=>{
  const content=q('#expedition-content',expedition);
  read('Le récit des Marches',Array.from(content.querySelectorAll('.expedition-chapter,.expedition-fragment,.expedition-after,.expedition-stage-title,.expedition-description')));
 });
 page.classList.add('mobile-play-ready');expedition.classList.add('mobile-story-ready');
 info.hidden=false;story.hidden=false;
 let frame=0,observed=null;
 const observer=typeof ResizeObserver==='function'?new ResizeObserver(schedule):null;
 function schedule(){
  if(frame)return;
  frame=requestAnimationFrame(()=>{frame=0;fit()});
 }
 function fit(){
  const game=q('.game.mobile-active',page);
  if(observed!==game){if(observed)observer?.unobserve(observed);observed=game;if(game)observer?.observe(game)}
  if(!game)return;
  const board=q('.board',game);
  if(!board)return;
  if(!compact.matches||!page.classList.contains('active')||page.dataset.trialView!=='play'){
   board.style.removeProperty('--mobile-board-width');return;
  }
  const nav=q('.top nav'), viewport=window.visualViewport;
  const bottom=Math.min(viewport?viewport.offsetTop+viewport.height:window.innerHeight,nav?.getBoundingClientRect().top||window.innerHeight);
  const rect=game.getBoundingClientRect(), br=board.getBoundingClientRect();
  if(rect.width<=0||br.width<=0)return;
  const style=getComputedStyle(board), gameStyle=getComputedStyle(game);
  const cols=style.gridTemplateColumns.trim().split(/\s+/).length;
  const rows=Math.ceil(board.children.length/Math.max(1,cols));
  if(!rows||!cols)return;
  const gap=parseFloat(style.rowGap)||0, colGap=parseFloat(style.columnGap)||0;
  const py=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0)+(parseFloat(style.borderTopWidth)||0)+(parseFloat(style.borderBottomWidth)||0);
  const px=(parseFloat(style.paddingLeft)||0)+(parseFloat(style.paddingRight)||0)+(parseFloat(style.borderLeftWidth)||0)+(parseFloat(style.borderRightWidth)||0);
  const available=bottom-rect.top-(rect.height-br.height)-8;
  const tile=Math.max(44,Math.floor((available-py-gap*(rows-1))/rows));
  const inner=rect.width-(parseFloat(gameStyle.paddingLeft)||0)-(parseFloat(gameStyle.paddingRight)||0)-(parseFloat(gameStyle.borderLeftWidth)||0)-(parseFloat(gameStyle.borderRightWidth)||0);
  const width=Math.max(0,Math.floor(Math.min(inner,cols*tile+(cols-1)*colGap+px)));
  const value=width+'px';
  if(board.style.getPropertyValue('--mobile-board-width')!==value)board.style.setProperty('--mobile-board-width',value);
 }
 new MutationObserver(schedule).observe(page,{attributes:true,attributeFilter:['class','data-trial-view']});
 new MutationObserver(schedule).observe(q('#games'),{subtree:true,attributes:true,attributeFilter:['class'],childList:true});
 window.addEventListener('resize',schedule);window.visualViewport?.addEventListener('resize',schedule);
 compact.addEventListener('change',schedule);
 schedule();
}
