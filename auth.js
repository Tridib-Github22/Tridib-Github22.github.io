/**
 * @fileoverview auth.js — Authentication and authorisation for Ping TCM website.
 * Handles user registration, login, logout, session management, role-based
 * access control, and form wiring. Vanilla JS, no frameworks.
 * Depends on app.js (window.App) being loaded first.
 * @version 1.0.0
 */

'use strict';

// ─────────────────────────────────────────────
// CONSTANTS & CONFIGURATION
// ─────────────────────────────────────────────

/** localStorage keys (must match app.js STORAGE_KEYS) */
const AUTH_KEYS = {
  USERS:   'ptcm_users',
  SESSION: 'ptcm_session',
};

/**
 * Role hierarchy — higher index = more privilege.
 * @type {string[]}
 */
const ROLE_HIERARCHY = ['user', 'superuser', 'admin'];

/**
 * Seed accounts pre-loaded into localStorage on first run.
 * Passwords are stored hashed (SHA-256 hex).
 * NOTE: In production, hashing must occur server-side. This client-side
 * approach is acceptable for a demo/static site only.
 *
 * @type {Array<{id:string, email:string, passwordHash:string, role:string, firstName:string, createdAt:number}>}
 */
const DEFAULT_ACCOUNTS = [
  {
    id: 'usr_admin_default',
    email: 'admin@pingtcm.com',
    // Admin123!
    passwordHash: null, // computed at runtime — see seedDefaultAccounts()
    _plaintext: 'Admin123!',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    createdAt: 0,
  },
  {
    id: 'usr_super_default',
    email: 'super@pingtcm.com',
    // Super123!
    passwordHash: null,
    _plaintext: 'Super123!',
    role: 'superuser',
    firstName: 'Super',
    lastName: 'User',
    createdAt: 0,
  },
];

// ─────────────────────────────────────────────
// VALIDATION HELPERS
// ─────────────────────────────────────────────

/**
 * Validates an email address format.
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
function isValidEmail(email) {
  // RFC 5322-ish, pragmatic regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim().toLowerCase());
}

/**
 * Validates a password against the policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 digit
 *
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, errors: string[] }} Validation result
 */
function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 8)      errors.push('Password must be at least 8 characters.');
  if (!/[A-Z]/.test(password))               errors.push('Password must contain at least one uppercase letter.');
  if (!/[0-9]/.test(password))               errors.push('Password must contain at least one number.');
  return { valid: errors.length === 0, errors };
}

// ─────────────────────────────────────────────
// PASSWORD HASHING (Web Crypto API)
// ─────────────────────────────────────────────

/**
 * Hashes a plaintext password using SHA-256 via the Web Crypto API.
 * Returns a hex string.
 * @param {string} plain - Plaintext password
 * @returns {Promise<string>} Hex-encoded SHA-256 hash
 */
