/**
 * @fileoverview app.js — Core application logic for Ping TCM website.
 * Handles routing, global state, navigation, notifications, scroll animations,
 * session persistence, and utility helpers. Vanilla JS, no frameworks.
 * @version 1.0.0
 */

'use strict';

// ─────────────────────────────────────────────
// GLOBAL STATE
// ─────────────────────────────────────────────

/**
 * @typedef {Object} CartItem
 * @property {string} id - Product/service ID
 * @property {string} name - Display name
 * @property {number} price - Unit price in cents
 * @property {number} quantity - Item quantity
 * @property {string} [image] - Optional image URL
 */

/**
 * @typedef {Object} Notification
 * @property {string} id - Unique notification ID
 * @property {string} message - Display message
 * @property {'success'|'error'|'info'|'warning'} type - Notification type
 * @property {number} [duration] - Auto-dismiss ms (0 = persistent)
 */

/**
 * @typedef {Object} AppState
 * @property {Object|null} currentUser - Authenticated user object
 * @property {CartItem[]} cart - Shopping cart items
 * @property {Notification[]} notifications - Active notifications
 * @property {boolean} menuOpen - Mobile menu state
 * @property {string} currentPage - Active page identifier
 */

/** @type {AppState} */
const AppState = {
  currentUser: null,
  cart: [],
  notifications: [],
  menuOpen: false,
  currentPage: '',
};

// Storage keys
const STORAGE_KEYS = {
  CART: 'ptcm_cart',
  SESSION: 'ptcm_session',
  USERS: 'ptcm_users',
};

// ─────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Formats a numeric price (in cents) to a localised currency string.
 * @param {number} cents - Price in cents (e.g. 5000 = $50.00)
 * @param {string} [currency='USD'] - ISO 4217 currency code
 * @param {string} [locale='en-US'] - BCP 47 locale string
 * @returns {string} Formatted price string, e.g. "$50.00"
 */
