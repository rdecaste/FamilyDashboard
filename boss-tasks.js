// Weekly family boss: shows how much damage each of today's chores does ("⚔ 30").
// Works on the dashboard (index.html) and the child pages (michelle.html, rassell.html).
// Reads the "tasks" list in boss.json; draws nothing when boss.json is missing, from
// another day, or when this week's boss is already defeated.
(()=>{
  const BOSS_URL='boss.json';
  const bare=id=>String(id||'').replace(/-/g,'');
  const amsDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  document.head.insertAdjacentHTML('beforeend',`<style>
.fb-dmg{display:inline-block;margin-left:.5em;padding:.05em .5em;border-radius:999px;background:rgba(255,138,71,.14);border:1px solid rgba(255,138,71,.4);color:#ffb38a;font-size:.78em;font-weight:800;line-height:1.35;white-space:nowrap;vertical-align:.08em;font-variant-numeric:tabular-nums;text-decoration:none}
.task.done .fb-dmg{opacity:.6}
.task-name .fb-dmg{margin-left:0;margin-top:6px;font-size:15px}
.task-name .fb-dmg-line{display:block}
</style>`);
  let tasks=[];

  function damageFor(key,title,id){
    if(id){const t=tasks.find(x=>bare(x.id)===bare(id));if(t)return t}
    return tasks.find(x=>(x.child===key||x.child==='beide')&&x.title===title);
  }
  function badge(t,long){return `<b class="fb-dmg" title="${t.points} punten = ${t.damage} schade aan de weekbaas">⚔ ${t.damage}${long?' schade':''}</b>`}
  function annotate(){
    // Dashboard: child cards in the right rail.
    for(const card of document.querySelectorAll('.child[data-child]')){
      const key=card.dataset.child;
      for(const row of card.querySelectorAll('.tasks .task')){
        const span=row.querySelector('span:last-of-type');if(!span)continue;
        const old=span.querySelector('.fb-dmg');
        const title=(old?span.textContent.replace(old.textContent,''):span.textContent).trim();
        const t=tasks.length&&damageFor(key,title);
        if(old&&(!t||old.textContent!==`⚔ ${t.damage}`))old.remove();
        if(t&&!span.querySelector('.fb-dmg'))span.insertAdjacentHTML('beforeend',badge(t,false));
      }
    }
    // Child pages: #tasks with a Complete button per chore.
    const key=typeof CHILD==='string'?CHILD.toLowerCase():'';
    for(const row of document.querySelectorAll('#tasks .task')){
      const name=row.querySelector('.task-name'),btn=row.querySelector('[data-task-id]');if(!name)continue;
      const old=name.querySelector('.fb-dmg-line');
      const title=(old?name.textContent.replace(old.textContent,''):name.textContent).trim();
      const t=tasks.length&&damageFor(key,title,btn&&btn.dataset.taskId);
      if(old&&(!t||!old.textContent.includes(`⚔ ${t.damage} `)))old.remove();
      if(t&&!name.querySelector('.fb-dmg-line'))name.insertAdjacentHTML('beforeend',`<span class="fb-dmg-line">${badge(t,true)}</span>`);
    }
  }
  let queued=false;
  const schedule=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;annotate();if(typeof window.scheduleFit==='function')window.scheduleFit()},0)};
  // The pages redraw their task lists on every refresh; put the badges back each time.
  new MutationObserver(muts=>{if(muts.some(m=>[...m.addedNodes].some(n=>!(n.classList&&(n.classList.contains('fb-dmg')||n.classList.contains('fb-dmg-line'))))))schedule()})
    .observe(document.body,{childList:true,subtree:true});

  async function refresh(){
    try{
      const r=await fetch(`${BOSS_URL}?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(r.status);
      const b=await r.json();
      tasks=b&&b.version===1&&b.today===amsDay()&&!b.defeatedAt&&Array.isArray(b.tasks)?b.tasks:[];
    }catch(e){tasks=[]}
    annotate();
  }
  window.FamilyBossTasks={refresh,annotate,set:list=>{tasks=list||[];annotate()}};
  refresh();setInterval(refresh,15000);
})();
