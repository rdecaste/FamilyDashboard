const ENGINE_URL='https://quest-engine.quest-engine.workers.dev';
const COMPLETE_WEBHOOK=ENGINE_URL+'/family/complete';
const REWARD_WEBHOOK=ENGINE_URL+'/family/reward';
const key=CHILD.toLowerCase();
const points=document.getElementById('points'),screen=document.getElementById('screen'),tasks=document.getElementById('tasks'),message=document.getElementById('message');
// Reward buttons are re-drawn from catalog.json (the 🎁 Beloningen list), so look them up each time.
const rewardButtons=()=>[...document.querySelectorAll('button[data-reward]')];
let lastData=null;
// While a save is running the periodic refresh must not redraw the page: it
// would bring back the Complete button of a task that is still being saved.
let saving=0;
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sinceTxt=t=>{if(!t||!t.since)return '';const d=new Date(t.since+'T12:00:00Z');return isNaN(d)?'':`<span class="since">sinds ${['zo','ma','di','wo','do','vr','za'][d.getUTCDay()]}</span>`;};
function render(data){lastData=data;const child=data.children[key];const balance=Number(child.points??0);points.textContent=balance;const allowed=(child.screenTime||'Yes')!=='No';const value=screen.querySelector('.screen-value');if(value)value.textContent=allowed?'YES ✓':'NO ✕';screen.classList.toggle('no',!allowed);screen.classList.toggle('yes',allowed);for(const b of rewardButtons()){const cost=Number(b.dataset.cost);b.disabled=balance<cost;b.title=b.disabled?`You need ${cost-balance} more points`:'';}const items=child.outstandingTasks||[];tasks.innerHTML=items.length?items.map(t=>`<article class="task"><div class="task-name">${escapeHtml(typeof t==='string'?t:t.title)}${t.points?`<b class="pts">+${Number(t.points)}</b>`:''}${sinceTxt(t)}</div><button class="complete" type="button" data-task-id="${escapeHtml(t.id||'')}" ${t.id?'':'disabled'}>Complete</button></article>`).join(''):'<div class="empty">Everything is done ✓</div>';if(window.FamilyExtras)FamilyExtras.render(data);}
async function load(){if(saving)return;try{const r=await fetch(`${ENGINE_URL}/family/latest?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error('Could not load dashboard');render(await r.json());message.textContent='';}catch(e){message.textContent=e.message;message.className='message error';}}
tasks.addEventListener('click',async event=>{const button=event.target.closest('button[data-task-id]');if(!button)return;button.disabled=true;button.textContent='Saving…';message.textContent='';saving++;try{const r=await fetch(COMPLETE_WEBHOOK,{method:'POST',body:new URLSearchParams({taskId:button.dataset.taskId,child:CHILD})});if(!r.ok)throw new Error('Could not complete task');const data=await r.json();button.textContent='Done';button.classList.add('done');saving--;render(data);}catch(e){saving=Math.max(0,saving-1);button.disabled=false;button.textContent='Complete';message.textContent=e.message;message.className='message error';await load();}});
document.querySelector('.rewards').addEventListener('click',async event=>{const button=event.target.closest('button[data-reward]');if(!button||button.disabled)return;const label=button.querySelector('strong').textContent,cost=button.dataset.cost;if(!confirm(`Redeem ${label} for ${cost} points?`))return;const original=button.innerHTML;rewardButtons().forEach(b=>b.disabled=true);button.innerHTML='<strong>Redeeming…</strong>';message.textContent='';saving++;try{const r=await fetch(REWARD_WEBHOOK,{method:'POST',body:new URLSearchParams({child:CHILD,reward:button.dataset.reward})});if(!r.ok)throw new Error('Could not redeem reward');const data=await r.json();saving--;render(data);message.textContent=`${label} redeemed.`;message.className='message success';}catch(e){saving=Math.max(0,saving-1);button.innerHTML=original;message.textContent='Redemption failed. Refresh and try again.';message.className='message error';await load();}});
load();setInterval(load,60000);
function renderRewards(catalog){
  const grid=document.querySelector('.reward-grid'),list=(catalog&&catalog.rewards)||[];
  if(!grid||!list.length)return;
  grid.innerHTML=list.map(r=>`<button class="reward${r.key==='cash'?' cash':''}" type="button" data-reward="${escapeHtml(r.key)}" data-cost="${Number(r.cost)}"><strong>${escapeHtml(((r.emoji||'')+' '+r.title).trim())}</strong><span>${Number(r.cost)} points</span></button>`).join('');
  if(lastData)render(lastData);
}
window.addEventListener('family-catalog',e=>renderRewards(e.detail));