function formatPrice(cents, currency = 'USD', locale = 'en-US') {
  if (typeof cents !== 'number' || isNaN(cents)) return '$0.00';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

/**
 * Formats a Date or ISO date string into a human-readable string.
 * @param {Date|string|number} date - Date to format
 * @param {Intl.DateTimeFormatOptions} [options] - Optional Intl options
 * @param {string} [locale='en-US'] - BCP 47 locale string
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}, locale = 'en-US') {
  const defaults = { year: 'numeric', month: 'long', day: 'numeric' };
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    return new Intl.DateTimeFormat(locale, { ...defaults, ...options }).format(d);
  } catch {
    return String(date);
  }
}

/**
 * Generates a pseudo-random unique ID string.
 * @param {string} [prefix='id'] - Optional prefix
 * @returns {string} Unique ID string, e.g. "id_k7f2x9a1"
 */
function generateId(prefix = 'id') {
  const random = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}${random}`;
}

/**
 * Returns a debounced version of the given function.
 * @param {Function} fn - Function to debounce
 * @param {number} [delay=300] - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Safely parses a JSON string; returns fallback on failure.
 * @param {string} str - JSON string to parse
 * @param {*} [fallback=null] - Value returned on parse error
 * @returns {*} Parsed value or fallback
 */
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str - Raw string
 * @returns {string} HTML-escaped string
 */
function escapeHtml(str) {
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}


// ─────────────────────────────────────────────
// SESSION & PERSISTENCE
// ─────────────────────────────────────────────

/**
 * Persists the current cart to localStorage.
 * @returns {void}
 */
function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEYS.CART, JSON.stringify(AppState.cart));
  } catch (e) {
    console.warn('[PingTCM] Could not save cart:', e);
  }
}

/**
 * Loads the cart from localStorage into AppState.
 * @returns {void}
 */
function loadCart() {
  const raw = localStorage.getItem(STORAGE_KEYS.CART);
  AppState.cart = safeJsonParse(raw, []);
}

/**
 * Loads the authenticated session from localStorage into AppState.
 * Clears the session if it has expired.
 * @returns {Object|null} Current user or null
 */
function loadSession() {
  const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
  const session = safeJsonParse(raw, null);
  if (!session) return null;

  const now = Date.now();
  if (session.expiresAt && now > session.expiresAt) {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    AppState.currentUser = null;
    return null;
  }

  AppState.currentUser = session.user || null;
  return AppState.currentUser;
}

/**
 * Saves a user session to localStorage with a 24-hour expiry.
 * @param {Object} user - Authenticated user object
 * @returns {void}
 */
function saveSession(user) {
  const session = {
    user,
    expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 h
    createdAt: Date.now(),
  };
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
    AppState.currentUser = user;
  } catch (e) {
    console.warn('[PingTCM] Could not save session:', e);
  }
}

/**
 * Clears the session from localStorage and resets AppState.currentUser.
 * @returns {void}
 */
function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  AppState.currentUser = null;
}

// ─────────────────────────────────────────────
// CART MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Adds an item to the cart or increments its quantity if already present.
 * @param {CartItem} item - Item to add
 * @returns {void}
 */
function cartAdd(item) {
  const existing = AppState.cart.find((c) => c.id === item.id);
  if (existing) {
    existing.quantity += item.quantity || 1;
  } else {
    AppState.cart.push({ ...item, quantity: item.quantity || 1 });
  }
  saveCart();
  updateCartBadge();
}

/**
 * Removes an item from the cart by ID.
 * @param {string} itemId - ID of the item to remove
 * @returns {void}
 */
function cartRemove(itemId) {
  AppState.cart = AppState.cart.filter((c) => c.id !== itemId);
  saveCart();
  updateCartBadge();
}

/**
 * Updates the quantity of a cart item. Removes it if quantity ≤ 0.
 * @param {string} itemId - ID of the item to update
 * @param {number} quantity - New quantity
 * @returns {void}
 */
function cartUpdateQuantity(itemId, quantity) {
  if (quantity <= 0) {
    cartRemove(itemId);
    return;
  }
  const item = AppState.cart.find((c) => c.id === itemId);
  if (item) {
    item.quantity = quantity;
    saveCart();
    updateCartBadge();
  }
}

/**
 * Clears all items from the cart.
 * @returns {void}
 */
function cartClear() {
  AppState.cart = [];
  saveCart();
  updateCartBadge();
}

/**
 * Returns the total number of items (sum of quantities) in the cart.
 * @returns {number} Total item count
 */
function cartCount() {
  return AppState.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
}

/**
 * Returns the total price of all cart items in cents.
 * @returns {number} Total price in cents
 */
function cartTotal() {
  return AppState.cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
}

/**
 * Updates the cart badge element(s) with the current item count.
 * Hides the badge when the cart is empty.
 * @returns {void}
 */
function updateCartBadge() {
  const count = cartCount();
  const badges = document.querySelectorAll('[data-cart-badge]');
  badges.forEach((badge) => {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
    badge.setAttribute('aria-label', `${count} item${count !== 1 ? 's' : ''} in cart`);
  });
}


// ─────────────────────────────────────────────
// NOTIFICATION / TOAST SYSTEM
// ─────────────────────────────────────────────

/** Icons mapped to each notification type */
const NOTIFICATION_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

/**
 * Ensures the toast container exists in the DOM, creating it if needed.
 * @returns {HTMLElement} The toast container element
 */
function getToastContainer() {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Notifications');
    container.style.cssText =
      'position:fixed;top:1.25rem;right:1.25rem;z-index:9999;' +
      'display:flex;flex-direction:column;gap:0.5rem;max-width:360px;width:calc(100% - 2.5rem);';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Displays a toast notification.
 * @param {string} message - Notification message text
 * @param {'success'|'error'|'info'|'warning'} [type='info'] - Notification type
 * @param {number} [duration=4000] - Auto-dismiss delay in ms; 0 = persistent
 * @returns {string} The notification ID (use to manually dismiss)
 */
function showNotification(message, type = 'info', duration = 4000) {
  const id = generateId('toast');
  const container = getToastContainer();

  const colorMap = {
    success: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '#10b981' },
    error:   { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '#f59e0b' },
    info:    { bg: '#dbeafe', border: '#3b82f6', text: '#1e3a8a', icon: '#3b82f6' },
  };
  const colors = colorMap[type] || colorMap.info;
  const icon = NOTIFICATION_ICONS[type] || NOTIFICATION_ICONS.info;

  const toast = document.createElement('div');
  toast.id = id;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-atomic', 'true');
  toast.style.cssText =
    `display:flex;align-items:flex-start;gap:0.75rem;padding:0.875rem 1rem;` +
    `background:${colors.bg};border:1px solid ${colors.border};border-radius:0.5rem;` +
    `box-shadow:0 4px 12px rgba(0,0,0,0.1);cursor:pointer;` +
    `transform:translateX(120%);transition:transform 0.3s ease,opacity 0.3s ease;opacity:0;`;

  toast.innerHTML =
    `<span style="flex-shrink:0;font-weight:700;font-size:1rem;color:${colors.icon}" aria-hidden="true">${icon}</span>` +
    `<span style="flex:1;font-size:0.875rem;color:${colors.text};line-height:1.4">${escapeHtml(message)}</span>` +
    `<button aria-label="Dismiss notification" style="flex-shrink:0;background:none;border:none;` +
    `font-size:1rem;color:${colors.text};cursor:pointer;padding:0;line-height:1;opacity:0.7;">✕</button>`;

  container.appendChild(toast);

  // Track in state
  AppState.notifications.push({ id, message, type, duration });

  // Animate in
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
      toast.style.opacity = '1';
    });
  });

  // Dismiss helpers
  const dismiss = () => hideNotification(id);
  toast.addEventListener('click', dismiss);
  toast.querySelector('button').addEventListener('click', (e) => { e.stopPropagation(); dismiss(); });

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return id;
}

