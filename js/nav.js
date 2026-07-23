/**
 * nav.js — Lightweight nav initializer for Ping TCM pages.
 * Updates #authNav, cart badge, hamburger menu, and navbar scroll effect.
 * Works on all static HTML pages (index.html + pages/*.html).
 */
(function () {
  'use strict';

  function initNav() {
    const user = window.Auth ? Auth.getCurrentUser() : null;
    const authNav = document.getElementById('authNav');
    const isInPages = window.location.pathname.includes('/pages/');
    const prefix = isInPages ? '' : 'pages/';

    if (authNav) {
      if (user) {
        const initials = ((user.firstName || '')[0] || '') + ((user.lastName || '')[0] || '') || user.email[0].toUpperCase();
        const dashLink = user.role === 'admin' ? prefix + 'admin.html' : prefix + 'dashboard.html';
        authNav.innerHTML = `
          <div class="dropdown">
            <div class="user-menu-btn" style="cursor:pointer">
              <div class="user-avatar">${initials.toUpperCase()}</div>
              <span style="max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.firstName || user.email.split('@')[0]}</span>
              <i class="fa-solid fa-chevron-down" style="font-size:.65rem"></i>
            </div>
            <div class="dropdown-menu">
              <a href="${dashLink}"><i class="fa-solid fa-gauge"></i> Dashboard</a>
              ${user.role === 'admin' ? `<a href="${prefix}admin.html"><i class="fa-solid fa-shield-halved"></i> Admin Panel</a>` : ''}
              <div class="divider"></div>
              <button id="navLogoutBtn"><i class="fa-solid fa-right-from-bracket"></i> Sign Out</button>
            </div>
          </div>`;

        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
          logoutBtn.addEventListener('click', () => {
            if (window.Auth) Auth.logout();
          });
        }
      } else {
        authNav.innerHTML = `<a href="${prefix}login.html" class="btn btn-primary btn-sm">Sign In</a>`;
      }
    }

    // Cart badge
    updateNavCartBadge();

    // Navbar scroll shadow
    const navbar = document.getElementById('navbar');
    if (navbar) {
      const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    // Hamburger mobile menu
    const hamburger = document.getElementById('hamburger');
    const navLinks  = document.getElementById('navLinks');
    if (hamburger && navLinks) {
      hamburger.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', String(open));
      });
      // Close on outside click
      document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
          navLinks.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Scroll-based animation (IntersectionObserver)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animated');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });
      document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    } else {
      // Fallback: show everything immediately
      document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('animated'));
    }
  }

  function updateNavCartBadge() {
    try {
      const items = JSON.parse(localStorage.getItem('ptcm_cart') || '[]');
      const count = items.reduce((s, i) => s + (i.qty || 1), 0);
      const badge = document.getElementById('cartBadge');
      if (badge) {
        badge.textContent = count > 0 ? count : '';
        badge.classList.toggle('visible', count > 0);
      }
    } catch (e) { /* ignore */ }
  }

  // Expose so shop.js can call after cart updates
  window.updateNavCartBadge = updateNavCartBadge;

  // Hide page loader
  function hideLoader() {
    const loader = document.getElementById('pageLoader');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initNav(); hideLoader(); });
  } else {
    initNav();
    hideLoader();
  }
})();
