const all = (selector) => [...document.querySelectorAll(selector)];
const search=document.querySelector('[data-kb-search]');
const topics=document.querySelector('[data-kb-topic]');
const cards=all('[data-kb-card]');
const roles=all('[data-kb-role]');
const stopwords=new Set(['how','do','does','i','can','the','a','an','to','for','my','on','in','and','of','is','it','with','you','your']);
const clean=s=>s.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
if(search&&topics){
  let role='all';
  const url=new URL(location.href);
  const requestedRole=url.searchParams.get('role');
  if(roles.some(b=>b.dataset.kbRole===requestedRole))role=requestedRole;
  const requestedTopic=url.searchParams.get('topic');
  if([...topics.options].some(o=>o.value===requestedTopic))topics.value=requestedTopic;
  [search,topics,...roles].forEach(el=>el.disabled=false);
  const count=document.querySelector('[data-kb-count]');
  const empty=document.querySelector('[data-kb-empty]');
  function filter(){
    const terms=clean(search.value).split(/[^a-z0-9]+/).filter(t=>t&&!stopwords.has(t));
    let visible=0;
    for(const card of cards){
      const show=(role==='all'||card.dataset.roles.split(' ').includes(role))&&(topics.value==='all'||topics.value===card.dataset.topic)&&terms.every(t=>clean(card.dataset.search).includes(t));
      card.hidden=!show;if(show)visible++;
    }
    roles.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kbRole===role)));
    count.textContent=visible+' '+(visible===1?'training guide':'training guides')+' · '+roles.find(b=>b.dataset.kbRole===role).textContent;
    empty.hidden=visible!==0;
  }
  for(const button of roles)button.addEventListener('click',()=>{role=button.dataset.kbRole;filter();});
  search.addEventListener('input',filter);topics.addEventListener('change',filter);
  document.querySelector('[data-kb-reset]').addEventListener('click',()=>{role='all';search.value='';topics.value='all';filter();search.focus();});
  filter();
}
for(const button of all('[data-kb-print]')){button.disabled=false;button.addEventListener('click',()=>window.print());}
