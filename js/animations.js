import {
  animate,
  createTimeline,
  stagger,
  spring,
  cubicBezier,
  set,
} from '../assets/vendor/anime.esm.min.js';

const EASE_ENTER = cubicBezier(0.22, 1, 0.36, 1);
const EASE_OUT = cubicBezier(0.16, 1, 0.3, 1);
const SPRING_POP = spring({ bounce: 0.38, duration: 680 });

const activeInstances = [];
let blockObserver = null;

export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function track(instance) {
  if (instance) activeInstances.push(instance);
  return instance;
}

/**
 * Top scroll progress bar driven by Anime.js.
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
 * Hero entrance timeline — runs on initial load.
 */
export function animateHero() {
  if (prefersReducedMotion()) return;

  const heroItems = document.querySelectorAll('[data-hero-item]');
  const heroMedia = document.querySelector('[data-hero-media]');
  const socialPills = document.querySelectorAll('.hero-social .social-pill');

  if (!heroItems.length) return;

  set(heroItems, { opacity: 0, translateY: 32 });
  if (heroMedia) {
    set(heroMedia, { opacity: 0, scale: 0.88, translateY: 28 });
  }
  if (socialPills.length) {
    set(socialPills, { opacity: 0, translateY: 16, scale: 0.9 });
  }

  const tl = createTimeline({
    defaults: {
      ease: EASE_ENTER,
    },
  });

  tl.add(heroItems, {
    opacity: [0, 1],
    translateY: [32, 0],
    duration: 720,
    delay: stagger(95),
  });

  if (heroMedia) {
    tl.add(
      heroMedia,
      {
        opacity: [0, 1],
        scale: [0.88, 1],
        translateY: [28, 0],
        duration: 860,
        ease: EASE_OUT,
      },
      160
    );
  }

  if (socialPills.length) {
    tl.add(
      socialPills,
      {
        opacity: [0, 1],
        translateY: [16, 0],
        scale: [0.9, 1],
        duration: 520,
        delay: stagger(75),
      },
      480
    );
  }

  track(tl);
}

/**
 * Build granular scroll-animated blocks so each element animates
 * right when it enters the user's viewport while scrolling.
 */
