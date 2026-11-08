// DayRidge's accessible, zero-dependency illustrative product gallery.
const gallery = document.querySelector('#app-gallery');
if (gallery) {
  const cards = [...gallery.querySelectorAll('[data-gallery-item]')];
  const filters = [...gallery.querySelectorAll('[data-gallery-filter]')];
  const dialog = document.querySelector('#dr-gallery-dialog');
  const image = dialog?.querySelector('[data-gallery-full-image]');
  const title = dialog?.querySelector('[data-gallery-title]');
  const description = dialog?.querySelector('[data-gallery-description]');
  const count = dialog?.querySelector('[data-gallery-position]');
  let index = 0;
  let priorFocus = null;
  const visibleCards = () => cards.filter(card => !card.hidden);
  const render = () => {
    const shown = visibleCards();
    if (!shown.length) return;
    index = (index + shown.length) % shown.length;
    const item = shown[index];
    image.src = item.querySelector('img')?.currentSrc || item.dataset.galleryImage;
    image.alt = item.querySelector('img')?.alt || 'DayRidge illustrative product preview';
    title.textContent = item.dataset.galleryTitle || 'DayRidge preview';
    description.textContent = item.dataset.galleryDescription || '';
    count.textContent = `${index + 1} of ${shown.length}`;
  };
  filters.forEach(filter => filter.addEventListener('click', () => {
    const selection = filter.dataset.galleryFilter;
    cards.forEach(card => { const categories = (card.dataset.galleryCategory || '').split(/\s+/); card.hidden = selection !== 'all' && !categories.includes(selection); });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button === filter)));
    if (dialog?.open) { index = 0; render(); }
  }));
  cards.forEach(card => card.addEventListener('click', () => {
    if (!dialog || !image || !title || !description || !count) return;
    priorFocus = card;
    index = visibleCards().indexOf(card);
    render();
    dialog.showModal();
    dialog.querySelector('[data-gallery-close]')?.focus();
  }));
  dialog?.querySelector('[data-gallery-close]')?.addEventListener('click', () => dialog.close());
  dialog?.querySelector('[data-gallery-prev]')?.addEventListener('click', () => { index--; render(); });
  dialog?.querySelector('[data-gallery-next]')?.addEventListener('click', () => { index++; render(); });
  dialog?.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog?.addEventListener('close', () => { priorFocus?.focus(); });
  dialog?.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); index--; render(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); index++; render(); }
  });
}
