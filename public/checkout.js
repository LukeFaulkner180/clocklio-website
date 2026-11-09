import { checkoutQuote } from './pricing.js';

const form = document.querySelector('#dayridge-checkout-form');
if (form) {
  const packageField = form.querySelector('[name="packageCode"]');
  const employeesField = form.querySelector('[name="employeeCount"]');
  const frequencyFields = [...form.querySelectorAll('[name="billingInterval"]')];
  const quoteAmount = document.querySelector('#dayridge-checkout-quote');
  const band = document.querySelector('#dayridge-checkout-band');
  const savings = document.querySelector('#dayridge-checkout-savings');
  const message = document.querySelector('#dayridge-checkout-feedback');
  const button = form.querySelector('[type="submit"]');
  const params = new URLSearchParams(window.location.search);
  const permittedPackages = ['clocking', 'full'];
  const config = {
    enabled: document.querySelector('meta[name="dayridge-checkout-enabled"]')?.content === 'true',
    endpoint: document.querySelector('meta[name="dayridge-checkout-endpoint"]')?.content || '',
  };
  const checkoutReady = config.enabled && /^https:\/\/[a-z0-9.-]+\/functions\/v1\/stripe-create-checkout$/i.test(config.endpoint);
  const money = pence => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
  const billingInterval = () => frequencyFields.find(field => field.checked)?.value || 'year';

  if (permittedPackages.includes(params.get('package'))) packageField.value = params.get('package');
  const requestedEmployees = Number(params.get('employees'));
  if (Number.isInteger(requestedEmployees) && requestedEmployees >= 1 && requestedEmployees <= 50) employeesField.value = String(requestedEmployees);
  if (['month', 'year'].includes(params.get('billing'))) {
    const selected = frequencyFields.find(field => field.value === params.get('billing'));
    if (selected) selected.checked = true;
  }

  function updateQuote() {
    const quote = checkoutQuote(packageField.value, Number(employeesField.value), billingInterval());
    quoteAmount.textContent = quote
      ? money(quote.recurringPence) + (quote.billingInterval === 'month' ? ' / month' : ' / year')
      : 'Custom quote';
    band.textContent = quote
      ? 'Up to ' + quote.employeeLimit + ' employees · ' +
        (quote.billingInterval === 'month' ? 'Monthly recurring payment; cancel subject to terms.' : 'Annual recurring payment; next renewal in 12 months.') +
        ' Add-ons billed separately.'
      : 'Teams above the package maximum need a tailored quote.';
    if (savings) savings.textContent = quote
      ? (quote.billingInterval === 'year'
        ? 'Save ' + money(quote.annualSavingPence) + ' compared with twelve monthly payments.'
        : 'Pay ' + money(quote.twelveMonthCostPence) + ' over twelve months, if you stay subscribed.')
      : '';
    const canBuy = checkoutReady && Boolean(quote);
    button.disabled = !canBuy;
    button.textContent = canBuy ? 'Continue to secure checkout' : 'Checkout not yet available';
    message.textContent = checkoutReady
      ? (quote ? 'Stripe will confirm the recurring amount, terms and payment before purchase.' : 'Please contact us to discuss a custom plan.')
      : 'Preview only: online payments are not yet enabled.';
  }
  packageField.addEventListener('change', updateQuote);
  employeesField.addEventListener('input', updateQuote);
  for (const field of frequencyFields) field.addEventListener('change', updateQuote);
  updateQuote();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!checkoutReady || !form.reportValidity()) return;
    const quote = checkoutQuote(packageField.value, Number(employeesField.value), billingInterval());
    if (!quote) return;
    button.disabled = true;
    button.textContent = 'Connecting securely…';
    message.textContent = 'Creating a secure Stripe checkout session…';
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({
          packageCode: quote.packageCode,
          employeeCount: Number(employeesField.value),
          billingInterval: quote.billingInterval,
          businessName: form.elements.namedItem('businessName').value.trim(),
          ownerEmail: form.elements.namedItem('ownerEmail').value.trim().toLowerCase(),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.url !== 'string') throw new Error(data.message || 'Checkout could not be started.');
      const destination = new URL(data.url);
      if (destination.protocol !== 'https:' || destination.hostname !== 'checkout.stripe.com') {
        throw new Error('Checkout returned an unexpected destination.');
      }
      window.location.assign(destination.href);
    } catch (error) {
      updateQuote();
      message.textContent = error instanceof Error ? error.message : 'Please try again later.';
    }
  });
}
