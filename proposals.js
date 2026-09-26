// Child page: propose chores and rewards, and show the reward list from catalog.json.
// catalog.json is written by the Make scenario "Family Dashboard — Proposals & Management".
// Double taps are blocked here (pending list, recent sends, cooldown) and again in Make.
(()=>{
  const MANAGE_WEBHOOK='https://hook.eu2.make.com/t5o3sctyra256eyzxf8yfc7dzx8f40ab';
  const RECENT_KEY='familyDashboard.recentProposals.v1',RECENT_MS=10*60*1000,COOLDOWN_MS=20000;
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key=s=>String(s??'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const mine=document.getElementById('my-ideas'),msg=document.getElementById('idea-message'),count=document.getElementById('ideas-count');
  let busy=false,pending=[];

  const readRecent=()=>{try{return (JSON.parse(localStorage.getItem(RECENT_KEY))||[]).filter(r=>Date.now()-r.at<RECENT_MS);}catch(e){return [];}};
  const forget=(kind,title)=>{try{localStorage.setItem(RECENT_KEY,JSON.stringify(readRecent().filter(r=>!(r.kind===kind&&r.key===key(title)))));}catch(e){}};
  const remember=(kind,title)=>{try{localStorage.setItem(RECENT_KEY,JSON.stringify([...readRecent(),{kind,key:key(title),at:Date.now()}]));}catch(e){}};

  function show(catalog){
    window.dispatchEvent(new CustomEvent('family-catalog',{detail:catalog}));
    pending=(catalog.proposals||[]).filter(p=>p.child===CHILD);
    const shown=pending.filter((p,i)=>pending.findIndex(q=>q.type===p.type&&key(q.title)===key(p.title))===i);
    if(count)count.textContent=shown.length?`(${shown.length} wacht)`:'';
    if(!mine)return;
    mine.innerHTML=shown.length?'<h3>Wacht op papa of mama</h3>'+shown.map(p=>`<div class="idea"><span>${p.type==='reward'?'🎁':'🧹'} ${esc(p.title)}</span><small>${p.type==='reward'?(p.suggestedCost?`${p.suggestedCost} punten?`:'Beloning'):'Taakje'}</small></div>`).join(''):'';
  }
  async function loadCatalog(){
    if(busy)return;
    try{const r=await fetch(`catalog.json?t=${Date.now()}`,{cache:'no-store'});if(r.ok)show(await r.json());}catch(e){}
  }
  function isDouble(kind,title){
    const k=key(title),type=kind==='reward'?'reward':'task';
    return pending.some(p=>p.type===type&&key(p.title)===k)||readRecent().some(r=>r.kind===kind&&r.key===k);
  }
  function cooldown(){
    const buttons=[...document.querySelectorAll('.idea-form button')];
    buttons.forEach(b=>{b.disabled=true;});
    setTimeout(()=>buttons.forEach(b=>{b.disabled=false;b.textContent='Voorstellen';}),COOLDOWN_MS);
  }
  document.querySelectorAll('.idea-form').forEach(form=>form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(busy)return;
    const kind=form.dataset.kind,title=form.elements.idea.value.trim();
    if(title.length<2)return;
    if(isDouble(kind,title)){form.reset();msg.textContent='Dit voorstel staat al klaar. Papa of mama kijkt ernaar.';msg.className='message success';return;}
    const body=new URLSearchParams({action:kind==='reward'?'propose-reward':'propose-task',child:CHILD,title});
    if(kind==='reward'&&form.elements.cost&&form.elements.cost.value)body.set('cost',form.elements.cost.value);
    const button=form.querySelector('button');
    busy=true;remember(kind,title);
    document.querySelectorAll('.idea-form button').forEach(b=>{b.disabled=true;});
    button.textContent='Versturen…';msg.textContent='';msg.className='message';
    try{
      const r=await fetch(MANAGE_WEBHOOK,{method:'POST',body});
      if(!r.ok)throw new Error('');
      const data=await r.json();
      if(!data.ok){forget(kind,title);msg.textContent=data.message||'Versturen lukte niet.';msg.className='message error';return;}
      form.reset();show(data);msg.textContent=data.message;msg.className='message success';
    }catch(err){
      // The request may still be on its way (Make handles one at a time), so don't invite a second tap.
      form.reset();
      msg.textContent=err.message||'Je voorstel is onderweg. Het verschijnt zo in de lijst; je hoeft niet opnieuw te drukken.';msg.className='message';
    }finally{
      busy=false;button.textContent='Even wachten…';cooldown();
    }
  }));
  loadCatalog();setInterval(loadCatalog,60000);
})();
