import { checkoutQuote } from './pricing.js';

const form = document.querySelector('#dayridge-checkout-form');
if (form) {
  const packageField = form.querySelector('[name="package"]');
  const employeesField = form.querySelector('[name="employees"]');
  const frequencyFields = [...form.querySelectorAll('[name="billing"]')];
  const amount = document.querySelector('#dayridge-checkout-quote');
  const band = document.querySelector('#dayridge-checkout-band');
  const saving = document.querySelector('#dayridge-checkout-savings');
  const message = document.querySelector('#dayridge-checkout-feedback');
  const button = form.querySelector('[type="submit"]');
  const params = new URLSearchParams(window.location.search);
  const money = pence => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
  if (['clocking', 'full'].includes(params.get('package'))) packageField.value = params.get('package');
  const selectedEmployees = Number(params.get('employees'));
  if (Number.isInteger(selectedEmployees) && selectedEmployees >= 1 && selectedEmployees <= 50) employeesField.value = String(selectedEmployees);
  if (['month', 'year'].includes(params.get('billing'))) {
    const chosen = frequencyFields.find(field => field.value === params.get('billing'));
    if (chosen) chosen.checked = true;
  }
  function signupPlan(quote, interval) {
    if (!quote || interval !== 'year') return null;
    if (quote.packageCode === 'clocking') return 'clockx' + quote.employeeLimit;
    return quote.employeeLimit === 5 ? 'full5' : null;
  }
  function update() {
    const interval = frequencyFields.find(field => field.checked)?.value || 'year';
    const quote = checkoutQuote(packageField.value, Number(employeesField.value), interval);
    amount.textContent = quote ? money(quote.recurringPence) + (interval === 'month' ? ' / month' : ' / year') : 'Custom quote';
    band.textContent = quote ? 'Up to ' + quote.employeeLimit + ' employees · ' + (interval === 'month' ? 'Monthly' : 'Annual') + ' recurring plan price. Add-ons billed separately.' : 'For teams above the available allowance, please contact DayRidge.';
    saving.textContent = quote ? (interval === 'year' ? 'Save ' + money(quote.annualSavingPence) + ' compared with 12 monthly payments.' : money(quote.twelveMonthCostPence) + ' over 12 months if you remain subscribed.') : '';
    const live = signupPlan(quote, interval);
    button.textContent = live ? 'Continue to business signup' : 'Contact DayRidge about this plan';
    message.textContent = live ? 'Review your annual plan and business details before payment.' : 'Contact DayRidge to arrange this selection.';

  }
  packageField.addEventListener('change', update);
  employeesField.addEventListener('input', update);
  for (const field of frequencyFields) field.addEventListener('change', update);
  update();
  // This is navigation only. No payment endpoint, customer data collection or card handling.
  form.addEventListener('submit', event => {
    event.preventDefault();
    const interval = frequencyFields.find(field => field.checked)?.value || 'year';
    const employees = Number(employeesField.value);
    if (!form.reportValidity()) return;
    const plan = signupPlan(checkoutQuote(packageField.value, employees, interval), interval);
    if (plan) {
      window.location.assign('https://app.dayridge.co.uk/start?plan=' + plan);
      return;
    }
    const query = new URLSearchParams({ package: packageField.value, employees: String(employees), billing: interval });
    window.location.assign('/contact/?topic=plan&' + query.toString());
  });
}
