// Privacy and cookie information for the DayRidge public website.
// This is a transparency notice, not a consent banner: the website currently
// has no optional marketing tags or visitor-identifying analytics cookies.
const NOTICE_KEY = 'dayridge_privacy_notice_v1';
const STATS_KEY = 'dayridge_website_stats_disabled_v1';

function saved(key) {
  try { return window.localStorage.getItem(key); } catch { return null; }
}
function setSaved(key, value) {
  try { if (value === null) window.localStorage.removeItem(key); else window.localStorage.setItem(key, value); }
  catch { /* Browsers may disable storage. The site remains usable. */ }
}
function statsDisabled() { return saved(STATS_KEY) === '1'; }

for (const footer of document.querySelectorAll('.site-footer .footer-legal')) {
  if (footer.querySelector('a[href="/cookies/"]')) continue;
  const link = document.createElement('a');
  link.href = '/cookies/';
  link.textContent = 'Privacy & cookies';
  const privacyLink = footer.querySelector('a[href="/privacy/"]');
  if (privacyLink) privacyLink.after(link);
  else footer.append(link);
}

const notice = document.createElement('section');
notice.className = 'dr-privacy-notice';
notice.setAttribute('role', 'region');
notice.setAttribute('aria-label', 'DayRidge website privacy information');
notice.hidden = true;
notice.innerHTML = `
  <div class="dr-privacy-notice-head">
    <span class="dr-privacy-icon" aria-hidden="true">✳</span>
    <div><strong>Your privacy matters</strong><span>Clear, simple and in your control.</span></div>
  </div>
  <p>DayRidge's public website uses cookieless statistics rather than advertising trackers. We may use essential browser storage to remember your privacy choice.</p>
  <div class="dr-privacy-buttons">
    <button type="button" class="dr-privacy-primary" data-privacy-dismiss>Got it</button>
    <button type="button" class="dr-privacy-secondary" data-privacy-settings aria-expanded="false" aria-controls="dr-privacy-options">Privacy controls</button>
  </div>
  <div class="dr-privacy-options" id="dr-privacy-options" hidden>
    <div class="dr-privacy-option"><div><strong>Essential storage</strong><small>Security and saved privacy preferences. Always available when needed.</small></div><span class="dr-privacy-essential">Essential</span></div>
    <div class="dr-privacy-option"><div><strong>Anonymous website statistics</strong><small>Broad page and device counts, without cookies or a persistent visitor ID.</small></div><button type="button" class="dr-privacy-switch" role="switch" aria-label="Allow anonymous website statistics" data-privacy-stat-toggle><span></span></button></div>
    <small class="dr-privacy-explainer">Turning this off stops future DayRidge website statistics from this browser. It does not remove counts already collected.</small>
  </div>
  <a class="dr-privacy-policy" href="/cookies/">Read our Privacy & cookies information</a>
`;
document.body.append(notice);
const toggle = notice.querySelector('[data-privacy-stat-toggle]');
const settings = notice.querySelector('[data-privacy-settings]');
const options = notice.querySelector('#dr-privacy-options');
function refreshToggle() {
  const enabled = !statsDisabled();
  toggle.setAttribute('aria-checked', String(enabled));
  toggle.classList.toggle('active', enabled);
}
function showSettings() {
  notice.hidden = false;
  options.hidden = false;
  settings.setAttribute('aria-expanded', 'true');
  refreshToggle();
}
refreshToggle();
if (saved(NOTICE_KEY) !== 'dismissed' && !['404','not-found'].includes(document.body?.dataset.page)) {
  notice.hidden = false;
}
settings.addEventListener('click', () => {
  const open = options.hidden;
  options.hidden = !open;
  settings.setAttribute('aria-expanded', String(open));
});
toggle.addEventListener('click', () => {
  setSaved(STATS_KEY, statsDisabled() ? null : '1');
  refreshToggle();
});
notice.querySelector('[data-privacy-dismiss]').addEventListener('click', () => {
  setSaved(NOTICE_KEY, 'dismissed');
  notice.hidden = true;
});
document.addEventListener('click', event => {
  const control = event.target.closest?.('[data-open-privacy-preferences]');
  if (control) { event.preventDefault(); showSettings(); }
});
