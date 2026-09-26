// Ouderpaneel: show one tab at a time and remember the open tab and folded blocks per device.
(()=>{
  const KEY='familyDashboard.parent.v1';
  const tabs=[...document.querySelectorAll('.tabs [data-tab]')];
  const panels=[...document.querySelectorAll('.tab-panel')];
  const names=tabs.map(t=>t.dataset.tab);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return {};}};
  const save=patch=>{try{localStorage.setItem(KEY,JSON.stringify({...read(),...patch}));}catch(e){}};
  // Old links pointed at sections; map them to the tab that holds them.
  const HASH={vandaag:'vandaag',brug:'vandaag',voorstellen:'voorstellen',taakjes:'taakjes',vast:'taakjes',beloningen:'beloningen',baasschat:'beloningen'};

  function show(name,remember=true){
    if(!names.includes(name))name=names[0];
    tabs.forEach(t=>{const on=t.dataset.tab===name;t.classList.toggle('active',on);t.setAttribute('aria-selected',on);});
    panels.forEach(p=>{p.hidden=p.dataset.panel!==name;});
    if(remember)save({tab:name});
  }

  tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.tab)));
  document.addEventListener('click',e=>{
    const link=e.target.closest('[data-go]');if(!link)return;
    e.preventDefault();show(link.dataset.go);
    document.querySelector('.tabs').scrollIntoView({behavior:'smooth',block:'start'});
  });

  const folds=read().folds||{};
  document.querySelectorAll('details.fold[data-fold]').forEach(d=>{
    if(d.dataset.fold in folds)d.open=folds[d.dataset.fold];
    d.addEventListener('toggle',()=>{const f=read().folds||{};f[d.dataset.fold]=d.open;save({folds:f});});
  });

  show(HASH[location.hash.slice(1)]||read().tab||'vandaag',false);
})();
