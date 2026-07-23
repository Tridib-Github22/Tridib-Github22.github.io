/**
 * admin.js — Ping TCM Acupuncture Clinic
 * Admin panel: dashboard, users, orders, appointments, products, analytics
 * Vanilla JS · localStorage persistence · Chart.js for charts
 *
 * Roles:
 *   admin     — full access (users, orders, appointments, products)
 *   superuser — orders + appointments only; cannot touch users or products
 */

'use strict';

/* ─────────────────────────────────────────────
   CONSTANTS & STORAGE KEYS
───────────────────────────────────────────── */
const ADMIN_KEYS = {
  users:        'ptcm_users',
  orders:       'ptcm_orders',
  appointments: 'ptcm_appointments',
  products:     'ptcm_admin_products',
  session:      'ptcm_admin_session',
};

/* ─────────────────────────────────────────────
   ROLE-BASED ACCESS CONTROL
───────────────────────────────────────────── */
const AdminAuth = (() => {
  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(ADMIN_KEYS.session)) || null;
    } catch { return null; }
  }

  function setSession(user) {
    sessionStorage.setItem(ADMIN_KEYS.session, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(ADMIN_KEYS.session);
  }

  function isAdmin()     { return getSession()?.role === 'admin'; }
  function isSuperuser() { const r = getSession()?.role; return r === 'superuser' || r === 'admin'; }

  function can(action) {
    const role = getSession()?.role;
    if (!role) return false;
    const permissions = {
      admin:     ['users', 'orders', 'appointments', 'products', 'analytics'],
      superuser: ['orders', 'appointments', 'analytics'],
    };
    return (permissions[role] || []).includes(action);
  }

  /** Restrict a DOM element based on permission; hide if no access */
  function guard(elementId, action) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (!can(action)) {
      el.hidden = true;
      el.setAttribute('aria-hidden', 'true');
    }
  }

  return { getSession, setSession, clearSession, isAdmin, isSuperuser, can, guard };
})();

/* ─────────────────────────────────────────────
   DATA LAYER — localStorage CRUD helpers
───────────────────────────────────────────── */
function _load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}

function _save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Seed demo data if storage is empty
function _seedDemoData() {
  // Users
  if (!localStorage.getItem(ADMIN_KEYS.users)) {
    _save(ADMIN_KEYS.users, [
      { id: 'u1', name: 'Alice Chen',    email: 'alice@example.com',   role: 'admin',     joined: '2025-01-10', status: 'active' },
      { id: 'u2', name: 'Bob Martinez',  email: 'bob@example.com',     role: 'superuser', joined: '2025-02-14', status: 'active' },
      { id: 'u3', name: 'Carol Kim',     email: 'carol@example.com',   role: 'customer',  joined: '2025-03-05', status: 'active' },
      { id: 'u4', name: 'David Patel',   email: 'david@example.com',   role: 'customer',  joined: '2025-04-20', status: 'active' },
      { id: 'u5', name: 'Eva Thompson',  email: 'eva@example.com',     role: 'customer',  joined: '2025-05-08', status: 'inactive' },
      { id: 'u6', name: 'Frank Liu',     email: 'frank@example.com',   role: 'customer',  joined: '2025-06-17', status: 'active' },
      { id: 'u7', name: 'Grace Nguyen',  email: 'grace@example.com',   role: 'customer',  joined: '2025-07-01', status: 'active' },
      { id: 'u8', name: 'Henry Adams',   email: 'henry@example.com',   role: 'customer',  joined: '2025-08-23', status: 'active' },
    ]);
  }

  // Orders
  if (!localStorage.getItem(ADMIN_KEYS.orders)) {
    const sampleOrders = [
      { id: 'ORD-001', date: '2026-01-15T10:30:00Z', customer: { firstName: 'Carol', lastName: 'Kim', email: 'carol@example.com' }, items: [{ name: 'Initial Consultation', qty: 1, price: 150 }], total: 150, status: 'completed' },
      { id: 'ORD-002', date: '2026-02-03T14:00:00Z', customer: { firstName: 'David', lastName: 'Patel', email: 'david@example.com' }, items: [{ name: 'Pain Management Package', qty: 1, price: 375 }], total: 375, status: 'completed' },
      { id: 'ORD-003', date: '2026-03-11T09:15:00Z', customer: { firstName: 'Eva', lastName: 'Thompson', email: 'eva@example.com' }, items: [{ name: 'Herbal Tea Blend — Energy', qty: 2, price: 28 }], total: 56, status: 'completed' },
      { id: 'ORD-004', date: '2026-04-22T16:45:00Z', customer: { firstName: 'Frank', lastName: 'Liu', email: 'frank@example.com' }, items: [{ name: 'Follow-up Acupuncture', qty: 1, price: 85 }, { name: 'Gua Sha Stone', qty: 1, price: 22 }], total: 107, status: 'completed' },
      { id: 'ORD-005', date: '2026-05-07T11:00:00Z', customer: { firstName: 'Grace', lastName: 'Nguyen', email: 'grace@example.com' }, items: [{ name: 'Infertility Package', qty: 1, price: 650 }], total: 650, status: 'processing' },
      { id: 'ORD-006', date: '2026-06-18T13:30:00Z', customer: { firstName: 'Henry', lastName: 'Adams', email: 'henry@example.com' }, items: [{ name: 'Essential Oil Set', qty: 1, price: 35 }, { name: 'Acupressure Mat', qty: 1, price: 38 }], total: 73, status: 'processing' },
      { id: 'ORD-007', date: '2026-07-01T08:00:00Z', customer: { firstName: 'Alice', lastName: 'Chen', email: 'alice@example.com' }, items: [{ name: 'PTSD / Anxiety Treatment', qty: 1, price: 450 }], total: 450, status: 'pending' },
      { id: 'ORD-008', date: '2026-07-14T09:45:00Z', customer: { firstName: 'Bob', lastName: 'Martinez', email: 'bob@example.com' }, items: [{ name: 'Sports Injury Treatment', qty: 1, price: 95 }], total: 95, status: 'pending' },
    ];
    _save(ADMIN_KEYS.orders, sampleOrders);
  }

  // Appointments
  if (!localStorage.getItem(ADMIN_KEYS.appointments)) {
    const today = new Date().toISOString().slice(0, 10);
    _save(ADMIN_KEYS.appointments, [
      { id: 'APT-001', patientName: 'Carol Kim',    patientEmail: 'carol@example.com', service: 'Initial Consultation',   date: today,        time: '09:00', practitioner: 'Dr. Ping', status: 'confirmed', notes: '' },
      { id: 'APT-002', patientName: 'David Patel',  patientEmail: 'david@example.com', service: 'Follow-up Acupuncture',  date: today,        time: '10:30', practitioner: 'Dr. Ping', status: 'pending',   notes: 'Lower back pain' },
      { id: 'APT-003', patientName: 'Grace Nguyen', patientEmail: 'grace@example.com', service: 'Infertility Package',    date: today,        time: '14:00', practitioner: 'Dr. Ping', status: 'confirmed', notes: '' },
      { id: 'APT-004', patientName: 'Frank Liu',    patientEmail: 'frank@example.com', service: 'Sports Injury Treatment',date: today,        time: '16:00', practitioner: 'Dr. Ping', status: 'pending',   notes: 'Knee injury' },
      { id: 'APT-005', patientName: 'Eva Thompson', patientEmail: 'eva@example.com',   service: 'Herbal Medicine Consultation', date: '2026-07-15', time: '11:00', practitioner: 'Dr. Ping', status: 'pending', notes: '' },
      { id: 'APT-006', patientName: 'Henry Adams',  patientEmail: 'henry@example.com', service: 'Pain Management Package', date: '2026-07-16', time: '13:30', practitioner: 'Dr. Ping', status: 'pending',   notes: '' },
    ]);
  }
}

