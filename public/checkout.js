import { clockxPlan, fullWorkspacePlan } from './pricing.js';

const form = document.querySelector('#dayridge-checkout-form');
if (form) {
  const packageField = form.querySelector('[name="packageCode"]');
  const employeesField = form.querySelector('[name="employeeCount"]');
  const quote = document.querySelector('#dayridge-checkout-quote');
  const band = document.querySelector('#dayridge-checkout-band');
  const message = document.querySelector('#dayridge-checkout-feedback');
  const button = form.querySelector('[type="submit"]');
  const params = new URLSearchParams(window.location.search);
  const permittedPackages = ['clocking', 'full'];
  const config = {
    enabled: document.querySelector('meta[name="dayridge-checkout-enabled"]')?.content === 'true',
    endpoint: document.querySelector('meta[name="dayridge-checkout-endpoint"]')?.content || '',
  };
  const checkoutReady = config.enabled && /^https:\/\/[a-z0-9.-]+\/functions\/v1\/stripe-create-checkout$/i.test(config.endpoint);
  const money = amount => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(amount / 100);

  if (permittedPackages.includes(params.get('package'))) packageField.value = params.get('package');
  const requestedEmployees = Number(params.get('employees'));
  if (Number.isInteger(requestedEmployees) && requestedEmployees >= 1 && requestedEmployees <= 50) employeesField.value = String(requestedEmployees);
  
  function updateQuote() {
    const count = Number(employeesField.value);
    const isClockx = packageField.value === 'clocking';
    const plan = isClockx ? clockxPlan(count) : fullWorkspacePlan(count);
    quote.textContent = plan ? money(plan.price) + ' / year' : 'Custom quote';
    band.textContent = plan
      ? 'Includes up to ' + plan.employeeLimit + ' employees. Annual renewal; optional add-ons charged separately.'
      : 'Teams above the package maximum need a tailored quote.';
    const canBuy = checkoutReady && Boolean(plan);
    button.disabled = !canBuy;
    button.textContent = canBuy ? 'Continue to secure checkout' : 'Checkout not yet available';
    message.textContent = checkoutReady
      ? (plan ? 'You will confirm your details and payment on Stripe.' : 'Please contact us to discuss a custom plan.')
      : 'Online purchases are being prepared. No payment can be taken through this page yet.';
  }
  packageField.addEventListener('change', updateQuote);
  employeesField.addEventListener('change', updateQuote);
  updateQuote();

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!checkoutReady) return;
    const count = Number(employeesField.value);
    const plan = packageField.value === 'clocking' ? clockxPlan(count) : fullWorkspacePlan(count);
    if (!plan || !form.reportValidity()) return;
    button.disabled = true;
    button.textContent = 'Connecting securely…';
    message.textContent = 'Creating a secure Stripe checkout session…';
    try {
      const response = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'omit',
        body: JSON.stringify({
          packageCode: packageField.value,
          employeeCount: count,
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
      message.textContent = error instanceof Error ? error.message : 'Please try again later.';
      updateQuote();
    }
  });
}
