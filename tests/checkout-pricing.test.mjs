import { readFile } from 'node:fs/promises'
import test from 'node:test';
import assert from 'node:assert/strict';
import { checkoutQuote, monthlyPricePence, quoteWebsiteBasket, dayridgeSignupUrl } from '../public/pricing.js';

test('Clockx monthly and yearly options use server-compatible tier prices', () => {
  for (const [employees, yearly, monthly, seats] of [
    [1, 14999, 1499, 5], [5, 14999, 1499, 5],
    [6, 21999, 2199, 10], [10, 21999, 2199, 10],
    [11, 36999, 3699, 20], [20, 36999, 3699, 20],
  ]) {
    const annual = checkoutQuote('clocking', employees, 'year');
    const month = checkoutQuote('clocking', employees, 'month');
    assert.equal(annual.recurringPence, yearly);
    assert.equal(month.recurringPence, monthly);
    assert.equal(month.employeeLimit, seats);
    assert.equal(month.twelveMonthCostPence, monthly * 12);
    assert.equal(annual.annualSavingPence, monthly * 12 - yearly);
  }
});

test('Full Workspace monthly premium applies across all existing tiers', () => {
  for (const [count, annual, monthly] of [
    [5, 29999, 2999], [6, 34499, 3499], [7, 38999, 3899],
    [8, 43499, 4399], [9, 47999, 4799], [10, 64999, 6499],
    [15, 64999, 6499], [16, 114999, 11499], [30, 114999, 11499],
    [31, 189999, 18999], [50, 189999, 18999],
  ]) {
    const quote = checkoutQuote('full', count, 'month');
    assert.equal(quote.recurringPence, monthly);
    assert.equal(quote.annualPence, annual);
    assert.ok(monthly * 12 > annual);
  }
});

test('Invalid package, size and billing interval cannot produce a quote', () => {
  assert.equal(checkoutQuote('unknown', 5), null);
  assert.equal(checkoutQuote('full', 0), null);
  assert.equal(checkoutQuote('full', 51), null);
  assert.equal(checkoutQuote('clocking', 21), null);
  assert.equal(checkoutQuote('full', 6.5), null);
  assert.equal(checkoutQuote('full', 5, 'weekly'), null);
  assert.equal(monthlyPricePence(-10), null);
});

test('pricing can navigate to checkout without sending a payment request', async () => {
  const html=await readFile(new URL('../public/pricing/index.html',import.meta.url),'utf8')
  const script=await readFile(new URL('../public/checkout.js',import.meta.url),'utf8')
  assert.match(html,/id="dayridge-checkout-form"/)
  assert.match(html,/action="\/contact\/" method="get"/)
  assert.match(html,/name="billing" value="year" checked/)
  assert.match(html,/name="billing" value="month"/)
  assert.match(html,/Continue to secure checkout/)
  assert.match(script,/window.location.assign\(url\)/)
  assert.doesNotMatch(script,/fetch\(|stripe\.checkout|STRIPE_SECRET_KEY/i)
  assert.doesNotMatch(html,/name="ownerEmail"|name="businessName"|name="cardNumber"/)
})
test('checkout page shows a clear coming-soon message and cannot process payment', async () => {
  const html=await readFile(new URL('../public/checkout/index.html',import.meta.url),'utf8')
  const script=await readFile(new URL('../public/checkout-page.js',import.meta.url),'utf8')
  assert.match(html,/Online checkout isn't set up just yet/)
  assert.match(html,/No payment will be taken/)
  assert.match(html,/disabled aria-disabled="true"/)
  assert.match(html,/href="\/contact\/\?topic=plan"/)
  assert.match(html,/id="checkout-selected-total"/)
  assert.match(html,/content="noindex, follow"/)
  assert.match(html,/id="checkout-owner-details"/)
  assert.match(html,/name="email" type="email"/)
  assert.match(html,/name="business"/)
  assert.match(html,/name="name"/)
  assert.match(html,/I agree for DayRidge to store these details/)
  assert.match(html,/id="checkout-owner-confirmed"/)
  assert.match(html,/id="checkout-payment-unavailable"|checkout-payment-disabled/)
  assert.doesNotMatch(html,/<iframe|stripe\.com|type="password"|name="cardNumber"/i)
  assert.match(script,/contact-config\.js/)
  assert.match(script,/topic: 'plan'/)
  assert.match(script,/elapsedMs: Date\.now\(\) - startedAt/)
  assert.match(script,/response\.ok/)
  assert.doesNotMatch(script,/stripe\.checkout|stripe\.com|create-business|createUser|paymentIntent/i)
})

test('build a monthly Full Workspace basket with all three add-ons and licensed users',()=>{
  const quote=quoteWebsiteBasket({packageCode:'full',employees:8,interval:'month',
    addons:['tasks','stock','geo_clockin'],tasksUsers:4});
  assert.equal(quote.recurringPence,4399);
  assert.equal(quote.totalPence,4399+499+4*235+999+499);
  assert.equal(quote.breakdown.length,3);
  const url=new URL(dayridgeSignupUrl(quote));
  assert.equal(url.hostname,'app.dayridge.co.uk');
  assert.equal(url.pathname,'/start');
  assert.equal(url.searchParams.get('package'),'full');
  assert.equal(url.searchParams.get('employees'),'8');
  assert.equal(url.searchParams.get('billing'),'month');
  assert.equal(url.searchParams.get('addons'),'tasks,stock,geo_clockin');
  assert.equal(url.searchParams.get('tasksUsers'),'4');
  assert.equal(url.searchParams.has('price'),false);
});
test('annual quote bundles use approved annual add-on prices',()=>{
  const quote=quoteWebsiteBasket({packageCode:'full',employees:10,interval:'year',
    addons:['tasks','stock','geo_clockin'],tasksUsers:5});
  assert.equal(quote.totalPence,64999+4999+5*2399+9999+4999);
  assert.equal(quote.annualSavingPence,quote.monthlyTotalPence*12-quote.totalPence);
});
test('Clockx only allows geo, and invalid Tasks licences never produce a checkout link',()=>{
  assert.equal(quoteWebsiteBasket({packageCode:'clocking',employees:5,interval:'month',
    addons:['tasks'],tasksUsers:1}),null);
  assert.equal(quoteWebsiteBasket({packageCode:'clocking',employees:5,interval:'month',
    addons:['stock']}),null);
  assert.equal(quoteWebsiteBasket({packageCode:'full',employees:5,interval:'month',
    addons:['tasks'],tasksUsers:6}),null);
  assert.equal(quoteWebsiteBasket({packageCode:'full',employees:5,interval:'month',
    addons:['tasks'],tasksUsers:0}),null);
  const geo=quoteWebsiteBasket({packageCode:'clocking',employees:5,interval:'month',
    addons:['geo_clockin']});
  assert.equal(geo.totalPence,1499+499);
  assert.equal(new URL(dayridgeSignupUrl(geo)).searchParams.get('addons'),'geo_clockin');
  assert.equal(dayridgeSignupUrl(null),null);
});
test('website pricing section offers each addon in both plan and builder sections',async()=>{
  const html=await readFile(new URL('../public/pricing/index.html',import.meta.url),'utf8');
  assert.match(html,/data-quote-billing/);
  assert.match(html,/data-quote-checkout/);
  for(const code of ['tasks','stock','geo_clockin']){
    assert.match(html,new RegExp('name="addons" value="'+code+'"'));
    assert.match(html,new RegExp('data-checkout-addon-price="'+code+'"'));
  }
  assert.doesNotMatch(html,/Discuss this workspace|Discuss this plan/);
});
