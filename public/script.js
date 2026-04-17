/**
 * Wee'z Kitchen — Customer Frontend Script (FIXED & STABLE)
 */

// ─── App State ─────────────────────────────────────────────
let allMenuItems = [];
let cart = [];
let screenshotBase64 = null;

const DELIVERY_FEE = 100;
const WHATSAPP_NUMBER = '923000609339';

// ─── Init ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  initNavbarScroll();
  onOrderTypeChange();
});

// ─── Navbar ───────────────────────────────────────────────
function initNavbarScroll() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ═════════ MENU ═════════

async function loadMenu() {
  try {
    const res = await fetch('/menu');
    const json = await res.json();
    allMenuItems = json.data || [];
    buildCategoryFilters(allMenuItems);
    renderMenu(allMenuItems);
  } catch (err) {
    document.getElementById('menuGrid').innerHTML =
      `<div class="loading-state">Failed to load menu</div>`;
  }
}

function buildCategoryFilters(items) {
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  const categories = [...new Set(items.map(i => i.category))];

  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.textContent = cat;
    btn.onclick = () => filterCategory(cat, btn);
    container.appendChild(btn);
  });
}

function renderMenu(items) {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  grid.innerHTML = items.map(item => {
    const inCart = cart.find(c => c.id === item.id);

    return `
    <div class="menu-card">
      <img src="${item.image}" />
      <h3>${item.name}</h3>
      <p>${item.description || ''}</p>
      <div>
        Rs. ${item.price}
        <button onclick="addToCart(${item.id})">
          ${inCart ? '✓ Added' : '+ Add'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function filterCategory(cat, btn) {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const filtered = cat === 'All'
    ? allMenuItems
    : allMenuItems.filter(i => i.category === cat);

  renderMenu(filtered);
}

// ═════════ CART ═════════

function addToCart(itemId) {
  const item = allMenuItems.find(i => i.id === itemId);
  if (!item) return;

  const existing = cart.find(c => c.id === itemId);
  if (existing) existing.quantity++;
  else cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });

  updateCartUI();
}

function changeQty(itemId, delta) {
  const idx = cart.findIndex(c => c.id === itemId);
  if (idx === -1) return;

  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) cart.splice(idx, 1);

  updateCartUI();
}

function updateCartUI() {
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooter  = document.getElementById('cartFooter');

  if (!cartItemsEl) return;

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal   = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = totalItems;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `<p>Your cart is empty</p>`;
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  if (cartFooter) cartFooter.style.display = 'block';

  cartItemsEl.innerHTML = cart.map(item => `
    <div>
      ${item.name} - Rs.${item.price * item.quantity}
      <button onclick="changeQty(${item.id}, -1)">-</button>
      ${item.quantity}
      <button onclick="changeQty(${item.id}, 1)">+</button>
    </div>
  `).join('');

  const sub = document.getElementById('cartSubtotal');
  const tot = document.getElementById('cartTotal');

  if (sub) sub.textContent = `Rs. ${subtotal}`;
  if (tot) tot.textContent = `Rs. ${subtotal}`;

  updateFinalTotal();
}

// ═════════ CHECKOUT ═════════

function toggleCart() {
  document.getElementById('cartSidebar')?.classList.toggle('open');
  document.getElementById('cartOverlay')?.classList.toggle('open');
}

function openCheckout() {
  if (cart.length === 0) return alert('Cart empty');
  toggleCart();
  renderOrderSummary();
  document.getElementById('checkoutOverlay')?.classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutOverlay')?.classList.remove('open');
}

function renderOrderSummary() {
  const el = document.getElementById('orderSummaryMini');
  if (!el) return;

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  el.innerHTML = cart.map(i => `
    <div>${i.name} x ${i.quantity}</div>
  `).join('') + `<hr>Total: Rs.${subtotal}`;
}

function updateFinalTotal() {
  const el = document.getElementById('finalTotal');
  if (!el) return;

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  el.textContent = `Rs. ${subtotal}`;
}

// ═════════ TOAST ═════════

function showToast(msg) {
  alert(msg);
}
