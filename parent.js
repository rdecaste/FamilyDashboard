const WEBHOOK='https://hook.eu2.make.com/9otc8coig6ulfw6eeqt8oraph8rhi4y1';
const SCREEN_WEBHOOK='https://hook.eu2.make.com/gstybp793srkspjvn017jj8r0mu41jv8';
const els={rassell:document.getElementById('rassellTasks'),michelle:document.getElementById('michelleTasks')};
const message=document.getElementById('message');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function itemHtml(t,child,isReward){const value=Number(t.points||0),pointsLabel=value<0?`${Math.abs(value)} points spent`:`+${value} points`;return `<article class="task"><div><div class="task-name">${escapeHtml(t.title)}</div><small>${isReward?'Reward · ':''}${pointsLabel}</small></div><button class="reset" type="button" data-task-id="${escapeHtml(t.id)}" data-child="${child}">Reset</button></article>`;}
function render(data){let count=0;for(const key of ['rassell','michelle']){const child=data.children?.[key]||{},name=key==='rassell'?'Rassell':'Michelle',tasks=child.completedTasks||[],rewards=child.redemptions||[];count+=tasks.length+rewards.length;const rows=[...tasks.map(t=>itemHtml(t,name,false)),...rewards.map(t=>itemHtml(t,name,true))];els[key].innerHTML=rows.length?rows.join(''):'<div class="empty">No completed tasks or rewards</div>';const screenButton=document.querySelector(`.screen-off[data-child="${name}"]`);if(screenButton){const off=String(child.screenTime||'').toLowerCase()==='no';screenButton.disabled=off;screenButton.textContent=off?'🚫 No screen time ✓':'🚫 No screen time';screenButton.dataset.busy='false';}}document.getElementById('completedCount').textContent=count;document.getElementById('updated').textContent=data.updatedAt?new Date(data.updatedAt).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}):'—';}
async function load(){try{const r=await fetch(`latest.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error('Could not load dashboard');render(await r.json());message.textContent='';}catch(e){message.textContent=e.message;message.className='message error';}}
async function resetItem(button){
  if(button.dataset.busy==='true')return;
  button.dataset.busy='true';
  const taskId=button.dataset.taskId,child=button.dataset.child;
  button.disabled=true;
  button.textContent='Resetting…';
  message.textContent='';
  try{
    const r=await fetch(WEBHOOK,{method:'POST',body:new URLSearchParams({taskId,child})});
    if(!r.ok)throw new Error('Reset failed');
    const data=await r.json();
    render(data);
    message.textContent='Item reset and points reversed.';
    message.className='message success';
  }catch(err){
    button.disabled=false;
    button.textContent='Reset';
    button.dataset.busy='false';
    message.textContent='Reset failed. Try again.';
    message.className='message error';
  }
}
document.addEventListener('click',e=>{
  const button=e.target.closest('button.reset');
  if(!button)return;
  e.preventDefault();
  e.stopPropagation();
  if(button.dataset.busy==='true')return;
  const approved=window.confirm('Reset this item and reverse its points?');
  if(approved!==true)return;
  resetItem(button);
});
load();setInterval(load,60000);
async function disableScreenTime(button){
  if(button.dataset.busy==='true')return;
  const child=button.dataset.child;
  button.dataset.busy='true';
  button.disabled=true;
  button.textContent='Updating…';
  message.textContent='';
  try{
    const r=await fetch(SCREEN_WEBHOOK,{method:'POST',body:new URLSearchParams({child})});
    if(!r.ok)throw new Error('Screen-time override failed');
    const data=await r.json();
    message.textContent=`${child}: no screen time today.`;
    message.className='message success';
    button.textContent='🚫 No screen time ✓';
    setTimeout(load,1200);
  }catch(err){
    button.disabled=false;
    button.textContent='🚫 No screen time';
    button.dataset.busy='false';
    message.textContent='Could not update screen time. Try again.';
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
  if(window.confirm(`Set ${child} to NO screen time for today?`)) disableScreenTime(button);
});
