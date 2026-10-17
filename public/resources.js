// Public resource tools run locally; they do not send enquiry or referral records.
const all = (selector,root=document) => [...root.querySelectorAll(selector)];
const one = (selector,root=document) => root.querySelector(selector);
const helpSearch = one('[data-help-search]');
if (helpSearch) {
  const cards=all('[data-help-card]'),buttons=all('[data-help-filter]');
  let category='all';
  function filterHelp() {
    const terms=helpSearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let count=0;
    cards.forEach(card=>{const show=(category==='all'||card.dataset.category===category)&&terms.every(term=>card.dataset.search.includes(term));card.hidden=!show;if(show)count++;});
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.helpFilter===category)));
    one('[data-help-count]').textContent=count+' '+(count===1?'guide':'guides')+' to explore';
    one('[data-help-empty]').hidden=count!==0;
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{category=button.dataset.helpFilter;filterHelp();}));
  helpSearch.addEventListener('input',filterHelp);
  one('[data-help-clear]').addEventListener('click',()=>{category='all';helpSearch.value='';filterHelp();helpSearch.focus();});
  filterHelp();
}
const releases=all('[data-release]');
if (releases.length) {
  all('[data-release-filter]').forEach(button=>button.addEventListener('click',()=>{
    const selected=button.dataset.releaseFilter;
    releases.forEach(card=>card.hidden=selected!=='all'&&card.dataset.status!==selected);
    all('[data-release-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    const count=releases.filter(card=>!card.hidden).length;
    one('[data-release-count]').textContent=count+' '+(count===1?'update or idea':'updates and ideas');
    one('[data-release-empty]').hidden=count!==0;
  }));
}
const referralForm=one('[data-referral-form]');
if(referralForm){
  const result=one('[data-referral-result]'),input=one('[data-referral-link]'),status=one('[data-referral-status]');
  referralForm.addEventListener('input',event=>{if(event.target.name==='referrer'){result.hidden=true;status.textContent='';event.target.setCustomValidity('');}});
  referralForm.addEventListener('submit',event=>{
    event.preventDefault();const field=referralForm.elements.namedItem('referrer'),ref=field.value.trim();
    field.setCustomValidity(ref?'':'Enter your name or business reference.');if(!referralForm.reportValidity())return;
    const target=new URL('contact/',new URL('./',import.meta.url));target.searchParams.set('topic','referral');target.searchParams.set('ref',ref);
    input.value=target.href;result.hidden=false;status.textContent='Your link is ready to share. No referral has been registered and no reward has been created.';
  });
  one('[data-copy-referral]').addEventListener('click',async()=>{
    try{await navigator.clipboard.writeText(input.value);status.textContent='Referral link copied. The receiving business can include your reference in its own enquiry.';}
    catch{input.focus();input.select();status.textContent='Select and copy the link above to share your introduction.';}
  });
}
const referralField=one('#contact-form [name="referrer"]');
if(referralField){
  const reference=new URLSearchParams(location.search).get('ref');
  if(reference)referralField.value=reference.slice(0,120);
}
