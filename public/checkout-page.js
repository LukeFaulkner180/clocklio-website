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


// DayRidge already accepts validated, rate-limited contact requests. Reuse
// this existing route for a manual business setup enquiry. This does not
// create a business, request payment, or send an invitation automatically.
const setupForm = document.getElementById('checkout-owner-details');
if (setupForm) {
  const startedAt = Date.now();
  const submitButton = document.getElementById('checkout-owner-submit');
  const feedback = document.getElementById('checkout-owner-status');
  const confirmed = document.getElementById('checkout-owner-confirmed');
  let submitting = false;
  const band = packageCode === 'clocking'
    ? (employees <= 5 ? '1–5' : employees <= 10 ? '6–10' : employees <= 20 ? '11–20' : '21+')
    : (employees <= 5 ? '1–5' : employees <= 9 ? '6–9' : employees <= 15 ? '10–15' : employees <= 30 ? '16–30' : '31–50');

  setupForm.addEventListener('input', event => {
    feedback.hidden = true;
    event.target.setCustomValidity?.('');
  });
  setupForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || submitButton.disabled) return;
    const name = setupForm.elements.namedItem('name');
    const email = setupForm.elements.namedItem('email');
    const business = setupForm.elements.namedItem('business');
    const consent = document.getElementById('checkout-owner-agree');
    for (const field of [name,email,business]) field.value = field.value.trim();
    if (!setupForm.reportValidity() || !consent.checked) return;
    const payload = {
      name: name.value,
      email: email.value,
      business: business.value,
      package: packageCode,
      employees: band,
      topic: 'plan',
      message: 'DayRidge checkout preview — request for manual business setup. Plan: '
        + (packageCode === 'full' ? 'Full Workspace' : 'Clockx')
        + '. Selected employees: ' + employees
        + '. Billing preference: ' + (billingInterval === 'month' ? 'monthly' : 'annual')
        + '. Indicative recurring price: ' + (quote ? formatGBP(quote.recurringPence) : 'custom quote')
        + '. No payment has been made and no automatic invitation should be sent.',
      website: setupForm.elements.namedItem('website').value,
      elapsedMs: Date.now() - startedAt,
    };
    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Sending request…';
    feedback.hidden = true;
    try {
      const { contactURL, publicAnonKey } = await import('./contact-config.js');
      const response = await fetch(contactURL, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', apikey:publicAnonKey, Authorization:'Bearer ' + publicAnonKey },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        throw new Error(response.status === 429
          ? 'Too many enquiries have been submitted from this connection. Please try again later.'
          : response.status === 400
            ? 'Please check your details and try again.'
            : 'We could not save your request. Please try again.');
      }
      setupForm.hidden = true;
      confirmed.hidden = false;
      confirmed.focus({ preventScroll: true });
    } catch (error) {
      feedback.textContent = error?.name === 'TimeoutError' || error?.name === 'AbortError' || error?.name === 'TypeError'
        ? 'We could not confirm your request was received. Check your connection and try again.'
        : error?.message || 'We could not save your request.';
      feedback.hidden = false;
      feedback.focus();
    } finally {
      submitting = false;
      if (confirmed.hidden) {
        submitButton.disabled = false;
        submitButton.textContent = 'Request my business setup';
      }
    }
  });
  // Without JavaScript, never transmit private owner details in a GET URL.
  submitButton.disabled = false;
}