/**
 * Dismisses and removes a toast notification by ID.
 * @param {string} id - Notification ID returned by showNotification()
 * @returns {void}
 */
function hideNotification(id) {
  const toast = document.getElementById(id);
  if (!toast) return;

  toast.style.transform = 'translateX(120%)';
  toast.style.opacity = '0';
  setTimeout(() => {
    toast.remove();
    AppState.notifications = AppState.notifications.filter((n) => n.id !== id);
  }, 320);
}

/**
 * Convenience wrappers for each notification type.
 * @namespace Notify
 */
const Notify = {
  /** @param {string} msg @param {number} [dur] */ success: (msg, dur) => showNotification(msg, 'success', dur),
  /** @param {string} msg @param {number} [dur] */ error:   (msg, dur) => showNotification(msg, 'error',   dur),
  /** @param {string} msg @param {number} [dur] */ warning: (msg, dur) => showNotification(msg, 'warning', dur),
  /** @param {string} msg @param {number} [dur] */ info:    (msg, dur) => showNotification(msg, 'info',    dur),
};


// ─────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────

/**
 * Navigation link definitions.
 * `authRequired`: show only when logged in.
 * `guestOnly`: show only when logged out.
 * `roles`: array of roles that can see this link (empty = all).
 *
 * @type {Array<{label:string, href:string, authRequired?:boolean, guestOnly?:boolean, roles?:string[]}>}
 */
const NAV_LINKS = [
  { label: 'Home',        href: 'index.html' },
  { label: 'Services',    href: 'services.html' },
  { label: 'About',       href: 'about.html' },
  { label: 'Shop',        href: 'shop.html' },
  { label: 'Blog',        href: 'blog.html' },
  { label: 'Contact',     href: 'contact.html' },
  { label: 'Dashboard',   href: 'dashboard.html', authRequired: true,  roles: ['user', 'superuser'] },
  { label: 'Admin',       href: 'admin.html',      authRequired: true,  roles: ['admin'] },
  { label: 'Sign In',     href: 'login.html',      guestOnly: true },
  { label: 'Register',    href: 'register.html',   guestOnly: true },
];

