const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = pence => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(pence / 100);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

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
setupTabs(previewTabs, selected => previewTabs.forEach(button => {
  const active = button === selected;
  button.setAttribute('aria-selected', String(active));
  button.tabIndex = active ? 0 : -1;
  document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
}));
const stage = $('[data-tilt]');
if (stage && matchMedia('(hover: hover) and (pointer: fine)').matches && !reducedMotion.matches) {
  stage.addEventListener('pointermove', event => {
    if (reducedMotion.matches) return;
    const box = stage.getBoundingClientRect();
    const x = ((event.clientX - box.left) / box.width - 0.5) * 3;
    const y = ((event.clientY - box.top) / box.height - 0.5) * -3;
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
  link.href = '/features/?role=' + key;
  $('#role-preview').setAttribute('aria-labelledby', selected.id);
});

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

// Annual platform and monthly add-ons are deliberately shown separately.
if ($('[data-team-number]')) {
  const plans = [{ code: 'starter', name: 'Starter', limit: 5, price: 29999 }, { code: 'team', name: 'Team', limit: 15, price: 64999 }, { code: 'business', name: 'Business', limit: 30, price: 114999 }, { code: 'scale', name: 'Scale', limit: 50, price: 189999 }];
  const number = $('[data-team-number]'), range = $('[data-team-range]'), tasks = $('[data-quote-tasks]'), stock = $('[data-quote-stock]'), taskUsers = $('[data-tasks-users]');
  function quote() {
    const size = Number(number.value), users = Number(taskUsers.value);
    const valid = number.value !== '' && Number.isInteger(size) && size >= 1 && size <= 10000;
    const validUsers = !tasks.checked || (taskUsers.value !== '' && Number.isInteger(users) && users >= 0 && users <= 10000);
    $('[data-tasks-users-wrap]').hidden = !tasks.checked;
    const plan = valid ? plans.find(item => size <= item.limit) : null;
    $$('[data-plan-card]').forEach(card => {
      const selected = valid && plan && card.dataset.planCard === plan.code;
      card.classList.toggle('is-recommended', Boolean(selected));
      $('[data-recommendation]', card).hidden = !selected;
    });
    const tasksTotal = tasks.checked ? 499 + 235 * users : 0;
    const stockTotal = stock.checked ? 999 : 0;
    $('[data-quote-plan]').textContent = valid ? (plan?.name || 'Custom') : 'Your';
    $('[data-quote-employees]').textContent = valid ? String(size) : '—';
    const annual = $('[data-quote-annual]');
    annual.textContent = valid ? (plan ? money(plan.price) : 'Let’s talk') : '—';
    if (plan) { const suffix = document.createElement('small'); suffix.textContent = '/ year'; annual.append(suffix); }
    $('[data-quote-custom]').hidden = !valid || Boolean(plan);
    $('[data-quote-tasks-total]').textContent = validUsers ? (tasks.checked ? money(tasksTotal) : 'Not selected') : 'Check user count';
    $('[data-quote-stock-total]').textContent = stock.checked ? money(stockTotal) : 'Not selected';
    $('[data-quote-monthly]').textContent = valid && validUsers ? money(tasksTotal + stockTotal) : '—';
    $('[data-quote-status]').textContent = !valid ? 'Enter a whole employee count from 1 to 10,000.' : !validUsers ? 'Enter a whole Tasks user count from 0 to 10,000.' : (plan ? plan.name + ' fits ' + size + ' employees. ' : 'A custom core quote fits teams over 50. ') + 'Selected add-ons total ' + money(tasksTotal + stockTotal) + ' per month.';
    const params = new URLSearchParams({ topic: valid && !plan ? 'custom' : 'plan' });
    if (valid && validUsers) { params.set('employees', String(size)); params.set('plan', plan?.name || 'Custom'); if (tasks.checked) params.set('tasks', String(users)); if (stock.checked) params.set('stock', 'yes'); }
    $('[data-quote-contact]').href = '/contact/?' + params;
  }
  range.addEventListener('input', () => { number.value = range.value; quote(); });
  number.addEventListener('input', () => { range.value = String(Math.min(60, Math.max(1, Number(number.value) || 1))); quote(); });
  [tasks, stock].forEach(input => input.addEventListener('change', quote));
  taskUsers.addEventListener('input', quote);
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

// Contact details are pending. Visitors can prepare and copy a local draft.
const contactForm = $('#contact-form');
if (contactForm) {
  const panel = $('[data-email-draft-panel]'), preview = $('[data-email-preview]'), status = $('[data-draft-status]');
  const query = new URLSearchParams(location.search);
  const field = name => contactForm.elements.namedItem(name);
  const topic = query.get('topic');
  if ([...field('topic').options].some(option => option.value === topic)) field('topic').value = topic;
  const size = Number(query.get('employees'));
  if (Number.isInteger(size) && size >= 1 && size <= 10000) field('employees').value = size <= 5 ? '1–5' : size <= 15 ? '6–15' : size <= 30 ? '16–30' : size <= 50 ? '31–50' : '51+';
  const plan = query.get('plan');
  if (['Starter', 'Team', 'Business', 'Scale', 'Custom'].includes(plan)) {
    let message = 'I’d like to discuss the ' + plan + ' plan for ' + size + ' active employees.';
    const users = query.get('tasks');
    if (users !== null && /^\d{1,5}$/.test(users) && Number(users) <= 10000) message += '\nTasks add-on: ' + users + ' agreed chargeable users.';
    if (query.get('stock') === 'yes') message += '\nStock Management add-on: yes.';
    field('message').value = message;
  }
  let enquiry = '';
  contactForm.addEventListener('input', () => { panel.hidden = true; enquiry = ''; });
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    ['name', 'business', 'message'].forEach(name => field(name).setCustomValidity(field(name).value.trim() ? '' : 'Please fill in this field.'));
    if (!contactForm.reportValidity()) return;
    const data = new FormData(contactForm);
    const topicName = field('topic').selectedOptions[0].textContent;
    enquiry = 'Hello ClockNexa,\n\n' + String(data.get('message')).trim() + '\n\nName: ' + String(data.get('name')).trim() + '\nEmail: ' + String(data.get('email')).trim() + '\nBusiness: ' + String(data.get('business')).trim() + '\nTeam size: ' + data.get('employees') + '\nEnquiry: ' + topicName;
    preview.textContent = enquiry;
    status.textContent = 'Your enquiry is ready to copy. It has not been sent. Contact details are coming soon.';
    panel.hidden = false; panel.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
  });
  contactForm.addEventListener('input', event => { if (event.target.setCustomValidity) event.target.setCustomValidity(''); });
  $('[data-copy-enquiry]').addEventListener('click', async () => {
    if (!enquiry) return;
    try { await navigator.clipboard.writeText(enquiry); status.textContent = 'Enquiry copied. Keep it ready for when our contact details are available.'; }
    catch { const range = document.createRange(); range.selectNodeContents(preview); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); status.textContent = 'Select and copy the enquiry above to keep for later.'; }
  });
}
