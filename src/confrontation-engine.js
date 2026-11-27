// Moteur expérimental indépendant des sauvegardes.
export const enemies=[{"name":"Sentinelle de verre","hp":24,"attack":3},{"name":"Gardien des reflets","hp":72,"attack":9},{"name":"Colosse prismatique","hp":145,"attack":17}];
export function stats(c){return {attack:c.attack,health:c.health,flux:Math.max(1,Math.round((c.attack+c.health)/4))}}

export function createBattle(team,rank=0){
 if(!Array.isArray(team)||team.length<1||team.length>4||new Set(team.map(c=>c.type)).size!==team.length||!team.some(c=>c.type==='Héros'||c.type==='Créature'))throw Error("Alliance invalide");
 const enemy=enemies[rank];if(!enemy)throw Error("Rang invalide");
 const sum=fn=>team.reduce((v,c)=>v+fn(c),0),maxHealth=sum(c=>c.health);
 return {enemy,turn:1,hp:maxHealth,maxHealth,enemyHp:enemy.hp,attack:Math.max(1,sum(c=>['Héros','Créature'].includes(c.type)?c.attack:c.type==='Artefact'?Math.ceil(c.attack/3):0)),spell:Math.max(1,sum(c=>stats(c).flux*(c.type==='Sort'?2:1))),energy:3,status:'active',log:'La confrontation commence.'};
}

export function intent(b){return ['attaque','charge','garde'][(b.turn-1)%3]}

export function playTurn(b,action){
 if(b.status!=='active'||!['attack','spell','guard'].includes(action)||action==='spell'&&b.energy<2)return b;
 const next={...b},i=intent(b);let damage=0;
 if(action==='attack'){damage=i==='garde'?Math.max(1,Math.floor(b.attack/2)):b.attack;next.energy=Math.min(5,b.energy+1)}
 if(action==='spell'){damage=b.spell;next.energy-=2}
 if(action==='guard')next.energy=Math.min(5,b.energy+2);
 next.enemyHp=Math.max(0,b.enemyHp-damage);
 if(!next.enemyHp){next.status='win';next.log=damage+' dégâts. Victoire !';return next}
 let incoming=i==='attaque'?b.enemy.attack:i==='charge'?Math.ceil(b.enemy.attack*1.6):0;
 if(action==='guard')incoming=Math.floor(incoming/4);
 next.hp=Math.max(0,b.hp-incoming);next.turn++;
 next.status=next.hp===0?'loss':'active';
 next.log=(damage?damage+' dégâts infligés. ':'Posture défensive. ')+incoming+' dégâts subis.'+(next.status==='loss'?' Alliance vaincue.':'');
 return next;
}
