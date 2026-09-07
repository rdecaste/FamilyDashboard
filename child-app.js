const COMPLETE_WEBHOOK='https://hook.eu2.make.com/qhf8gxv7v9pjuonoy63f2jar53aqg94n';
const REWARD_WEBHOOK='https://hook.eu2.make.com/knkywjxm7vcgk1nap9g0c86ff4waeiwd';
const key=CHILD.toLowerCase();
const points=document.getElementById('points'),screen=document.getElementById('screen'),tasks=document.getElementById('tasks'),message=document.getElementById('message'),rewardButtons=[...document.querySelectorAll('button[data-reward]')];
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function render(data){const child=data.children[key];const balance=Number(child.points??0);points.textContent=balance;screen.textContent=`Screen time: ${child.screenTime||'Yes'}`;screen.classList.toggle('no',child.screenTime==='No');for(const b of rewardButtons){const cost=Number(b.dataset.cost);b.disabled=balance<cost;b.title=b.disabled?`You need ${cost-balance} more points`:'';}const items=child.outstandingTasks||[];tasks.innerHTML=items.length?items.map(t=>`<article class="task"><div class="task-name">${escapeHtml(typeof t==='string'?t:t.title)}</div><button class="complete" type="button" data-task-id="${escapeHtml(t.id||'')}" ${t.id?'':'disabled'}>Complete</button></article>`).join(''):'<div class="empty">Everything is done ✓</div>';}
async function load(){try{const r=await fetch(`latest.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error('Could not load dashboard');render(await r.json());message.textContent='';}catch(e){message.textContent=e.message;message.className='message error';}}
tasks.addEventListener('click',async event=>{const button=event.target.closest('button[data-task-id]');if(!button)return;button.disabled=true;button.textContent='Saving…';message.textContent='';try{const r=await fetch(COMPLETE_WEBHOOK,{method:'POST',body:new URLSearchParams({taskId:button.dataset.taskId,child:CHILD})});if(!r.ok)throw new Error('Could not complete task');const data=await r.json();button.textContent='Done';button.classList.add('done');render(data);}catch(e){button.disabled=false;button.textContent='Complete';message.textContent=e.message;message.className='message error';}});
document.querySelector('.rewards').addEventListener('click',async event=>{const button=event.target.closest('button[data-reward]');if(!button||button.disabled)return;const label=button.querySelector('strong').textContent,cost=button.dataset.cost;if(!confirm(`Redeem ${label} for ${cost} points?`))return;const original=button.innerHTML;rewardButtons.forEach(b=>b.disabled=true);button.innerHTML='<strong>Redeeming…</strong>';message.textContent='';try{const r=await fetch(REWARD_WEBHOOK,{method:'POST',body:new URLSearchParams({child:CHILD,reward:button.dataset.reward})});if(!r.ok)throw new Error('Could not redeem reward');const data=await r.json();render(data);message.textContent=`${label} redeemed.`;message.className='message success';}catch(e){button.innerHTML=original;message.textContent='Redemption failed. Refresh and try again.';message.className='message error';await load();}});
load();setInterval(load,60000);
const WEEKLY_CLOUD='a3xk0plk';
async function loadWeeklySummary(){
  const image=document.getElementById('weekly-image'),placeholder=document.getElementById('weekly-placeholder');
  if(!image||!placeholder)return;
  const tag=`family-${key}-weekly`;
  try{
    const r=await fetch(`https://res.cloudinary.com/${WEEKLY_CLOUD}/image/list/${tag}.json?t=${Date.now()}`,{cache:'no-store'});
    if(!r.ok)throw new Error('not ready');
    const data=await r.json();
    const latest=[...(data.resources||[])].sort((a,b)=>b.version-a.version)[0];
    if(!latest)throw new Error('not ready');
    const id=latest.public_id.split('/').map(encodeURIComponent).join('/');
    image.onload=()=>image.classList.add('loaded');
    image.src=`https://res.cloudinary.com/${WEEKLY_CLOUD}/image/upload/f_auto,q_auto,w_900,c_limit/v${latest.version}/${id}.${latest.format}`;
  }catch(e){
    placeholder.textContent='Je eerste weekoverzicht verschijnt zondagavond.';
  }
}
loadWeeklySummary();setInterval(loadWeeklySummary,300000);
