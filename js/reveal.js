// Content rises in as it enters the screen, in a short stagger inside each group.
import { reducedMotion } from './pixel-noise.js';

const GROUPS = [
  '.case-header > *',
  '.case-section > *',
  '.cards > li',
  '.works-main > .work-card',
  '.works-side > *',
  '#works > h2',
  '#about > h2',
  '.about-intro',
  '.about-columns > div',
  '.small-talk > *',
  '.talk-list > .talk-item',
  '.next-case',
];

export function initReveal() {
  if (reducedMotion() || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('js-reveal');
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('is-in');
    observer.unobserve(entry.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  GROUPS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      if (element.classList.contains('reveal') || element.closest('.case-section--impact > .numbers')) return;
      const siblings = [...element.parentElement.children].filter((child) => child.classList.contains('reveal'));
      element.classList.add('reveal');
      element.style.setProperty('--i', String(Math.min(siblings.length, 6)));
      observer.observe(element);
    });
  });
}
