import { checkoutQuote, quoteWebsiteBasket, dayridgeSignupUrl, DAYRIDGE_ADDON_RATES } from './pricing.js';

const form=document.querySelector('#dayridge-checkout-form');
if(form){
  const packageField=form.querySelector('[name="package"]');
  const employeesField=form.querySelector('[name="employees"]');
  const frequencyFields=[...form.querySelectorAll('[name="billing"]')];
  const addonFields=[...form.querySelectorAll('[name="addons"]')];
  const tasksWrap=form.querySelector('[data-checkout-tasks-users-wrap]');
  const tasksInput=form.querySelector('[name="tasksUsers"]');
  const amount=document.querySelector('#dayridge-checkout-quote');
  const band=document.querySelector('#dayridge-checkout-band');
  const saving=document.querySelector('#dayridge-checkout-savings');
  const message=document.querySelector('#dayridge-checkout-feedback');
  const button=form.querySelector('[type="submit"]');
  const params=new URLSearchParams(window.location.search);
  const money=pence=>new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(pence/100);
  if(['clocking','full'].includes(params.get('package')))packageField.value=params.get('package');
  const requested=Number(params.get('employees'));
  if(Number.isInteger(requested)&&requested>=1&&requested<=50)employeesField.value=String(requested);
  if(['month','year'].includes(params.get('billing'))){
    const selected=frequencyFields.find(field=>field.value===params.get('billing'));
    if(selected)selected.checked=true;
  }
  const fromUrl=(params.get('addons')??'').split(',');
  for(const field of addonFields)field.checked=fromUrl.includes(field.value);
  const requestedSeats=Number(params.get('tasksUsers'));
  if(Number.isInteger(requestedSeats)&&requestedSeats>=1&&requestedSeats<=50)tasksInput.value=String(requestedSeats);
  function selection(){
    const employees=Number(employeesField.value);
    const interval=frequencyFields.find(field=>field.checked)?.value||'year';
    const addons=addonFields.filter(field=>field.checked&&!field.disabled).map(field=>field.value);
    return quoteWebsiteBasket({packageCode:packageField.value,employees,interval,
      addons,tasksUsers:addons.includes('tasks')?Number(tasksInput.value):0});
  }
  function update(){
    const pkg=packageField.value;
    employeesField.max=pkg==='clocking'?'20':'50';
    for(const field of addonFields){
      const restricted=DAYRIDGE_ADDON_RATES[field.value].fullOnly&&pkg!=='full';
      field.disabled=restricted;
      if(restricted)field.checked=false;
    }
    const employees=Number(employeesField.value);
    tasksInput.max=String(Math.min(50,Number.isInteger(employees)&&employees>0?employees:50));
    const tasks=addonFields.some(field=>field.value==='tasks'&&field.checked&&!field.disabled);
    tasksWrap.hidden=!tasks;
    tasksInput.disabled=!tasks;
    const interval=frequencyFields.find(field=>field.checked)?.value||'year';
    for(const field of addonFields){
      const price=form.querySelector('[data-checkout-addon-price="'+field.value+'"]');
      const rate=DAYRIDGE_ADDON_RATES[field.value];
      price.textContent=money(rate[interval])+'/'+(interval==='year'?'year':'month')+
        (field.value==='tasks'?' + licensed users':'');
    }
    const basket=selection();
    amount.textContent=basket?money(basket.totalPence)+' / '+(interval==='month'?'month':'year'):'Choose a valid plan';
    band.textContent=basket?('Up to '+basket.employeeLimit+' employees · '+(interval==='month'?'Monthly':'Annual')+
      ' billing · '+(basket.addons.length?basket.addons.length+' selected add-on'+(basket.addons.length===1?'':'s')+' included':'No add-ons selected')):
      'Choose a valid employee count and Tasks licence quantity.';
    saving.textContent=basket?(interval==='year'?
      'Save '+money(basket.annualSavingPence)+' compared with twelve monthly payments.':
      '12-month estimate: '+money(basket.monthlyTotalPence*12)+' if you remain subscribed.'):'';
    button.disabled=!basket;
    button.textContent=basket?'Continue to secure checkout':'Review your selection';
    message.textContent=basket?
      'Your selected plan and add-ons carry through to DayRidge, where you review terms and payment availability.':
      'Check your employee count and Tasks licences before continuing.';
  }
  packageField.addEventListener('change',update);
  employeesField.addEventListener('input',update);
  tasksInput.addEventListener('input',update);
  for(const field of addonFields)field.addEventListener('change',update);
  for(const field of frequencyFields)field.addEventListener('change',update);
  update();
  // Selection-only navigation. No customer records, card details, prices or
  // payment requests are sent by the public website.
  form.addEventListener('submit',event=>{
    event.preventDefault();
    if(!form.reportValidity())return;
    const basket=selection(),url=dayridgeSignupUrl(basket);
    if(!url)return;
    window.location.assign(url);
  });
}
