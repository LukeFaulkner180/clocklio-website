import { checkoutQuote } from './pricing.js';

const params = new URLSearchParams(window.location.search);
const requestedPackage = params.get('package');
const requestedCount = Number(params.get('employees'));
const interval = params.get('billing');
const packageCode = ['clocking','full'].includes(requestedPackage) ? requestedPackage : 'clocking';
const employees = Number.isInteger(requestedCount) && requestedCount >= 1 && requestedCount <= 50 ? requestedCount : 5;
const billingInterval = ['year','month'].includes(interval) ? interval : 'year';
const quote = checkoutQuote(packageCode, employees, billingInterval);
const formatGBP = amount => new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP'}).format(amount / 100);
const text = (id, value) => { const node = document.getElementById(id); if(node) node.textContent = value; };
text('checkout-selected-plan', packageCode === 'full' ? 'Full Workspace' : 'Clockx');
text('checkout-selected-employees', quote ? 'Up to ' + quote.employeeLimit + ' employees' : 'Custom employee allowance');
text('checkout-selected-cycle', billingInterval === 'month' ? 'Monthly recurring' : 'Annual recurring');
text('checkout-selected-total', quote ? formatGBP(quote.recurringPence) : 'Custom quote');
text('checkout-total-period', quote ? '/ ' + (billingInterval === 'month' ? 'month' : 'year') : '');
text('checkout-selection-note', quote ? 'Indicative plan price only. No payment is being requested or taken.' : 'Contact DayRidge for a tailored price. No payment is being requested or taken.');
const contact = document.getElementById('checkout-contact');
if(contact) contact.href = '/contact/?' + new URLSearchParams({topic:'plan',package:packageCode,employees:String(employees)}).toString();
const change = document.getElementById('checkout-change-plan');
if(change) change.href = '/pricing/?' + new URLSearchParams({package:packageCode,employees:String(employees),billing:billingInterval}).toString() + '#checkout';
// This page deliberately contains no payment form, API requests, or card processing.