/* ─────────────────────────────────────────────
   DASHBOARD STATS
───────────────────────────────────────────── */
function renderDashboardStats() {
  const users        = _load(ADMIN_KEYS.users);
  const orders       = _load(ADMIN_KEYS.orders);
  const appointments = _load(ADMIN_KEYS.appointments);
  const today        = new Date().toISOString().slice(0, 10);

  const totalRevenue    = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const todayAppts      = appointments.filter(a => a.date === today).length;
  const pendingOrders   = orders.filter(o => o.status === 'pending').length;
  const activeUsers     = users.filter(u => u.status === 'active').length;

  _setStatEl('stat-users',          activeUsers);
  _setStatEl('stat-orders',         orders.length);
  _setStatEl('stat-revenue',        _fmtCurrency(totalRevenue));
  _setStatEl('stat-appts-today',    todayAppts);
  _setStatEl('stat-pending-orders', pendingOrders);
}

function _setStatEl(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function _fmtCurrency(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);
}

function _fmtDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
  } catch { return iso; }
}

function _escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function _statusBadge(status) {
  const map = {
    pending:    'badge--warning',
    processing: 'badge--info',
    completed:  'badge--success',
    cancelled:  'badge--danger',
    confirmed:  'badge--success',
    active:     'badge--success',
    inactive:   'badge--muted',
    admin:      'badge--primary',
    superuser:  'badge--info',
    customer:   'badge--muted',
  };
  return `<span class="badge ${map[status] || 'badge--muted'}">${_escHtml(status)}</span>`;
}


/* ─────────────────────────────────────────────
   USER MANAGEMENT  (admin only)
───────────────────────────────────────────── */
function renderUsersTable() {
  const container = document.getElementById('users-table-container');
  if (!container) return;

  if (!AdminAuth.can('users')) {
    container.innerHTML = '<p class="access-denied">⚠ You do not have permission to manage users.</p>';
    return;
  }

  const users = _load(ADMIN_KEYS.users);

  if (users.length === 0) {
    container.innerHTML = '<p class="table-empty">No users found.</p>';
    return;
  }

  container.innerHTML = `
<div class="table-toolbar">
  <input type="text" id="user-search" class="table-search" placeholder="Search users…" oninput="filterUsersTable(this.value)">
  <button class="btn btn--primary btn--sm" onclick="openUserModal()">+ Add User</button>
</div>
<div class="table-responsive">
<table class="admin-table" id="users-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Role</th>
      <th>Joined</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    ${users.map(u => `
    <tr data-user-id="${_escHtml(u.id)}" class="user-row">
      <td>${_escHtml(u.name)}</td>
      <td>${_escHtml(u.email)}</td>
      <td>${_statusBadge(u.role)}</td>
      <td>${_escHtml(u.joined || '—')}</td>
      <td>${_statusBadge(u.status)}</td>
      <td class="actions-cell">
        <button class="btn btn--sm btn--secondary" onclick="viewUser('${_escHtml(u.id)}')" title="View user">View</button>
        <button class="btn btn--sm btn--primary"   onclick="openUserModal('${_escHtml(u.id)}')" title="Edit user">Edit</button>
        <button class="btn btn--sm btn--danger"    onclick="deleteUser('${_escHtml(u.id)}')" title="Delete user">Delete</button>
      </td>
    </tr>`).join('')}
  </tbody>
</table>
</div>`;
}

