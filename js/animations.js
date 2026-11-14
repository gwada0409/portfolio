import {
  animate,
  createTimeline,
  stagger,
  onScroll,
  cubicBezier,
} from '../assets/vendor/anime.esm.min.js';

const EASE_ENTER = cubicBezier(0.22, 1, 0.36, 1);
const EASE_UI = cubicBezier(0.2, 0.8, 0.2, 1);

const activeInstances = [];

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function track(instance) {
  if (instance) activeInstances.push(instance);
  return instance;
}

/**
 * Hero entrance timeline — runs once on initial load.
 */
export function animateHero() {
  if (prefersReducedMotion()) return;

  const heroItems = document.querySelectorAll('[data-hero-item]');
  const heroMedia = document.querySelector('[data-hero-media]');
  if (!heroItems.length) return;

  heroItems.forEach((el) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
  });

  if (heroMedia) {
    heroMedia.style.opacity = '0';
    heroMedia.style.transform = 'scale(0.97)';
  }

  const tl = createTimeline({
    defaults: {
      ease: EASE_ENTER,
    },
  });

  tl.add(heroItems, {
    opacity: [0, 1],
    translateY: [16, 0],
    duration: 580,
    delay: stagger(65),
  });

  if (heroMedia) {
    tl.add(
      heroMedia,
      {
        opacity: [0, 1],
        scale: [0.97, 1],
        duration: 680,
      },
      140
    );
  }

  track(tl);
}

/**
 * Reusable scroll-triggered stagger reveal using Anime.js v4 onScroll.
 */
export function setupScrollReveals() {
  if (prefersReducedMotion()) return;

  const groups = document.querySelectorAll('[data-reveal-group]');
  groups.forEach((group) => {
    const items = group.querySelectorAll('[data-reveal-item]');
    if (!items.length) return;

    items.forEach((item) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(18px)';
    });

    const anim = animate(items, {
      opacity: [0, 1],
      translateY: [18, 0],
      duration: 540,
      delay: stagger(60),
      ease: EASE_ENTER,
      autoplay: onScroll({
        target: group,
        enter: 'bottom-=60 top',
        repeat: false,
      }),
    });

    track(anim);
  });

  // Experience timeline rail draw + item reveal
  const timeline = document.querySelector('[data-timeline]');
  if (timeline) {
    const rail = timeline.querySelector('.timeline-rail');
    const entries = timeline.querySelectorAll('.timeline-item');

    if (rail) {
      rail.style.transform = 'scaleY(0)';
      track(
        animate(rail, {
          scaleY: [0, 1],
          duration: 700,
          ease: EASE_UI,
          autoplay: onScroll({
            target: timeline,
            enter: 'bottom-=80 top',
            repeat: false,
          }),
        })
      );
    }

    if (entries.length) {
      entries.forEach((entry) => {
        entry.style.opacity = '0';
        entry.style.transform = 'translateX(-14px)';
      });

      track(
        animate(entries, {
          opacity: [0, 1],
          translateX: [-14, 0],
          duration: 560,
          delay: stagger(110),
          ease: EASE_ENTER,
          autoplay: onScroll({
            target: timeline,
            enter: 'bottom-=60 top',
            repeat: false,
          }),
        })
      );
    }
  }
}

/**
 * Lightbox modal entrance animation.
 */
export function animateModalOpen(dialogEl) {
  if (prefersReducedMotion() || !dialogEl) return;
  animate(dialogEl, {
    opacity: [0, 1],
    scale: [0.96, 1],
    duration: 240,
    ease: EASE_ENTER,
  });
}

/**
 * Clean up all tracked Anime.js instances and ScrollObservers.
 */
export function cleanupAnimations() {
  while (activeInstances.length) {
    const instance = activeInstances.pop();
    if (instance && typeof instance.revert === 'function') {
      instance.revert();
    }
  }
}

export function initAnimations() {
  animateHero();
  setupScrollReveals();
}
