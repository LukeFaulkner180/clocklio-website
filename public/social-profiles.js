import './website-stats.js?v=1';
// Add the verified DayRidge page URLs here when the profiles are ready.
const socialProfiles = {
  facebook: null,
  tiktok: 'https://www.tiktok.com/@dayridge.app',
  instagram: null,
};

for (const profile of document.querySelectorAll('[data-social-platform]')) {
  const name = profile.textContent.trim();
  const destination = socialProfiles[profile.dataset.socialPlatform];
  if (!destination) {
    profile.classList.add('is-coming-soon');
    profile.title = `${name} — Coming soon`;
    const label = profile.querySelector('span');
    if (label) {
      label.classList.add('social-profile-copy');
      const status = document.createElement('small');
      status.className = 'social-profile-status';
      status.textContent = 'Coming soon';
      label.append(status);
    }
    continue;
  }
  const url = new URL(destination);
  if (url.protocol !== 'https:') continue;
  const link = document.createElement('a');
  link.className = profile.className;
  link.dataset.socialPlatform = profile.dataset.socialPlatform;
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `DayRidge on ${name} (opens in a new tab)`);
  link.append(...profile.childNodes);
  profile.replaceWith(link);
}

if (Object.values(socialProfiles).some(Boolean)) {
  for (const note of document.querySelectorAll('[data-social-note]')) {
    note.textContent = Object.values(socialProfiles).every(Boolean)
      ? 'Updates, ideas and a look behind the scenes.'
      : 'Follow the journey. More social pages coming soon.';
  }
}