function filterUsersTable(term) {
  const t = term.toLowerCase();
  document.querySelectorAll('#users-table .user-row').forEach(row => {
    const text = row.textContent.toLowerCase();
    row.hidden = t.length > 0 && !text.includes(t);
  });
}

function viewUser(userId) {
  const users = _load(ADMIN_KEYS.users);
  const u = users.find(x => x.id === userId);
  if (!u) return;
  _openInfoModal('User Details', `
    <dl class="detail-list">
      <dt>Name</dt>    <dd>${_escHtml(u.name)}</dd>
      <dt>Email</dt>   <dd>${_escHtml(u.email)}</dd>
      <dt>Role</dt>    <dd>${_statusBadge(u.role)}</dd>
      <dt>Joined</dt>  <dd>${_escHtml(u.joined || '—')}</dd>
      <dt>Status</dt>  <dd>${_statusBadge(u.status)}</dd>
    </dl>`);
}

function openUserModal(userId = null) {
  const users = _load(ADMIN_KEYS.users);
  const u = userId ? users.find(x => x.id === userId) : null;
  const title = u ? 'Edit User' : 'Add User';

  _openFormModal(title, `
    <div class="form-group">
      <label for="um-name">Full Name <span class="required">*</span></label>
      <input id="um-name" type="text" class="form-control" value="${_escHtml(u?.name || '')}" required>
    </div>
    <div class="form-group">
      <label for="um-email">Email <span class="required">*</span></label>
      <input id="um-email" type="email" class="form-control" value="${_escHtml(u?.email || '')}" required>
    </div>
    <div class="form-group">
      <label for="um-role">Role</label>
      <select id="um-role" class="form-control">
        <option value="customer"  ${u?.role === 'customer'  ? 'selected' : ''}>Customer</option>
        <option value="superuser" ${u?.role === 'superuser' ? 'selected' : ''}>Superuser</option>
        <option value="admin"     ${u?.role === 'admin'     ? 'selected' : ''}>Admin</option>
      </select>
    </div>
    <div class="form-group">
      <label for="um-status">Status</label>
      <select id="um-status" class="form-control">
        <option value="active"   ${u?.status !== 'inactive' ? 'selected' : ''}>Active</option>
        <option value="inactive" ${u?.status === 'inactive' ? 'selected' : ''}>Inactive</option>
      </select>
    </div>`,
    () => {
      const name   = document.getElementById('um-name').value.trim();
      const email  = document.getElementById('um-email').value.trim();
      const role   = document.getElementById('um-role').value;
      const status = document.getElementById('um-status').value;

      if (!name || !email) { adminToast('Name and email are required.', 'error'); return false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { adminToast('Invalid email address.', 'error'); return false; }

      if (u) {
        Object.assign(u, { name, email, role, status });
        _save(ADMIN_KEYS.users, users);
        adminToast('User updated.');
      } else {
        users.push({ id: 'u' + Date.now(), name, email, role, status, joined: new Date().toISOString().slice(0, 10) });
        _save(ADMIN_KEYS.users, users);
        adminToast('User added.');
      }
      renderUsersTable();
      return true;
    });
}

function deleteUser(userId) {
  if (!confirm('Permanently delete this user? This cannot be undone.')) return;
  const users = _load(ADMIN_KEYS.users).filter(u => u.id !== userId);
  _save(ADMIN_KEYS.users, users);
  adminToast('User deleted.');
  renderUsersTable();
}

/* ─────────────────────────────────────────────
   ORDERS TABLE
───────────────────────────────────────────── */
function renderOrdersTable() {
  const container = document.getElementById('orders-table-container');
  if (!container) return;

  if (!AdminAuth.can('orders')) {
    container.innerHTML = '<p class="access-denied">⚠ You do not have permission to view orders.</p>';
    return;
  }

  const orders = _load(ADMIN_KEYS.orders);

  if (orders.length === 0) {
    container.innerHTML = '<p class="table-empty">No orders found.</p>';
    return;
  }

  container.innerHTML = `
<div class="table-toolbar">
  <input type="text" id="order-search" class="table-search" placeholder="Search orders…" oninput="filterOrdersTable(this.value)">
  <select id="order-status-filter" class="table-filter" onchange="filterOrdersTable(document.getElementById('order-search').value)">
    <option value="">All Statuses</option>
    <option value="pending">Pending</option>
    <option value="processing">Processing</option>
    <option value="completed">Completed</option>
    <option value="cancelled">Cancelled</option>
  </select>
  <button class="btn btn--secondary btn--sm" onclick="exportCSV('orders')">Export CSV</button>
</div>
<div class="table-responsive">
<table class="admin-table" id="orders-table">
  <thead>
    <tr>
      <th>Order ID</th>
      <th>Customer</th>
      <th>Date</th>
      <th>Items</th>
      <th>Total</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    ${orders.map(o => `
    <tr data-order-id="${_escHtml(o.id)}" class="order-row">
      <td><code>${_escHtml(o.id)}</code></td>
      <td>${_escHtml((o.customer?.firstName || '') + ' ' + (o.customer?.lastName || ''))}</td>
      <td>${_fmtDate(o.date)}</td>
      <td>${(o.items || []).length} item(s)</td>
      <td>${_fmtCurrency(o.total || 0)}</td>
      <td>${_statusBadge(o.status)}</td>
      <td class="actions-cell">
        <button class="btn btn--sm btn--secondary" onclick="viewOrder('${_escHtml(o.id)}')">View</button>
        <button class="btn btn--sm btn--primary"   onclick="updateOrderStatus('${_escHtml(o.id)}')">Update Status</button>
      </td>
    </tr>`).join('')}
  </tbody>
</table>
</div>`;
}

function filterOrdersTable(term) {
  const t      = (term || '').toLowerCase();
  const status = (document.getElementById('order-status-filter')?.value || '').toLowerCase();
  document.querySelectorAll('#orders-table .order-row').forEach(row => {
    const text     = row.textContent.toLowerCase();
    const matchTxt = !t || text.includes(t);
    const matchSts = !status || text.includes(status);
    row.hidden = !(matchTxt && matchSts);
  });
}

function viewOrder(orderId) {
  const orders = _load(ADMIN_KEYS.orders);
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  const itemsHtml = (o.items || []).map(i =>
    `<li>${_escHtml(i.name)} × ${i.qty} — ${_fmtCurrency(i.price * i.qty)}</li>`
  ).join('');

  _openInfoModal('Order Details', `
    <dl class="detail-list">
      <dt>Order ID</dt>   <dd><code>${_escHtml(o.id)}</code></dd>
      <dt>Date</dt>       <dd>${_fmtDate(o.date)}</dd>
      <dt>Customer</dt>   <dd>${_escHtml((o.customer?.firstName || '') + ' ' + (o.customer?.lastName || ''))}</dd>
      <dt>Email</dt>      <dd>${_escHtml(o.customer?.email || '—')}</dd>
      <dt>Status</dt>     <dd>${_statusBadge(o.status)}</dd>
      <dt>Items</dt>      <dd><ul class="order-items-list">${itemsHtml}</ul></dd>
      <dt>Subtotal</dt>   <dd>${_fmtCurrency(o.subtotal || o.total)}</dd>
      ${o.discount ? `<dt>Discount</dt><dd>−${_fmtCurrency(o.discount)}</dd>` : ''}
      <dt>Total</dt>      <dd><strong>${_fmtCurrency(o.total)}</strong></dd>
      ${o.notes ? `<dt>Notes</dt><dd>${_escHtml(o.notes)}</dd>` : ''}
    </dl>`);
}

function updateOrderStatus(orderId) {
  const orders = _load(ADMIN_KEYS.orders);
  const o = orders.find(x => x.id === orderId);
  if (!o) return;

  _openFormModal('Update Order Status', `
    <div class="form-group">
      <label for="os-status">Status for order <code>${_escHtml(o.id)}</code></label>
      <select id="os-status" class="form-control">
        <option value="pending"    ${o.status === 'pending'    ? 'selected' : ''}>Pending</option>
        <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Processing</option>
        <option value="completed"  ${o.status === 'completed'  ? 'selected' : ''}>Completed</option>
        <option value="cancelled"  ${o.status === 'cancelled'  ? 'selected' : ''}>Cancelled</option>
      </select>
    </div>`,
    () => {
      o.status = document.getElementById('os-status').value;
      _save(ADMIN_KEYS.orders, orders);
      adminToast('Order status updated.');
      renderOrdersTable();
      return true;
    });
}


/* ─────────────────────────────────────────────
   APPOINTMENTS TABLE
───────────────────────────────────────────── */
function renderAppointmentsTable() {
  const container = document.getElementById('appointments-table-container');
  if (!container) return;

  if (!AdminAuth.can('appointments')) {
    container.innerHTML = '<p class="access-denied">⚠ You do not have permission to view appointments.</p>';
    return;
  }

  const appointments = _load(ADMIN_KEYS.appointments);

  if (appointments.length === 0) {
    container.innerHTML = '<p class="table-empty">No appointments found.</p>';
    return;
  }

  appointments.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  container.innerHTML = `
<div class="table-toolbar">
  <input type="text" id="appt-search" class="table-search" placeholder="Search appointments…" oninput="filterAppointmentsTable(this.value)">
  <select id="appt-status-filter" class="table-filter" onchange="filterAppointmentsTable(document.getElementById('appt-search').value)">
    <option value="">All Statuses</option>
    <option value="pending">Pending</option>
    <option value="confirmed">Confirmed</option>
    <option value="cancelled">Cancelled</option>
  </select>
  <button class="btn btn--secondary btn--sm" onclick="exportCSV('appointments')">Export CSV</button>
</div>
<div class="table-responsive">
<table class="admin-table" id="appointments-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Patient</th>
      <th>Service</th>
      <th>Date</th>
      <th>Time</th>
      <th>Practitioner</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    ${appointments.map(a => `
    <tr data-appt-id="${_escHtml(a.id)}" class="appt-row">
      <td><code>${_escHtml(a.id)}</code></td>
      <td>${_escHtml(a.patientName)}</td>
      <td>${_escHtml(a.service)}</td>
      <td>${_escHtml(a.date)}</td>
      <td>${_escHtml(a.time)}</td>
      <td>${_escHtml(a.practitioner || 'Dr. Ping')}</td>
      <td>${_statusBadge(a.status)}</td>
      <td class="actions-cell">
        <button class="btn btn--sm btn--secondary" onclick="viewAppointment('${_escHtml(a.id)}')">View</button>
        ${a.status === 'pending'    ? `<button class="btn btn--sm btn--success" onclick="approveAppointment('${_escHtml(a.id)}')">Approve</button>` : ''}
        ${a.status !== 'cancelled' ? `<button class="btn btn--sm btn--danger"  onclick="cancelAppointment('${_escHtml(a.id)}')">Cancel</button>`  : ''}
      </td>
    </tr>`).join('')}
  </tbody>
</table>
</div>`;
}

function filterAppointmentsTable(term) {
  const t      = (term || '').toLowerCase();
  const status = (document.getElementById('appt-status-filter')?.value || '').toLowerCase();
  document.querySelectorAll('#appointments-table .appt-row').forEach(row => {
    const text     = row.textContent.toLowerCase();
    const matchTxt = !t || text.includes(t);
    const matchSts = !status || text.includes(status);
    row.hidden = !(matchTxt && matchSts);
  });
}

function viewAppointment(apptId) {
  const apts = _load(ADMIN_KEYS.appointments);
  const a = apts.find(x => x.id === apptId);
  if (!a) return;
  _openInfoModal('Appointment Details', `
    <dl class="detail-list">
      <dt>ID</dt>           <dd><code>${_escHtml(a.id)}</code></dd>
      <dt>Patient</dt>      <dd>${_escHtml(a.patientName)}</dd>
      <dt>Email</dt>        <dd>${_escHtml(a.patientEmail || '—')}</dd>
      <dt>Service</dt>      <dd>${_escHtml(a.service)}</dd>
      <dt>Date</dt>         <dd>${_escHtml(a.date)}</dd>
      <dt>Time</dt>         <dd>${_escHtml(a.time)}</dd>
      <dt>Practitioner</dt> <dd>${_escHtml(a.practitioner || 'Dr. Ping')}</dd>
      <dt>Status</dt>       <dd>${_statusBadge(a.status)}</dd>
      ${a.notes ? `<dt>Notes</dt><dd>${_escHtml(a.notes)}</dd>` : ''}
    </dl>`);
}

function approveAppointment(apptId) {
  const apts = _load(ADMIN_KEYS.appointments);
  const a = apts.find(x => x.id === apptId);
  if (!a) return;
  a.status = 'confirmed';
  _save(ADMIN_KEYS.appointments, apts);
  adminToast('Appointment confirmed.');
  renderAppointmentsTable();
  renderDashboardStats();
}

function cancelAppointment(apptId) {
  if (!confirm('Cancel this appointment?')) return;
  const apts = _load(ADMIN_KEYS.appointments);
  const a = apts.find(x => x.id === apptId);
  if (!a) return;
  a.status = 'cancelled';
  _save(ADMIN_KEYS.appointments, apts);
  adminToast('Appointment cancelled.');
  renderAppointmentsTable();
  renderDashboardStats();
}

/* ─────────────────────────────────────────────
   PRODUCT MANAGEMENT  (admin only)
───────────────────────────────────────────── */
function _loadAdminProducts() {
  // Seed from shop.js PRODUCTS if empty; works when both scripts are loaded
  const stored = _load(ADMIN_KEYS.products);
  if (stored.length === 0 && typeof PRODUCTS !== 'undefined') {
    _save(ADMIN_KEYS.products, PRODUCTS);
    return [...PRODUCTS];
  }
  return stored;
}

function renderProductManagement() {
  const container = document.getElementById('products-mgmt-container');
  if (!container) return;

  if (!AdminAuth.can('products')) {
    container.innerHTML = '<p class="access-denied">⚠ You do not have permission to manage products.</p>';
    return;
  }

  const products = _loadAdminProducts();

  container.innerHTML = `
<div class="table-toolbar">
  <input type="text" id="prod-search" class="table-search" placeholder="Search products…" oninput="filterProductsTable(this.value)">
  <button class="btn btn--primary btn--sm" onclick="openProductEditModal()">+ Add Product</button>
  <button class="btn btn--secondary btn--sm" onclick="exportCSV('products')">Export CSV</button>
</div>
<div class="table-responsive">
<table class="admin-table" id="products-mgmt-table">
  <thead>
    <tr>
      <th>ID</th>
      <th>Name</th>
      <th>Category</th>
      <th>Price</th>
      <th>Stock</th>
      <th>Rating</th>
      <th>Featured</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    ${products.map(p => `
    <tr data-prod-id="${_escHtml(p.id)}" class="prod-row">
      <td><code>${_escHtml(p.id)}</code></td>
      <td>${_escHtml(p.name)}</td>
      <td>${_statusBadge(p.category)}</td>
      <td>${_fmtCurrency(p.price)}</td>
      <td>${_escHtml(String(p.stock))}</td>
      <td>${Number(p.rating).toFixed(1)} ⭐</td>
      <td>${p.featured ? '✓' : '—'}</td>
      <td class="actions-cell">
        <button class="btn btn--sm btn--primary" onclick="openProductEditModal('${_escHtml(p.id)}')">Edit</button>
        <button class="btn btn--sm btn--danger"  onclick="deleteProduct('${_escHtml(p.id)}')">Delete</button>
      </td>
    </tr>`).join('')}
  </tbody>
</table>
</div>`;
}

function filterProductsTable(term) {
  const t = (term || '').toLowerCase();
  document.querySelectorAll('#products-mgmt-table .prod-row').forEach(row => {
    row.hidden = t.length > 0 && !row.textContent.toLowerCase().includes(t);
  });
}

function openProductEditModal(productId = null) {
  const products = _loadAdminProducts();
  const p = productId ? products.find(x => x.id === productId) : null;
  const title = p ? 'Edit Product' : 'Add Product';

  _openFormModal(title, `
    <div class="form-row">
      <div class="form-group">
        <label for="pm-name">Name <span class="required">*</span></label>
        <input id="pm-name" type="text" class="form-control" value="${_escHtml(p?.name || '')}" required>
      </div>
      <div class="form-group">
        <label for="pm-category">Category</label>
        <select id="pm-category" class="form-control">
          <option value="service" ${p?.category === 'service'  ? 'selected' : ''}>Service</option>
          <option value="product" ${p?.category === 'product'  ? 'selected' : ''}>Product</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label for="pm-desc">Description</label>
      <textarea id="pm-desc" class="form-control" rows="3">${_escHtml(p?.description || '')}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="pm-price">Price ($) <span class="required">*</span></label>
        <input id="pm-price" type="number" class="form-control" value="${p?.price ?? ''}" min="0" step="0.01" required>
      </div>
      <div class="form-group">
        <label for="pm-stock">Stock</label>
        <input id="pm-stock" type="number" class="form-control" value="${p?.stock ?? 0}" min="0">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label for="pm-rating">Rating (0–5)</label>
        <input id="pm-rating" type="number" class="form-control" value="${p?.rating ?? 4.5}" min="0" max="5" step="0.1">
      </div>
      <div class="form-group">
        <label for="pm-reviews">Reviews Count</label>
        <input id="pm-reviews" type="number" class="form-control" value="${p?.reviewsCount ?? 0}" min="0">
      </div>
    </div>
    <div class="form-group">
      <label for="pm-image">Image Path</label>
      <input id="pm-image" type="text" class="form-control" value="${_escHtml(p?.image || '')}">
    </div>
    <div class="form-group form-check">
      <input id="pm-featured" type="checkbox" ${p?.featured ? 'checked' : ''}>
      <label for="pm-featured">Featured product</label>
    </div>`,
    () => {
      const name     = document.getElementById('pm-name').value.trim();
      const price    = parseFloat(document.getElementById('pm-price').value);

      if (!name)          { adminToast('Product name is required.', 'error'); return false; }
      if (isNaN(price) || price < 0) { adminToast('Valid price is required.', 'error'); return false; }

      const data = {
        name,
        price,
        category:     document.getElementById('pm-category').value,
        description:  document.getElementById('pm-desc').value.trim(),
        stock:        parseInt(document.getElementById('pm-stock').value) || 0,
        rating:       parseFloat(document.getElementById('pm-rating').value) || 4.5,
        reviewsCount: parseInt(document.getElementById('pm-reviews').value) || 0,
        image:        document.getElementById('pm-image').value.trim(),
        featured:     document.getElementById('pm-featured').checked,
      };

      if (p) {
        Object.assign(p, data);
        adminToast('Product updated.');
      } else {
        products.push({ id: 'prd-' + Date.now(), ...data });
        adminToast('Product added.');
      }

      _save(ADMIN_KEYS.products, products);
      renderProductManagement();
      return true;
    });
}

function deleteProduct(productId) {
  if (!confirm('Permanently delete this product?')) return;
  const products = _loadAdminProducts().filter(p => p.id !== productId);
  _save(ADMIN_KEYS.products, products);
  adminToast('Product deleted.');
  renderProductManagement();
}


/* ─────────────────────────────────────────────
   ANALYTICS — Chart.js charts
   Expects Chart.js loaded via CDN before this script
───────────────────────────────────────────── */

// Track chart instances so we can destroy before re-render
const _chartInstances = {};

function renderAnalytics() {
  if (!AdminAuth.can('analytics')) return;
  renderMonthlyRevenueChart();
  renderServicesPopularityChart();
}

/** Line chart: monthly revenue for the past 12 months */
function renderMonthlyRevenueChart() {
  const canvas = document.getElementById('chart-revenue');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = '<p class="chart-error">Chart.js not loaded.</p>';
    return;
  }

  const orders = _load(ADMIN_KEYS.orders);
  const now    = new Date();

  // Build last 12 months labels + revenue buckets
  const labels  = [];
  const revenue = new Array(12).fill(0);

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    labels.push(d.toLocaleString('en-US', { month: 'short', year: '2-digit' }));
  }

  orders.forEach(o => {
    const d = new Date(o.date);
    if (isNaN(d)) return;
    const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diffMonths >= 0 && diffMonths < 12) {
      revenue[11 - diffMonths] += Number(o.total) || 0;
    }
  });

  if (_chartInstances.revenue) _chartInstances.revenue.destroy();

  _chartInstances.revenue = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label:           'Revenue (USD)',
        data:             revenue,
        borderColor:     '#8B5E3C',
        backgroundColor: 'rgba(139, 94, 60, 0.12)',
        borderWidth:      2,
        pointBackgroundColor: '#8B5E3C',
        pointRadius:      4,
        fill:             true,
        tension:          0.3,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      plugins: {
        legend:  { position: 'top' },
        tooltip: {
          callbacks: {
            label: ctx => ' $' + ctx.raw.toLocaleString('en-US', { minimumFractionDigits: 2 }),
          },
        },
        title: {
          display: true,
          text:    'Monthly Revenue — Last 12 Months',
          font:    { size: 16 },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => '$' + v.toLocaleString(),
          },
        },
      },
    },
  });
}