/**
 * Determines the current page filename from the window location.
 * @returns {string} e.g. "services.html" or "index.html"
 */
function getCurrentPageName() {
  const path = window.location.pathname;
  const file = path.split('/').pop();
  return file || 'index.html';
}

/**
 * Renders the primary navigation into any element with [data-nav].
 * Injects links appropriate for the current user's auth state and role.
 * @param {Object|null} user - Current user (or null if guest)
 * @returns {void}
 */
function renderNav(user) {
  const containers = document.querySelectorAll('[data-nav]');
  if (!containers.length) return;

  const currentPage = getCurrentPageName();

  const linksHtml = NAV_LINKS.filter((link) => {
    if (link.authRequired && !user) return false;
    if (link.guestOnly && user) return false;
    if (link.roles && link.roles.length && user && !link.roles.includes(user.role)) return false;
    return true;
  })
    .map((link) => {
      const isActive = currentPage === link.href;
      const activeClass = isActive ? ' nav-link--active' : '';
      const ariaCurrent = isActive ? ' aria-current="page"' : '';
      return `<a href="${escapeHtml(link.href)}" class="nav-link${activeClass}"${ariaCurrent}>${escapeHtml(link.label)}</a>`;
    })
    .join('\n');

  // Cart icon shown only when user is logged in or always visible (per design preference)
  const cartHtml = `
    <a href="cart.html" class="nav-cart" aria-label="Shopping cart">
      <span class="nav-cart__icon" aria-hidden="true">🛒</span>
      <span data-cart-badge class="nav-cart__badge" style="display:none" aria-label="0 items in cart">0</span>
    </a>`;

  // User avatar / logout when authenticated
  const userHtml = user
    ? `<div class="nav-user">
        <span class="nav-user__name">${escapeHtml(user.firstName || user.email)}</span>
        <button class="nav-user__logout btn btn--ghost" data-action="logout" type="button">Sign Out</button>
       </div>`
    : '';

  const html = `<div class="nav-links">${linksHtml}</div>${cartHtml}${userHtml}`;

  containers.forEach((el) => {
    el.innerHTML = html;
  });

  updateCartBadge();
  bindNavEvents();
}

/**
 * Binds click events inside rendered nav elements.
 * @returns {void}
 */
function bindNavEvents() {
  document.querySelectorAll('[data-action="logout"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (typeof Auth !== 'undefined') {
        Auth.logout();
      } else {
        clearSession();
        window.location.href = 'index.html';
      }
    });
  });
}

/**
 * Highlights the nav link matching the current page (fallback for
 * server-rendered or static pages where renderNav was not called).
 * @returns {void}
 */
