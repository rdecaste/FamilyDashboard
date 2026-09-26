// Child page: propose chores and rewards, and show the reward list from catalog.json.
// catalog.json is written by the Make scenario "Family Dashboard — Proposals & Management".
(()=>{
  const MANAGE_WEBHOOK='https://hook.eu2.make.com/t5o3sctyra256eyzxf8yfc7dzx8f40ab';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const mine=document.getElementById('my-ideas'),msg=document.getElementById('idea-message');
  let busy=false;
  function show(catalog){
    window.dispatchEvent(new CustomEvent('family-catalog',{detail:catalog}));
    if(!mine)return;
    const list=(catalog.proposals||[]).filter(p=>p.child===CHILD);
    mine.innerHTML=list.length?'<h3>Wacht op papa of mama</h3>'+list.map(p=>`<div class="idea"><span>${p.type==='reward'?'🎁':'🧹'} ${esc(p.title)}</span><small>${p.type==='reward'?(p.suggestedCost?`${p.suggestedCost} punten?`:'Beloning'):'Taakje'}</small></div>`).join(''):'';
  }
  async function loadCatalog(){
    if(busy)return;
    try{const r=await fetch(`catalog.json?t=${Date.now()}`,{cache:'no-store'});if(r.ok)show(await r.json());}catch(e){}
  }
  document.querySelectorAll('.idea-form').forEach(form=>form.addEventListener('submit',async e=>{
    e.preventDefault();
    if(busy)return;
    const kind=form.dataset.kind,title=form.elements.idea.value.trim();
    if(title.length<2)return;
    const body=new URLSearchParams({action:kind==='reward'?'propose-reward':'propose-task',child:CHILD,title});
    if(kind==='reward'&&form.elements.cost&&form.elements.cost.value)body.set('cost',form.elements.cost.value);
    const button=form.querySelector('button');
    busy=true;button.disabled=true;button.textContent='Versturen…';msg.textContent='';msg.className='message';
    try{
      const r=await fetch(MANAGE_WEBHOOK,{method:'POST',body});
      if(!r.ok)throw new Error('');
      const data=await r.json();
      if(!data.ok)throw new Error(data.message||'');
      form.reset();show(data);msg.textContent=data.message;msg.className='message success';
    }catch(err){
      msg.textContent=err.message||'Versturen lukte niet. Probeer het zo nog eens.';msg.className='message error';
    }finally{
      busy=false;button.disabled=false;button.textContent='Voorstellen';
    }
  }));
  loadCatalog();setInterval(loadCatalog,60000);
})();
