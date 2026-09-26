const WEBHOOK='https://hook.eu2.make.com/9otc8coig6ulfw6eeqt8oraph8rhi4y1';
const SCREEN_WEBHOOK='https://hook.eu2.make.com/gstybp793srkspjvn017jj8r0mu41jv8';
const KIDS=[['rassell','Rassell'],['michelle','Michelle']];
const els={rassell:document.getElementById('rassellTasks'),michelle:document.getElementById('michelleTasks')};
const openEls={rassell:document.getElementById('rassellOpen'),michelle:document.getElementById('michelleOpen')};
const message=document.getElementById('message');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function itemHtml(t,child,isReward){const value=Number(t.points||0),pointsLabel=value<0?`${Math.abs(value)} punten uitgegeven`:`+${value} punten`;return `<article class="task${isReward?' reward-item':''}"><div><div class="task-name">${isReward?'🎁 ':'✓ '}${escapeHtml(t.title)}</div><small>${isReward?'Beloning · ':''}${pointsLabel}</small></div><button class="reset" type="button" data-task-id="${escapeHtml(t.id)}" data-child="${child}">Terugzetten</button></article>`;}

// Top summary: one card per child with points, today's progress and screen time.
function renderOverview(key,child){
  const card=document.querySelector(`.ov-kid[data-child="${key}"]`);if(!card)return;
  const done=(child.completedTasks||[]).length,open=(child.outstandingTasks||[]).length,total=done+open;
  const missed=Number(child.missedPoints||0),noScreen=String(child.screenTime||'').toLowerCase()==='no';
  card.querySelector('.points-val').textContent=Number(child.points||0);
  card.querySelector('.bar i').style.width=total?`${Math.round(done/total*100)}%`:'0%';
  card.querySelector('.ov-today').textContent=(total?(open?`${done} van ${total} taakjes klaar`:`Alle ${total} taakjes klaar 🎉`):'Geen taakjes vandaag')+(missed?` · ${Math.abs(missed)} punten gemist`:'');
  const pill=card.querySelector('.screen');pill.textContent=noScreen?'📺 Nee':'📺 Ja';pill.classList.toggle('no',noScreen);
}

function render(data){let count=0;for(const [key,name] of KIDS){const child=data.children?.[key]||{},tasks=child.completedTasks||[],rewards=child.redemptions||[],open=child.outstandingTasks||[];count+=tasks.length+rewards.length;renderOverview(key,child);
  openEls[key].innerHTML=open.length?`<p class="list-label">Nog te doen (${open.length})</p><div class="chips">${open.map(t=>`<span class="chip">${escapeHtml(t.title)}</span>`).join('')}</div>`:'<p class="list-label all-done">Niets meer open 🎉</p>';
  const rows=[...tasks.map(t=>itemHtml(t,name,false)),...rewards.map(t=>itemHtml(t,name,true))];els[key].innerHTML=(rows.length?`<p class="list-label">Gedaan (${rows.length})</p>`+rows.join(''):'<div class="empty small">Nog niets afgevinkt</div>');
  const screenButton=document.querySelector(`.screen-off[data-child="${name}"]`);if(screenButton){const off=String(child.screenTime||'').toLowerCase()==='no';screenButton.disabled=off;screenButton.textContent=off?'🚫 Geen schermtijd ✓':'🚫 Geen schermtijd';screenButton.dataset.busy='false';}}
  document.getElementById('completedCount').textContent=count;document.getElementById('updated').textContent=data.updatedAt?new Date(data.updatedAt).toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'}):'—';}

// Top summary: the weekly boss, from boss.json.
function renderBoss(b){
  const card=document.getElementById('ov-boss');if(!card||!b||b.version!==1)return;
  const max=Number(b.maxHp||0),hp=Math.max(0,Number(b.hp||0)),c=b.contributions||{};
  card.querySelector('.boss-name').textContent=b.name||'Weekbaas';
  card.querySelector('.bar i').style.width=max?`${Math.round(hp/max*100)}%`:'0%';
  const state=card.querySelector('.boss-state');
  state.textContent=b.chestOpenedAt?'Kist open':b.defeatedAt?'Verslagen':`${hp}/${max} HP`;
  state.classList.toggle('won',!!b.defeatedAt);
  card.querySelector('.boss-detail').textContent=`Rassell ${c.rassell?.damage||0} · Michelle ${c.michelle?.damage||0} schade`;
}

async function load(){try{const r=await fetch(`latest.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error('Dashboard laden lukte niet');render(await r.json());}catch(e){message.textContent=e.message;message.className='message error';}
  try{const r=await fetch(`boss.json?t=${Date.now()}`,{cache:'no-store'});if(r.ok)renderBoss(await r.json());}catch(e){}}
async function resetItem(button){
  if(button.dataset.busy==='true')return;
  button.dataset.busy='true';
  const taskId=button.dataset.taskId,child=button.dataset.child;
  button.disabled=true;
  button.textContent='Bezig…';
  message.textContent='';
  try{
    const r=await fetch(WEBHOOK,{method:'POST',body:new URLSearchParams({taskId,child})});
    if(!r.ok)throw new Error('Reset failed');
    const data=await r.json();
    render(data);
    message.textContent='Teruggezet en punten teruggedraaid.';
    message.className='message success';
  }catch(err){
    button.disabled=false;
    button.textContent='Terugzetten';
    button.dataset.busy='false';
    message.textContent='Terugzetten lukte niet. Probeer het nog eens.';
    message.className='message error';
  }
}
document.addEventListener('click',e=>{
  const button=e.target.closest('button.reset');
  if(!button)return;
  e.preventDefault();
  e.stopPropagation();
  if(button.dataset.busy==='true')return;
  const approved=window.confirm('Dit terugzetten en de punten terugdraaien?');
  if(approved!==true)return;
  resetItem(button);
});
load();setInterval(load,60000);
async function disableScreenTime(button){
  if(button.dataset.busy==='true')return;
  const child=button.dataset.child;
  button.dataset.busy='true';
  button.disabled=true;
  button.textContent='Bezig…';
  message.textContent='';
  try{
    const r=await fetch(SCREEN_WEBHOOK,{method:'POST',body:new URLSearchParams({child})});
    if(!r.ok)throw new Error('Screen-time override failed');
    await r.json();
    message.textContent=`${child}: vandaag geen schermtijd.`;
    message.className='message success';
    button.textContent='🚫 Geen schermtijd ✓';
    setTimeout(load,1200);
  }catch(err){
    button.disabled=false;
    button.textContent='🚫 Geen schermtijd';
    button.dataset.busy='false';
    message.textContent='Schermtijd aanpassen lukte niet. Probeer het nog eens.';
    message.className='message error';
  }
}

document.addEventListener('click',e=>{
  const button=e.target.closest('button.screen-off');
  if(!button)return;
  e.preventDefault();
  e.stopPropagation();
  if(button.dataset.busy==='true'||button.disabled)return;
  const child=button.dataset.child;
  if(window.confirm(`${child} vandaag GEEN schermtijd geven?`)) disableScreenTime(button);
});

// Messages show as a toast at the bottom of the screen and fade after a few seconds.
document.querySelectorAll('.toasts .message').forEach(el=>{
  let timer;
  new MutationObserver(()=>{clearTimeout(timer);if(el.textContent)timer=setTimeout(()=>{el.textContent='';},6000);}).observe(el,{childList:true,characterData:true,subtree:true});
});
