// The parent page's actions need the family passcode (the Quest Engine's
// FAMILY_PASSCODE, since Oct 2026): reset, screen time and managing tasks,
// rewards and chores. It is asked once on this device and kept here; a wrong
// one is forgotten, so the next try asks again. The children's pages and the
// TV don't need it.
const FAMILY_PASSCODE_KEY='family-passcode';
function familyPasscode(){
  let code='';
  try{code=localStorage.getItem(FAMILY_PASSCODE_KEY)||'';}catch(e){}
  if(!code){
    code=(window.prompt('Gezinscode (voor ouders)')||'').trim();
    if(code)try{localStorage.setItem(FAMILY_PASSCODE_KEY,code);}catch(e){}
  }
  return code;
}
class WrongPasscode extends Error{}
// POST with the passcode; a refusal clears it and throws WrongPasscode.
async function parentPost(url,params){
  const code=familyPasscode();
  if(!code)throw new WrongPasscode('Geen gezinscode ingevuld.');
  const r=await fetch(url,{method:'POST',body:new URLSearchParams({...params,passcode:code})});
  if(r.status===401){
    try{localStorage.removeItem(FAMILY_PASSCODE_KEY);}catch(e){}
    throw new WrongPasscode('Verkeerde gezinscode. Probeer het nog eens.');
  }
  return r;
}