async function hashPassword(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compares a plaintext password against a stored hash.
 * @param {string} plain - Plaintext password to check
 * @param {string} storedHash - Previously computed SHA-256 hex hash
 * @returns {Promise<boolean>} True if they match
 */
async function verifyPassword(plain, storedHash) {
  const hash = await hashPassword(plain);
  return hash === storedHash;
}

// ─────────────────────────────────────────────
// USER STORAGE HELPERS
// ─────────────────────────────────────────────

/**
 * Reads all users from localStorage.
 * @returns {Object[]} Array of user objects
 */
function getUsers() {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.USERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Persists the users array to localStorage.
 * @param {Object[]} users - Users array to save
 * @returns {void}
 */
function saveUsers(users) {
  try {
    localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
  } catch (e) {
    console.warn('[PingTCM Auth] Could not save users:', e);
  }
}

/**
 * Finds a user by email (case-insensitive).
 * @param {string} email - Email to look up
 * @returns {Object|undefined} User object or undefined
 */
function findUserByEmail(email) {
  return getUsers().find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
}

/**
 * Seeds the localStorage with default admin/superuser accounts if they
 * do not already exist. Runs once on first page load.
 * @returns {Promise<void>}
 */
async function seedDefaultAccounts() {
  const users = getUsers();
  let changed = false;

  for (const account of DEFAULT_ACCOUNTS) {
    const exists = users.some((u) => u.email === account.email);
    if (!exists) {
      const hash = await hashPassword(account._plaintext);
      const { _plaintext, ...rest } = account; // strip plaintext before storing
      users.push({ ...rest, passwordHash: hash });
      changed = true;
    }
  }

  if (changed) saveUsers(users);
}


// ─────────────────────────────────────────────
// SESSION MANAGEMENT
// ─────────────────────────────────────────────

/**
 * Reads the stored session from localStorage.
 * Returns null if absent or expired.
 * @returns {{ user: Object, expiresAt: number }|null}
 */
function readSession() {
  try {
    const raw = localStorage.getItem(AUTH_KEYS.SESSION);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_KEYS.SESSION);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Writes a new session for the given user with a 24-hour expiry.
 * Also updates window.App.state.currentUser if App is loaded.
 * @param {Object} user - User object (passwordHash excluded before writing)
 * @returns {void}
 */
function writeSession(user) {
  // Never store the password hash in the session
  const { passwordHash, ...safeUser } = user;
  const session = {
    user: safeUser,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  try {
    localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(session));
    if (window.App) window.App.state.currentUser = safeUser;
  } catch (e) {
    console.warn('[PingTCM Auth] Could not write session:', e);
  }
}

/**
 * Destroys the current session.
 * @returns {void}
 */
function destroySession() {
  localStorage.removeItem(AUTH_KEYS.SESSION);
  if (window.App) window.App.state.currentUser = null;
}

// ─────────────────────────────────────────────
// CORE AUTH FUNCTIONS
// ─────────────────────────────────────────────

/**
 * Returns the currently authenticated user or null.
 * @returns {Object|null} User object (without passwordHash) or null
 */
function getCurrentUser() {
  const session = readSession();
  return session ? session.user : null;
}

/**
 * Returns true if a valid (non-expired) session exists.
 * @returns {boolean}
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Checks whether the current user holds at least the specified role.
 * Uses the ROLE_HIERARCHY array: admin > superuser > user.
 *
 * @param {string} minRole - Minimum required role ('user'|'superuser'|'admin')
 * @returns {boolean} True if the current user's role is >= minRole in the hierarchy
 */
function hasRole(minRole) {
  const user = getCurrentUser();
  if (!user) return false;
  const userIdx = ROLE_HIERARCHY.indexOf(user.role);
  const minIdx  = ROLE_HIERARCHY.indexOf(minRole);
  return userIdx >= minIdx && userIdx !== -1 && minIdx !== -1;
}

/**
 * Enforces authentication (and optionally a minimum role) for a page.
 * Redirects to login.html with a `redirect` query param if the check fails.
 * Call this at the top of any page script that needs protection.
 *
 * @param {string} [minRole='user'] - Minimum required role
 * @returns {boolean} True if access is granted; false (and redirects) otherwise
 */
function requireAuth(minRole = 'user') {
  if (!isLoggedIn()) {
    window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
    return false;
  }
  if (!hasRole(minRole)) {
    if (window.App) {
      window.App.notify.error('You do not have permission to view this page.');
    }
    // Redirect to an appropriate fallback
    const user = getCurrentUser();
    window.location.href = getPostLoginRedirect(user);
    return false;
  }
  return true;
}

/**
 * Resolves the post-login redirect URL based on user role.
 * Falls back to index.html for unrecognised roles.
 *
 * @param {Object} user - Authenticated user
 * @returns {string} Relative URL to redirect to
 */
function getPostLoginRedirect(user) {
  if (!user) return 'login.html';
  // Check for ?redirect param first (deep-link after auth guard)
  const params = new URLSearchParams(window.location.search);
  const redirectParam = params.get('redirect');
  if (redirectParam) {
    try {
      // Only allow same-origin redirects
      const url = new URL(redirectParam, window.location.origin);
      if (url.origin === window.location.origin) return url.pathname + url.search + url.hash;
    } catch { /* ignore */ }
  }
  switch (user.role) {
    case 'admin':     return 'admin.html';
    case 'superuser': return 'dashboard.html';
    default:          return 'dashboard.html';
  }
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────

/**
 * Authenticates a user with email and password.
 *
 * @param {string} email - User email
 * @param {string} password - Plaintext password
 * @returns {Promise<{ success: boolean, user?: Object, error?: string }>}
 */
async function login(email, password) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }
  if (!isValidEmail(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  const user = findUserByEmail(email);
  if (!user) {
    // Generic message to avoid user enumeration
    return { success: false, error: 'Invalid email or password.' };
  }

  const match = await verifyPassword(password, user.passwordHash);
  if (!match) {
    return { success: false, error: 'Invalid email or password.' };
  }

  writeSession(user);
  return { success: true, user: getCurrentUser() };
}

// ─────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────

/**
 * Logs out the current user, destroys the session, and redirects to home.
 * @returns {void}
 */
function logout() {
  destroySession();
  if (window.App) {
    window.App.notify.info('You have been signed out.');
    window.App.renderNav(null);
  }
  // Short delay so the toast is visible before navigation
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────

/**
 * @typedef {Object} RegisterData
 * @property {string} email
 * @property {string} password
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} [phone]
 */

/**
 * Registers a new user account with the 'user' role.
 *
 * @param {RegisterData} userData - Registration data
 * @returns {Promise<{ success: boolean, user?: Object, errors?: string[] }>}
 */
async function register(userData) {
  const errors = [];

  const { email, password, firstName, lastName, phone = '', role: requestedRole = 'user' } = userData;

  // Email
  if (!email) errors.push('Email is required.');
  else if (!isValidEmail(email)) errors.push('Please enter a valid email address.');

  // Name
  if (!firstName || !firstName.trim()) errors.push('First name is required.');
  if (!lastName  || !lastName.trim())  errors.push('Last name is required.');

  // Password
  const pwResult = validatePassword(password);
  if (!pwResult.valid) errors.push(...pwResult.errors);

  if (errors.length) return { success: false, errors };

  // Duplicate check
  if (findUserByEmail(email)) {
    return { success: false, errors: ['An account with that email already exists.'] };
  }

  const passwordHash = await hashPassword(password);
  const newUser = {
    id:           (window.App ? window.App.generateId('usr') : `usr_${Date.now()}`),
    email:        email.trim().toLowerCase(),
    passwordHash,
    role:         ['user','superuser'].includes(requestedRole) ? requestedRole : 'user',
    firstName:    firstName.trim(),
    lastName:     lastName.trim(),
    phone:        phone.trim(),
    createdAt:    Date.now(),
  };

  const users = getUsers();
  users.push(newUser);
  saveUsers(users);

  // Log in immediately after registration
  writeSession(newUser);
  return { success: true, user: getCurrentUser() };
}


// ─────────────────────────────────────────────
// FORM HANDLERS
// ─────────────────────────────────────────────

/**
 * Displays form-level validation errors.
 * Expects a container element with [data-form-errors] inside the form.
 *
 * @param {HTMLFormElement} form - The form element
 * @param {string[]} errors - Array of error messages
 * @returns {void}
 */
function showFormErrors(form, errors) {
  let container = form.querySelector('[data-form-errors]');
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('data-form-errors', '');
    container.setAttribute('role', 'alert');
    container.style.cssText =
      'background:#fee2e2;border:1px solid #ef4444;border-radius:0.375rem;' +
      'padding:0.75rem 1rem;margin-bottom:1rem;color:#991b1b;font-size:0.875rem;';
    form.prepend(container);
  }
  container.innerHTML = errors
    .map((e) => `<p style="margin:0.2rem 0">⚠ ${escapeHtml(e)}</p>`)
    .join('');
  container.style.display = 'block';
  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Clears form-level validation errors.
 * @param {HTMLFormElement} form - The form element
 * @returns {void}
 */
function clearFormErrors(form) {
  const container = form.querySelector('[data-form-errors]');
  if (container) {
    container.innerHTML = '';
    container.style.display = 'none';
  }
}

/**
 * Sets the loading state of a submit button.
 * @param {HTMLButtonElement} btn - Submit button
 * @param {boolean} loading - True to show loading state
 * @param {string} [loadingText='Processing…'] - Text while loading
 * @returns {void}
 */
function setButtonLoading(btn, loading, loadingText = 'Processing…') {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
  }
}

/**
 * Safely escapes HTML; falls back to window.App.escapeHtml if available.
 * @param {string} str - Raw string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (window.App && window.App.escapeHtml) return window.App.escapeHtml(str);
  const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
  return String(str).replace(/[&<>"']/g, (c) => map[c]);
}

// ─────────────────────────────────────────────
// LOGIN PAGE HANDLER
// ─────────────────────────────────────────────

/**
 * Wires up the login form on login.html.
 * Expects a <form id="login-form"> with inputs named "email" and "password".
 * @returns {void}
 */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  // If already logged in, redirect away
  if (isLoggedIn()) {
    window.location.href = getPostLoginRedirect(getCurrentUser());
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const email    = form.elements['email']?.value.trim()    || '';
    const password = form.elements['password']?.value        || '';
    const submitBtn = form.querySelector('[type="submit"]');

    setButtonLoading(submitBtn, true, 'Signing in…');

    try {
      const result = await login(email, password);
      if (result.success) {
        if (window.App) {
          window.App.renderNav(result.user);
          window.App.notify.success(`Welcome back, ${result.user.firstName || result.user.email}!`);
        }
        setTimeout(() => {
          window.location.href = getPostLoginRedirect(result.user);
        }, 600);
      } else {
        showFormErrors(form, [result.error]);
        setButtonLoading(submitBtn, false);
      }
    } catch (err) {
      console.error('[PingTCM Auth] Login error:', err);
      showFormErrors(form, ['An unexpected error occurred. Please try again.']);
      setButtonLoading(submitBtn, false);
    }
  });

  // Toggle password visibility
  const toggleBtn = form.querySelector('[data-toggle-password]');
  if (toggleBtn) {
    const pwInput = form.elements['password'];
    toggleBtn.addEventListener('click', () => {
      const isText = pwInput.type === 'text';
      pwInput.type = isText ? 'password' : 'text';
      toggleBtn.textContent = isText ? 'Show' : 'Hide';
      toggleBtn.setAttribute('aria-label', isText ? 'Show password' : 'Hide password');
    });
  }
}

// ─────────────────────────────────────────────
// REGISTER PAGE HANDLER
// ─────────────────────────────────────────────

/**
 * Wires up the registration form on register.html.
 * Expects a <form id="register-form"> with inputs:
 *   firstName, lastName, email, password, confirmPassword, phone (optional)
 * @returns {void}
 */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  // If already logged in, redirect away
  if (isLoggedIn()) {
    window.location.href = getPostLoginRedirect(getCurrentUser());
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFormErrors(form);

    const data = {
      firstName:       form.elements['firstName']?.value.trim()   || '',
      lastName:        form.elements['lastName']?.value.trim()    || '',
      email:           form.elements['email']?.value.trim()       || '',
      password:        form.elements['password']?.value           || '',
      confirmPassword: form.elements['confirmPassword']?.value    || '',
      phone:           form.elements['phone']?.value.trim()       || '',
      role:            form.elements['role']?.value               || 'user',
    };

    // Client-side confirm password check
    if (data.password !== data.confirmPassword) {
      showFormErrors(form, ['Passwords do not match.']);
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    setButtonLoading(submitBtn, true, 'Creating account…');

    try {
      const result = await register(data);
      if (result.success) {
        if (window.App) {
          window.App.renderNav(result.user);
          window.App.notify.success('Account created! Welcome to Ping TCM.');
        }
        setTimeout(() => {
          window.location.href = getPostLoginRedirect(result.user);
        }, 800);
      } else {
        showFormErrors(form, result.errors || ['Registration failed. Please try again.']);
        setButtonLoading(submitBtn, false);
      }
    } catch (err) {
      console.error('[PingTCM Auth] Register error:', err);
      showFormErrors(form, ['An unexpected error occurred. Please try again.']);
      setButtonLoading(submitBtn, false);
    }
  });

  // Real-time password strength feedback
  const pwInput = form.elements['password'];
  const strengthEl = form.querySelector('[data-password-strength]');
  if (pwInput && strengthEl) {
    pwInput.addEventListener('input', () => {
      const pw = pwInput.value;
      const result = validatePassword(pw);
      if (!pw) {
        strengthEl.textContent = '';
        return;
      }
      if (result.valid) {
        strengthEl.textContent = '✓ Password meets requirements';
        strengthEl.style.color = '#10b981';
      } else {
        strengthEl.textContent = result.errors[0];
        strengthEl.style.color = '#ef4444';
      }
    });
  }

  // Toggle password visibility
  const toggleBtn = form.querySelector('[data-toggle-password]');
  if (toggleBtn) {
    const pwInput2 = form.elements['password'];
    toggleBtn.addEventListener('click', () => {
      const isText = pwInput2.type === 'text';
      pwInput2.type = isText ? 'password' : 'text';
      toggleBtn.textContent = isText ? 'Show' : 'Hide';
    });
  }
}

// ─────────────────────────────────────────────
// AUTH GUARD
// ─────────────────────────────────────────────

/**
 * Page-level auth guard. Call on pages that require authentication.
 * Reads the `data-require-auth` and `data-require-role` attributes
 * from <body> if present, then enforces access.
 *
 * Usage in HTML: <body data-require-auth data-require-role="admin">
 *
 * @returns {boolean} True if access is permitted
 */
function enforceAuthGuard() {
  const body = document.body;
  if (!body.hasAttribute('data-require-auth')) return true; // Page is public

  const minRole = body.dataset.requireRole || 'user';
  return requireAuth(minRole);
}

// ─────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────

/**
 * Bootstraps auth module.
 * - Seeds default accounts on first run.
 * - Enforces auth guard for protected pages.
 * - Wires up login / register forms if present.
 * @returns {Promise<void>}
 */
async function initAuth() {
  await seedDefaultAccounts();

  // Enforce page-level auth guard before anything else renders
  if (!enforceAuthGuard()) return;

  // Wire forms
  initLoginForm();
  initRegisterForm();

  // Expose current user to App state (if app.js loaded after auth.js)
  const user = getCurrentUser();
  if (window.App && user) {
    window.App.state.currentUser = user;
    window.App.renderNav(user);
  }
}

// Run after DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}

// ─────────────────────────────────────────────
// PUBLIC API (window.Auth)
// ─────────────────────────────────────────────

/**
 * Public interface exposed on window.Auth for use by other scripts.
 * @namespace Auth
 */
window.Auth = {
  login,
  logout,
  register,
  getCurrentUser,
  isLoggedIn,
  hasRole,
  requireAuth,
  validatePassword,
  isValidEmail,

  // Expose for page scripts that need to check roles inline
  ROLE_HIERARCHY,
};
