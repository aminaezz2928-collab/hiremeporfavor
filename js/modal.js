import { mosaicSnapshot } from './hero.js';
import { reducedMotion } from './pixel-noise.js';

// showModal() already gives focus handling, Esc to close and an inert page behind the window.
export function initModal() {
  const dialog = document.querySelector('.how-dialog');
  if (!dialog) return;

  document.querySelectorAll('.how-open').forEach((button) => {
    button.addEventListener('click', () => {
      // A full mosaic frame becomes the backdrop, its light center sitting behind the window.
      dialog.style.setProperty('--mosaic', `url("${mosaicSnapshot()}")`);
      dialog.showModal();
      const target = button.dataset.howTarget && dialog.querySelector(`#${button.dataset.howTarget}`);
      if (target) {
        // "More about methods" opens the window right at the methods.
        requestAnimationFrame(() => {
          target.scrollIntoView({ block: 'start', behavior: reducedMotion() ? 'auto' : 'smooth' });
          target.focus({ preventScroll: true });
        });
      } else {
        dialog.scrollTop = 0;
      }
    });
  });

  dialog.querySelector('.how-close').addEventListener('click', () => dialog.close());

  // The window padding lives on an inner element, so only the backdrop targets the dialog itself.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}
