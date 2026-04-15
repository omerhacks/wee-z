/**
 * Wee'z Kitchen — Admin Panel Script
 * Handles: login, orders view/update, menu CRUD
 */

// ─── Auth State ─────────────────────────────────────────────────────────────
let adminToken = sessionStorage.getItem('adminToken') || null;

// ─── Init ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (adminToken) {
    showAdminApp();
  }
  // Auto-focus username
  document.getElementById('loginUser')?.focus();
});

// ══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════════════════════════════════

async function doLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPass').value.trim();
  const errEl = document.getElementById('loginError');

  if (!username || !password) {
    errEl.textContent = '❌ Please enter username and password';
    errEl.style.display = 'block';
    return;
  }

  try {
    const res = await fetch('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();

    if (json.success) {
      adminToken = json.token;
      sessionStorage.setItem('adminToken', adminToken);
      errEl.style.display = 'none';
      showAdminApp();
    } else {
      errEl.textContent = '❌ ' + json.message;
      errEl.style.display = 'block';
    }
  } catch (err) {
    errEl.textContent = '❌ Server error. Is the server running?';
    errEl.style.display = 'block';
  }
}

function doLogout() {
  adminToken = null;
  sessionStorage.removeItem('adminToken');
  document.getElementById('adminApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').value = '';
}

function showAdminApp() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminApp').style.display = 'flex';
  loadOrders(); // Load orders by default
}

// ─── Auth header helper ──────────────────────────────────────────────────────
function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-auth': adminToken
  };
}

// ─── Handle 401 ──────────────────────────────────────────────────────────────
function handleUnauth() {
  alert('Session expired. Please login again.');
  doLogout();
}

// ══════════════════════════════════════════════════════════════════════════════
//  TAB NAVIGATION
// ══════════════════════════════════════════════════════════════════════════════

function showTab(tabName, btnEl) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  // Show selected tab
  document.getElementById(`tab-${tabName}`).classList.add('active');
  btnEl.classList.add('active');

  // Load data for that tab
  if (tabName === 'orders')  loadOrders();
  if (tabName === 'menu')    loadMenuAdmin();
}

// ══════════════════════════════════════════════════════════════════════════════
//  ORDERS
// ══════════════════════════════════════════════════════════════════════════════

async function loadOrders() {
  const container = document.getElementById('ordersContainer');
  container.innerHTML = '<div class="loading-msg">⏳ Loading orders...</div>';

  try {
    const res = await fetch('/admin/orders', { headers: authHeaders() });
    if (res.status === 401) { handleUnauth(); return; }
    const json = await res.json();
    renderOrders(json.data);
  } catch (err) {
    container.innerHTML = '<div class="loading-msg">⚠️ Failed to load orders.</div>';
  }
}

