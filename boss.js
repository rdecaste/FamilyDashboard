// Weekly family boss: reads boss.json (written by Make "Family Boss — Publish boss.json")
// and draws the boss HUD, victory banner and treasure chest on the adventure visual.
// If boss.json is missing or from an older week, nothing is shown.
(()=>{
  const BOSS_URL='boss.json';
  const BOSS_WEBHOOK='https://hook.eu2.make.com/43q89kow1dc6avoq4co5hmao7ykxsev0';
  const ACCENT={woestijn:'#ffc15a',diepzee:'#7fe3ff',ijsrijk:'#b8e6ff',bos:'#9fe58a',vulkaan:'#ff9a4a',wolken:'#c9b8ff'};
  const NAME={michelle:'Michelle',rassell:'Rassell',samen:'Samen'};
  const hero=document.querySelector('.hero');
  if(!hero)return;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nl=n=>Number(n||0).toLocaleString('nl-NL');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

  hero.insertAdjacentHTML('beforeend',`
<section class="fb-hud" id="fb-hud" aria-label="Weekbaas" hidden>
  <div class="fb-kicker"><span class="fb-dot"></span><span id="fb-week">Weekbaas</span><span class="fb-world" id="fb-world"></span></div>
  <div class="fb-name" id="fb-name"></div>
  <div class="fb-hp-row">
    <div class="fb-bar" id="fb-bar" role="progressbar" aria-label="Levenspunten van de baas" aria-valuemin="0"><div class="fb-ghost" id="fb-ghost"></div><div class="fb-fill" id="fb-fill"></div><div class="fb-ticks"></div></div>
    <div class="fb-num"><strong id="fb-hp"></strong> / <span id="fb-max"></span> HP</div>
  </div>
  <div class="fb-team" id="fb-team"></div>
  <div class="fb-foot">Elke afgeronde taak = schade · je eigen punten blijven van jou</div>
</section>
<section class="fb-victory" id="fb-victory" aria-live="polite" hidden>
  <div class="fb-vkicker" id="fb-vkicker"></div>
  <div class="fb-vtitle">Baas verslagen!</div>
  <div class="fb-vsub" id="fb-vsub"></div>
  <div class="fb-vmeta" id="fb-vmeta"></div>
  <div class="fb-reward" id="fb-reward" hidden><div class="fb-rlabel">Gedeelde schat</div><div id="fb-reward-text"></div><div class="fb-rnote">Een gezamenlijke beloning — los van jullie eigen punten.</div></div>
</section>
<button class="fb-chest" id="fb-chest" type="button" hidden></button>
<div class="fb-toast" id="fb-toast" role="status"></div>`);
  const $=id=>document.getElementById(id);

  const amsDay=d=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  const noon=ds=>{const [y,m,d]=ds.split('-').map(Number);return new Date(Date.UTC(y,m-1,d,12))};
  const mondayOf=ds=>{const t=noon(ds);t.setUTCDate(t.getUTCDate()-((t.getUTCDay()+6)%7));return t.toISOString().slice(0,10)};
  const fmtDay=(ds,o)=>new Intl.DateTimeFormat('nl-NL',{timeZone:'Europe/Amsterdam',...o}).format(new Date(ds.length===10?ds+'T12:00:00Z':ds));
  const isoWeek=ds=>{const t=noon(ds);t.setUTCDate(t.getUTCDate()+3-((t.getUTCDay()+6)%7));const y0=new Date(Date.UTC(t.getUTCFullYear(),0,4));return 1+Math.round(((t-y0)/864e5-3+((y0.getUTCDay()+6)%7))/7)};

  let last=null,toastTimer;
  function toast(html){const t=$('fb-toast');t.innerHTML=html;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),5000)}
  function pop(damage,who){if(reduced)return;const p=document.createElement('div');p.className='fb-pop';p.innerHTML=`−${nl(damage)}<small>${esc(who)}</small>`;hero.appendChild(p);setTimeout(()=>p.remove(),1700)}
  function confetti(n=90){
    if(reduced)return;const cols=['#ffd66c','#ff8a47','#3fd8c2','#9fe5c4','#ff5c7a','#7fb8ff','#fff'];
    for(let i=0;i<n;i++){const c=document.createElement('span');c.className='fb-confetti';c.style.left=Math.random()*100+'%';c.style.background=cols[i%cols.length];c.style.setProperty('--dx',(Math.random()*200-100)+'px');c.style.setProperty('--rot',(Math.random()*900-450)+'deg');c.style.animationDuration=(2.2+Math.random()*1.8)+'s';c.style.animationDelay=(Math.random()*.6)+'s';hero.appendChild(c);setTimeout(()=>c.remove(),4800)}
  }
  function chestSVG(open){
    const base='<rect x="22" y="92" width="156" height="74" rx="10" fill="#9a5a2b" stroke="#5e3417" stroke-width="5"/><rect x="42" y="92" width="16" height="74" fill="#e0b44a" stroke="#9c7420" stroke-width="2"/><rect x="142" y="92" width="16" height="74" fill="#e0b44a" stroke="#9c7420" stroke-width="2"/><rect x="22" y="120" width="156" height="8" fill="#7a431f" opacity=".6"/>';
    if(!open)return `<svg viewBox="0 0 200 175" aria-hidden="true"><defs><radialGradient id="fbGlow"><stop offset="0" stop-color="#ffd66c" stop-opacity=".45"/><stop offset="1" stop-color="#ffd66c" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="168" rx="86" ry="9" fill="#000" opacity=".3"/><circle cx="100" cy="95" r="98" fill="url(#fbGlow)"/>${base}<path d="M22,94 Q22,38 100,38 Q178,38 178,94Z" fill="#b36b34" stroke="#5e3417" stroke-width="5"/><path d="M42,94 Q42,46 50,43 L58,42 Q56,60 58,94Z M142,94 Q144,60 142,42 L150,43 Q158,46 158,94Z" fill="#e0b44a" stroke="#9c7420" stroke-width="2"/><rect x="86" y="80" width="28" height="32" rx="5" fill="#ffd24a" stroke="#9c7420" stroke-width="3"/><circle cx="100" cy="93" r="4.5" fill="#5e3417"/><rect x="98" y="95" width="4" height="9" fill="#5e3417"/></svg>`;
    const rays=Array.from({length:12},(_,i)=>{const a=i*Math.PI/6,c=Math.cos,s=Math.sin;return `<path d="M100,80 L${(100+140*c(a-.1)).toFixed(1)},${(80+140*s(a-.1)).toFixed(1)} L${(100+140*c(a+.1)).toFixed(1)},${(80+140*s(a+.1)).toFixed(1)}Z" fill="#ffe89a" opacity=".35"/>`}).join('');
    const gems=[[62,84,'#ffd24a'],[80,78,'#ffd24a'],[98,82,'#4fc3ff'],[116,76,'#ffd24a'],[134,84,'#ff5c7a'],[90,70,'#7cf29a'],[110,68,'#ffd24a']].map(([x,y,c])=>`<circle cx="${x}" cy="${y}" r="9" fill="${c}" stroke="#9c7420" stroke-width="2"/>`).join('');
    return `<svg viewBox="0 0 200 175" aria-hidden="true"><defs><radialGradient id="fbGlow2"><stop offset="0" stop-color="#fff2b0" stop-opacity=".95"/><stop offset="1" stop-color="#ffd66c" stop-opacity="0"/></radialGradient></defs><ellipse cx="100" cy="168" rx="86" ry="9" fill="#000" opacity=".3"/><g class="fb-rays" opacity=".7">${rays}</g><circle cx="100" cy="85" r="90" fill="url(#fbGlow2)"/><path d="M26,92 L40,18 Q100,-2 160,18 L174,92Z" fill="#8a4f26" stroke="#5e3417" stroke-width="5"/><path d="M36,86 L46,26 Q100,10 154,26 L164,86Z" fill="#4a2a12"/>${base}<rect x="30" y="86" width="140" height="12" rx="4" fill="#3a200e"/>${gems}</svg>`;
  }

  function render(b){
    const current=b&&b.version===1&&b.weekStart===mondayOf(amsDay(new Date()));
    $('fb-hud').hidden=true;$('fb-victory').hidden=true;$('fb-chest').hidden=true;
    if(!current){last=null;return}
    document.documentElement.style.setProperty('--fb-accent',ACCENT[b.theme]||'#ffd66c');
    const c=b.contributions||{},won=!!b.defeatedAt;
    if(!won){
      const pct=Math.max(0,Math.min(100,b.hp/b.maxHp*100));
      $('fb-week').textContent=`Weekbaas · week ${isoWeek(b.weekStart)}`;
      $('fb-world').textContent=b.world||'';
      $('fb-name').textContent=b.name||'';
      $('fb-fill').style.width=pct+'%';$('fb-ghost').style.width=pct+'%';
      $('fb-hp').textContent=nl(b.hp);$('fb-max').textContent=nl(b.maxHp);
      const bar=$('fb-bar');bar.setAttribute('aria-valuenow',b.hp);bar.setAttribute('aria-valuemax',b.maxHp);bar.classList.toggle('low',pct>0&&pct<=25);
      const perTask=(b.damagePerPoint||10)*3,left=Math.ceil(b.hp/perTask);
      const chip=(k,col)=>{const n=(c[k]||{}).hits||0;return `<span class="fb-chip"><i style="background:${col}"></i>${NAME[k]} · ${n} treffer${n===1?'':'s'}</span>`};
      $('fb-team').innerHTML=`<span class="fb-total">Samen <b>${nl(b.totalDamage)}</b> schade · nog ± ${left} ta${left===1?'ak':'ken'}</span>`+chip('michelle','#3fd8c2')+chip('rassell','#ffb14a')+(((c.samen||{}).hits||0)?chip('samen','#c9b8ff'):'');
      $('fb-hud').hidden=false;
    }else{
      const hits=((c.michelle||{}).hits||0)+((c.rassell||{}).hits||0)+((c.samen||{}).hits||0);
      const next=noon(b.weekStart);next.setUTCDate(next.getUTCDate()+7);
      $('fb-vkicker').textContent=`Week ${isoWeek(b.weekStart)} · ${b.world||''}`;
      $('fb-vsub').innerHTML=`<b>Michelle</b> en <b>Rassell</b> hebben ${esc(b.name)} samen verslagen!`;
      $('fb-vmeta').textContent=`${hits} taken samen · verslagen op ${fmtDay(b.defeatedAt,{weekday:'long',day:'numeric',month:'long'})} · nieuwe baas op ${fmtDay(next.toISOString().slice(0,10),{weekday:'long',day:'numeric',month:'long'})}`;
      const open=!!b.chestOpenedAt;
      $('fb-reward').hidden=!open;$('fb-reward-text').textContent=b.reward||'Overleg samen wat jullie gedeelde beloning wordt.';
      const chest=$('fb-chest');chest.classList.toggle('open',open);chest.disabled=false;
      chest.setAttribute('aria-label',open?'Schatkist is open':'Open de schatkist');
      chest.innerHTML=chestSVG(open)+`<span class="fb-chest-label">${open?'Schat gevonden!':'Open de schatkist'}</span>`;
      $('fb-victory').hidden=false;chest.hidden=false;
    }
    // Live effects only when this screen saw the change happen (not on first load).
    if(last&&last.weekStart===b.weekStart){
      if(b.hp<last.hp){const r=(b.recent||[])[0];pop(last.hp-b.hp,r?NAME[r.child]:'Samen');if(r)toast(`<b>${esc(NAME[r.child])}</b>: ${esc(r.task)} → ${nl(r.damage)} schade`)}
      if(won&&!last.defeatedAt)confetti();
    }
    last=b;
  }

  async function refresh(){
    try{const r=await fetch(`${BOSS_URL}?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(r.status);render(await r.json())}
    catch(e){render(null)}
  }
  $('fb-chest').addEventListener('click',async()=>{
    const chest=$('fb-chest');if(chest.classList.contains('open')||chest.disabled)return;
    if(BOSS_WEBHOOK.includes('__')){toast('De schatkist is nog niet gekoppeld.');return}
    chest.disabled=true;chest.querySelector('.fb-chest-label').textContent='Openen…';
    try{
      const r=await fetch(BOSS_WEBHOOK,{method:'POST',body:new URLSearchParams({action:'open-chest'})});
      if(!r.ok)throw new Error(r.status);
      // Make answers "Accepted" when it queues the call; the file catches up shortly after.
      const data=await r.json().catch(()=>null);
      if(!data){setTimeout(refresh,6000);setTimeout(refresh,15000);return}
      if(data&&data.boss){render(data.boss);if(data.code==='chest_opened')confetti(60)}
      if(data&&data.code==='not_defeated')toast('De baas is nog niet verslagen.');
    }catch(e){chest.disabled=false;chest.querySelector('.fb-chest-label').textContent='Open de schatkist';toast('Openen lukte niet — probeer het zo nog eens.')}
  });
  window.FamilyBoss={render,refresh};
  refresh();setInterval(refresh,15000);
})();
