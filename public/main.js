import { fullWorkspacePlan } from './pricing.js?v=3';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = pence => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const siteRoot = new URL('./', import.meta.url).pathname;
const sitePath = relativePath => siteRoot + relativePath.replace(/^\/+/, '');

// Follow the device's motion preference automatically, without website controls.
const motionDisabled = () => reducedMotion.matches;
function updateMotion() {
  if (motionDisabled()) {
    $$('[data-reveal]').forEach(element => element.classList.add('is-visible'));
    $$('[data-tilt]').forEach(element => { element.style.transform = ''; });
    document.getAnimations().forEach(animation => { if (animation.effect?.target?.closest('[role="tabpanel"]')) animation.cancel(); });
  }
}
reducedMotion.addEventListener('change', updateMotion);
document.addEventListener('visibilitychange', () => document.documentElement.classList.toggle('motion-suspended', document.hidden));
updateMotion();
$$('[data-back-top]').forEach(button => {
  button.hidden = false;
  button.addEventListener('click', () => scrollTo({ top: 0, behavior: motionDisabled() ? 'instant' : 'smooth' }));
});
function animatePanel(panel) {
  if (motionDisabled()) return;
  panel.getAnimations().forEach(animation => animation.cancel());
  panel.animate([{ opacity: .25, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
}

// Navigation works with pointer, keyboard and touch.
const menuToggle = $('[data-menu-toggle]');
const navigation = $('#site-navigation');
const platformToggle = $('[data-platform-toggle]');
const platformMenu = $('#platform-menu');
function closePlatform(focus = false) {
  platformMenu.hidden = true;
  platformToggle.setAttribute('aria-expanded', 'false');
  if (focus) platformToggle.focus();
}
function closeMenu(focus = false) {
  navigation.classList.remove('is-open');
  document.body.classList.remove('menu-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Open menu');
  closePlatform();
  if (focus) menuToggle.focus();
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  navigation.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  if (!open) closePlatform();
});
platformToggle.addEventListener('click', () => {
  const open = platformMenu.hidden;
  platformMenu.hidden = !open;
  platformToggle.setAttribute('aria-expanded', String(open));
});
document.addEventListener('click', event => {
  if (!event.target.closest('.nav-shell')) closeMenu();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (!platformMenu.hidden) closePlatform(true);
    else if (navigation.classList.contains('is-open')) closeMenu(true);
  }
  if (event.key === 'Tab' && navigation.classList.contains('is-open')) {
    const items = [menuToggle, ...$$('a, button', navigation)].filter(el => el.getClientRects().length);
    const first = items[0], last = items.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
$$('a', navigation).forEach(link => link.addEventListener('click', () => closeMenu()));
matchMedia('(max-width: 1000px)').addEventListener('change', () => closeMenu());
const header = $('[data-header]');
let scrollPending = false;
function updateHeader() { header.classList.toggle('is-scrolled', scrollY > 140); scrollPending = false; }
addEventListener('scroll', () => {
  if (!scrollPending) { scrollPending = true; requestAnimationFrame(updateHeader); }
}, { passive: true });
updateHeader();

// Content stays visible if JavaScript or IntersectionObserver is unavailable.
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
  }), { threshold: 0.06, rootMargin: '15px' });
  $$('[data-reveal]').forEach(el => observer.observe(el));
  document.documentElement.classList.add('js');
  reducedMotion.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); $$('[data-reveal]').forEach(el => el.classList.add('is-visible')); }
  });
}
function setupTabs(buttons, activate) {
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => activate(button));
    button.addEventListener('keydown', event => {
      const next = { ArrowRight: (index + 1) % buttons.length, ArrowLeft: (index - 1 + buttons.length) % buttons.length, Home: 0, End: buttons.length - 1 }[event.key];
      if (next !== undefined) { event.preventDefault(); activate(buttons[next]); buttons[next].focus(); }
    });
  });
}
const previewTabs = $$('[data-preview]');
const previewDescriptions = {
  rota: ['Plan the week and publish shifts your team can follow.', 'Rota published', 'Your team can see their shifts.'],
  time: ['Keep recorded hours, breaks and attendance in view.', 'Time, recorded', 'A clearer view of the working day.'],
  stock: ['Compare stock usage, expected takings and till figures.', 'Stock, explained', 'Count, compare and investigate differences.']
};
setupTabs(previewTabs, selected => {
  previewTabs.forEach(button => {
  const active = button === selected;
  button.setAttribute('aria-selected', String(active));
  button.tabIndex = active ? 0 : -1;
  document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
  });
  const nav = $$('.demo-sidebar .demo-nav');
  nav.forEach((item, index) => item.classList.toggle('active', index === { rota: 0, time: 1, stock: 4 }[selected.dataset.preview]));
  const description = previewDescriptions[selected.dataset.preview];
  $('[data-preview-description]').textContent = description[0];
  $('[data-preview-notice-title]').textContent = description[1];
  $('[data-preview-notice-detail]').textContent = description[2];
  animatePanel(document.getElementById(selected.getAttribute('aria-controls')));
});
const stage = $('[data-tilt]');
if (stage && matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  stage.addEventListener('pointermove', event => {
    if (motionDisabled()) return;
    const box = stage.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * 1.2;
    const y = ((event.clientY - box.top) / box.height - 0.5) * -1.2;
    stage.style.transform = 'perspective(1400px) rotateX(' + y + 'deg) rotateY(' + x + 'deg)';
  });
  stage.addEventListener('pointerleave', () => { stage.style.transform = ''; });
}
const roles = {
  owner: { label: 'THE BUSINESS OWNER VIEW', title: ['The detail.', 'The bigger picture.'], description: 'Keep an eye on staffing costs, review payroll handovers and decide who can access sensitive information.', items: ['Labour budgets & gross pay summaries', 'Permission controls for your Managers', 'Employee onboarding & protected records'], link: 'Explore owner features' },
  manager: { label: 'THE MANAGER VIEW', title: ['A plan for the week.', 'A grip on the day.'], description: 'Bring rotas, requests and attendance together. Keep the day moving with the permissions your business owner has agreed.', items: ['Draft, refine & publish the team rota', 'Leave, sickness & shift cover requests', 'Attendance records & permitted documents'], link: 'Explore manager features' },
  employee: { label: 'THE EMPLOYEE VIEW', title: ['Know what’s next.', 'Follow every hour.'], description: 'See your published shifts, record your time and keep your requests and documents in one personal workspace.', items: ['Upcoming shifts & published rotas', 'Clock-ins, breaks & gross pay estimates', 'Leave requests & your own documents'], link: 'Explore employee features' },
  leader: { label: 'THE TEAM LEADER VIEW', title: ['Lead the shift.', 'With the right tools.'], description: 'Support the team with a focused view. Your business can grant additional rota, leave or attendance permissions when you need them.', items: ['Published team shifts & your own records', 'Optional rota & leave approval permissions', 'Optional directory & attendance visibility'], link: 'Explore Team Leader features' }
};
const roleTabs = $$('[data-role]');
setupTabs(roleTabs, selected => {
  roleTabs.forEach(button => { const active = button === selected; button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1; });
  const key = selected.dataset.role, role = roles[key];
  $('[data-role-label]').textContent = role.label;
  $('[data-role-title]').replaceChildren(document.createTextNode(role.title[0]), document.createElement('br'), document.createTextNode(role.title[1]));
  $('[data-role-description]').textContent = role.description;
  $$('.role-preview-list > div > span').forEach((span, index) => { span.textContent = role.items[index]; });
  const link = $('[data-role-link]');
  link.firstChild.textContent = role.link + ' ';
  link.href = sitePath('/features/?role=' + key);
  $('#role-preview').setAttribute('aria-labelledby', selected.id);
  animatePanel($('#role-preview'));
});

