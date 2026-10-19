import { signupURL, publicAnonKey } from './early-access-config.js';

const form = document.querySelector('[data-tester-form]');
if (form) {
  const startedAt = Date.now();
  const button = form.querySelector('button[type="submit"]');
  const status = document.querySelector('[data-tester-status]');
  const success = document.querySelector('[data-tester-success]');
  let saving = false;
  form.addEventListener('input', event => {
    event.target.setCustomValidity?.('');
    status.hidden = true;
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (saving) return;
    for (const name of ['name', 'email', 'business']) {
      const field = form.elements.namedItem(name);
      field.value = field.value.trim();
      field.setCustomValidity(field.value ? '' : 'Please complete this field.');
    }
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {
      name: data.get('name'), email: data.get('email'), business: data.get('business'),
      industry: data.get('industry'), teamSize: data.get('teamSize'),
      interests: data.getAll('interests'), goals: String(data.get('goals') || '').trim(),
      consent: data.get('consent') === 'yes', website: data.get('website'),
      elapsedMs: Date.now() - startedAt,
    };
    saving = true;
    button.disabled = true;
    button.textContent = 'Saving your registration…';
    status.hidden = true;
    try {
      const response = await fetch(signupURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: publicAnonKey, Authorization: 'Bearer ' + publicAnonKey },
        body: JSON.stringify(payload), signal: AbortSignal.timeout(20000),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.ok !== true) {
        throw new Error(response.status === 429
          ? 'There have been several registrations from this connection. Please try again in an hour.'
          : response.status === 400
            ? 'Please check your details, make sure the contact permission is ticked, and try again.'
            : 'We couldn’t save your registration. Please try again in a moment.');
      }
      form.hidden = true;
      document.querySelector('[data-form-heading]').hidden = true;
      document.querySelector('[data-form-intro]').hidden = true;
      success.hidden = false;
      success.focus();
    } catch (error) {
      status.textContent = ['TimeoutError', 'AbortError', 'TypeError'].includes(error.name)
        ? 'We couldn’t confirm your registration. Check your connection and try again; you won’t be added twice.'
        : error.message;
      status.hidden = false;
      status.focus();
    } finally {
      saving = false;
      button.disabled = false;
      button.textContent = 'Register my business';
    }
  });
  // Enable submission only after the handler is attached. Without JavaScript,
  // contact details must never be sent in a page URL or a native form request.
  button.disabled = false;
}
