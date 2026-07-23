/**
 * shop.js — Ping TCM Acupuncture Clinic
 * E-commerce logic: catalog, cart, checkout, orders, coupons
 * Vanilla JS · localStorage persistence
 */

'use strict';

/* ─────────────────────────────────────────────
   PRODUCT CATALOG
───────────────────────────────────────────── */
const PRODUCTS = [
  // ── SERVICES ──
  {
    id: 'svc-001',
    name: 'Initial Consultation',
    description: 'Comprehensive first visit including full health history, tongue and pulse diagnosis, and personalized treatment plan tailored to your unique constitution.',
    price: 150,
    category: 'service',
    image: 'images/placeholders/svc-consultation.jpg',
    rating: 4.9,
    reviewsCount: 214,
    stock: 999,
    featured: true,
  },
  {
    id: 'svc-002',
    name: 'Follow-up Acupuncture',
    description: 'Standard 60-minute follow-up acupuncture session. Includes needle therapy, moxibustion if indicated, and progress review.',
    price: 85,
    category: 'service',
    image: 'images/placeholders/svc-followup.jpg',
    rating: 4.8,
    reviewsCount: 389,
    stock: 999,
    featured: true,
  },
  {
    id: 'svc-003',
    name: 'Pain Management Package',
    description: '5-session package designed for chronic or acute pain conditions including back pain, migraines, arthritis, and fibromyalgia. Save $50 vs individual sessions.',
    price: 375,
    category: 'service',
    image: 'images/placeholders/svc-pain.jpg',
    rating: 4.8,
    reviewsCount: 156,
    stock: 999,
    featured: true,
  },
  {
    id: 'svc-004',
    name: 'Infertility Package',
    description: 'Comprehensive fertility support program combining acupuncture, herbal medicine, and lifestyle coaching. 8-session course with ongoing email support.',
    price: 650,
    category: 'service',
    image: 'images/placeholders/svc-infertility.jpg',
    rating: 4.7,
    reviewsCount: 88,
    stock: 999,
    featured: false,
  },
  {
    id: 'svc-005',
    name: 'Allergy Treatment Package',
    description: '6-session allergy relief program addressing seasonal allergies, food sensitivities, and respiratory conditions through acupuncture and herbal support.',
    price: 320,
    category: 'service',
    image: 'images/placeholders/svc-allergy.jpg',
    rating: 4.6,
    reviewsCount: 73,
    stock: 999,
    featured: false,
  },
  {
    id: 'svc-006',
    name: 'Weight Loss Program',
    description: '10-session holistic weight management program combining auricular acupuncture, metabolic balancing herbs, dietary guidance, and mindfulness techniques.',
    price: 480,
    category: 'service',
    image: 'images/placeholders/svc-weightloss.jpg',
    rating: 4.5,
    reviewsCount: 61,
    stock: 999,
    featured: false,
  },
  {
    id: 'svc-007',
    name: 'PTSD / Anxiety Treatment',
    description: '8-session integrative program for PTSD and anxiety disorders. Combines acupuncture, ear seeds, breathing techniques, and herbal nervous system support.',
    price: 450,
    category: 'service',
    image: 'images/placeholders/svc-anxiety.jpg',
    rating: 4.8,
    reviewsCount: 102,
    stock: 999,
    featured: true,
  },
  {
    id: 'svc-008',
    name: 'Depression Treatment Package',
    description: '8-session program addressing depression through acupuncture, lifestyle medicine, and TCM herbal formulas to restore emotional balance and vitality.',
    price: 420,
    category: 'service',
    image: 'images/placeholders/svc-depression.jpg',
    rating: 4.7,
    reviewsCount: 94,
    stock: 999,
    featured: false,
  },
  {
    id: 'svc-009',
    name: 'Herbal Medicine Consultation',
    description: 'In-depth 45-minute herbal medicine consultation. Receive a custom Chinese herbal formula prescription tailored to your current health needs.',
    price: 120,
    category: 'service',
    image: 'images/placeholders/svc-herbal.jpg',
    rating: 4.9,
    reviewsCount: 137,
    stock: 999,
    featured: false,
  },
  {
    id: 'svc-010',
    name: 'Sports Injury Treatment',
    description: 'Targeted acupuncture and cupping session for sports injuries, muscle strains, tendinitis, and recovery optimization. 75-minute appointment.',
    price: 95,
    category: 'service',
    image: 'images/placeholders/svc-sports.jpg',
    rating: 4.8,
    reviewsCount: 178,
    stock: 999,
    featured: true,
  },

  // ── PRODUCTS ──
  {
    id: 'prd-001',
    name: 'Herbal Tea Blend — Energy',
    description: 'Energizing loose-leaf herbal blend with Astragalus, Ginseng, and Goji berry. Supports vitality, mental clarity, and adrenal health. 50g pouch, ~25 servings.',
    price: 28,
    category: 'product',
    image: 'images/placeholders/prd-tea-energy.jpg',
    rating: 4.7,
    reviewsCount: 203,
    stock: 45,
    featured: true,
  },
  {
    id: 'prd-002',
    name: 'Herbal Tea Blend — Immunity',
    description: 'Immune-boosting herbal blend featuring Astragalus, Elderberry, Reishi mushroom, and Schisandra. 50g pouch, ~25 servings.',
    price: 32,
    category: 'product',
    image: 'images/placeholders/prd-tea-immunity.jpg',
    rating: 4.8,
    reviewsCount: 189,
    stock: 38,
    featured: true,
  },
  {
    id: 'prd-003',
    name: 'Cupping Set',
    description: 'Professional-grade silicone cupping set of 12 cups in graduated sizes. Includes carrying pouch and instructional guide. BPA-free, easy to clean.',
    price: 45,
    category: 'product',
    image: 'images/placeholders/prd-cupping.jpg',
    rating: 4.6,
    reviewsCount: 112,
    stock: 22,
    featured: false,
  },
  {
    id: 'prd-004',
    name: 'Acupressure Mat',
    description: 'Premium acupressure mat with 6,210 stimulation points and neck pillow. Promotes relaxation, circulation, and pain relief. Eco-friendly foam core.',
    price: 38,
    category: 'product',
    image: 'images/placeholders/prd-mat.jpg',
    rating: 4.5,
    reviewsCount: 267,
    stock: 15,
    featured: true,
  },
  {
    id: 'prd-005',
    name: 'Gua Sha Stone',
    description: 'Authentic jade gua sha stone, hand-shaped for facial and body scraping. Includes a microfiber pouch and usage guide. Promotes lymphatic drainage.',
    price: 22,
    category: 'product',
    image: 'images/placeholders/prd-guasha.jpg',
    rating: 4.7,
    reviewsCount: 341,
    stock: 50,
    featured: false,
  },
  {
    id: 'prd-006',
    name: 'Herbal Supplement Pack',
    description: 'Monthly supply of foundational TCM supplements: Qi-tonifying capsules (60ct), adaptogen blend (60ct), and digestive harmony tablets (60ct).',
    price: 55,
    category: 'product',
    image: 'images/placeholders/prd-supplements.jpg',
    rating: 4.6,
    reviewsCount: 98,
    stock: 30,
    featured: false,
  },
  {
    id: 'prd-007',
    name: 'Moxa Sticks Bundle',
    description: 'Bundle of 10 premium smokeless moxa sticks made from aged mugwort. Used for moxibustion therapy to warm meridians and expel cold. 2.5cm diameter.',
    price: 18,
    category: 'product',
    image: 'images/placeholders/prd-moxa.jpg',
    rating: 4.5,
    reviewsCount: 76,
    stock: 60,
    featured: false,
  },
  {
    id: 'prd-008',
    name: 'Essential Oil Set',
    description: 'Set of 6 therapeutic-grade essential oils: Lavender, Peppermint, Eucalyptus, Frankincense, Tea Tree, and Ginger. 10ml bottles. Perfect for aromatherapy.',
    price: 35,
    category: 'product',
    image: 'images/placeholders/prd-oils.jpg',
    rating: 4.8,
    reviewsCount: 154,
    stock: 25,
    featured: true,
  },
  {
    id: 'prd-009',
    name: 'Relaxation Candle Set',
    description: 'Set of 3 hand-poured soy wax candles in calming TCM-inspired scents: Jasmine & Chrysanthemum, Sandalwood & Ginger, and Lotus & Patchouli. 8oz each.',
    price: 24,
    category: 'product',
    image: 'images/placeholders/prd-candles.jpg',
    rating: 4.7,
    reviewsCount: 182,
    stock: 20,
    featured: false,
  },
  {
    id: 'prd-010',
    name: 'Traditional Chinese Calendar',
    description: '2026 Traditional Chinese Lunar Calendar with daily health tips, seasonal self-care advice, festival dates, and TCM wellness guidance. 12-month wall format.',
    price: 15,
    category: 'product',
    image: 'images/placeholders/prd-calendar.jpg',
    rating: 4.4,
    reviewsCount: 59,
    stock: 40,
    featured: false,
  },
];

