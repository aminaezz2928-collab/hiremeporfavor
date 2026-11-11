// Screen carousels, the full-size view of any screen, and videos that play only while visible.
import { reducedMotion } from './pixel-noise.js';

function initCarousel(root) {
  const track = root.querySelector('.carousel-track');
  const slides = [...track.querySelectorAll('.slide')];
  const [prev, next] = root.querySelectorAll('.carousel-btn');
  const counter = root.querySelector('.carousel-counter');
  let queued = false;

  const current = () => {
    const left = track.scrollLeft;
    let index = 0;
    slides.forEach((slide, i) => {
      if (slide.offsetLeft - slides[0].offsetLeft <= left + 8) index = i;
    });
    return index;
  };

  const update = () => {
    queued = false;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    root.classList.toggle('is-static', track.scrollWidth <= track.clientWidth + 4);
    const index = atEnd ? slides.length - 1 : current();
    counter.textContent = `${index + 1} / ${slides.length}`;
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = atEnd;
  };

  const go = (direction) => {
    const target = slides[Math.min(slides.length - 1, Math.max(0, current() + direction))];
    track.scrollTo({ left: target.offsetLeft - slides[0].offsetLeft, behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  track.addEventListener('scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  }, { passive: true });
  new ResizeObserver(update).observe(track);
  track.querySelectorAll('img').forEach((img) => img.addEventListener('load', update, { once: true }));
  update();
}

// Full-size view: a dark stage, the caption, and a zoom bar (−, slider, +, percent).
// Zoomed in, the stage scrolls, so any part of the screen can be reached by drag, wheel or keys.
function initLightbox() {
  const dialog = document.querySelector('.lightbox');
  if (!dialog) return;
  const stage = dialog.querySelector('.lightbox-stage');
  const caption = dialog.querySelector('.lightbox-caption');
  const range = dialog.querySelector('.lightbox-range');
  const output = dialog.querySelector('.lightbox-value');
  // The image element is created on first use, so the page never carries an empty one.
  let image = null;
  let base = { width: 0, height: 0 };

  const fit = () => {
    if (!image?.naturalWidth) return;
    const maxW = stage.clientWidth - 32;
    const maxH = stage.clientHeight - 32;
    const scale = Math.min(1, maxW / image.naturalWidth, maxH / image.naturalHeight);
    base = { width: image.naturalWidth * scale, height: image.naturalHeight * scale };
  };

  const setZoom = (percent) => {
    const value = Math.min(300, Math.max(100, Math.round(percent / 5) * 5));
    range.value = String(value);
    output.textContent = `${value}%`;
    range.style.setProperty('--fill', `${((value - 100) / 200) * 100}%`);
    if (!image) return;
    const centerX = (stage.scrollLeft + stage.clientWidth / 2) / Math.max(1, stage.scrollWidth);
    const centerY = (stage.scrollTop + stage.clientHeight / 2) / Math.max(1, stage.scrollHeight);
    image.style.width = `${(base.width * value) / 100}px`;
    image.style.height = `${(base.height * value) / 100}px`;
    dialog.classList.toggle('is-zoomed', value > 100);
    // Keep the point in the middle of the view in place while zooming.
    stage.scrollLeft = centerX * stage.scrollWidth - stage.clientWidth / 2;
    stage.scrollTop = centerY * stage.scrollHeight - stage.clientHeight / 2;
  };

  document.querySelectorAll('[data-zoom]').forEach((button) => {
    button.addEventListener('click', () => {
      const source = button.querySelector('img');
      if (!image) {
        image = document.createElement('img');
        image.decoding = 'async';
        stage.append(image);
        image.addEventListener('load', () => {
          fit();
          setZoom(100);
        });
      }
      image.alt = source.alt;
      caption.textContent = button.closest('.slide')?.querySelector('figcaption')?.textContent.trim() ?? '';
      dialog.showModal();
      image.src = source.currentSrc || source.src;
      if (image.complete) {
        fit();
        setZoom(100);
      }
    });
  });

  dialog.querySelectorAll('.lightbox-zoom').forEach((button) => {
    button.addEventListener('click', () => setZoom(Number(range.value) + Number(button.dataset.step) * 25));
  });
  range.addEventListener('input', () => setZoom(Number(range.value)));
  window.addEventListener('resize', () => {
    if (!dialog.open) return;
    fit();
    setZoom(Number(range.value));
  });

  // Drag to move around a zoomed screen.
  let drag = null;
  stage.addEventListener('pointerdown', (event) => {
    if (event.target !== image || Number(range.value) <= 100) return;
    drag = { x: event.clientX, y: event.clientY, left: stage.scrollLeft, top: stage.scrollTop, moved: false };
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true;
    stage.scrollLeft = drag.left - dx;
    stage.scrollTop = drag.top - dy;
  });
  stage.addEventListener('pointerup', () => {
    setTimeout(() => { drag = null; });
  });

  dialog.querySelector('.lightbox-close').addEventListener('click', () => dialog.close());
  // A click on the dark area closes; a click on the screen toggles zoom.
  stage.addEventListener('click', (event) => {
    if (drag?.moved) return;
    if (event.target === image) setZoom(Number(range.value) > 100 ? 100 : 200);
    else dialog.close();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    setZoom(100);
  });
}

function initVideos() {
  const videos = [...document.querySelectorAll('video[data-autoplay]')];
  if (!videos.length || reducedMotion()) return;
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    const video = entry.target;
    if (entry.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }), { threshold: 0.4 });
  videos.forEach((video) => observer.observe(video));
}

export function initMedia() {
  document.querySelectorAll('[data-carousel]').forEach(initCarousel);
  initLightbox();
  initVideos();
}
