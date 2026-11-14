import {
  animate,
  createTimeline,
  spring,
  cubicBezier,
  set,
} from '../assets/vendor/anime.esm.min.js';

const EASE_ENTER = cubicBezier(0.22, 1, 0.36, 1);
const EASE_OUT = cubicBezier(0.16, 1, 0.3, 1);
const SPRING_POP = spring({ bounce: 0.38, duration: 680 });

let rafId = null;
let registeredItems = [];
let isEngineRunning = false;

/**
 * Top hairline scroll progress bar driven by Anime.js.
 */
export function setupScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;

  const updateBar = () => {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
    animate(bar, {
      scaleX: progress,
      duration: 160,
      ease: 'outQuad',
    });
  };

  window.addEventListener('scroll', updateBar, { passive: true });
  updateBar();
}

/**
 * Hero entrance animation on initial page load.
 */
export function animateHero() {
  const heroItems = document.querySelectorAll('[data-hero-item]');
  const heroMedia = document.querySelector('[data-hero-media]');
  const socialPills = document.querySelectorAll('.hero-social .social-pill');

  if (!heroItems.length) return;

  const tl = createTimeline({
    defaults: {
      ease: EASE_ENTER,
    },
  });

  tl.add(heroItems, {
    opacity: [0, 1],
    translateY: [24, 0],
    duration: 650,
    delay: (el, i) => i * 70,
  });

  if (heroMedia) {
    tl.add(
      heroMedia,
      {
        opacity: [0, 1],
        scale: [0.94, 1],
        translateY: [20, 0],
        duration: 720,
        ease: EASE_OUT,
      },
      120
    );
  }

  if (socialPills.length) {
    tl.add(
      socialPills,
      {
        opacity: [0, 1],
        translateY: [12, 0],
        scale: [0.94, 1],
        duration: 450,
        delay: (el, i) => i * 50,
      },
      380
    );
  }
}

/**
 * Smooth Hermite / cubic easing curve for natural entrance and exit.
 */
