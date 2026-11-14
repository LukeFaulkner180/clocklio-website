export function fullWorkspacePlan(employees) {
  if (!Number.isInteger(employees) || employees < 1 || employees > 50) return null;
  if (employees < 10) return { code: 'starter', name: 'Starter', employeeLimit: Math.max(5, employees), price: 29999 + Math.max(0, employees - 5) * 4500 };
  if (employees <= 15) return { code: 'team', name: 'Team', employeeLimit: 15, price: 64999 };
  if (employees <= 30) return { code: 'business', name: 'Business', employeeLimit: 30, price: 114999 };
  return { code: 'scale', name: 'Scale', employeeLimit: 50, price: 189999 };
}
export function fullWorkspaceAnnualPence(employees) {
  return fullWorkspacePlan(employees)?.price ?? null;
}

export function clockxPlan(employees) {
  if (!Number.isInteger(employees) || employees < 1 || employees > 20) return null;
  if (employees <= 5) return { code: 'starter', name: 'Clockx 5', employeeLimit: 5, price: 14999 };
  if (employees <= 10) return { code: 'team', name: 'Clockx 10', employeeLimit: 10, price: 21999 };
  return { code: 'business', name: 'Clockx 20', employeeLimit: 20, price: 36999 };
}

// Monthly subscriptions cost approximately 20% more across a full year.
// Round down by 1p from an exact 20% premium to retain familiar .99 endings.
export function monthlyPricePence(annualPence) {
  if (!Number.isInteger(annualPence) || annualPence <= 0) return null;
  return Math.round(annualPence / 10) - 1;
}

export function checkoutQuote(packageCode, employees, billingInterval = 'year') {
  if (!['month', 'year'].includes(billingInterval)) return null;
  const plan = packageCode === 'clocking'
    ? clockxPlan(employees)
    : packageCode === 'full' ? fullWorkspacePlan(employees) : null;
  if (!plan) return null;
  // The 6–9 employee monthly prices are the approved Stripe tiers,
  // not estimates derived by rounding the annual price.
  const fullMonthlyTiers = { 6: 3499, 7: 3899, 8: 4399, 9: 4799 };
  const monthlyPence = packageCode === 'full' && employees >= 6 && employees <= 9
    ? fullMonthlyTiers[employees] : monthlyPricePence(plan.price);
  return {
    ...plan,
    packageCode,
    billingInterval,
    annualPence: plan.price,
    monthlyPence,
    recurringPence: billingInterval === 'month' ? monthlyPence : plan.price,
    twelveMonthCostPence: billingInterval === 'month' ? monthlyPence * 12 : plan.price,
    annualSavingPence: monthlyPence * 12 - plan.price,
  };
}

/** Display-only basket; Stripe independently resolves and verifies every price. */
export const DAYRIDGE_ADDON_RATES = Object.freeze({
  tasks:{label:'Tasks',fullOnly:true,month:499,year:4999,perUserMonth:235,perUserYear:2399},
  stock:{label:'Stock Management',fullOnly:true,month:999,year:9999},
  geo_clockin:{label:'Geo Clock-in',fullOnly:false,month:499,year:4999},
});
export function quoteWebsiteBasket({packageCode='clocking',employees=5,interval='year',addons=[],tasksUsers=0}={}){
  const plan=checkoutQuote(packageCode,employees,interval);
  if(!plan||!Array.isArray(addons)||addons.length>3||new Set(addons).size!==addons.length||
    addons.some(code=>!Object.hasOwn(DAYRIDGE_ADDON_RATES,code)||(DAYRIDGE_ADDON_RATES[code].fullOnly&&packageCode!=='full')))return null;
  if(addons.includes('tasks')&&(!Number.isSafeInteger(tasksUsers)||tasksUsers<1||tasksUsers>employees))return null;
  const totalFor=term=>{
    const planPrice=checkoutQuote(packageCode,employees,term).recurringPence;
    return planPrice+addons.reduce((total,code)=>{
      const rate=DAYRIDGE_ADDON_RATES[code];
      const seats=code==='tasks'?tasksUsers*(term==='year'?rate.perUserYear:rate.perUserMonth):0;
      return total+rate[term]+seats;
    },0);
  };
  const breakdown=addons.map(code=>{
    const rate=DAYRIDGE_ADDON_RATES[code];
    return {code,label:rate.label,amountPence:rate[interval]+(code==='tasks'?tasksUsers*(interval==='year'?rate.perUserYear:rate.perUserMonth):0)};
  });
  const annualTotalPence=totalFor('year'),monthlyTotalPence=totalFor('month');
  return {...plan,requestedEmployees:employees,addons,breakdown,
    tasksUsers:addons.includes('tasks')?tasksUsers:0,
    addonPence:breakdown.reduce((sum,x)=>sum+x.amountPence,0),
    totalPence:interval==='year'?annualTotalPence:monthlyTotalPence,
    annualTotalPence,monthlyTotalPence,annualSavingPence:monthlyTotalPence*12-annualTotalPence};
}

/** Website navigation only: the checkout service never trusts these inputs. */
export function dayridgeSignupUrl(basket){
  if(!basket)return null;
  const url=new URL('https://app.dayridge.co.uk/start');
  url.searchParams.set('package',basket.packageCode);
  url.searchParams.set('employees',String(basket.requestedEmployees));
  url.searchParams.set('billing',basket.billingInterval);
  if(basket.addons.length)url.searchParams.set('addons',basket.addons.join(','));
  if(basket.addons.includes('tasks'))url.searchParams.set('tasksUsers',String(basket.tasksUsers));
  return url.toString();
}