/** Pie chart: order count by service/product name */
function renderServicesPopularityChart() {
  const canvas = document.getElementById('chart-services');
  if (!canvas) return;

  if (typeof Chart === 'undefined') {
    canvas.parentElement.innerHTML = '<p class="chart-error">Chart.js not loaded.</p>';
    return;
  }

  const orders = _load(ADMIN_KEYS.orders);
  const tally  = {};

  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const key = item.name || 'Unknown';
      tally[key] = (tally[key] || 0) + (item.qty || 1);
    });
  });

  // Sort by count, take top 10
  const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const labels = sorted.map(([k]) => k);
  const data   = sorted.map(([, v]) => v);

  const palette = [
    '#8B5E3C','#C4956A','#D4B896','#4A7C59','#7DB87A',
    '#3A6186','#89ABD4','#7B4F8C','#C47ABD','#E07B54',
  ];

  if (_chartInstances.services) _chartInstances.services.destroy();

  _chartInstances.services = new Chart(canvas, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: palette.slice(0, labels.length),
        borderColor:     '#fff',
        borderWidth:      2,
      }],
    },
    options: {
      responsive:          true,
      maintainAspectRatio: true,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 14 } },
        title:  { display: true, text: 'Services & Products Popularity', font: { size: 16 } },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.raw} orders`,
          },
        },
      },
    },
  });
}

/* ─────────────────────────────────────────────
   CSV EXPORT
───────────────────────────────────────────── */
function exportCSV(dataType) {
  let rows = [];
  let filename = '';

  switch (dataType) {
    case 'orders': {
      if (!AdminAuth.can('orders')) { adminToast('No permission.', 'error'); return; }
      const orders = _load(ADMIN_KEYS.orders);
      filename = 'ping-tcm-orders.csv';
      rows = [
        ['Order ID', 'Date', 'Customer', 'Email', 'Items', 'Subtotal', 'Discount', 'Total', 'Status'],
        ...orders.map(o => [
          o.id,
          o.date,
          `${o.customer?.firstName || ''} ${o.customer?.lastName || ''}`.trim(),
          o.customer?.email || '',
          (o.items || []).map(i => `${i.name} x${i.qty}`).join('; '),
          o.subtotal ?? o.total,
          o.discount || 0,
          o.total,
          o.status,
        ]),
      ];
      break;
    }
    case 'appointments': {
      if (!AdminAuth.can('appointments')) { adminToast('No permission.', 'error'); return; }
      const apts = _load(ADMIN_KEYS.appointments);
      filename = 'ping-tcm-appointments.csv';
      rows = [
        ['ID', 'Patient', 'Email', 'Service', 'Date', 'Time', 'Practitioner', 'Status', 'Notes'],
        ...apts.map(a => [a.id, a.patientName, a.patientEmail, a.service, a.date, a.time, a.practitioner, a.status, a.notes]),
      ];
      break;
    }
    case 'users': {
      if (!AdminAuth.can('users')) { adminToast('No permission.', 'error'); return; }
      const users = _load(ADMIN_KEYS.users);
      filename = 'ping-tcm-users.csv';
      rows = [
        ['ID', 'Name', 'Email', 'Role', 'Joined', 'Status'],
        ...users.map(u => [u.id, u.name, u.email, u.role, u.joined, u.status]),
      ];
      break;
    }
    case 'products': {
      if (!AdminAuth.can('products')) { adminToast('No permission.', 'error'); return; }
      const products = _loadAdminProducts();
      filename = 'ping-tcm-products.csv';
      rows = [
        ['ID', 'Name', 'Category', 'Price', 'Stock', 'Rating', 'Reviews', 'Featured'],
        ...products.map(p => [p.id, p.name, p.category, p.price, p.stock, p.rating, p.reviewsCount, p.featured]),
      ];
      break;
    }
    default:
      adminToast('Unknown data type for export.', 'error');
      return;
  }

  const csv = rows.map(row =>
    row.map(cell => {
      const str = String(cell ?? '').replace(/"/g, '""');
      return /[,"\n\r]/.test(str) ? `"${str}"` : str;
    }).join(',')
  ).join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  adminToast(`${dataType} exported as CSV.`);
}

/* ─────────────────────────────────────────────
   REUSABLE MODAL HELPERS
───────────────────────────────────────────── */
function _getOrCreateAdminModal() {
  let modal = document.getElementById('admin-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'admin-modal';
    modal.className = 'modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'admin-modal-title');
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) _closeAdminModal(); });
  }
  return modal;
}

function _closeAdminModal() {
  const modal = document.getElementById('admin-modal');
  if (modal) { modal.setAttribute('hidden', ''); document.body.classList.remove('modal-open'); }
}

/** Readonly info modal */
function _openInfoModal(title, bodyHtml) {
  const modal = _getOrCreateAdminModal();
  modal.innerHTML = `
