import { initAnimations, animateModalOpen, cleanupAnimations } from './animations.js?v=2.1';

// ==========================================================================
// Theme Management (Light / Dark with localStorage persistence)
// ==========================================================================
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark-mode', isDark);

  if (themeIcon) {
    themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }
  if (themeToggleBtn) {
    themeToggleBtn.setAttribute('aria-pressed', String(isDark));
    themeToggleBtn.setAttribute(
      'aria-label',
      isDark ? 'Switch to light mode' : 'Switch to dark mode'
    );
  }
}

function initTheme() {
  const saved = localStorage.getItem('portfolio-theme');
  if (saved === 'dark' || saved === 'light') {
    applyTheme(saved);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  themeToggleBtn?.addEventListener('click', () => {
    const next = document.documentElement.classList.contains('dark-mode') ? 'light' : 'dark';
    localStorage.setItem('portfolio-theme', next);
    applyTheme(next);
  });
}

// ==========================================================================
// Mobile Navigation
// ==========================================================================
const menuToggleBtn = document.getElementById('menuToggle');
const menuIcon = document.getElementById('menuIcon');
const navLinksList = document.getElementById('navLinks');

function setMobileMenu(open) {
  if (!navLinksList || !menuToggleBtn || !menuIcon) return;
  navLinksList.classList.toggle('is-open', open);
  menuToggleBtn.setAttribute('aria-expanded', String(open));
  menuIcon.className = open ? 'fas fa-times' : 'fas fa-bars';
}

function initNavigation() {
  menuToggleBtn?.addEventListener('click', () => {
    const isOpen = navLinksList?.classList.contains('is-open');
    setMobileMenu(!isOpen);
  });

  navLinksList?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMobileMenu(false));
  });

  document.addEventListener('click', (event) => {
    const header = document.querySelector('.site-header');
    if (
      navLinksList?.classList.contains('is-open') &&
      header &&
      !header.contains(event.target)
    ) {
      setMobileMenu(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 860) {
      setMobileMenu(false);
    }
  });

  // Active section indicator
  const sections = document.querySelectorAll('main section[id]');
  const navItems = document.querySelectorAll('.nav-link[href^="#"]');

  if (sections.length && navItems.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute('id');
          navItems.forEach((item) => {
            const matches = item.getAttribute('href') === `#${id}`;
            item.classList.toggle('is-active', matches);
            if (matches) {
              item.setAttribute('aria-current', 'page');
            } else {
              item.removeAttribute('aria-current');
            }
          });
        });
      },
      {
        rootMargin: '-35% 0px -55% 0px',
        threshold: 0,
      }
    );

    sections.forEach((sec) => navObserver.observe(sec));
  }
}

// ==========================================================================
// Project Gallery Lightbox (Keyboard + Mouse + Touch accessible)
// ==========================================================================
function initGalleryModal() {
  const modal = document.getElementById('imageModal');
  const modalDialog = modal?.querySelector('.modal-dialog');
  const modalImg = document.getElementById('modalImage');
  const modalCaption = document.getElementById('modalCaption');
  const closeBtn = document.getElementById('modalClose');
  const prevBtn = document.getElementById('modalPrev');
  const nextBtn = document.getElementById('modalNext');
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));

  if (!modal || !modalImg || !modalCaption || !galleryItems.length) return;

  let currentIndex = 0;
  let lastFocusedEl = null;

  function showSlide(index) {
    currentIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[currentIndex];
    const img = item.querySelector('img');
    const caption = item.dataset.caption || item.textContent.trim();

    if (img) {
      modalImg.src = img.src;
      modalImg.alt = img.alt;
    }
    modalCaption.textContent = `${caption} (${currentIndex + 1} / ${galleryItems.length})`;
  }

  function openModal(index) {
    lastFocusedEl = document.activeElement;
    showSlide(index);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    animateModalOpen(modalDialog);
    closeBtn?.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
      lastFocusedEl.focus();
    }
  }

  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => openModal(index));
  });

  closeBtn?.addEventListener('click', closeModal);
  prevBtn?.addEventListener('click', () => showSlide(currentIndex - 1));
  nextBtn?.addEventListener('click', () => showSlide(currentIndex + 1));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!modal.classList.contains('is-open')) return;
    if (event.key === 'Escape') closeModal();
    if (event.key === 'ArrowLeft') showSlide(currentIndex - 1);
    if (event.key === 'ArrowRight') showSlide(currentIndex + 1);
  });
}

// ==========================================================================
// Back to Top Button
// ==========================================================================
function initBackToTop() {
  const backToTopBtn = document.getElementById('backToTop');
  if (!backToTopBtn) return;

  const toggleVisibility = () => {
    backToTopBtn.classList.toggle('is-visible', window.scrollY > 360);
  };

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ==========================================================================
// Bootstrap
// ==========================================================================
function bootstrap() {
  initTheme();
  initNavigation();
  initGalleryModal();
  initBackToTop();
  initAnimations();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}

window.addEventListener('pagehide', cleanupAnimations);
