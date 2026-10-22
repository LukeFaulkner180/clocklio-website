import { publicAnonKey } from './contact-config.js';

// Anonymous aggregates only. No cookies, browser storage or persistent visitor ID.
const onWebsite = ['dayridge.co.uk', 'www.dayridge.co.uk'].includes(location.hostname) ||
  (location.hostname === 'lukefaulkner180.github.io' && /^\/clocklio-website(?:\/|$)/.test(location.pathname));
const bot = /bot\b|crawler|spider|slurp|facebookexternalhit|facebot|whatsapp|telegrambot|preview|headless|lighthouse/i.test(navigator.userAgent);
if (onWebsite && !bot && !['404', 'not-found'].includes(document.body?.dataset.page) && typeof crypto.randomUUID === 'function') {
  let sent = false;
  const pagePath = location.pathname.replace(/^\/clocklio-website(?=\/|$)/, '') || '/';
  const device = /ipad|tablet/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1) ? 'tablet' : /mobi|iphone|android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
  const classifyHost = host => {
    if (/(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(host)) return 'facebook';
    if (/(^|\.)instagram\.com$/.test(host)) return 'instagram';
    if (/(^|\.)google\.[a-z.]+$/.test(host)) return 'google';
    if (/(^|\.)bing\.com$/.test(host)) return 'bing';
    if (/(^|\.)linkedin\.com$|^lnkd\.in$/.test(host)) return 'linkedin';
    if (['dayridge.co.uk','www.dayridge.co.uk','lukefaulkner180.github.io'].includes(host)) return 'internal';
    return 'other';
  };
  let source = 'direct';
  try {
    if (document.referrer) source = classifyHost(new URL(document.referrer).hostname);
    // Recognise known campaign source names locally; never transmit the query string.
    const campaign = new URL(location.href).searchParams.get('utm_source')?.toLowerCase();
    const known = { facebook:'facebook',fb:'facebook',instagram:'instagram',ig:'instagram',google:'google',bing:'bing',linkedin:'linkedin' };
    if (campaign && Object.hasOwn(known,campaign)) source = known[campaign];
  } catch { /* An unavailable referrer remains direct / unknown. */ }
  const send = async (payload, retry = false) => {
    try {
      const response = await fetch('https://gfqewchszhnaupukjcyb.supabase.co/functions/v1/dayridge-website-view', {
        method:'POST', credentials:'omit', referrerPolicy:'no-referrer', keepalive:true,
        headers:{'Content-Type':'application/json',apikey:publicAnonKey,Authorization:`Bearer ${publicAnonKey}`},
        body:JSON.stringify(payload),
      });
      if (response.status >= 500 && !retry) window.setTimeout(() => { void send(payload,true); },1000);
    } catch { if (!retry) window.setTimeout(() => { void send(payload,true); },1000); }
  };
  const payload = eventType => ({ eventId:crypto.randomUUID(), pagePath, device, source, eventType });
  const countWhenVisible = () => {
    if (sent || document.visibilityState !== 'visible' || document.prerendering) return;
    sent = true;
    document.removeEventListener('visibilitychange',countWhenVisible);
    document.removeEventListener('prerenderingchange',countWhenVisible);
    void send(payload('view'));
  };
  document.addEventListener('visibilitychange',countWhenVisible);
  document.addEventListener('prerenderingchange',countWhenVisible);
  document.addEventListener('click',event => {
    const link = event.target?.closest?.('a[href]');
    if (!link || document.visibilityState !== 'visible') return;
    try {
      const url = new URL(link.href,location.href);
      if (url.origin === location.origin && /\/(?:downloads)\/(?:dayridge|clocknexa)-product-brochure\.pdf$/.test(url.pathname)) void send(payload('brochure_download'));
    } catch { /* Analytics must never interrupt a link. */ }
  });
  countWhenVisible();
}