// Hover light follows a pointer without replacing native touch scrolling.
if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
  $$('.bento, .addon-teaser, .industry-grid article').forEach(card => {
    card.classList.add('spotlight');
    let pointerFrame = 0;
    card.addEventListener('pointermove', event => {
      if (motionDisabled() || pointerFrame) return;
      const { clientX, clientY } = event;
      pointerFrame = requestAnimationFrame(() => {
        const bounds = card.getBoundingClientRect();
        card.style.setProperty('--pointer-x', clientX - bounds.left + 'px');
        card.style.setProperty('--pointer-y', clientY - bounds.top + 'px');
        pointerFrame = 0;
      });
    });
  });
}
const mapDetail = $('[data-map-detail]');
if (mapDetail) {
  const defaultDetail = mapDetail.textContent;
  $$('[data-map-node]').forEach(node => {
    const describe = () => { mapDetail.textContent = node.dataset.mapDescription; };
    node.addEventListener('pointerenter', describe);
    node.addEventListener('focus', describe);
    const clear = () => {
      const focused = document.activeElement.closest('[data-map-node]');
      mapDetail.textContent = focused ? focused.dataset.mapDescription : defaultDetail;
    };
    node.addEventListener('pointerleave', clear);
    node.addEventListener('blur', () => requestAnimationFrame(clear));
  });
}

