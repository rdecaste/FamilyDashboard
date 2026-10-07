// Weekly family boss: shows how much damage each of today's chores does ("⚔ 30").
// Works on the dashboard (index.html) and the child pages (michelle.html, rassell.html).
// Reads the "tasks" list in boss.json; draws nothing when boss.json is missing, from
// another day, or when this week's boss is already defeated.
// Since 3 Oct 2026 it also draws each kid's own boss score (damage) and a bar towards
// their 80% of the week (boss.json chores.kids) in the kid's section, in blue so it
// reads apart from the boss's own HP bar (green once their part is done).
// Since 7 Oct it shows the damage still needed, not a number of chores (too predictable).
(()=>{
  const BOSS_URL='https://quest-engine.quest-engine.workers.dev/family/boss';
  const bare=id=>String(id||'').replace(/-/g,'');
  const amsDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  document.head.insertAdjacentHTML('beforeend',`<style>
.fb-dmg{display:inline-block;margin-left:.5em;padding:.05em .5em;border-radius:999px;background:rgba(255,138,71,.14);border:1px solid rgba(255,138,71,.4);color:#ffb38a;font-size:.78em;font-weight:800;line-height:1.35;white-space:nowrap;vertical-align:.08em;font-variant-numeric:tabular-nums;text-decoration:none}
.task.done .fb-dmg{opacity:.6}
.task-name .fb-dmg{margin-left:0;margin-top:6px;font-size:15px}
.task-name .fb-dmg-line{display:block}
.fb-kid{margin:8px 0 10px;padding:8px 10px;border-radius:12px;background:rgba(79,163,255,.08);border:1px solid rgba(79,163,255,.3);font-size:14px;line-height:1.3}
.fb-kid-top{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.fb-kid-top b{color:#8cc8ff;font-variant-numeric:tabular-nums}
.fb-kid-bar{position:relative;height:10px;margin:7px 0 5px;border-radius:999px;background:rgba(255,255,255,.12);overflow:visible}
.fb-kid-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#3d7bff,#5ad1ff);transition:width .6s}
.fb-kid.ok .fb-kid-fill{background:linear-gradient(90deg,#3fd8a0,#7cf29a)}
.fb-kid-mark{position:absolute;top:-3px;bottom:-3px;width:2px;background:#fff;opacity:.85;border-radius:2px}
.fb-kid-sub{display:flex;justify-content:space-between;gap:8px;opacity:.8;font-size:.9em}
</style>`);
  let tasks=[],boss=null;
  const NAMES={michelle:'Michelle',rassell:'Rassell'};

  function damageFor(key,title,id){
    if(id){const t=tasks.find(x=>bare(x.id)===bare(id));if(t)return t}
    return tasks.find(x=>(x.child===key||x.child==='beide')&&x.title===title);
  }
  function badge(t,long){return `<b class="fb-dmg" title="${t.points} punten = ${t.damage} schade aan de weekbaas">⚔ ${t.damage}${long?' schade':''}</b>`}
  // Each kid's own part of the boss: damage done and a bar to 80% of their week.
  function kidHtml(c,need){
    const pct=Math.max(0,Math.min(100,c.pct||0)),ok=!(c.hpLeft>0);
    const sub=ok?'✓ jouw deel van de baas is klaar':`nog ${c.hpLeft} schade voor jouw deel`;
    return `<div class="fb-kid${ok?' ok':''}"><div class="fb-kid-top"><span>⚔ Weekbaas</span><span><b>${c.damage||0}</b> schade</span></div>`+
      `<div class="fb-kid-bar" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="Taakjes deze week"><div class="fb-kid-fill" style="width:${pct}%"></div><i class="fb-kid-mark" style="left:${need}%"></i></div>`+
      `<div class="fb-kid-sub"><span>${pct}% van je week · ${need}% nodig</span><span>${sub}</span></div></div>`;
  }
  function drawKids(){
    const kids=boss&&boss.chores&&boss.chores.kids,need=(boss&&boss.chores&&boss.chores.need)||80;
    const place=(host,key,where)=>{
      if(!host)return;
      const c=kids&&kids[key];
      let el=host.parentNode.querySelector(':scope > .fb-kid');
      if(!c){if(el)el.remove();return}
      const sig=[c.damage,c.pct,c.hpLeft,need].join('|');
      if(el&&el.dataset.sig===sig)return;
      if(el)el.remove();
      host.insertAdjacentHTML(where,kidHtml(c,need));
      host.parentNode.querySelector(':scope > .fb-kid').dataset.sig=sig;
    };
    for(const card of document.querySelectorAll('.child[data-child]'))place(card.querySelector('.child-head'),card.dataset.child,'afterend');
    const key=typeof CHILD==='string'?CHILD.toLowerCase():'';
    if(NAMES[key])place(document.querySelector('header.top'),key,'afterend');
  }
  function annotate(){
    drawKids();
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
  new MutationObserver(muts=>{if(muts.some(m=>[...m.addedNodes].some(n=>!(n.classList&&(n.classList.contains('fb-dmg')||n.classList.contains('fb-dmg-line')||n.classList.contains('fb-kid'))))))schedule()})
    .observe(document.body,{childList:true,subtree:true});

  async function refresh(){
    try{
      const r=await fetch(`${BOSS_URL}?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(r.status);
      const b=await r.json();
      tasks=b&&b.version===1&&b.today===amsDay()&&!b.defeatedAt&&Array.isArray(b.tasks)?b.tasks:[];
      boss=b&&b.version===1&&b.today===amsDay()?b:null;
    }catch(e){tasks=[];boss=null}
    annotate();
  }
  window.FamilyBossTasks={refresh,annotate,set:list=>{tasks=list||[];annotate()}};
  refresh();setInterval(refresh,15000);
})();