/* ─────────────────────────────────────────────
   COUPON CODES
───────────────────────────────────────────── */
const COUPONS = {
  PING10:    { discount: 0.10, description: '10% off your order' },
  WELCOME20: { discount: 0.20, description: '20% off — welcome gift for new customers', newUsersOnly: true },
  TCM15:     { discount: 0.15, description: '15% off your order' },
};

/* ─────────────────────────────────────────────
   CART  (localStorage key: 'ptcm_cart')
───────────────────────────────────────────── */
const CART_KEY   = 'ptcm_cart';
const ORDERS_KEY = 'ptcm_orders';

const Cart = (() => {
  /** @returns {Array} */
  function _load() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
      return [];
    }
  }

  function _save(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }

  /** Add a product to the cart (or increment qty if already present) */
  function add(productId, qty = 1) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) { console.warn('Cart.add: unknown product', productId); return; }

    const items = _load();
    const existing = items.find(i => i.id === productId);

    if (existing) {
      existing.qty = Math.min(existing.qty + qty, product.stock);
    } else {
      items.push({ id: productId, qty: Math.min(qty, product.stock) });
    }

    _save(items);
    _dispatch('cart:updated');
  }

  /** Remove a product entirely from the cart */
  function remove(productId) {
    const items = _load().filter(i => i.id !== productId);
    _save(items);
    _dispatch('cart:updated');
  }

  /** Set the quantity for a cart line; removes if qty ≤ 0 */
  function updateQty(productId, qty) {
    if (qty <= 0) { remove(productId); return; }
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const items = _load();
    const item = items.find(i => i.id === productId);
    if (item) {
      item.qty = Math.min(qty, product.stock);
      _save(items);
      _dispatch('cart:updated');
    }
  }

  /** Empty the cart */
  function clear() {
    _save([]);
    _dispatch('cart:updated');
  }

  /** Return cart lines enriched with full product data */
  function getItems() {
    return _load().map(item => {
      const product = PRODUCTS.find(p => p.id === item.id);
      return product ? { ...product, qty: item.qty } : null;
    }).filter(Boolean);
  }

  /** Subtotal before any coupon */
  function getTotal() {
    return getItems().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  /** Total number of units across all cart lines */
  function getCount() {
    return _load().reduce((sum, i) => sum + i.qty, 0);
  }

  function _dispatch(eventName) {
    document.dispatchEvent(new CustomEvent(eventName, { detail: getItems() }));
  }

  return { add, remove, updateQty, clear, getItems, getTotal, getCount };
})();