function smoothEase(t) {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

/**
 * Registers an element into the continuous bidirectional scroll engine.
 */
function registerScrollItem(el, options = {}) {
  if (!el) return;

  const isHero = !!options.isHero;
  const isLast = !!options.isLast;
  const staggerIndex = options.staggerIndex || 0;
  const staggerOffset = staggerIndex * 26; // pixels of stagger separation

  const rect = el.getBoundingClientRect();
  const vh = window.innerHeight;
  const inInitialView = rect.top < vh && rect.bottom > 0;

  // On initial load, elements already in viewport start visible; off-screen elements start hidden
  const initialOpacity = inInitialView || isHero ? 1 : 0;
  const initialY = inInitialView || isHero ? 0 : 40;
  const initialScale = inInitialView || isHero ? 1 : 0.98;

  el.style.opacity = String(initialOpacity);
  el.style.transform = `translate3d(0, ${initialY}px, 0) scale(${initialScale})`;
  el.style.willChange = 'opacity, transform';

  registeredItems.push({
    el,
    isHero,
    isLast,
    staggerOffset,
    currentOpacity: initialOpacity,
    currentY: initialY,
    currentScale: initialScale,
    targetOpacity: initialOpacity,
    targetY: initialY,
    targetScale: initialScale,
  });
}

/**
 * Evaluates target opacity, translateY, and scale for every registered item
 * based on its exact geometric position relative to the viewport.
 */
function updateItemTargets() {
  const vh = window.innerHeight;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const entryDistance = Math.max(160, Math.min(260, vh * 0.28));
  const exitDistance = Math.max(140, Math.min(220, vh * 0.24));

  for (let i = 0; i < registeredItems.length; i++) {
    const item = registeredItems[i];
    const rect = item.el.getBoundingClientRect();

    if (item.isHero) {
      // Hero: 100% visible at scrollY = 0.
      // Fades out upward as user scrolls down away from top.
      // Fades back in downward as user scrolls back up to top.
      const heroExitZone = Math.max(220, vh * 0.45);
      if (scrollY <= 20 || rect.bottom >= heroExitZone) {
        item.targetOpacity = 1;
        item.targetY = 0;
        item.targetScale = 1;
      } else if (rect.bottom <= 0) {
        item.targetOpacity = 0;
        item.targetY = -30;
        item.targetScale = 1;
      } else {
        const p = smoothEase(rect.bottom / heroExitZone);
        item.targetOpacity = p;
        item.targetY = -30 * (1 - p);
        item.targetScale = 1;
      }
      continue;
    }

    if (item.isLast) {
      // Contact section: Fades in from bottom, but stays comfortably visible at document end.
      const enterThreshold = vh - item.staggerOffset;
      if (rect.top >= enterThreshold) {
        item.targetOpacity = 0;
        item.targetY = 40;
        item.targetScale = 0.98;
      } else {
        const p = smoothEase((enterThreshold - rect.top) / entryDistance);
        item.targetOpacity = p;
        item.targetY = 40 * (1 - p);
        item.targetScale = 0.98 + 0.02 * p;
      }
      continue;
    }

    // Standard bidirectional element
    const enterThreshold = vh - item.staggerOffset;
    const exitThreshold = item.staggerOffset;

    // 1. Below viewport: Entering from bottom (scrolling down) / Leaving bottom (scrolling up)
    if (rect.top >= enterThreshold) {
      item.targetOpacity = 0;
      item.targetY = 40;
      item.targetScale = 0.98;
    } else if (rect.top > enterThreshold - entryDistance) {
      const p = smoothEase((enterThreshold - rect.top) / entryDistance);
      item.targetOpacity = p;
      item.targetY = 40 * (1 - p);
      item.targetScale = 0.98 + 0.02 * p;
    }
    // 2. Above viewport: Leaving top (scrolling down) / Entering from top (scrolling up)
    else if (rect.bottom <= exitThreshold) {
      item.targetOpacity = 0;
      item.targetY = -30;
      item.targetScale = 1;
    } else if (rect.bottom < exitThreshold + exitDistance) {
      const p = smoothEase((rect.bottom - exitThreshold) / exitDistance);
      item.targetOpacity = p;
      item.targetY = -30 * (1 - p);
      item.targetScale = 1;
    }
    // 3. Resting comfortably in viewport: Full opacity, normal position
    else {
      item.targetOpacity = 1;
      item.targetY = 0;
      item.targetScale = 1;
    }
  }
}

/**
 * Continuous smooth rendering loop.
 * Uses inertial lerp (damping) on each frame for buttery smooth transitions.
 */
function renderLoop() {
  updateItemTargets();

  const lerpFactor = 0.22; // Smooth 60fps-120fps interpolation

  for (let i = 0; i < registeredItems.length; i++) {
    const item = registeredItems[i];

    item.currentOpacity += (item.targetOpacity - item.currentOpacity) * lerpFactor;
    item.currentY += (item.targetY - item.currentY) * lerpFactor;
    item.currentScale += (item.targetScale - item.currentScale) * lerpFactor;

    // Snap if very close to eliminate idle calculations
    if (Math.abs(item.targetOpacity - item.currentOpacity) < 0.003) {
      item.currentOpacity = item.targetOpacity;
    }
    if (Math.abs(item.targetY - item.currentY) < 0.1) {
      item.currentY = item.targetY;
    }
    if (Math.abs(item.targetScale - item.currentScale) < 0.001) {
      item.currentScale = item.targetScale;
    }

    item.el.style.opacity = item.currentOpacity.toFixed(3);
    item.el.style.transform = `translate3d(0, ${item.currentY.toFixed(1)}px, 0) scale(${item.currentScale.toFixed(3)})`;
  }

  // Update timeline rail scale in Experience section
  const rail = document.querySelector('#experience .timeline-rail');
  const expSection = document.querySelector('#experience .timeline');
  if (rail && expSection) {
    const expRect = expSection.getBoundingClientRect();
    const vh = window.innerHeight;
    const progress = Math.max(0, Math.min(1, (vh * 0.7 - expRect.top) / (expRect.height * 0.85)));
    rail.style.transform = `scaleY(${progress.toFixed(3)})`;
  }

  if (isEngineRunning) {
    rafId = requestAnimationFrame(renderLoop);
  }
}

/**
 * Sets up bidirectional scroll animation across all major portfolio sections
 * and their constituent elements with card staggering and smooth sync.
 */
export function setupBidirectionalScroll() {
  cleanupAnimations();

  // 1. Hero Section (#home) — Visible immediately on load, fades out as user scrolls down
  const heroGrid = document.querySelector('#home .hero-grid');
  if (heroGrid) {
    const heroContent = heroGrid.querySelector(':scope > div');
    const heroProfile = heroGrid.querySelector('.hero-profile');
    if (heroContent) registerScrollItem(heroContent, { isHero: true });
    if (heroProfile) registerScrollItem(heroProfile, { isHero: true });
  }

  // Helper for single structural elements
  function registerSingle(selector) {
    const el = document.querySelector(selector);
    if (el) registerScrollItem(el);
  }

  // 2. About Section (#about)
  registerSingle('#about .section-header');
  registerSingle('#about .about-prose');

  // About Fact Cards (staggered)
  const facts = document.querySelectorAll('#about .about-facts .fact-item');
  facts.forEach((card, i) => registerScrollItem(card, { staggerIndex: i }));

  // 3. Technical Skills Section (#skills)
  registerSingle('#skills .section-header');

  // Skill Cards Grid (staggered across 6 cards)
  const skillCards = document.querySelectorAll('#skills .skills-grid .skill-card');
  skillCards.forEach((card, i) => registerScrollItem(card, { staggerIndex: i }));

  // 4. Projects Section (#projects)
  registerSingle('#projects .section-header');

  // Featured Project: Syringe Needle Collector Machine
  registerSingle('#projects .featured-card .featured-top');
  registerSingle('#projects .featured-card .video-wrapper');
  registerSingle('#projects .featured-card .featured-details');
  registerSingle('#projects .featured-card .gallery-section');

  // Software & Web Applications
  registerSingle('#projects .projects-subheading');

  const projectCards = document.querySelectorAll('#projects .projects-grid .project-card');
  projectCards.forEach((card, i) => registerScrollItem(card, { staggerIndex: i }));

  // 5. Experience Section (#experience)
  registerSingle('#experience .section-header');

  const timelineItems = document.querySelectorAll('#experience .timeline .timeline-item');
  timelineItems.forEach((item, i) => registerScrollItem(item, { staggerIndex: i }));

  // 6. Education Section (#education)
  registerSingle('#education .section-header');

  const eduCards = document.querySelectorAll('#education .two-col-grid .info-card');
  eduCards.forEach((card, i) => registerScrollItem(card, { staggerIndex: i }));

  // 7. Awards & Certifications Section (#awards)
  registerSingle('#awards .section-header');
  registerSingle('#awards .award-card');

  const certCards = document.querySelectorAll('#awards .cert-stack .cert-card');
  certCards.forEach((card, i) => registerScrollItem(card, { staggerIndex: i }));

  // 8. Contact Section (#contact)
  const contactPanel = document.querySelector('#contact .contact-panel');
  if (contactPanel) registerScrollItem(contactPanel, { isLast: true });

  // Start continuous smooth render engine
  isEngineRunning = true;
  rafId = requestAnimationFrame(renderLoop);
}

/**
 * Interactive hover micro-animations on cards.
 * Scales the card icon smoothly on hover without conflicting with scroll transforms.
 */
export function setupHoverAnimations() {
  const interactiveCards = document.querySelectorAll(
    '.skill-card, .project-card, .timeline-item, .info-card, .award-card, .cert-card, .fact-item'
  );

  interactiveCards.forEach((card) => {
    const icon = card.querySelector('.skill-icon, .award-icon, i');
    if (!icon) return;

    card.addEventListener('mouseenter', () => {
      animate(icon, {
        scale: 1.15,
        duration: 240,
        ease: EASE_OUT,
      });
    });

    card.addEventListener('mouseleave', () => {
      animate(icon, {
        scale: 1,
        duration: 220,
        ease: EASE_OUT,
      });
    });
  });
}

/**
 * Lightbox modal entrance animation.
 */
export function animateModalOpen(dialogEl) {
  if (!dialogEl) return;
  animate(dialogEl, {
    opacity: [0, 1],
    scale: [0.94, 1],
    translateY: [16, 0],
    duration: 280,
    ease: EASE_ENTER,
  });
}

/**
 * Clean up all tracked observers and animation frames.
 */
export function cleanupAnimations() {
  isEngineRunning = false;
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  registeredItems = [];
}

export function initAnimations() {
  setupScrollProgress();
  animateHero();
  setupBidirectionalScroll();
  setupHoverAnimations();
}
