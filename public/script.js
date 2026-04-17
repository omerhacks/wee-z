/**
 * Wee'z Kitchen — Customer Frontend Script
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
      `<div class="loading-state"><p>Failed to load menu. Please refresh.</p></div>`;
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
    btn.setAttribute('data-cat', cat);
    btn.onclick = () => filterCategory(cat, btn);
    container.appendChild(btn);
  });
}

function renderMenu(items) {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  if (items.length === 0) {
    grid.innerHTML = `<div class="loading-state"><p>No items in this category.</p></div>`;
    return;
  }

  grid.innerHTML = items.map(item => {
    const inCart = cart.find(c => c.id === item.id);
    const imgSrc = item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';

    return `
    <div class="menu-card" id="card-${item.id}">
      <div class="card-img-wrap">
        <img
          src="${imgSrc}"
          alt="${item.name}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80'"
        />
        <span class="card-category-tag">${item.category}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        ${item.description ? `<div class="card-desc">${item.description}</div>` : ''}
        <div class="card-footer">
          <div class="card-price">
            <span>Rs.</span>${item.price.toLocaleString()}
          </div>
          <button
            class="add-btn ${inCart ? 'in-cart' : ''}"
            id="addBtn-${item.id}"
            onclick="addToCart(${item.id})"
          >
            ${inCart ? '✓ Added' : '+ Add'}
          </button>
        </div>
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
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
  }

  // Update the card button state without full re-render
  const btn = document.getElementById(`addBtn-${itemId}`);
  if (btn) {
    btn.classList.add('in-cart');
    btn.textContent = '✓ Added';
  }

  updateCartUI();
  showToast(`${item.name} added to cart`, 'success');
}

function changeQty(itemId, delta) {
  const idx = cart.findIndex(c => c.id === itemId);
  if (idx === -1) return;

  cart[idx].quantity += delta;

  if (cart[idx].quantity <= 0) {
    cart.splice(idx, 1);
    // Reset the card button
    const btn = document.getElementById(`addBtn-${itemId}`);
    if (btn) {
      btn.classList.remove('in-cart');
      btn.textContent = '+ Add';
    }
  }

  updateCartUI();
}

function updateCartUI() {
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooter  = document.getElementById('cartFooter');
  if (!cartItemsEl) return;

  const totalItems = cart.reduce((s, c) => s + c.quantity, 0);
  const subtotal   = cart.reduce((s, c) => s + c.price * c.quantity, 0);

  // Update badge
  const badge = document.getElementById('cartBadge');
  if (badge) badge.textContent = totalItems;

  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty" id="cartEmpty">
        <div style="font-size:2.5rem">🍽️</div>
        <p>Your cart is empty</p>
        <small>Add some delicious items to get started!</small>
      </div>`;
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  if (cartFooter) cartFooter.style.display = 'block';

  // Render cart items with proper structure
  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">Rs. ${(item.price * item.quantity).toLocaleString()}</div>
      </div>
      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>
  `).join('');

  // Update totals
  const isDelivery = document.querySelector('input[name="orderType"]:checked')?.value === 'delivery';
  const total = subtotal + (isDelivery ? DELIVERY_FEE : 0);

  const sub = document.getElementById('cartSubtotal');
  const tot = document.getElementById('cartTotal');
  const deliveryRow = document.getElementById('deliveryFeeRow');

  if (sub) sub.textContent = `Rs. ${subtotal.toLocaleString()}`;
  if (deliveryRow) deliveryRow.style.display = isDelivery ? 'flex' : 'none';
  if (tot) tot.textContent = `Rs. ${total.toLocaleString()}`;

  updateFinalTotal();
}

// ═════════ CHECKOUT ═════════

function toggleCart() {
  document.getElementById('cartSidebar')?.classList.toggle('open');
  document.getElementById('cartOverlay')?.classList.toggle('open');
}

function openCheckout() {
  if (cart.length === 0) { showToast('Your cart is empty', 'error'); return; }
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
    <div class="summary-item">
      <span>${i.name} × ${i.quantity}</span>
      <span>Rs. ${(i.price * i.quantity).toLocaleString()}</span>
    </div>
  `).join('') + `
    <div class="summary-item total">
      <span>Subtotal</span>
      <span>Rs. ${subtotal.toLocaleString()}</span>
    </div>`;
}

function updateFinalTotal() {
  const el = document.getElementById('finalTotal');
  if (!el) return;

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const isDelivery = document.querySelector('input[name="orderType"]:checked')?.value === 'delivery';
  const total = subtotal + (isDelivery ? DELIVERY_FEE : 0);

  el.textContent = `Rs. ${total.toLocaleString()}`;
}

function onOrderTypeChange() {
  const type = document.querySelector('input[name="orderType"]:checked')?.value;
  const addressGroup  = document.getElementById('addressGroup');
  const deliveryFeeRow = document.getElementById('deliveryFeeRow');
  const cashOpt       = document.getElementById('cashOpt');

  if (addressGroup)   addressGroup.style.display   = type === 'delivery' ? 'block' : 'none';
  if (deliveryFeeRow) deliveryFeeRow.style.display  = type === 'delivery' ? 'flex'  : 'none';
  if (cashOpt)        cashOpt.style.display         = type === 'delivery' ? 'block' : 'none';

  updateCartUI();
  updateFinalTotal();
}

function onPaymentChange() {
  const method = document.querySelector('input[name="payment"]:checked')?.value;
  const onlinePayDetails = document.getElementById('onlinePayDetails');
  const payInstructions  = document.getElementById('payInstructions');

  if (!onlinePayDetails) return;

  if (method === 'jazzcash' || method === 'easypaisa') {
    onlinePayDetails.style.display = 'block';
    if (payInstructions) {
      const details = method === 'jazzcash'
        ? { name: 'JazzCash', number: '0300-0609339', account: 'Wee\'z Kitchen' }
        : { name: 'Easypaisa', number: '0300-0609339', account: 'Wee\'z Kitchen' };
      payInstructions.innerHTML = `
        <strong>${details.name} Payment Details</strong>
        Send payment to: <strong>${details.number}</strong><br>
        Account Name: <strong>${details.account}</strong>
      `;
    }
  } else {
    onlinePayDetails.style.display = 'none';
  }
}

function onScreenshotSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    screenshotBase64 = e.target.result;
    document.getElementById('uploadPlaceholder').style.display = 'none';
    document.getElementById('uploadPreview').style.display = 'block';
    document.getElementById('previewImg').src = screenshotBase64;
  };
  reader.readAsDataURL(file);
}

async function placeOrder() {
  const name    = document.getElementById('custName')?.value.trim();
  const phone   = document.getElementById('custPhone')?.value.trim();
  const type    = document.querySelector('input[name="orderType"]:checked')?.value;
  const address = document.getElementById('custAddress')?.value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value;

  if (!name)    { showToast('Please enter your name', 'error'); return; }
  if (!phone)   { showToast('Please enter your phone number', 'error'); return; }
  if (type === 'delivery' && !address) { showToast('Please enter delivery address', 'error'); return; }
  if (!payment) { showToast('Please select a payment method', 'error'); return; }

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const total    = subtotal + (type === 'delivery' ? DELIVERY_FEE : 0);

  const itemsList = cart.map(i => `• ${i.name} ×${i.quantity} = Rs.${i.price * i.quantity}`).join('%0A');

  const msg = [
    `🍛 *New Order — Wee'z Kitchen*`,
    ``,
    `👤 *Customer:* ${name}`,
    `📞 *Phone:* ${phone}`,
    `🚗 *Order Type:* ${type === 'delivery' ? 'Delivery' : 'Pickup'}`,
    type === 'delivery' ? `📍 *Address:* ${address}` : '',
    `💳 *Payment:* ${payment}`,
    ``,
    `🧾 *Order Details:*`,
    itemsList,
    ``,
    `💰 *Subtotal:* Rs.${subtotal}`,
    type === 'delivery' ? `🛵 *Delivery Fee:* Rs.${DELIVERY_FEE}` : '',
    `✅ *Total: Rs.${total}*`,
  ].filter(Boolean).join('%0A');

  // Disable button
  const btn  = document.getElementById('placeOrderBtn');
  const text = document.getElementById('orderBtnText');
  const spin = document.getElementById('btnSpinner');
  if (btn)  btn.disabled = true;
  if (text) text.style.display = 'none';
  if (spin) spin.style.display = 'block';

  setTimeout(() => {
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, '_blank');
    if (btn)  btn.disabled = false;
    if (text) text.style.display = 'block';
    if (spin) spin.style.display = 'none';
    closeCheckout();
    cart = [];
    updateCartUI();
    // Reset all card buttons
    document.querySelectorAll('.add-btn.in-cart').forEach(b => {
      b.classList.remove('in-cart');
      b.textContent = '+ Add';
    });
    showToast('Order sent via WhatsApp! 🎉', 'success');
  }, 800);
}

// ═════════ TOAST ═════════

function showToast(msg, type = '') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