<div class="modal-box">
  <button class="modal-close" onclick="_closeAdminModal()" aria-label="Close">&times;</button>
  <h2 id="admin-modal-title">${_escHtml(title)}</h2>
  <div class="modal-body">${bodyHtml}</div>
  <div class="modal-footer">
    <button class="btn btn--secondary" onclick="_closeAdminModal()">Close</button>
  </div>
</div>`;
  modal.removeAttribute('hidden');
  document.body.classList.add('modal-open');
  modal.querySelector('.modal-close').focus();
}

/** Form modal — onSave should return true to close, false to keep open */
function _openFormModal(title, formBodyHtml, onSave) {
  const modal = _getOrCreateAdminModal();
  modal.innerHTML = `
<div class="modal-box">
  <button class="modal-close" onclick="_closeAdminModal()" aria-label="Close">&times;</button>
  <h2 id="admin-modal-title">${_escHtml(title)}</h2>
  <form id="admin-modal-form" novalidate>
    <div class="modal-body">${formBodyHtml}</div>
    <div class="modal-footer">
      <button type="button" class="btn btn--secondary" onclick="_closeAdminModal()">Cancel</button>
      <button type="submit" class="btn btn--primary">Save</button>
    </div>
  </form>
</div>`;

  modal.removeAttribute('hidden');
  document.body.classList.add('modal-open');

  document.getElementById('admin-modal-form').addEventListener('submit', e => {
    e.preventDefault();
    const result = onSave();
    if (result !== false) _closeAdminModal();
  });

  modal.querySelector('.modal-close').focus();
}

/* ─────────────────────────────────────────────
   TOAST NOTIFICATIONS (admin)
───────────────────────────────────────────── */
function adminToast(message, type = 'success') {
  let container = document.getElementById('admin-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'admin-toast-container';
    container.setAttribute('aria-live', 'polite');
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  void toast.offsetWidth;
  toast.classList.add('toast--show');
  setTimeout(() => {
    toast.classList.remove('toast--show');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3500);
}

/* ─────────────────────────────────────────────
   TAB NAVIGATION
───────────────────────────────────────────── */
function switchTab(tabId) {
  // Deactivate all panels and tabs
  document.querySelectorAll('.admin-panel').forEach(panel => {
    panel.hidden = panel.id !== tabId;
  });
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
    btn.setAttribute('aria-selected', btn.dataset.tab === tabId ? 'true' : 'false');
  });

  // Lazy-render on first visit
  switch (tabId) {
    case 'panel-dashboard':    renderDashboardStats(); break;
    case 'panel-users':        renderUsersTable();     break;
    case 'panel-orders':       renderOrdersTable();    break;
    case 'panel-appointments': renderAppointmentsTable(); break;
    case 'panel-products':     renderProductManagement(); break;
    case 'panel-analytics':    renderAnalytics();      break;
  }
}

/* ─────────────────────────────────────────────
   PAGE INITIALIZATION
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  // Seed demo data if first run
  _seedDemoData();

  // Set up a demo session if none exists (remove in production)
  if (!AdminAuth.getSession()) {
    AdminAuth.setSession({ id: 'u1', name: 'Alice Chen', email: 'alice@example.com', role: 'admin' });
  }

  // Apply role-based visibility to nav items
  AdminAuth.guard('nav-users',    'users');
  AdminAuth.guard('nav-products', 'products');

  // Show admin identity in header
  const session = AdminAuth.getSession();
  const adminNameEl = document.getElementById('admin-user-name');
  if (adminNameEl && session) adminNameEl.textContent = session.name + ' (' + session.role + ')';

  // Wire tab buttons
  document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Wire logout button
  const logoutBtn = document.getElementById('admin-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Sign out of the admin panel?')) {
        AdminAuth.clearSession();
        window.location.href = 'index.html';
      }
    });
  }

  // Keyboard: Escape closes any open modal
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') _closeAdminModal();
  });

  // Default: show dashboard
  switchTab('panel-dashboard');
});

/* ─────────────────────────────────────────────
   PUBLIC API
───────────────────────────────────────────── */
window.AdminAuth                = AdminAuth;
window.renderDashboardStats     = renderDashboardStats;
window.renderUsersTable         = renderUsersTable;
window.renderOrdersTable        = renderOrdersTable;
window.renderAppointmentsTable  = renderAppointmentsTable;
window.renderProductManagement  = renderProductManagement;
window.renderAnalytics          = renderAnalytics;
window.filterUsersTable         = filterUsersTable;
window.filterOrdersTable        = filterOrdersTable;
window.filterAppointmentsTable  = filterAppointmentsTable;
window.filterProductsTable      = filterProductsTable;
window.viewUser                 = viewUser;
window.openUserModal            = openUserModal;
window.deleteUser               = deleteUser;
window.viewOrder                = viewOrder;
window.updateOrderStatus        = updateOrderStatus;
window.viewAppointment          = viewAppointment;
window.approveAppointment       = approveAppointment;
window.cancelAppointment        = cancelAppointment;
window.openProductEditModal     = openProductEditModal;
window.deleteProduct            = deleteProduct;
window.exportCSV                = exportCSV;
window.switchTab                = switchTab;
window.adminToast               = adminToast;
window._closeAdminModal         = _closeAdminModal;