/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */

/** Format a number as USD currency string */
function formatPrice(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/** Build HTML star rating display (supports half stars) */
function buildStars(rating) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  const star  = '<span class="star star--full">★</span>';
  const starH = '<span class="star star--half">★</span>';
  const starE = '<span class="star star--empty">☆</span>';

  return star.repeat(full) + starH.repeat(half) + starE.repeat(empty);
}

/** Generate a placeholder SVG data URL for missing product images */
function placeholderSrc(label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <rect width="400" height="300" fill="#f0ebe3"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="16"
          fill="#9b7e5a" text-anchor="middle" dominant-baseline="middle">${label}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/* ─────────────────────────────────────────────
   RENDER PRODUCTS
   renderProducts(filter, sort, search)
     filter : 'all' | 'service' | 'product'
     sort   : 'default' | 'price-asc' | 'price-desc' | 'name' | 'rating'
     search : string
───────────────────────────────────────────── */
function renderProducts(filter = 'all', sort = 'default', search = '') {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const term = search.trim().toLowerCase();

  let list = PRODUCTS.filter(p => {
    if (filter !== 'all' && p.category !== filter) return false;
    if (term && !p.name.toLowerCase().includes(term) && !p.description.toLowerCase().includes(term)) return false;
    return true;
  });

  // Sorting
  switch (sort) {
    case 'price-asc':  list.sort((a, b) => a.price - b.price);                          break;
    case 'price-desc': list.sort((a, b) => b.price - a.price);                          break;
    case 'name':       list.sort((a, b) => a.name.localeCompare(b.name));               break;
    case 'rating':     list.sort((a, b) => b.rating - a.rating);                        break;
    default:           list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)); break;
  }

  if (list.length === 0) {
    grid.innerHTML = `<div class="products-empty">
      <p>No results found for <strong>"${_escHtml(search)}"</strong>.</p>
      <button class="btn btn--secondary" onclick="resetFilters()">Clear filters</button>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(p => _productCard(p)).join('');

  // Lazy-load images: swap placeholder if real image 404s
  grid.querySelectorAll('img[data-product-img]').forEach(img => {
    img.addEventListener('error', function () {
      this.src = placeholderSrc(this.alt);
      this.removeEventListener('error', null);
    });
  });
}

function _productCard(p) {
  const inCart   = Cart.getItems().some(i => i.id === p.id);
  const outStock = p.stock === 0;
  const badge    = p.featured ? '<span class="badge badge--featured">Featured</span>' : '';
  const catBadge = `<span class="badge badge--${p.category}">${p.category === 'service' ? 'Service' : 'Product'}</span>`;

  return `
<article class="product-card" data-id="${p.id}" data-category="${p.category}">
  <div class="product-card__img-wrap">
    <img src="${_escAttr(p.image)}"
         data-product-img
         alt="${_escAttr(p.name)}"
         loading="lazy"
         onerror="this.src=placeholderSrc('${_escAttr(p.name)}')">
    <div class="product-card__badges">${badge}${catBadge}</div>
  </div>
  <div class="product-card__body">
    <h3 class="product-card__name">${_escHtml(p.name)}</h3>
    <div class="product-card__stars" aria-label="Rating: ${p.rating} out of 5">
      ${buildStars(p.rating)}
      <span class="product-card__reviews">(${p.reviewsCount})</span>
    </div>
    <p class="product-card__desc">${_escHtml(p.description)}</p>
    <div class="product-card__footer">
      <span class="product-card__price">${formatPrice(p.price)}</span>
      ${outStock
        ? '<span class="product-card__oos">Out of stock</span>'
        : `<button class="btn btn--primary btn--add-cart ${inCart ? 'in-cart' : ''}"
                   onclick="handleAddToCart('${p.id}', this)"
                   data-id="${p.id}"
                   aria-label="Add ${_escAttr(p.name)} to cart">
             ${inCart ? '✓ In Cart' : 'Add to Cart'}
           </button>`
      }
    </div>
    <button class="btn btn--link product-card__details-btn"
            onclick="openProductModal('${p.id}')"
            aria-label="View details for ${_escAttr(p.name)}">View details</button>
  </div>
</article>`.trim();
}

/* ─────────────────────────────────────────────
   PRODUCT DETAIL MODAL
───────────────────────────────────────────── */
function openProductModal(productId) {
  const p = PRODUCTS.find(pr => pr.id === productId);
  if (!p) return;

  let modal = document.getElementById('product-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'product-modal';
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'modal-title');
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeProductModal(); });
  }

  const related = _getRelated(p, 3);

  modal.innerHTML = `
<div class="modal-box">
  <button class="modal-close" onclick="closeProductModal()" aria-label="Close">&times;</button>
  <div class="modal-body">
    <div class="modal-img-wrap">
      <img src="${_escAttr(p.image)}" alt="${_escAttr(p.name)}"
           onerror="this.src=placeholderSrc('${_escAttr(p.name)}')">
    </div>
    <div class="modal-info">
      <span class="badge badge--${p.category}">${p.category === 'service' ? 'Service' : 'Product'}</span>
      ${p.featured ? '<span class="badge badge--featured">Featured</span>' : ''}
      <h2 id="modal-title">${_escHtml(p.name)}</h2>
      <div class="modal-stars" aria-label="Rating: ${p.rating} out of 5">
        ${buildStars(p.rating)}
        <span>${p.rating} (${p.reviewsCount} reviews)</span>
      </div>
      <p class="modal-price">${formatPrice(p.price)}</p>
      <p class="modal-desc">${_escHtml(p.description)}</p>
      <div class="modal-qty-row">
        <label for="modal-qty">Qty:</label>
        <input id="modal-qty" type="number" value="1" min="1" max="${p.stock}" class="qty-input">
        <button class="btn btn--primary"
                onclick="handleAddToCart('${p.id}', this, parseInt(document.getElementById('modal-qty').value))"
                ${p.stock === 0 ? 'disabled' : ''}>
          ${p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
      <p class="modal-stock">${p.stock > 0 ? `${p.stock} available` : '<span class="text-danger">Out of stock</span>'}</p>
    </div>
  </div>
  ${related.length ? `
  <div class="modal-related">
    <h3>Related Items</h3>
    <div class="related-grid">${related.map(r => `
      <div class="related-card" onclick="openProductModal('${r.id}')">
        <img src="${_escAttr(r.image)}" alt="${_escAttr(r.name)}"
             onerror="this.src=placeholderSrc('${_escAttr(r.name)}')">
        <p>${_escHtml(r.name)}</p>
        <strong>${formatPrice(r.price)}</strong>
      </div>`).join('')}
    </div>
  </div>` : ''}
</div>`.trim();

  modal.removeAttribute('hidden');
  document.body.classList.add('modal-open');
  modal.querySelector('.modal-close').focus();
}

function closeProductModal() {
  const modal = document.getElementById('product-modal');
  if (modal) {
    modal.setAttribute('hidden', '');
    document.body.classList.remove('modal-open');
  }
}

/** Return up to `count` products in the same category, excluding current */
function _getRelated(product, count = 3) {
  return PRODUCTS
    .filter(p => p.id !== product.id && p.category === product.category)
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

/* ─────────────────────────────────────────────
   ADD-TO-CART HANDLER
───────────────────────────────────────────── */
function handleAddToCart(productId, btnEl, qty = 1) {
  Cart.add(productId, qty);
  if (btnEl) {
    btnEl.textContent = '✓ In Cart';
    btnEl.classList.add('in-cart');
    btnEl.disabled = true;
    setTimeout(() => {
      btnEl.textContent = 'Add to Cart';
      btnEl.classList.remove('in-cart');
      btnEl.disabled = false;
    }, 1800);
  }
  showToast(`Added to cart!`);
  updateCartBadge();
}

/* ─────────────────────────────────────────────
   FILTER / SORT / SEARCH — UI controls
───────────────────────────────────────────── */
let _activeFilter = 'all';
let _activeSort   = 'default';
let _activeSearch = '';

function applyFilter(filter) {
  _activeFilter = filter;
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });
  renderProducts(_activeFilter, _activeSort, _activeSearch);
}

function applySort(sort) {
  _activeSort = sort;
  renderProducts(_activeFilter, _activeSort, _activeSearch);
}

function applySearch(term) {
  _activeSearch = term;
  renderProducts(_activeFilter, _activeSort, _activeSearch);
}

function resetFilters() {
  _activeFilter = 'all';
  _activeSort   = 'default';
  _activeSearch = '';
  const searchEl = document.getElementById('shop-search');
  if (searchEl) searchEl.value = '';
  const sortEl = document.getElementById('shop-sort');
  if (sortEl) sortEl.value = 'default';
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === 'all');
  });
  renderProducts();
}


/* ─────────────────────────────────────────────
   RENDER CART
───────────────────────────────────────────── */
function renderCart() {
  const container = document.getElementById('cart-container');
  if (!container) return;

  const items    = Cart.getItems();
  const subtotal = Cart.getTotal();
  const coupon   = _getActiveCoupon();
  const discount = coupon ? subtotal * coupon.discount : 0;
  const total    = subtotal - discount;

  if (items.length === 0) {
    container.innerHTML = `
<div class="cart-empty">
  <p>Your cart is empty.</p>
  <a href="shop.html" class="btn btn--primary">Continue Shopping</a>
</div>`;
    return;
  }

  const linesHtml = items.map(item => `
<div class="cart-item" data-id="${item.id}">
  <img class="cart-item__img" src="${_escAttr(item.image)}" alt="${_escAttr(item.name)}"
       onerror="this.src=placeholderSrc('${_escAttr(item.name)}')">
  <div class="cart-item__info">
    <h4 class="cart-item__name">${_escHtml(item.name)}</h4>
    <span class="badge badge--${item.category}">${item.category}</span>
    <p class="cart-item__unit-price">${formatPrice(item.price)} each</p>
  </div>
  <div class="cart-item__qty">
    <button class="qty-btn" onclick="Cart.updateQty('${item.id}', ${item.qty - 1}); renderCart();"
            aria-label="Decrease quantity" ${item.qty <= 1 ? 'disabled' : ''}>−</button>
    <input type="number" class="qty-input" value="${item.qty}" min="1" max="${item.stock}"
           onchange="Cart.updateQty('${item.id}', parseInt(this.value) || 1); renderCart();"
           aria-label="Quantity for ${_escAttr(item.name)}">
    <button class="qty-btn" onclick="Cart.updateQty('${item.id}', ${item.qty + 1}); renderCart();"
            aria-label="Increase quantity" ${item.qty >= item.stock ? 'disabled' : ''}>+</button>
  </div>
  <span class="cart-item__line-price">${formatPrice(item.price * item.qty)}</span>
  <button class="cart-item__remove" onclick="Cart.remove('${item.id}'); renderCart();"
          aria-label="Remove ${_escAttr(item.name)} from cart">&times;</button>
</div>`).join('');

  container.innerHTML = `
<div class="cart-lines">${linesHtml}</div>
<div class="cart-summary">
  <div class="coupon-row">
    <input id="coupon-input" type="text" placeholder="Coupon code" class="coupon-input"
           value="${_escAttr(_getActiveCouponCode())}" aria-label="Coupon code">
    <button class="btn btn--secondary" onclick="applyCoupon()">Apply</button>
    ${coupon ? `<button class="btn btn--link" onclick="removeCoupon()">Remove</button>` : ''}
  </div>
  ${coupon ? `<p class="coupon-success">✓ ${_escHtml(coupon.description)} applied</p>` : ''}
  <div id="coupon-error" class="coupon-error" aria-live="polite"></div>
  <table class="cart-totals">
    <tr><td>Subtotal</td><td>${formatPrice(subtotal)}</td></tr>
    ${coupon ? `<tr class="discount-row"><td>Discount (${Math.round(coupon.discount * 100)}%)</td><td>−${formatPrice(discount)}</td></tr>` : ''}
    <tr class="total-row"><td><strong>Total</strong></td><td><strong>${formatPrice(total)}</strong></td></tr>
  </table>
  <div class="cart-actions">
    <button class="btn btn--danger" onclick="confirmClearCart()">Clear Cart</button>
    <a href="checkout.html" class="btn btn--primary">Proceed to Checkout</a>
  </div>
</div>`;

  updateCartBadge();
}

function confirmClearCart() {
  if (window.confirm('Remove all items from your cart?')) {
    Cart.clear();
    renderCart();
  }
}

/* ─────────────────────────────────────────────
   COUPON HANDLING
───────────────────────────────────────────── */
const COUPON_SESSION_KEY = 'ptcm_coupon';

function applyCoupon() {
  const input = document.getElementById('coupon-input');
  const errEl = document.getElementById('coupon-error');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  const errorMsg = validateCoupon(code);

  if (errorMsg) {
    if (errEl) errEl.textContent = errorMsg;
    return;
  }

  sessionStorage.setItem(COUPON_SESSION_KEY, code);
  if (errEl) errEl.textContent = '';
  renderCart();
}

function removeCoupon() {
  sessionStorage.removeItem(COUPON_SESSION_KEY);
  renderCart();
}

function _getActiveCouponCode() {
  return sessionStorage.getItem(COUPON_SESSION_KEY) || '';
}

function _getActiveCoupon() {
  const code = _getActiveCouponCode();
  return code ? COUPONS[code] || null : null;
}

function validateCoupon(code) {
  if (!code) return 'Please enter a coupon code.';
  const coupon = COUPONS[code];
  if (!coupon) return 'Invalid coupon code.';
  if (coupon.newUsersOnly) {
    const orders = _loadOrders();
    if (orders.length > 0) return 'WELCOME20 is only valid for new customers.';
  }
  return null; // valid
}

/* ─────────────────────────────────────────────
   CHECKOUT — form handling & order creation
───────────────────────────────────────────── */
function initCheckout() {
  const form = document.getElementById('checkout-form');
  if (!form) return;

  _renderOrderSummary();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!_validateCheckoutForm(form)) return;

    const order = _buildOrder(form);
    _saveOrder(order);
    Cart.clear();
    sessionStorage.removeItem(COUPON_SESSION_KEY);
    _showOrderConfirmation(order);
  });

  // Live total update when coupon state changes
  document.addEventListener('cart:updated', _renderOrderSummary);
}

function _renderOrderSummary() {
  const el = document.getElementById('order-summary');
  if (!el) return;

  const items    = Cart.getItems();
  const subtotal = Cart.getTotal();
  const coupon   = _getActiveCoupon();
  const discount = coupon ? subtotal * coupon.discount : 0;
  const total    = subtotal - discount;

  if (items.length === 0) {
    el.innerHTML = '<p>Your cart is empty. <a href="shop.html">Go back to shop</a></p>';
    return;
  }

  el.innerHTML = `
<h3>Order Summary</h3>
<ul class="summary-lines">
  ${items.map(i => `<li><span>${_escHtml(i.name)} × ${i.qty}</span><span>${formatPrice(i.price * i.qty)}</span></li>`).join('')}
</ul>
<hr>
${coupon ? `<p class="discount-line">Discount: −${formatPrice(discount)}</p>` : ''}
<p class="summary-total"><strong>Total: ${formatPrice(total)}</strong></p>`;
}

function _validateCheckoutForm(form) {
  let valid = true;
  form.querySelectorAll('[required]').forEach(field => {
    field.classList.remove('field-error');
    if (!field.value.trim()) {
      field.classList.add('field-error');
      valid = false;
    }
  });
  // email format
  const email = form.querySelector('[type="email"]');
  if (email && email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    email.classList.add('field-error');
    valid = false;
  }
  if (!valid) showToast('Please fill in all required fields.', 'error');
  return valid;
}

function _buildOrder(form) {
  const data     = new FormData(form);
  const subtotal = Cart.getTotal();
  const coupon   = _getActiveCoupon();
  const discount = coupon ? subtotal * coupon.discount : 0;
  const total    = subtotal - discount;

  return {
    id:          'ORD-' + Date.now(),
    date:        new Date().toISOString(),
    status:      'pending',
    customer: {
      firstName: data.get('firstName') || '',
      lastName:  data.get('lastName')  || '',
      email:     data.get('email')     || '',
      phone:     data.get('phone')     || '',
      address:   data.get('address')   || '',
      city:      data.get('city')      || '',
      state:     data.get('state')     || '',
      zip:       data.get('zip')       || '',
    },
    items:       Cart.getItems().map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, category: i.category })),
    couponCode:  _getActiveCouponCode() || null,
    subtotal,
    discount,
    total,
    paymentMethod: data.get('paymentMethod') || 'card',
    notes:         data.get('notes')          || '',
  };
}

function _saveOrder(order) {
  const orders = _loadOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function _loadOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
  } catch {
    return [];
  }
}

function _showOrderConfirmation(order) {
  const main = document.getElementById('checkout-main') || document.querySelector('main');
  if (!main) return;

  main.innerHTML = `
<div class="order-confirmation">
  <div class="confirm-icon">✓</div>
  <h2>Thank you, ${_escHtml(order.customer.firstName)}!</h2>
  <p>Your order <strong>${_escHtml(order.id)}</strong> has been placed successfully.</p>
  <p>A confirmation will be sent to <strong>${_escHtml(order.customer.email)}</strong>.</p>
  <div class="confirm-summary">
    <h3>Order Details</h3>
    <ul>
      ${order.items.map(i => `<li>${_escHtml(i.name)} × ${i.qty} — ${formatPrice(i.price * i.qty)}</li>`).join('')}
    </ul>
    <p><strong>Total paid: ${formatPrice(order.total)}</strong></p>
  </div>
  <a href="shop.html" class="btn btn--primary">Continue Shopping</a>
  <a href="index.html" class="btn btn--secondary">Back to Home</a>
</div>`;
}

/* ─────────────────────────────────────────────
   CART BADGE (header icon counter)
───────────────────────────────────────────── */
function updateCartBadge() {
  const count = Cart.getCount();
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.hidden = count === 0;
  });
}

/* ─────────────────────────────────────────────
   TOAST NOTIFICATIONS
───────────────────────────────────────────── */
function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  // Trigger reflow for animation
  void toast.offsetWidth;
  toast.classList.add('toast--show');

  setTimeout(() => {
    toast.classList.remove('toast--show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3000);
}

/* ─────────────────────────────────────────────
   SECURITY HELPERS
───────────────────────────────────────────── */
function _escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function _escAttr(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ─────────────────────────────────────────────
   PAGE INITIALIZATION
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  // ── Shop page ──
  if (document.getElementById('products-grid')) {
    renderProducts();

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
    });

    // Sort select
    const sortEl = document.getElementById('shop-sort');
    if (sortEl) sortEl.addEventListener('change', () => applySort(sortEl.value));

    // Search input (debounced)
    const searchEl = document.getElementById('shop-search');
    if (searchEl) {
      let searchTimer;
      searchEl.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => applySearch(searchEl.value), 300);
      });
    }
  }

  // ── Cart page ──
  if (document.getElementById('cart-container')) {
    renderCart();
    document.addEventListener('cart:updated', renderCart);
  }

  // ── Checkout page ──
  if (document.getElementById('checkout-form')) {
    initCheckout();
  }

  // ── Cart badge on all pages ──
  updateCartBadge();
  document.addEventListener('cart:updated', updateCartBadge);

  // ── Keyboard: close modal with Escape ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeProductModal();
  });
});

/* ─────────────────────────────────────────────
   PUBLIC API (for inline HTML event handlers)
───────────────────────────────────────────── */
window.Cart              = Cart;
window.renderProducts    = renderProducts;
window.renderCart        = renderCart;
window.handleAddToCart   = handleAddToCart;
window.openProductModal  = openProductModal;
window.closeProductModal = closeProductModal;
window.applyFilter       = applyFilter;
window.applySort         = applySort;
window.applySearch       = applySearch;
window.resetFilters      = resetFilters;
window.applyCoupon       = applyCoupon;
window.removeCoupon      = removeCoupon;
window.confirmClearCart  = confirmClearCart;
window.showToast         = showToast;
window.formatPrice       = formatPrice;
window.buildStars        = buildStars;
window.placeholderSrc    = placeholderSrc;
window.PRODUCTS          = PRODUCTS;
