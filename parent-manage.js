// Parent controls: approve proposals and manage chores, recurring chores, rewards and boss treasures.
// Every change goes through the Make scenario "Family Dashboard — Proposals & Management",
// which also republishes catalog.json and answers with the fresh catalog.
(()=>{
  const MANAGE_WEBHOOK='https://hook.eu2.make.com/t5o3sctyra256eyzxf8yfc7dzx8f40ab';
  const DAYS=[['ma','Ma'],['di','Di'],['wo','Wo'],['do','Do'],['vr','Vr'],['za','Za'],['zo','Zo']];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const $=id=>document.getElementById(id);
  const msg=$('manage-message');
  let busy=false,catalog=null;

  const opt=(v,label,sel)=>`<option value="${esc(v)}"${v===sel?' selected':''}>${esc(label)}</option>`;
  const whoSelect=sel=>`<select name="person">${opt('Rassell','Rassell',sel)}${opt('Michelle','Michelle',sel)}${opt('Beide','Beide',sel)}</select>`;
  const levelKey=l=>String(l||'').includes('Extra')?'extra':'standaard';
  const levelSelect=sel=>`<select name="level">${opt('standaard','⚡ Standaard (3)',sel)}${opt('extra','🔥 Extra (5)',sel)}</select>`;
  const dayBoxes=sel=>`<div class="day-picks">${DAYS.map(([v,l])=>`<label><input type="checkbox" name="days" value="${v}"${(sel||[]).includes(v)?' checked':''}>${l}</label>`).join('')}</div>`;
  const levelLabel=l=>String(l||'').includes('Extra')?'🔥 Extra':'⚡ Standaard';
  const dayLabel=d=>d===catalog?.today?'Vandaag':d===catalog?.tomorrow?'Morgen':d;
  // The Ouderpaneel has a tab per person: Rassell, Michelle and Beide (chores for both).
  const PEOPLE=['Rassell','Michelle','Beide'];
  const personOf=v=>v==='Rassell'||v==='Michelle'?v:'Beide';
  function fill(kind,items,key,row,empty){
    for(const p of PEOPLE){
      const el=document.querySelector(`[data-list="${kind}"][data-person="${p}"]`);if(!el)continue;
      const list=items.filter(x=>personOf(x[key])===p);
      el.innerHTML=list.map(row).join('')||`<div class="empty small">${empty}</div>`;
      const count=document.querySelector(`[data-count="${kind}"][data-person="${p}"]`);if(count)count.textContent=list.length?`(${list.length})`:'';
    }
  }
  const daysLabel=ds=>ds.length===7?'Elke dag':ds.map(d=>DAYS.find(x=>x[0]===d)?.[1]||d).join(' · ');

  function render(c){
    catalog=c;
    const proposals=c.proposals||[];
    // Identical proposals (same child, kind and title) show once; the extra copies are rejected with it.
    const pkey=p=>`${p.child}|${p.type}|${String(p.title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim()}`;
    const groups=new Map();for(const p of proposals){const k=pkey(p);if(groups.has(k))groups.get(k).extra.push(p.id);else groups.set(k,{...p,extra:[]});}
    const unique=[...groups.values()];
    const ov=$('ov-proposals');
    if(ov){ov.querySelector('.proposal-val').textContent=unique.length;ov.querySelector('.proposal-label').textContent=unique.length?'wachten op jou':'niets te beoordelen';ov.classList.toggle('waiting',proposals.length>0);}
    document.querySelectorAll('[data-badge]').forEach(b=>{const n=unique.filter(p=>p.child===b.dataset.badge).length;b.textContent=n;b.hidden=!n;});
    if(ov)ov.dataset.go=(proposals.find(p=>p.child==='Michelle')&&!proposals.find(p=>p.child==='Rassell'))?'michelle':'rassell';
    document.querySelectorAll('.proposals-block[data-person]').forEach(b=>{b.hidden=!proposals.some(p=>p.child===b.dataset.person);});
    const tag=p=>p.extra.length?` <span class="dup-tag">${p.extra.length+1}× voorgesteld</span>`:'';
    const wrap=(p,icon,kind,form)=>`<details class="manage-row-edit proposal"><summary><div><strong>${icon} ${esc(p.title)}${tag(p)}</strong><small>${kind}${p.suggestedCost?` · ${p.suggestedCost} punten?`:''}</small></div><span class="edit-link">Bekijken</span></summary>${form}</details>`;
    fill('proposals',unique,'child',p=>p.type==='reward'?wrap(p,'🎁','Beloning',`
      <form class="manage-card" data-id="${esc(p.id)}" data-extra="${esc(p.extra.join(','))}" data-kind="reward-proposal">
        <div class="card-fields">
          <label>Naam<input name="title" value="${esc(p.title)}" maxlength="60"></label>
          <label class="small">Punten<input name="cost" type="number" min="1" max="500" value="${p.suggestedCost||''}" required></label>
          <label class="small">Emoji<input name="emoji" maxlength="4" placeholder="🎁"></label>
        </div>
        <div class="card-actions"><button class="ok" data-act="approve-reward">Goedkeuren</button><button class="no" data-act="reject">Afwijzen</button></div>
      </form>`):wrap(p,'🧹','Taakje',`
      <form class="manage-card" data-id="${esc(p.id)}" data-extra="${esc(p.extra.join(','))}" data-kind="task-proposal">
        <div class="card-fields">
          <label>Naam<input name="title" value="${esc(p.title)}" maxlength="60"></label>
          <label>Voor${whoSelect(p.child)}</label>
          <label>Soort${levelSelect('standaard')}</label>
          <label>Wanneer<select name="day" class="when">${opt('vandaag','Vandaag')}${opt('morgen','Morgen')}${opt('vast','Vast, op vaste dagen')}</select></label>
        </div>
        <div class="repeat" hidden>${dayBoxes([])}</div>
        <div class="card-actions"><button class="ok" data-act="approve-task">Goedkeuren</button><button class="no" data-act="reject">Afwijzen</button></div>
      </form>`),'Geen voorstellen');

    // Open chores, today's first.
    const planned=(c.planned||[]).filter(t=>!t.completed).sort((x,y)=>String(x.day).localeCompare(String(y.day)));
    fill('planned',planned,'person',t=>`
      <div class="manage-row"><div><strong>${esc(t.title)}</strong><small>${esc(dayLabel(t.day))} · ${levelLabel(t.level)}</small></div>
      <button class="no" data-act="remove-task" data-id="${esc(t.id)}" data-title="${esc(t.title)}">Verwijderen</button></div>`,'Geen open taakjes voor vandaag of morgen');

    const recurring=c.recurring||[];
    fill('recurring',recurring,'person',t=>`
      <details class="manage-row-edit"><summary><div><strong>${esc(t.title)}</strong><small>${levelLabel(t.level)} · ${esc(daysLabel(t.days))}</small></div><span class="edit-link">Aanpassen</span></summary>
        <form class="manage-card" data-id="${esc(t.id)}" data-kind="chore">
          <div class="card-fields"><label>Naam<input name="title" value="${esc(t.title)}" maxlength="60"></label><label>Voor${whoSelect(t.person)}</label><label>Soort${levelSelect(levelKey(t.level))}</label></div>
          ${dayBoxes(t.days)}
          <div class="card-actions"><button class="ok" data-act="chore-save">Opslaan</button><button class="no" data-act="chore-remove">Stoppen</button></div>
        </form></details>`,'Nog geen vaste taakjes');

    // Rewards and boss treasures show as one line each; tap to edit.
    const rewards=c.rewards||[];
    $('reward-count').textContent=rewards.length?`(${rewards.length})`:'';
    $('reward-list').innerHTML=rewards.map(r=>`
      <details class="manage-row-edit"><summary><div><strong>${esc(r.emoji||'🎁')} ${esc(r.title)}</strong><small>${Number(r.cost)} punten</small></div><span class="edit-link">Aanpassen</span></summary>
      <form class="manage-card compact" data-id="${esc(r.id)}" data-kind="reward">
        <div class="card-fields"><label class="small">Emoji<input name="emoji" value="${esc(r.emoji)}" maxlength="4"></label><label>Beloning<input name="title" value="${esc(r.title)}" maxlength="60"></label><label class="small">Punten<input name="cost" type="number" min="1" max="500" value="${Number(r.cost)}"></label></div>
        <div class="card-actions"><button class="ok" data-act="reward-save">Opslaan</button><button class="no" data-act="reward-remove">Verwijderen</button></div>
      </form></details>`).join('')||'<div class="empty small">Nog geen beloningen</div>';

    // Boss treasures come in the order the Monday publish picks them; the first one is next.
    const treasures=c.treasures||[];
    $('treasure-count').textContent=treasures.length?`(${treasures.length})`:'';
    $('treasure-list').innerHTML=treasures.map(t=>`
      <details class="manage-row-edit"><summary><div><strong>${esc(t.emoji||'🏆')} ${esc(t.title)}</strong><small>${t.next?'<span class="treasure-tag">Volgende week</span> ':''}${t.lastUsed?`Laatst gebruikt: week van ${esc(shortDate(t.lastUsed))}`:(t.next?'':'Nog niet gebruikt')}</small></div><span class="edit-link">Aanpassen</span></summary>
      <form class="manage-card compact" data-id="${esc(t.id)}" data-kind="treasure">
        <div class="card-fields"><label class="small">Emoji<input name="emoji" value="${esc(t.emoji)}" maxlength="4"></label><label>Beloning<input name="title" value="${esc(t.title)}" maxlength="100"></label></div>
        <div class="card-actions"><button class="ok" data-act="treasure-save">Opslaan</button><button class="no" data-act="treasure-remove">Verwijderen</button></div>
      </form></details>`).join('')||'<div class="empty small">Nog geen baasbeloningen</div>';
  }

  function shortDate(ymd){
    const [y,m,d]=String(ymd).split('-').map(Number);
    return y?new Date(Date.UTC(y,m-1,d)).toLocaleDateString('nl-NL',{day:'numeric',month:'short',timeZone:'UTC'}):ymd;
  }

  async function showCurrentTreasure(){
    try{
      const r=await fetch(`boss.json?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)return;
      const b=await r.json();if(!b||b.version!==1||!b.reward)return;
      const state=b.chestOpenedAt?'kist geopend':b.defeatedAt?'verslagen, kist nog dicht':'baas nog niet verslagen';
      const el=$('treasure-now');el.textContent=`Deze week (${state}): ${b.reward}`;el.hidden=false;
    }catch(e){}
  }

  function fields(form){
    const f=form.elements,out={};
    for(const n of ['title','person','level','day','cost','emoji'])if(f[n]&&f[n].value!==undefined)out[n]=String(f[n].value).trim();
    out.days=[...form.querySelectorAll('input[name="days"]:checked')].map(x=>x.value).join(',');
    return out;
  }

  const CONFIRM={
    'reject':'Dit voorstel afwijzen?',
    'remove-task':'Dit taakje verwijderen?',
    'chore-remove':'Dit vaste taakje stoppen? Het komt dan niet meer terug.',
    'reward-remove':'Deze beloning verwijderen?',
    'treasure-remove':'Deze baasbeloning verwijderen?'
  };

  async function send(params,button){
    if(busy)return;
    if(CONFIRM[params.action]&&!window.confirm(CONFIRM[params.action]))return;
    busy=true;document.body.classList.add('manage-busy');
    const label=button?.textContent;if(button)button.textContent='Bezig…';
    msg.textContent='';msg.className='message';
    try{
      const r=await fetch(MANAGE_WEBHOOK,{method:'POST',body:new URLSearchParams(params)});
      if(!r.ok)throw new Error('');
      const data=await r.json();
      render(data);
      msg.textContent=data.message||'';msg.className=data.ok?'message success':'message error';
      if(data.ok&&typeof load==='function')setTimeout(load,1500);
      const extra=data.ok&&['approve-task','approve-reward','reject'].includes(params.action)?String(params.extra||'').split(',').filter(Boolean):[];
      for(let i=0;i<extra.length;i++){
        msg.textContent=`Dubbels opruimen… (${i+1} van ${extra.length})`;msg.className='message';
        try{const x=await fetch(MANAGE_WEBHOOK,{method:'POST',body:new URLSearchParams({action:'reject',id:extra[i]})});if(x.ok)render(await x.json());}catch(e){}
      }
      if(extra.length){msg.textContent=`${data.message||'Klaar.'} Dubbels opgeruimd.`;msg.className='message success';}
    }catch(err){
      if(button)button.textContent=label;
      msg.textContent='Dat lukte niet. Probeer het zo nog eens.';msg.className='message error';
    }finally{
      busy=false;document.body.classList.remove('manage-busy');
    }
  }

  document.addEventListener('change',e=>{
    const when=e.target.closest('select.when');
    if(when)when.closest('form').querySelector('.repeat').hidden=when.value!=='vast';
  });
  document.addEventListener('submit',e=>{if(e.target.closest('.manage'))e.preventDefault();});
  document.addEventListener('click',e=>{
    const button=e.target.closest('.manage button[data-act]');
    if(!button)return;
    e.preventDefault();
    const act=button.dataset.act,form=button.closest('form');
    if(act==='remove-task')return send({action:act,id:button.dataset.id},button);
    const f=form?fields(form):{};
    if(form&&form.dataset.id)f.id=form.dataset.id;
    if(form&&form.dataset.extra)f.extra=form.dataset.extra;
    send({action:act,...f},button);
  });

  async function init(){
    try{const r=await fetch(`catalog.json?t=${Date.now()}`,{cache:'no-store'});if(r.ok)render(await r.json());}catch(e){}
    // catalog.json can be a few minutes old, so ask Make for the current state once.
    try{
      const r=await fetch(MANAGE_WEBHOOK,{method:'POST',body:new URLSearchParams({action:'state'})});
      if(r.ok&&!busy)render(await r.json());
    }catch(e){}
  }
  init();
  showCurrentTreasure();
})();