function renderOrders(orders) {
  const container = document.getElementById('ordersContainer');

  if (!orders || orders.length === 0) {
    container.innerHTML = '<div class="no-data-msg">📭 No orders yet. Orders will appear here once customers start ordering.</div>';
    return;
  }

  const payLabels = { cash: 'Cash', jazzcash: 'JazzCash', easypaisa: 'Easypaisa' };
  const statuses  = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

  container.innerHTML = `
    <div class="orders-table-wrap">
      <table class="orders-table">
        <thead>
          <tr>
            <th>Order #</th>
            <th>Date & Time</th>
            <th>Customer</th>
            <th>Type</th>
            <th>Items</th>
            <th>Total</th>
            <th>Payment</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${orders.map(o => {
            const date = new Date(o.createdAt);
            const dateStr = date.toLocaleDateString('en-PK', { day:'2-digit', month:'short', year:'numeric' });
            const timeStr = date.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit', hour12: true });
            return `
            <tr>
              <td><span class="order-num">${o.orderNumber}</span></td>
              <td><div>${dateStr}</div><div style="color:var(--text-muted);font-size:.78rem">${timeStr}</div></td>
              <td>
                <div style="font-weight:600">${o.customerName}</div>
                <div style="font-size:.78rem;color:var(--text-muted)">${o.phone}</div>
                ${o.address !== 'N/A (Pickup)' ? `<div style="font-size:.76rem;color:var(--text-muted);max-width:150px">${o.address}</div>` : ''}
              </td>
              <td>
                <span style="font-size:1.2rem">${o.orderType === 'delivery' ? '🛵' : '🏪'}</span>
                <div style="font-size:.78rem;text-transform:capitalize">${o.orderType}</div>
              </td>
              <td>
                <div class="order-items-list">
                  ${o.items.map(i => `${i.name} ×${i.quantity}`).join('<br>')}
                </div>
              </td>
              <td><span class="order-total">Rs. ${o.total.toLocaleString()}</span></td>
              <td>
                <span class="pay-badge ${o.paymentMethod}">${payLabels[o.paymentMethod] || o.paymentMethod}</span>
                ${o.transactionId ? `<div style="font-size:.72rem;color:var(--text-muted);margin-top:3px">TXN: ${o.transactionId}</div>` : ''}
                ${o.hasScreenshot ? `<div style="font-size:.72rem;color:var(--success)">📷 Screenshot</div>` : ''}
              </td>
              <td>
                <span class="status-badge status-${o.status}">${o.status}</span>
                <br/>
                <select class="status-select" style="margin-top:6px" onchange="updateOrderStatus(${o.id}, this.value)">
                  ${statuses.map(s => `<option value="${s}" ${s === o.status ? 'selected' : ''}>${capitalize(s)}</option>`).join('')}
                </select>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    </div>`;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ status: newStatus })
    });
    if (res.status === 401) { handleUnauth(); return; }
    const json = await res.json();
    if (json.success) showAlert(`Status updated to "${newStatus}"`, 'success');
    else showAlert(json.message, 'error');
  } catch (err) {
    showAlert('Failed to update status', 'error');
  }
}

// ══════════════════════════════════════════════════════════════════════════════
//  MENU MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

async function loadMenuAdmin() {
  const container = document.getElementById('menuAdminContainer');
  container.innerHTML = '<div class="loading-msg">⏳ Loading menu...</div>';

  try {
    const res = await fetch('/menu');
    const json = await res.json();
    renderMenuAdmin(json.data);
  } catch (err) {
    container.innerHTML = '<div class="loading-msg">⚠️ Failed to load menu.</div>';
  }
}

function renderMenuAdmin(items) {
  const container = document.getElementById('menuAdminContainer');

  if (!items || items.length === 0) {
    container.innerHTML = '<div class="no-data-msg">No menu items found. Add some!</div>';
    return;
  }

  container.innerHTML = `<div class="menu-admin-grid">
    ${items.map(item => `
      <div class="menu-admin-card">
        <img class="mac-img" src="${item.image}" alt="${item.name}"
             onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop'" />
        <div class="mac-body">
          <div class="mac-name">${item.name}</div>
          <span class="mac-cat">${item.category}</span>
          <div class="mac-price">Rs. ${item.price.toLocaleString()} <span>per serving</span></div>
          <div class="mac-actions">
            <button class="edit-btn" onclick='openEditModal(${JSON.stringify(item)})'>✏️ Edit</button>
            <button class="del-btn" onclick="deleteMenuItem(${item.id}, '${item.name.replace(/'/g,"\\'")}')">🗑️ Delete</button>
          </div>
        </div>
      </div>`).join('')}
  </div>`;
}

// ─── Add Menu Item ───────────────────────────────────────────────────────────
async function addMenuItem() {
  const name     = document.getElementById('aiName').value.trim();
  const price    = document.getElementById('aiPrice').value;
  const category = document.getElementById('aiCategory').value.trim();
  const desc     = document.getElementById('aiDesc').value.trim();
  const image    = document.getElementById('aiImage').value.trim();
  const msgEl    = document.getElementById('addItemMsg');

  if (!name || !price || !category) {
    showResultMsg(msgEl, 'Name, price and category are required', 'error');
    return;
  }

  try {
    const res = await fetch('/admin/menu', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name, price, category, description: desc, image })
    });
    if (res.status === 401) { handleUnauth(); return; }
    const json = await res.json();

    if (json.success) {
      showResultMsg(msgEl, `✅ "${name}" added to menu!`, 'success');
      // Clear form
      ['aiName','aiPrice','aiCategory','aiDesc','aiImage'].forEach(id => document.getElementById(id).value = '');
      document.getElementById('aiPreview').src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop';
    } else {
      showResultMsg(msgEl, json.message, 'error');
    }
  } catch (err) {
    showResultMsg(msgEl, 'Server error. Please try again.', 'error');
  }
}

// ─── Edit Menu Item ──────────────────────────────────────────────────────────
function openEditModal(item) {
  document.getElementById('editId').value       = item.id;
  document.getElementById('editName').value     = item.name;
  document.getElementById('editPrice').value    = item.price;
  document.getElementById('editCategory').value = item.category;
  document.getElementById('editDesc').value     = item.description || '';
  document.getElementById('editImage').value    = item.image || '';
  document.getElementById('editMsg').style.display = 'none';
  document.getElementById('editOverlay').classList.add('open');
}

function closeEditModal() {
  document.getElementById('editOverlay').classList.remove('open');
}

async function saveEdit() {
  const id       = document.getElementById('editId').value;
  const name     = document.getElementById('editName').value.trim();
  const price    = document.getElementById('editPrice').value;
  const category = document.getElementById('editCategory').value.trim();
  const desc     = document.getElementById('editDesc').value.trim();
  const image    = document.getElementById('editImage').value.trim();
  const msgEl    = document.getElementById('editMsg');

  if (!name || !price || !category) {
    showResultMsg(msgEl, 'Name, price and category are required', 'error');
    return;
  }

  try {
    const res = await fetch(`/admin/menu/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name, price, category, description: desc, image })
    });
    if (res.status === 401) { handleUnauth(); return; }
    const json = await res.json();

    if (json.success) {
      showResultMsg(msgEl, `✅ "${name}" updated!`, 'success');
      setTimeout(() => { closeEditModal(); loadMenuAdmin(); }, 1000);
    } else {
      showResultMsg(msgEl, json.message, 'error');
    }
  } catch (err) {
    showResultMsg(msgEl, 'Server error. Please try again.', 'error');
  }
}