function collectScrollBlocks() {
  const blocks = [];

  // 1. Every section header
  document.querySelectorAll('.section-header').forEach((header) => {
    const kicker = header.querySelector('.section-kicker');
    const title = header.querySelector('.section-title');
    const lead = header.querySelector('.section-lead');
    blocks.push({
      el: header,
      prepare() {
        if (kicker) set(kicker, { opacity: 0, translateX: -28 });
        if (title) set(title, { opacity: 0, translateY: 30 });
        if (lead) set(lead, { opacity: 0, translateY: 24 });
      },
      play() {
        const tl = createTimeline({ defaults: { ease: EASE_OUT } });
        if (kicker) tl.add(kicker, { opacity: [0, 1], translateX: [-28, 0], duration: 520 }, 0);
        if (title) tl.add(title, { opacity: [0, 1], translateY: [30, 0], duration: 640 }, 80);
        if (lead) tl.add(lead, { opacity: [0, 1], translateY: [24, 0], duration: 580 }, 160);
        track(tl);
      },
    });
  });

  // 2. About grid (prose from left, facts staggered from right)
  const aboutGrid = document.querySelector('.about-grid');
  if (aboutGrid) {
    const prose = aboutGrid.querySelector('.about-prose');
    const facts = aboutGrid.querySelectorAll('.fact-item');
    blocks.push({
      el: aboutGrid,
      prepare() {
        if (prose) set(prose, { opacity: 0, translateX: -44 });
        if (facts.length) set(facts, { opacity: 0, translateX: 44, scale: 0.95 });
      },
      play() {
        const tl = createTimeline({ defaults: { ease: EASE_OUT } });
        if (prose) {
          tl.add(prose, { opacity: [0, 1], translateX: [-44, 0], duration: 700 }, 0);
        }
        if (facts.length) {
          tl.add(
            facts,
            {
              opacity: [0, 1],
              translateX: [44, 0],
              scale: [0.95, 1],
              duration: 620,
              delay: stagger(105),
            },
            100
          );
        }
        track(tl);
      },
    });
  }

  // 3. Technical Skills grid (staggered cards + staggered tag pop-in)
  const skillsGrid = document.querySelector('.skills-grid');
  if (skillsGrid) {
    const cards = skillsGrid.querySelectorAll('.skill-card');
    const icons = skillsGrid.querySelectorAll('.skill-icon');
    const tags = skillsGrid.querySelectorAll('.tag');
    blocks.push({
      el: skillsGrid,
      prepare() {
        if (cards.length) set(cards, { opacity: 0, translateY: 44, scale: 0.92 });
        if (icons.length) set(icons, { scale: 0.5, rotate: -12 });
        if (tags.length) set(tags, { opacity: 0, scale: 0.8, translateY: 8 });
      },
      play() {
        const tl = createTimeline({ defaults: { ease: EASE_OUT } });
        if (cards.length) {
          tl.add(
            cards,
            {
              opacity: [0, 1],
              translateY: [44, 0],
              scale: [0.92, 1],
              duration: 680,
              delay: stagger(90),
            },
            0
          );
        }
        if (icons.length) {
          tl.add(
            icons,
            {
              scale: [0.5, 1],
              rotate: [-12, 0],
              ease: SPRING_POP,
              delay: stagger(90),
            },
            80
          );
        }
        if (tags.length) {
          tl.add(
            tags,
            {
              opacity: [0, 1],
              scale: [0.8, 1],
              translateY: [8, 0],
              duration: 420,
              delay: stagger(20),
            },
            220
          );
        }
        track(tl);
      },
    });
  }

  // 4. Featured Project top & video/details body
  const featuredBody = document.querySelector('.featured-body');
  const featuredTop = document.querySelector('.featured-top');
  if (featuredTop && featuredBody) {
    const videoWrap = featuredBody.querySelector('.video-wrapper');
    const detailBlocks = featuredBody.querySelectorAll('.detail-block');
    blocks.push({
      el: featuredTop,
      prepare() {
        set(featuredTop, { opacity: 0, translateY: 32 });
        if (videoWrap) set(videoWrap, { opacity: 0, translateX: -36, scale: 0.96 });
        if (detailBlocks.length) set(detailBlocks, { opacity: 0, translateX: 36 });
      },
      play() {
        const tl = createTimeline({ defaults: { ease: EASE_OUT } });
        tl.add(featuredTop, { opacity: [0, 1], translateY: [32, 0], duration: 620 }, 0);
        if (videoWrap) {
          tl.add(
            videoWrap,
            { opacity: [0, 1], translateX: [-36, 0], scale: [0.96, 1], duration: 720 },
            140
          );
        }
        if (detailBlocks.length) {
          tl.add(
            detailBlocks,
            { opacity: [0, 1], translateX: [36, 0], duration: 620, delay: stagger(120) },
            200
          );
        }
        track(tl);
      },
    });
  }

  // 5. Project Gallery thumbnails (triggers when scrolling to the gallery)
  const gallerySection = document.querySelector('.gallery-section');
  if (gallerySection) {
    const galleryItems = gallerySection.querySelectorAll('.gallery-item');
    blocks.push({
      el: gallerySection,
      prepare() {
        if (galleryItems.length) set(galleryItems, { opacity: 0, translateY: 36, scale: 0.9 });
      },
      play() {
        if (!galleryItems.length) return;
        track(
          animate(galleryItems, {
            opacity: [0, 1],
            translateY: [36, 0],
            scale: [0.9, 1],
            duration: 660,
            delay: stagger(120),
            ease: EASE_OUT,
          })
        );
      },
    });
  }

  // 6. Software & Web Application Project Cards (triggers when scrolling to the cards grid)
  const projectsGrid = document.querySelector('.projects-grid');
  const projectsSubheading = document.querySelector('.projects-subheading');
  if (projectsGrid) {
    const projectCards = projectsGrid.querySelectorAll('.project-card');
    blocks.push({
      el: projectsGrid,
      prepare() {
        if (projectsSubheading) set(projectsSubheading, { opacity: 0, translateX: -24 });
        if (projectCards.length) set(projectCards, { opacity: 0, translateY: 48, scale: 0.92 });
      },
      play() {
        const tl = createTimeline({ defaults: { ease: EASE_OUT } });
        if (projectsSubheading) {
          tl.add(projectsSubheading, { opacity: [0, 1], translateX: [-24, 0], duration: 500 }, 0);
        }
        if (projectCards.length) {
          tl.add(
            projectCards,
            {
              opacity: [0, 1],
              translateY: [48, 0],
              scale: [0.92, 1],
              duration: 720,
              delay: stagger(140),
            },
            80
          );
        }
        track(tl);
      },
    });
  }

  // 7. Experience Timeline Rail + Individual Experience Cards (each animates as it enters view)
  const timelineRail = document.querySelector('.timeline-rail');
  const timelineEl = document.querySelector('.timeline');
  if (timelineEl && timelineRail) {
    blocks.push({
      el: timelineEl,
      prepare() {
        set(timelineRail, { scaleY: 0 });
      },
      play() {
        track(
          animate(timelineRail, {
            scaleY: [0, 1],
            duration: 1100,
            ease: EASE_ENTER,
          })
        );
      },
    });
  }

  document.querySelectorAll('.timeline-item').forEach((item) => {
    const dot = item.querySelector('.timeline-dot');
    const bullets = item.querySelectorAll('.exp-list li');
    blocks.push({
      el: item,
      prepare() {
        set(item, { opacity: 0, translateX: -44 });
        if (dot) set(dot, { scale: 0 });
        if (bullets.length) set(bullets, { opacity: 0, translateX: -16 });
      },
      play() {
        const tl = createTimeline({ defaults: { ease: EASE_OUT } });
        tl.add(item, { opacity: [0, 1], translateX: [-44, 0], duration: 680 }, 0);
        if (dot) {
          tl.add(dot, { scale: [0, 1], ease: SPRING_POP }, 100);
        }
        if (bullets.length) {
          tl.add(
            bullets,
            {
              opacity: [0, 1],
              translateX: [-16, 0],
              duration: 440,
              delay: stagger(45),
            },
            220
          );
        }
        track(tl);
      },
    });
  });

  // 8. Education Cards
  const eduGrid = document.querySelector('#education .two-col-grid');
  if (eduGrid) {
    const cards = eduGrid.querySelectorAll('.info-card');
    blocks.push({
      el: eduGrid,
      prepare() {
        if (cards.length) set(cards, { opacity: 0, translateY: 40, scale: 0.93 });
      },
      play() {
        if (!cards.length) return;
        track(
          animate(cards, {
            opacity: [0, 1],
            translateY: [40, 0],
            scale: [0.93, 1],
            duration: 680,
            delay: stagger(140),
            ease: EASE_OUT,
          })
        );
      },
    });
  }

  // 9. Awards & Certifications
  const awardsLayout = document.querySelector('.awards-layout');
  if (awardsLayout) {
    const awardCard = awardsLayout.querySelector('.award-card');
    const awardIcon = awardsLayout.querySelector('.award-icon');
    const certCards = awardsLayout.querySelectorAll('.cert-card');
    blocks.push({
      el: awardsLayout,
      prepare() {
        if (awardCard) set(awardCard, { opacity: 0, translateX: -40, scale: 0.94 });
        if (awardIcon) set(awardIcon, { scale: 0.3, rotate: -20 });
        if (certCards.length) set(certCards, { opacity: 0, translateX: 40 });
      },
      play() {
        const tl = createTimeline({ defaults: { ease: EASE_OUT } });
        if (awardCard) {
          tl.add(
            awardCard,
            { opacity: [0, 1], translateX: [-40, 0], scale: [0.94, 1], duration: 680 },
            0
          );
        }
        if (awardIcon) {
          tl.add(
            awardIcon,
            { scale: [0.3, 1], rotate: [-20, 0], ease: SPRING_POP },
            160
          );
        }
        if (certCards.length) {
          tl.add(
            certCards,
            { opacity: [0, 1], translateX: [40, 0], duration: 620, delay: stagger(130) },
            140
          );
        }
        track(tl);
      },
    });
  }

  // 10. Contact Panel
  const contactPanel = document.querySelector('.contact-panel');
  if (contactPanel) {
    const rows = contactPanel.querySelectorAll('.contact-row');
    blocks.push({
      el: contactPanel,
      prepare() {
        set(contactPanel, { opacity: 0, translateY: 40, scale: 0.96 });
        if (rows.length) set(rows, { opacity: 0, translateX: 32 });
      },
      play() {
        const tl = createTimeline({ defaults: { ease: EASE_OUT } });
        tl.add(
          contactPanel,
          { opacity: [0, 1], translateY: [40, 0], scale: [0.96, 1], duration: 680 },
          0
        );
        if (rows.length) {
          tl.add(
            rows,
            { opacity: [0, 1], translateX: [32, 0], duration: 540, delay: stagger(95) },
            180
          );
        }
        track(tl);
      },
    });
  }

  return blocks;
}

