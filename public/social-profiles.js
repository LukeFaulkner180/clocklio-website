// Add the verified DayRidge page URLs here when the profiles are ready.
const socialProfiles = {
  facebook: null,
  tiktok: 'https://www.tiktok.com/@dayridge.app',
  instagram: null,
};

for (const profile of document.querySelectorAll('[data-social-platform]')) {
  const destination = socialProfiles[profile.dataset.socialPlatform];
  if (!destination) continue;
  const url = new URL(destination);
  if (url.protocol !== 'https:') continue;
  const link = document.createElement('a');
  link.className = profile.className;
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `DayRidge on ${profile.textContent.trim()} (opens in a new tab)`);
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