// ─── Delete Menu Item ────────────────────────────────────────────────────────
async function deleteMenuItem(id, name) {
  if (!confirm(`Delete "${name}" from the menu?\n\nThis cannot be undone.`)) return;

  try {
    const res = await fetch(`/admin/menu/${id}`, {
      method: 'DELETE',
      headers: authHeaders()
    });
    if (res.status === 401) { handleUnauth(); return; }
    const json = await res.json();

    if (json.success) {
      showAlert(`"${name}" deleted from menu.`, 'success');
      loadMenuAdmin();
    } else {
      showAlert(json.message, 'error');
    }
  } catch (err) {
    showAlert('Failed to delete item.', 'error');
  }
}

// ─── Image Preview ────────────────────────────────────────────────────────────
function previewImage() {
  const url = document.getElementById('aiImage').value.trim();
  if (url) document.getElementById('aiPreview').src = url;
}

// ══════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function showResultMsg(el, msg, type) {
  el.textContent = msg;
  el.className = `result-msg ${type}`;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

function showAlert(msg, type = 'default') {
  // Simple in-page alert using a toast div
  const div = document.createElement('div');
  div.style.cssText = `
    position:fixed; bottom:24px; right:24px;
    background:${type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#1a56db'};
    color:white; padding:12px 20px; border-radius:10px;
    font-size:.9rem; font-weight:600; z-index:9999;
    box-shadow:0 4px 20px rgba(0,0,0,.2);
    animation:slideUp .3s ease;
  `;
  div.textContent = msg;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
app.use(express.json());

app.post('/add-item', (req, res) => {
  const menu = readJSON(MENU_FILE);

  const newItem = {
    id: menu.length + 1,
    ...req.body
  };

  menu.push(newItem);
  writeJSON(MENU_FILE, menu);

  res.json({ success: true });
});