// Static feature content is searchable without any remote service.
const featureCards = $$('[data-feature]');
if (featureCards.length) {
  const search = $('[data-feature-search]'), role = $('[data-feature-role]'), categories = $$('[data-category-filter]');
  let category = 'all';
  const query = new URLSearchParams(location.search);
  if (categories.some(button => button.dataset.categoryFilter === query.get('category'))) category = query.get('category');
  if ([...role.options].some(option => option.value === query.get('role'))) role.value = query.get('role');
  search.value = (query.get('search') || '').slice(0, 200);
  function filter() {
    const term = search.value.trim().toLocaleLowerCase('en-GB');
    let count = 0;
    featureCards.forEach(card => {
      const allowedRoles = card.dataset.roles.split(' ');
      const roleMatches = role.value === 'all' || allowedRoles.includes(role.value) || (role.value === 'owner' && allowedRoles.includes('manager'));
      const visible = (category === 'all' || card.dataset.category === category) && roleMatches && card.dataset.search.includes(term);
      card.hidden = !visible;
      if (visible) count++;
    });
    categories.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === category)));
    $('[data-feature-count]').textContent = count + (count === 1 ? ' feature to explore' : ' features to explore');
    $('[data-feature-empty]').hidden = count !== 0;
    $('.results-top [data-clear-filters]').hidden = !term && category === 'all' && role.value === 'all';
  }
  categories.forEach(button => button.addEventListener('click', () => { category = button.dataset.categoryFilter; filter(); }));
  search.addEventListener('input', filter);
  role.addEventListener('change', filter);
  $$('[data-clear-filters]').forEach(button => button.addEventListener('click', () => { search.value = ''; role.value = 'all'; category = 'all'; filter(); search.focus(); }));
  filter();
}

