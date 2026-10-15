// ✨ Extra klusjes (since 15 Oct 2026, Roy): bonus chores beside the mandatory ones, from
// latest.json "extras" (Quest Engine extrasBuild). Weekly extras stay all week; daily ones
// are today's. An extra for both kids goes to whoever ticks it first. Never a penalty, not
// in the boss's 80%, but a done extra hits the boss (⚔) for the kid who did it.
// One file for three places:
// - the dashboard (index.html): a card at the bottom of the child rail, read-only;
// - a child page (CHILD set): the extras this kid can still do, with a "Gedaan" button;
// - the parent page ([data-extras]): everything, with Terugzetten on the done ones.
// The pages call FamilyExtras.render(latest) whenever they redraw.
(()=>{
  const ENGINE_URL='https://quest-engine.quest-engine.workers.dev';
  const KID={michelle:['Michelle','#3fd8c2'],rassell:['Rassell','#ffb14a']};
  const DAY=['zo','ma','di','wo','do','vr','za'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const child=typeof CHILD==='string'?CHILD.toLowerCase():'';
  const rail=document.querySelector('.sidebar-content');
  const parentHost=document.querySelector('[data-extras]');
  const mode=parentHost?'parent':KID[child]?'kid':rail?'dashboard':'';
  if(!mode)return;

  document.head.insertAdjacentHTML('beforeend',`<style>
.xc{--xa:#c9b8ff}
.xc .check{flex:0 0 auto}
.xc-head{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}
.xc-title{font-weight:840;letter-spacing:-.02em}
.xc-sub{font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--xa)}
.xc-label{font-weight:790;letter-spacing:.1em;text-transform:uppercase;color:rgba(235,245,255,.56)}
.xc-row{display:flex;align-items:center;gap:9px;min-width:0}
.xc-t{min-width:0;overflow-wrap:anywhere}
.xc-row.done .xc-t{opacity:.7}
.xc-pts,.xc-dmg{display:inline-block;padding:.05em .5em;border-radius:999px;font-size:.74em;font-weight:800;white-space:nowrap;font-variant-numeric:tabular-nums}
.xc-pts{background:rgba(201,184,255,.14);border:1px solid rgba(201,184,255,.45);color:#ddd2ff}
.xc-dmg{background:rgba(255,138,71,.14);border:1px solid rgba(255,138,71,.4);color:#ffb38a}
.xc-row.done .xc-pts,.xc-row.done .xc-dmg{opacity:.6}
.xc-who{display:inline-flex;align-items:center;gap:.35em;padding:.08em .55em;border-radius:999px;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);font-size:.74em;font-weight:760;white-space:nowrap}
.xc-who i{width:.55em;height:.55em;border-radius:50%}
.xc-who small{font-size:1em;font-weight:600;opacity:.65}
.xc-end{margin-left:auto;display:inline-flex;align-items:center;gap:8px}
.xc-free{font-size:.7em;font-weight:700;color:rgba(235,245,255,.5);white-space:nowrap}
.xc-tally{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;font-weight:700;color:rgba(235,245,255,.75)}
.xc-tally b{color:#fff}
/* dashboard rail */
.child.xc{border-color:rgba(201,184,255,.32)!important;background:linear-gradient(180deg,rgba(201,184,255,.08),#141e2b 70%)!important}
.child.xc .xc-title{font-size:clamp(22px,1.25vw,32px)}
.child.xc .xc-sub,.child.xc .xc-label{font-size:clamp(12px,.62vw,16px)}
.child.xc .xc-group{margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08)}
.child.xc .xc-label{margin-bottom:5px}
.child.xc .xc-row{font-size:clamp(17px,.86vw,23px);font-weight:620;line-height:1.35;min-height:1.4em}
.child.xc .check{width:20px;height:20px;font-size:13px}
.child.xc .xc-row.open .check{background:rgba(201,184,255,.06);border:1px dashed rgba(201,184,255,.6);color:transparent}
.child.xc .xc-row.done .check{background:var(--xa);color:#1d1238}
.child.xc .xc-tally{margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.08);font-size:clamp(14px,.75vw,19px)}
/* child and parent pages */
.xc-page{margin:0 0 38px}
#message+.xc-page{margin-top:16px}
.xc-page .xc-title{font-size:20px}.xc-page .xc-sub{font-size:13px}
.xc-page .xc-intro{margin:6px 0 14px;color:#aab3c4}
.xc-page .xc-label{font-size:13px;margin:16px 0 8px}
.xc-page .xc-list{display:grid;gap:10px}
.xc-page .xc-row{background:#141128;border:1px solid #c9b8ff33;border-radius:16px;padding:14px 16px;font-size:clamp(17px,3vw,21px);line-height:1.25;flex-wrap:wrap}
.xc-page .xc-row.done{background:#111722;border-color:#ffffff12}
.xc-page .xc-row .xc-end{flex-wrap:wrap}
.xc-page .xc-go{appearance:none;border:0;border-radius:13px;background:#c9b8ff;color:#1d1238;padding:13px 18px;font:700 16px/1 system-ui;cursor:pointer;min-height:46px}
.xc-page .xc-go:disabled{opacity:.5;cursor:wait}
.xc-page .xc-tally{margin-top:14px;font-size:15px}
.xc-page .xc-empty{padding:18px;border-radius:16px;background:#111722;color:#aab3c4}
.xc-page .xc-msg{min-height:22px;margin-top:10px;color:#aab3c4}.xc-page .xc-msg.error{color:#fc8181}.xc-page .xc-msg.success{color:#c9b8ff}
@media(max-width:560px){.xc-page .xc-row .xc-end{margin-left:0;width:100%}.xc-page .xc-go{flex:1 1 auto}}
</style>`);

  // Boss damage per point and whether the boss still takes hits (boss-tasks.js keeps this).
  const boss=()=>(window.FamilyBossTasks&&window.FamilyBossTasks.state)||{perPoint:10,live:true};
  const amsDay=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Amsterdam',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const weekday=ds=>DAY[new Date(ds+'T12:00:00Z').getUTCDay()];
  const clock=iso=>{const d=new Date(iso);return Number.isNaN(d.getTime())?'':d.toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Amsterdam'})};
  const whoChip=(k,when)=>KID[k]?`<span class="xc-who"><i style="background:${KID[k][1]}"></i>${KID[k][0]}${when?` <small>${esc(when)}</small>`:''}</span>`:'';
  const badges=x=>{const b=boss();return `<span class="xc-pts">+${Number(x.points)||0}</span>${b.live?`<span class="xc-dmg">⚔ ${(Number(x.points)||0)*(b.perPoint||10)}</span>`:''}`};
  // A weekly extra done on another day shows the weekday, a daily one the time.
  const whenOf=(x,weekly)=>weekly?(x.doneDay===amsDay()?'vandaag':x.doneDay?weekday(x.doneDay):''):clock(x.doneAt);
  const openFor=(x,k)=>x.for==='beide'||x.for===k;
  const forLabel=x=>KID[x.for]?`alleen ${KID[x.for][0]}`:'nog vrij';

  function rowHtml(x,weekly){
    const done=!!x.doneBy;
    let end;
    if(done){
      end=whoChip(x.doneBy,whenOf(x,weekly));
      const id=weekly?x.taskId:x.id;
      if(mode==='parent'&&id&&KID[x.doneBy])end+=`<button class="reset" type="button" data-task-id="${esc(id)}" data-child="${esc(KID[x.doneBy][0])}">Terugzetten</button>`;
    }else if(mode==='kid'){
      end=`<button class="xc-go" type="button" ${weekly?`data-chore-id="${esc(x.choreId)}"`:`data-task-id="${esc(x.id)}"`}>Gedaan</button>`;
    }else end=`<span class="xc-free">${esc(forLabel(x))}</span>`;
    return `<div class="xc-row ${done?'done':'open'}"><span class="check">${done?'✓':''}</span><span class="xc-t">${esc(x.title)}</span>${badges(x)}<span class="xc-end">${end}</span></div>`;
  }
  const tally=t=>`<div class="xc-tally"><span>Extra deze week:</span>${Object.keys(KID).map(k=>`<span class="xc-who"><i style="background:${KID[k][1]}"></i>${KID[k][0]} <b>+${Number(t?.[k]?.points)||0}</b> <small>· ${Number(t?.[k]?.count)||0}×</small></span>`).join('')}</div>`;

  let card=null,last=null;
  function render(latest){
    const e=latest&&latest.extras;last=latest;
    let week=(e&&e.week)||[],today=(e&&e.today)||[];
    // A child sees what they can still take and what they did; not the other kid's own extras.
    if(mode==='kid'){const mine=x=>x.doneBy?x.doneBy===child:openFor(x,child);week=week.filter(mine);today=today.filter(mine);}
    const empty=!week.length&&!today.length;
    if(mode==='dashboard'){
      if(!card){rail.insertAdjacentHTML('beforeend','<article class="child xc" aria-label="Extra klusjes" hidden></article>');card=rail.lastElementChild;}
      card.hidden=empty;
      if(!empty)card.innerHTML=`<div class="xc-head"><div class="xc-title">✨ Extra klusjes</div><div class="xc-sub">Bonus · wie eerst is</div></div>`+
        (week.length?`<div class="xc-group"><div class="xc-label">Deze week · tot zondag</div>${week.map(x=>rowHtml(x,true)).join('')}</div>`:'')+
        (today.length?`<div class="xc-group"><div class="xc-label">Vandaag</div>${today.map(x=>rowHtml(x,false)).join('')}</div>`:'')+
        tally(e&&e.totals);
      if(typeof window.scheduleFit==='function')window.scheduleFit();
      return;
    }
    if(!card){
      const html=`<section class="xc xc-page" aria-label="Extra klusjes"><div class="xc-head"><h2 class="xc-title">✨ Extra klusjes</h2><span class="xc-sub">Bonus · wie eerst is</span></div>`+
        `<p class="xc-intro">${mode==='kid'?'Extra punten en schade aan de weekbaas. Wie het eerst doet, krijgt het. Niet gedaan? Dan verlies je niets.':'Telt niet mee voor de 80% van de baas; gedaan doet het wel schade. Geen straf als het blijft liggen.'}</p><div class="xc-body"></div><p class="xc-msg" aria-live="polite"></p></section>`;
      if(mode==='kid'){const anchor=document.getElementById('message')||document.getElementById('tasks');anchor.insertAdjacentHTML('afterend',html);card=anchor.nextElementSibling;}
      else{parentHost.innerHTML=html;card=parentHost.firstElementChild;}
      if(mode==='kid')card.addEventListener('click',take);
    }
    card.hidden=mode==='kid'&&!(e&&(e.week||[]).length+(e.today||[]).length);
    const body=card.querySelector('.xc-body');
    body.innerHTML=empty?`<div class="xc-empty">${e?'Geen extra klusjes op dit moment.':'Laden…'}</div>`:
      (week.length?`<p class="xc-label">Deze week · tot zondag</p><div class="xc-list">${week.map(x=>rowHtml(x,true)).join('')}</div>`:'')+
      (today.length?`<p class="xc-label">Vandaag</p><div class="xc-list">${today.map(x=>rowHtml(x,false)).join('')}</div>`:'')+
      (mode==='parent'||!empty?tally(e&&e.totals):'');
  }

  // Child page: tick an extra. The other kid may have been quicker: the engine says so.
  let busy=false;
  async function take(ev){
    const button=ev.target.closest('.xc-go');if(!button||busy)return;
    const msg=card.querySelector('.xc-msg');
    busy=true;button.disabled=true;button.textContent='Bezig…';msg.textContent='';msg.className='xc-msg';
    const params={child:CHILD};
    if(button.dataset.choreId)params.choreId=button.dataset.choreId;else params.taskId=button.dataset.taskId;
    try{
      const r=await fetch(ENGINE_URL+'/family/complete',{method:'POST',body:new URLSearchParams(params)});
      const data=await r.json().catch(()=>null);
      if(!r.ok)throw new Error((data&&data.error)||'Dat lukte niet. Probeer het nog eens.');
      if(typeof window.render==='function')window.render(data);else render(data);
      msg.textContent='Top! Extra punten erbij.';msg.className='xc-msg success';
    }catch(e){
      msg.textContent=/was je voor/.test(e.message)?`${e.message} 🙈`:e.message;msg.className='xc-msg error';
      button.disabled=false;button.textContent='Gedaan';
      try{const r=await fetch(`${ENGINE_URL}/family/latest?t=${Date.now()}`,{cache:'no-store'});if(r.ok){const d=await r.json();if(typeof window.render==='function')window.render(d);else render(d);}}catch(x){}
    }finally{busy=false;}
  }

  window.FamilyExtras={render,redraw:()=>last&&render(last)};
})();
