// Case contents: the active section and a rail that fills along the list as you read.
export function initScrollspy() {
  const nav = document.querySelector('.case-nav');
  const list = nav?.querySelector('ul');
  if (!list) return;

  const links = [...list.querySelectorAll('a')];
  const sections = links.map((link) => document.querySelector(link.hash));
  let current = null;
  let queued = false;

  const update = () => {
    queued = false;
    const readingLine = window.innerHeight * 0.3;
    const pageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;

    let index = 0;
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= readingLine) index = i;
    });
    // A short last section may never reach the reading line.
    const lastTop = sections.at(-1).getBoundingClientRect().top;
    if (pageEnd && lastTop < window.innerHeight) index = sections.length - 1;

    // How far the reading line has gone through the active section.
    const box = sections[index].getBoundingClientRect();
    const inside = Math.min(1, Math.max(0, (readingLine - box.top) / Math.max(1, box.height)));

    const item = links[index].parentElement;
    const filled = pageEnd ? list.scrollHeight : item.offsetTop + item.offsetHeight * inside;
    list.style.setProperty('--rail', `${Math.round(filled)}px`);

    if (index === current) return;
    current = index;
    links.forEach((link, i) => {
      if (i === index) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
      link.parentElement.classList.toggle('is-read', i < index);
    });
    // On narrow screens the menu is a horizontal strip: keep the active item visible.
    if (list.scrollWidth > list.clientWidth) list.scrollLeft = links[index].offsetLeft - 16;
  };

  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  update();
}