// Annual charges include annual add-ons; monthly extras stay separate.
if ($('[data-team-number]')) {

  const number = $('[data-team-number]'), range = $('[data-team-range]'), tasks = $('[data-quote-tasks]'), stock = $('[data-quote-stock]'), taskUsers = $('[data-tasks-users]'), geo = $('[data-quote-geo]'), geoBilling = $('[data-geo-billing]');
  function quote() {
    const size = Number(number.value), users = Number(taskUsers.value);
    const valid = number.value !== '' && Number.isInteger(size) && size >= 1 && size <= 10000;
    const validUsers = !tasks.checked || (taskUsers.value !== '' && Number.isInteger(users) && users >= 0 && users <= 10000);
    $('[data-tasks-users-wrap]').hidden = !tasks.checked;
    const plan = valid ? fullWorkspacePlan(size) : null;
    $$('[data-plan-card]').forEach(card => {
      const selected = valid && plan && card.dataset.planCard === plan.code;
      card.classList.toggle('is-recommended', Boolean(selected));
      $('[data-recommendation]', card).hidden = !selected;
    });
    const tasksTotal = tasks.checked ? 499 + 235 * users : 0;
    const stockTotal = stock.checked ? 999 : 0;
    const geoMonthly = geo?.checked && geoBilling.value === 'monthly' ? 499 : 0;
    const monthlyTotal = tasksTotal + stockTotal + geoMonthly;
    const geoAnnual = geo?.checked && geoBilling.value === 'annual' ? 4999 : 0;
    const annualTotal = plan ? plan.price + geoAnnual : null;
    if (geo) $('[data-geo-billing-wrap]').hidden = !geo.checked;
    if (geo) $('[data-quote-geo-total]').textContent = geo.checked ? (geoBilling.value === 'annual' ? '£49.99 / year' : '£4.99 / month') : 'Not selected';
    $('[data-quote-plan]').textContent = valid ? (plan?.name || 'Custom') : 'Your';
    $('[data-quote-employees]').textContent = valid ? String(size) : '—';
    const annual = $('[data-quote-annual]');
    annual.textContent = valid ? (plan ? money(plan.price) : 'Let’s talk') : '—';
    if (plan) { const suffix = document.createElement('small'); suffix.textContent = '/ year'; annual.append(suffix); }
    const totalAnnual = $('[data-quote-annual-total]');
    totalAnnual.textContent = valid ? (plan ? money(annualTotal) : 'Let’s talk') : '—';
    $('[data-quote-custom]').hidden = !valid || size <= 5;
    $('[data-quote-tasks-total]').textContent = validUsers ? (tasks.checked ? money(tasksTotal) : 'Not selected') : 'Check user count';
    $('[data-quote-stock-total]').textContent = stock.checked ? money(stockTotal) : 'Not selected';
    $('[data-quote-monthly]').textContent = valid && validUsers ? money(monthlyTotal) : '—';
    $('[data-quote-status]').textContent = !valid ? 'Enter a whole employee count from 1 to 10,000.' : !validUsers ? 'Enter a whole Tasks user count from 0 to 10,000.' : (!plan ? 'A Custom annual quote is needed for teams above 50 employees. ' : size < 10 ? (size <= 5 ? 'Starter includes up to five employees. ' : 'Starter includes five employees, with ' + (size - 5) + ' extra ' + (size === 6 ? 'employee' : 'employees') + ' at £45 each per year, up to nine employees. ') : plan.name + ' is a fixed annual plan covering up to ' + plan.employeeLimit + ' employees. No per-employee £45 charge applies within that allowance. ') + (plan ? 'Total annual price is ' + money(annualTotal) + (geoAnnual ? ', including Geo Clock-in' : '') + '. ' : (geoAnnual ? 'Geo Clock-in adds £49.99 per year to your agreed Custom price. ' : '')) + 'Monthly extras total ' + money(monthlyTotal) + ' per month.';
    const params = new URLSearchParams({ topic: 'plan', package: 'full' });
    if (valid && validUsers) { params.set('employees', String(size)); params.set('plan', plan?.name || 'Custom'); if (tasks.checked) params.set('tasks', String(users)); if (stock.checked) params.set('stock', 'yes'); if (geo?.checked) params.set('geo', geoBilling.value); }
    $('[data-quote-contact]').href = sitePath('/contact/?' + params);
  }
  range.addEventListener('input', () => { number.value = range.value; quote(); });
  number.addEventListener('input', () => { range.value = String(Math.min(60, Math.max(1, Number(number.value) || 1))); quote(); });
  [tasks, stock].forEach(input => input.addEventListener('change', quote));
  taskUsers.addEventListener('input', quote);
  geo?.addEventListener('change', quote);
  geoBilling?.addEventListener('change', quote);
  quote();
}
const demoTasks = $$('[data-demo-task]');
demoTasks.forEach(input => input.addEventListener('change', () => { $('[data-task-count]').textContent = demoTasks.filter(task => task.checked).length + ' of ' + demoTasks.length + ' complete'; }));

const stockInputs = $$('[data-stock-value]');
if (stockInputs.length) {
  function reconcile() {
    const values = Object.fromEntries(stockInputs.map(input => [input.dataset.stockValue, Number(input.value)]));
    const valid = stockInputs.every(input => input.value !== '' && input.checkValidity() && Number.isFinite(Number(input.value)));
    const sold = values.opening + values.delivered - values.closing - values.waste;
    const expected = $('[data-stock-expected]'), variance = $('[data-stock-variance]'), message = $('[data-stock-message]');
    if (!valid || sold < 0) {
      expected.textContent = '—'; variance.textContent = '—'; variance.removeAttribute('data-direction');
      message.textContent = !valid ? 'Enter a valid, non-negative number in each field.' : 'Closing stock and wastage cannot exceed opening stock plus deliveries.';
      return;
    }
    const expectedPence = Math.round(sold * Math.round(values.price * 100));
    const actualPence = Math.round(values.till * 100), difference = actualPence - expectedPence;
    expected.textContent = money(expectedPence); variance.textContent = money(difference);
    variance.dataset.direction = difference === 0 ? 'matched' : difference < 0 ? 'negative' : 'positive';
    message.textContent = difference === 0 ? 'The figures match for this example period.' : 'Till takings are ' + money(Math.abs(difference)) + (difference < 0 ? ' below' : ' above') + ' the stock-based expectation. Check the period and add an investigation note.';
  }
  stockInputs.forEach(input => input.addEventListener('input', reconcile));
  reconcile();
}

