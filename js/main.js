import { initMedia } from './carousel.js';
import { initCloudFrames } from './cloud-frame.js';
import { initCopy } from './copy.js';
import { initCountUp } from './countup.js';
import { initHero } from './hero.js';
import { initI18n } from './i18n.js';
import { initHeadingFit } from './fit.js';
import { initModal } from './modal.js';
import { initPixelFrames } from './pixels.js';
import { initReveal } from './reveal.js';
import { initScrollspy } from './scrollspy.js';
import { initTheme } from './theme.js';
import { initTransitions } from './transition.js';

function initToTop() {
  const button = document.querySelector('.to-top');
  const update = () => {
    button.hidden = window.scrollY < 600;
  };
  window.addEventListener('scroll', update, { passive: true });
  update();
}

initTransitions();
initTheme();
initI18n();
initScrollspy();
initHero();
initModal();
initMedia();
initPixelFrames();
initCloudFrames();
initHeadingFit();
initReveal();
initCountUp();
initCopy();
initToTop();
