// Steph's reminders for Roy (7 Oct 2026), on /steph and in the parent page's
// Steph tab: POST /family/remind on the Quest Engine (action add, list, done)
// with the family passcode (parent-auth.js). Each reminder is an open To-Do
// tagged Steph in D1, which Roy OS shows as "From Steph".
(function(){
  const root=document.querySelector('.remind');
  if(!root)return;
  const URL_REMIND='https://quest-engine.quest-engine.workers.dev/family/remind';
  const $=sel=>root.querySelector(sel);
  const form=$('form'),text=$('[name=text]'),due=$('[name=due]'),send=$('.send'),list=$('.list'),count=$('.count'),left=$('.left');
  const toastEl=document.getElementById(root.dataset.toast||'toast');
  const badge=document.querySelector('[data-remind-badge]');
  let timer;
  function toast(msg,error){
    if(!toastEl)return;
    toastEl.textContent=msg;toastEl.classList.toggle('error',!!error);
    clearTimeout(timer);timer=setTimeout(()=>{toastEl.textContent='';},5000);
  }
  const dayOf=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
  function whenLabel(day){
    if(day===dayOf(0))return 'vandaag';
    if(day===dayOf(1))return 'morgen';
    const [y,m,d]=day.split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString('nl-NL',{weekday:'short',day:'numeric',month:'short'});
  }
  function render(reminders){
    list.textContent='';
    count.textContent=reminders.length?'('+reminders.length+')':'';
    if(badge){badge.textContent=reminders.length;badge.hidden=!reminders.length;}
    if(!reminders.length){const li=document.createElement('li');li.className='empty';li.textContent='Niets open. 🎉';list.append(li);return;}
    for(const r of reminders){
      const li=document.createElement('li');
      const what=document.createElement('div');what.className='what';what.textContent=r.task;
      if(r.due){const s=document.createElement('small');s.textContent='📅 '+whenLabel(r.due);if(r.due<dayOf(0))s.className='late';what.append(s);}
      const b=document.createElement('button');b.type='button';b.className='done';b.textContent='klaar';
      b.addEventListener('click',()=>act({action:'done',id:r.id}));
      li.append(what,b);list.append(li);
    }
  }
  const buttons=()=>[send,...list.querySelectorAll('button')];
  // One call to the engine; renders its reminders list, or shows why not.
  async function act(params){
    buttons().forEach(b=>b.disabled=true);
    try{
      const r=await parentPost(URL_REMIND,params);
      const body=await r.json().catch(()=>({}));
      if(Array.isArray(body.reminders))render(body.reminders);
      if(!r.ok||!body.ok){toast(body.message||'Dat lukte niet. Probeer het zo nog eens.',true);return false;}
      return body;
    }catch(err){
      if(err instanceof WrongPasscode){toast(err.message,true);if(params.action==='list')askCode();}
      else toast('Geen verbinding. Probeer het zo nog eens.',true);
      return false;
    }finally{
      buttons().forEach(b=>b.disabled=false);
    }
  }
  function syncQuick(){root.querySelectorAll('.quick').forEach(b=>b.classList.toggle('on',due.value===dayOf(Number(b.dataset.days))));}
  root.querySelectorAll('.quick').forEach(b=>b.addEventListener('click',()=>{
    const day=dayOf(Number(b.dataset.days));
    due.value=due.value===day?'':day;
    syncQuick();
  }));
  due.addEventListener('change',syncQuick);
  text.addEventListener('input',()=>{left.textContent=140-text.value.length;});
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const t=text.value.trim();
    if(!t){text.focus();return;}
    const ok=await act({action:'add',text:t,due:due.value});
    if(ok){toast('✅ Verstuurd naar Roy');form.reset();left.textContent='140';syncQuick();}
  });
  // The passcode is asked by a tap, not on load: a prompt on load leaves the page blank behind it.
  const hasCode=()=>{try{return !!localStorage.getItem(FAMILY_PASSCODE_KEY);}catch(e){return false;}};
  function askCode(){
    list.textContent='';count.textContent='';
    const li=document.createElement('li');li.className='empty';
    const b=document.createElement('button');b.type='button';b.className='quick';b.textContent='🔑 Gezinscode invullen';
    b.addEventListener('click',()=>act({action:'list'}));
    li.append(b);list.append(li);
  }
  if(hasCode())act({action:'list'});else askCode();
  // Keep the list fresh when the page comes back into view.
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&hasCode())act({action:'list'});});
})();
