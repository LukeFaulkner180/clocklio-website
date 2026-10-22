import { publicAnonKey } from './contact-config.js';

// One in-memory event per document load. No cookies or visitor identification.
const onWebsite = ['dayridge.co.uk', 'www.dayridge.co.uk'].includes(location.hostname) ||
  (location.hostname === 'lukefaulkner180.github.io' && /^\/clocklio-website(?:\/|$)/.test(location.pathname));
const bot = /bot\b|crawler|spider|slurp|facebookexternalhit|facebot|whatsapp|telegrambot|preview|headless|lighthouse/i.test(navigator.userAgent);
if (onWebsite && !bot && !['404', 'not-found'].includes(document.body?.dataset.page) &&
  typeof crypto.randomUUID === 'function') {
  let sent = false;
  const eventId = crypto.randomUUID();
  const send = async (retry = false) => {
    try {
      const response = await fetch('https://gfqewchszhnaupukjcyb.supabase.co/functions/v1/dayridge-website-view', {
        method: 'POST',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', apikey: publicAnonKey, Authorization: `Bearer ${publicAnonKey}` },
        body: JSON.stringify({ eventId }),
      });
      if (response.status >= 500 && !retry) window.setTimeout(() => { void send(true); }, 1000);
    } catch {
      if (!retry) window.setTimeout(() => { void send(true); }, 1000);
    }
  };
  const countWhenVisible = () => {
    if (sent || document.visibilityState !== 'visible' || document.prerendering) return;
    sent = true;
    document.removeEventListener('visibilitychange', countWhenVisible);
    document.removeEventListener('prerenderingchange', countWhenVisible);
    void send();
  };
  document.addEventListener('visibilitychange', countWhenVisible);
  document.addEventListener('prerenderingchange', countWhenVisible);
  countWhenVisible();
}