/**
 * Observe granular blocks so each element animates right as it scrolls into view.
 */
export function setupScrollReveals() {
  if (prefersReducedMotion()) return;

  const blocks = collectScrollBlocks();
  if (!blocks.length) return;

  const blockMap = new Map();
  blocks.forEach((b) => {
    b.prepare();
    b.el.dataset.scrollAnimated = 'false';
    blockMap.set(b.el, b);
  });

  blockObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const block = blockMap.get(entry.target);
        if (!block) return;

        if (entry.isIntersecting && block.el.dataset.scrollAnimated !== 'true') {
          block.el.dataset.scrollAnimated = 'true';
          block.play();
        } else if (
          !entry.isIntersecting &&
          entry.boundingClientRect.top > window.innerHeight * 0.95
        ) {
          // Reset when scrolled back above the block so scrolling down again replays the animation
          block.el.dataset.scrollAnimated = 'false';
          block.prepare();
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -45px 0px',
    }
  );

  blocks.forEach((b) => blockObserver.observe(b.el));
}

/**
 * Interactive Anime.js hover micro-animations on cards, icons, and buttons.
 */
export function setupHoverAnimations() {
  if (prefersReducedMotion()) return;

  const interactiveCards = document.querySelectorAll(
    '.skill-card, .project-card, .timeline-item, .info-card, .award-card, .cert-card, .fact-item'
  );

  interactiveCards.forEach((card) => {
    const icon = card.querySelector('.skill-icon, .award-icon, i');

    card.addEventListener('mouseenter', () => {
      animate(card, {
        translateY: -5,
        duration: 240,
        ease: EASE_OUT,
      });
      if (icon) {
        animate(icon, {
          scale: 1.14,
          duration: 260,
          ease: EASE_OUT,
        });
      }
    });

    card.addEventListener('mouseleave', () => {
      animate(card, {
        translateY: 0,
        duration: 220,
        ease: EASE_OUT,
      });
      if (icon) {
        animate(icon, {
          scale: 1,
          duration: 220,
          ease: EASE_OUT,
        });
      }
    });
  });
}

/**
 * Lightbox modal entrance animation.
 */
export function animateModalOpen(dialogEl) {
  if (prefersReducedMotion() || !dialogEl) return;
  animate(dialogEl, {
    opacity: [0, 1],
    scale: [0.94, 1],
    translateY: [16, 0],
    duration: 280,
    ease: EASE_ENTER,
  });
}

/**
 * Clean up all tracked Anime.js instances and observers.
 */
export function cleanupAnimations() {
  if (blockObserver) {
    blockObserver.disconnect();
    blockObserver = null;
  }
  while (activeInstances.length) {
    const instance = activeInstances.pop();
    if (instance && typeof instance.revert === 'function') {
      instance.revert();
    }
  }
}

export function initAnimations() {
  setupScrollProgress();
  animateHero();
  setupScrollReveals();
  setupHoverAnimations();
}