// Contact enquiries are saved for in-app review. No email notification is sent.
const contactForm = $('#contact-form');
if (contactForm) {
  const panel = $('[data-contact-success]'), status = $('[data-contact-status]');
  const button = contactForm.querySelector('button[type="submit"]');
  const originalButton = button.innerHTML;
  const startedAt = Date.now();
  const query = new URLSearchParams(location.search);
  const field = name => contactForm.elements.namedItem(name);
  const topic = query.get('topic');
  if ([...field('topic').options].some(option => option.value === topic)) field('topic').value = topic;
  const size = Number(query.get('employees'));
  const packageCode = query.get('package');
  if (['full','rota_time','clocking'].includes(packageCode)) field('package').value = packageCode === 'rota_time' ? 'clocking' : packageCode;
  const fullBands = [...field('employees').options].map(option => [option.value,option.textContent]);
  function employeeBands(initialSize) {
    const clockx = field('package').value === 'clocking';
    const options = clockx ? [['','Select team size'],['1–5','1–5 employees · £149.99/year'],['6–10','6–10 employees · £219.99/year'],['11–20','11–20 employees · £369.99/year'],['21+','21+ employees · agreed quote']] : fullBands;
    field('employees').replaceChildren(...options.map(([value,label]) => new Option(label,value)));
    if (Number.isInteger(initialSize) && initialSize >= 1 && initialSize <= 10000) field('employees').value = clockx ? (initialSize <= 5 ? '1–5' : initialSize <= 10 ? '6–10' : initialSize <= 20 ? '11–20' : '21+') : (initialSize <= 5 ? '1–5' : initialSize <= 9 ? '6–9' : initialSize <= 15 ? '10–15' : initialSize <= 30 ? '16–30' : initialSize <= 50 ? '31–50' : '51+');
  }
  employeeBands(size);
  field('package').addEventListener('change',() => employeeBands(null));
  const plan = query.get('plan');
  if (['Starter', 'Team', 'Business', 'Scale', 'Custom', 'Full workspace'].includes(plan)) {
    let message = 'I’d like to discuss the ' + plan + ' plan for ' + size + ' active employees.';
    const users = query.get('tasks');
    if (users !== null && /^\d{1,5}$/.test(users) && Number(users) <= 10000) message += '\nTasks add-on: ' + users + ' agreed chargeable users.';
    if (query.get('stock') === 'yes') message += '\nStock Management add-on: yes.';
    field('message').value = message;
  }
  if (['monthly','annual'].includes(query.get('geo'))) field('message').value += (field('message').value ? '\n' : '') + 'Geo Clock-in add-on: ' + (query.get('geo') === 'annual' ? '£49.99 per business per year.' : '£4.99 per business per month.');
  contactForm.addEventListener('input', event => {
    status.hidden = true;
    event.target.setCustomValidity?.('');
  });
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (button.disabled) return;
    ['name', 'business', 'message'].forEach(name => field(name).setCustomValidity(field(name).value.trim() ? '' : 'Please fill in this field.'));
    if (!contactForm.reportValidity()) return;
    const data = new FormData(contactForm);
    const payload = {
      name: String(data.get('name') || '').trim(),
      email: String(data.get('email') || '').trim(),
      package: String(data.get('package') || ''),
      business: String(data.get('business') || '').trim(),
      employees: String(data.get('employees') || ''),
      topic: String(data.get('topic') || ''),
      referrer: String(data.get('referrer') || '').trim(),
      message: String(data.get('message') || '').trim(),
      website: String(data.get('website') || ''),
      elapsedMs: Date.now() - startedAt,
    };
    button.disabled = true;
    button.textContent = 'Sending…';
    status.hidden = true;
    try {
      const { contactURL, publicAnonKey } = await import(sitePath('/contact-config.js'));
      const response = await fetch(contactURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: publicAnonKey, Authorization: 'Bearer ' + publicAnonKey },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        throw new Error(response.status === 429
          ? 'There have been several contact requests from this connection. Please try again in an hour.'
          : response.status === 400
            ? 'Please check your details and message, then try again.'
            : 'We couldn’t save your request. Please try again in a moment.');
      }
      contactForm.hidden = true;
      panel.hidden = false;
      panel.focus({ preventScroll: true });
      panel.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
    } catch (error) {
      status.textContent = ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name)
        ? 'We couldn’t confirm that your request was saved. Check your connection and try again.'
        : error.message;
      status.hidden = false;
      status.focus();
    } finally {
      if (panel.hidden) {
        button.disabled = false;
        button.innerHTML = originalButton;
      }
    }
  });
  button.disabled = false;
}