function highlightActiveNavLink() {
  const currentPage = getCurrentPageName();
  document.querySelectorAll('.nav-link').forEach((a) => {
    const href = a.getAttribute('href');
    const isActive = href === currentPage || href === `./${currentPage}`;
    a.classList.toggle('nav-link--active', isActive);
    if (isActive) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
}

// ─────────────────────────────────────────────
// MOBILE MENU
// ─────────────────────────────────────────────

/**
 * Initialises the mobile hamburger menu toggle.
 * Expects a [data-menu-toggle] button and a [data-nav] element.
 * @returns {void}
 */
function initMobileMenu() {
  const toggle = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (!toggle || !nav) return;

  toggle.setAttribute('aria-controls', 'primary-nav');
  toggle.setAttribute('aria-expanded', 'false');
  nav.id = nav.id || 'primary-nav';

  toggle.addEventListener('click', () => {
    AppState.menuOpen = !AppState.menuOpen;
    nav.classList.toggle('nav--open', AppState.menuOpen);
    toggle.classList.toggle('menu-toggle--open', AppState.menuOpen);
    toggle.setAttribute('aria-expanded', String(AppState.menuOpen));
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (AppState.menuOpen && !nav.contains(e.target) && !toggle.contains(e.target)) {
      AppState.menuOpen = false;
      nav.classList.remove('nav--open');
      toggle.classList.remove('menu-toggle--open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Close menu on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && AppState.menuOpen) {
      AppState.menuOpen = false;
      nav.classList.remove('nav--open');
      toggle.classList.remove('menu-toggle--open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}


// ─────────────────────────────────────────────
// SCROLL ANIMATIONS (IntersectionObserver)
// ─────────────────────────────────────────────

/**
 * Attaches a fade-in scroll animation to all elements with [data-animate].
 * Elements receive the class 'is-visible' when they enter the viewport.
 * Falls back gracefully when IntersectionObserver is unavailable.
 * @returns {void}
 */
function initScrollAnimations() {
  const targets = document.querySelectorAll('[data-animate]');
  if (!targets.length) return;

  if (!('IntersectionObserver' in window)) {
    // Fallback: show all immediately
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          // Optional: stop observing once visible for performance
          if (!entry.target.dataset.animateRepeat) {
            observer.unobserve(entry.target);
          }
        } else if (entry.target.dataset.animateRepeat) {
          entry.target.classList.remove('is-visible');
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  targets.forEach((el) => {
    el.classList.add('will-animate');
    observer.observe(el);
  });
}

// ─────────────────────────────────────────────
// PAGE LOADER
// ─────────────────────────────────────────────

/**
 * Shows the full-screen page loader overlay.
 * Expects an element with id="page-loader" in the DOM,
 * or creates one dynamically.
 * @returns {void}
 */
function showPageLoader() {
  let loader = document.getElementById('page-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'page-loader';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-label', 'Loading');
    loader.style.cssText =
      'position:fixed;inset:0;z-index:10000;background:#fff;' +
      'display:flex;align-items:center;justify-content:center;' +
      'transition:opacity 0.3s ease;';
    loader.innerHTML =
      '<div style="text-align:center">' +
      '<div class="loader-spinner" aria-hidden="true"></div>' +
      '<p style="margin-top:1rem;color:#4b5563;font-size:0.9rem">Loading…</p>' +
      '</div>';
    document.body.appendChild(loader);
  }
  loader.style.display = 'flex';
  loader.style.opacity = '1';
}

/**
 * Hides the page loader overlay with a fade-out transition.
 * @returns {void}
 */
function hidePageLoader() {
  const loader = document.getElementById('page-loader');
  if (!loader) return;
  loader.style.opacity = '0';
  setTimeout(() => {
    loader.style.display = 'none';
  }, 320);
}

// ─────────────────────────────────────────────
// HASH-BASED ROUTER
// ─────────────────────────────────────────────

/**
 * @typedef {Object} Route
 * @property {string} path - Hash path, e.g. "#/services"
 * @property {Function} handler - Function to call when route is active
 * @property {boolean} [authRequired] - Redirect to login if not authenticated
 * @property {string[]} [roles] - Required roles
 */

/** @type {Route[]} */
const routes = [];

/**
 * Registers a route with the SPA router.
 * @param {string} path - Hash path (e.g. "#/home")
 * @param {Function} handler - Page init function
 * @param {{authRequired?:boolean, roles?:string[]}} [options] - Route options
 * @returns {void}
 */
function addRoute(path, handler, options = {}) {
  routes.push({ path, handler, ...options });
}

/**
 * Resolves and executes the handler for the current URL hash.
 * Redirects to login if a protected route is accessed without auth.
 * Falls back to the first registered route if no match is found.
 * @returns {void}
 */
function resolveRoute() {
  const hash = window.location.hash || '#/';
  const route = routes.find((r) => r.path === hash) || routes.find((r) => r.path === '#/');

  if (!route) return;

  if (route.authRequired) {
    const user = loadSession();
    if (!user) {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }
    if (route.roles && route.roles.length && !route.roles.includes(user.role)) {
      Notify.error('You do not have permission to view that page.');
      return;
    }
  }

  AppState.currentPage = hash;
  route.handler();
}

/**
 * Initialises hash-based routing; listens for hashchange events.
 * @returns {void}
 */
function initRouter() {
  window.addEventListener('hashchange', resolveRoute);
  resolveRoute();
}

// ─────────────────────────────────────────────
// EVENT DELEGATION HELPERS
// ─────────────────────────────────────────────

/**
 * Attaches a delegated event listener to a container element.
 * The handler fires only when the event target matches the given selector.
 *
 * @param {Element|Document} container - Parent element to listen on
 * @param {string} eventType - DOM event type (e.g. 'click')
 * @param {string} selector - CSS selector for target matching
 * @param {function(Event, Element):void} handler - Callback; receives the event and matched element
 * @returns {function():void} Cleanup function that removes the listener
 */
function onDelegate(container, eventType, selector, handler) {
  const listener = (e) => {
    const target = e.target.closest(selector);
    if (target && container.contains(target)) {
      handler(e, target);
    }
  };
  container.addEventListener(eventType, listener);
  return () => container.removeEventListener(eventType, listener);
}

/**
 * Convenience wrapper: delegates click events on document.
 * @param {string} selector - CSS selector
 * @param {function(Event, Element):void} handler - Click handler
 * @returns {function():void} Cleanup function
 */
function onClick(selector, handler) {
  return onDelegate(document, 'click', selector, handler);
}

// ─────────────────────────────────────────────
// APP INITIALISATION
// ─────────────────────────────────────────────

/**
 * Bootstraps the application.
 * Call once per page after the DOM is ready.
 * @returns {void}
 */
function initApp() {
  // 1. Restore session and cart from localStorage
  const user = loadSession();
  loadCart();

  // 2. Render navigation
  renderNav(user);

  // 3. Mobile menu
  initMobileMenu();

  // 4. Scroll animations
  initScrollAnimations();

  // 5. Update cart badge
  updateCartBadge();

  // 6. Hide page loader if present (set visible in <head> inline script)
  hidePageLoader();

  // 7. Dispatch custom event so page scripts can hook in after init
  document.dispatchEvent(new CustomEvent('app:ready', { detail: { user } }));
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ─────────────────────────────────────────────
// PUBLIC API (window.App)
// ─────────────────────────────────────────────

/**
 * Public interface exposed on window.App for use by other scripts.
 * @namespace App
 */
window.App = {
  // State
  state: AppState,

  // Utilities
  formatPrice,
  formatDate,
  generateId,
  debounce,
  escapeHtml,

  // Session
  saveSession,
  clearSession,
  loadSession,

  // Cart
  cart: {
    add: cartAdd,
    remove: cartRemove,
    updateQuantity: cartUpdateQuantity,
    clear: cartClear,
    count: cartCount,
    total: cartTotal,
    items: () => AppState.cart,
  },

  // Notifications
  notify: Notify,
  showNotification,
  hideNotification,

  // Navigation
  renderNav,
  highlightActiveNavLink,

  // Router
  addRoute,
  initRouter,

  // Helpers
  onDelegate,
  onClick,

  // Loader
  showPageLoader,
  hidePageLoader,
};


// ── Convenience globals so pages can call window.Notify.success() etc. ──
window.Notify = Notify;

// Also expose updateCartBadge directly for pages that call it
window.updateCartBadge = function () {
  const count = AppState.cart.reduce((s, i) => s + (i.qty || 1), 0);
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  badge.textContent = count > 0 ? count : '';
  badge.classList.toggle('visible', count > 0);
};
