// Small pointer-driven movement complements the CSS entrance animations.
const artwork = document.querySelector('[data-landing-art]');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
let pendingFrame = 0;

function resetArtwork() {
  cancelAnimationFrame(pendingFrame);
  pendingFrame = 0;
  artwork?.style.removeProperty('--art-rotate-x');
  artwork?.style.removeProperty('--art-rotate-y');
}
if (artwork) {
  artwork.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches) return;
    cancelAnimationFrame(pendingFrame);
    pendingFrame = requestAnimationFrame(() => {
      const bounds = artwork.getBoundingClientRect();
      const x = Math.max(-.5, Math.min(.5, (event.clientX - bounds.left) / bounds.width - .5));
      const y = Math.max(-.5, Math.min(.5, (event.clientY - bounds.top) / bounds.height - .5));
      artwork.style.setProperty('--art-rotate-x', `${-y * 3}deg`);
      artwork.style.setProperty('--art-rotate-y', `${x * 3}deg`);
    });
  }, { passive: true });
  artwork.addEventListener('pointerleave', resetArtwork);
  reducedMotion.addEventListener('change', resetArtwork);
  finePointer.addEventListener('change', resetArtwork);
}
document.addEventListener('visibilitychange', () => {
  document.body.classList.toggle('holding-paused', document.hidden);
  if (document.hidden) resetArtwork();
});
