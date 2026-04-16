/**
 * Wee'z Kitchen — Customer Frontend Script
 * Handles: menu loading, cart, checkout, order submission, WhatsApp redirect
 */

// ─── App State ─────────────────────────────────────────────────────────────
let allMenuItems = [];   // Full menu from API
let cart = [];           // Cart items: { id, name, price, quantity }
let screenshotBase64 = null;

const DELIVERY_FEE = 100;
const WHATSAPP_NUMBER = '923000609339';

// ─── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadMenu();
  initNavbarScroll();
  onOrderTypeChange(); // Set initial state
});

// ─── Navbar scroll effect ───────────────────────────────────────────────────
function initNavbarScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ══════════════════════════════════════════════════════════════════════════════
//  MENU
// ══════════════════════════════════════════════════════════════════════════════

// Fetch menu from backend API
async function loadMenu() {
  try {
    const res = await fetch('/menu');
    const json = await res.json();
    allMenuItems = json.data;
    buildCategoryFilters(allMenuItems);
    console.log("Rendering menu...");
    renderMenu(allMenuItems);
  } catch (err) {
    document.getElementById('menuGrid').innerHTML =
      `<div class="loading-state"><p>⚠️ Failed to load menu. Please refresh the page.</p></div>`;
  }
}

// Build category filter buttons dynamically
function buildCategoryFilters(items) {
  const categories = [...new Set(items.map(i => i.category))];
  const container = document.getElementById('categoryFilters');
  // Keep the "All" button, add category buttons
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.cat = cat;
    btn.textContent = cat;
    btn.onclick = () => filterCategory(cat, btn);
    container.appendChild(btn);
  });
}

// Render menu cards into the grid
function renderMenu(items) {
  const grid = document.getElementById('menuGrid');
  if (items.length === 0) {
    grid.innerHTML = `<div class="loading-state"><p>No items found in this category.</p></div>`;
    return;
  }
  grid.innerHTML = items.map(item => {
    const inCart = cart.find(c => c.id === item.id);
    return `
    <div class="menu-card" id="card-${item.id}">
      <div class="card-img-wrap">
        <img src="${item.image}" alt="${item.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'" />
        <span class="card-category-tag">${item.category}</span>
      </div>
      <div class="card-body">
        <div class="card-name">${item.name}</div>
        <div class="card-desc">${item.description || ''}</div>
        <div class="card-footer">
          <div class="card-price">Rs. ${item.price.toLocaleString()} <span>/ serving</span></div>
          <button class="add-btn ${inCart ? 'in-cart' : ''}" id="addBtn-${item.id}"
                  onclick="addToCart(${item.id})">
            ${inCart ? `✓ Added` : '+ Add'}
          </button>
        </div>
      </div>
    </div>`;
  }).join('');
}

// Filter menu by category
function filterCategory(cat, btn) {
  // Update active button
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = cat === 'All' ? allMenuItems : allMenuItems.filter(i => i.category === cat);
  renderMenu(filtered);
}

// ══════════════════════════════════════════════════════════════════════════════
//  CART
// ══════════════════════════════════════════════════════════════════════════════

function addToCart(itemId) {
  const item = allMenuItems.find(i => i.id === itemId);
  if (!item) return;

  const existing = cart.find(c => c.id === itemId);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({ id: item.id, name: item.name, price: item.price, quantity: 1 });
  }

  updateCartUI();
  updateAddBtnState(itemId);
  showToast(`${item.name} added to cart 🛒`, 'success');
}

function changeQty(itemId, delta) {
  const idx = cart.findIndex(c => c.id === itemId);
  if (idx === -1) return;
  cart[idx].quantity += delta;
  if (cart[idx].quantity <= 0) {
    cart.splice(idx, 1);
    updateAddBtnState(itemId);
  }
  if (!document.getElementById('cartItems')) return;
  updateCartUI();
}

function updateAddBtnState(itemId) {
  const btn = document.getElementById(`addBtn-${itemId}`);
  if (!btn) return;
  const inCart = cart.find(c => c.id === itemId);
  btn.textContent = inCart ? '✓ Added' : '+ Add';
  btn.classList.toggle('in-cart', !!inCart);
}

// Re-render everything cart-related
function updateCartUI() {
  const cartItemsEl = document.getElementById('cartItems');
  const cartFooter  = document.getElementById('cartFooter');

  const totalItems = cart.reduce((sum, c) => sum + c.quantity, 0);
  const subtotal   = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  // Badge
  document.getElementById('cartBadge').textContent = totalItems;

  // 🛑 EMPTY CART
  if (cart.length === 0) {
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <p>Your cart is empty</p>
      </div>
    `;
    if (cartFooter) cartFooter.style.display = 'none';
    return;
  }

  if (cartFooter) cartFooter.style.display = 'block';

  // ✅ CLEAN RENDER (ONLY ONE VERSION)
  cartItemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">
          Rs. ${(item.price * item.quantity).toLocaleString()}
        </div>
      </div>

      <div class="qty-ctrl">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-num">${item.quantity}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
      </div>
    </div>
  `).join('');

  // Totals
  document.getElementById('cartSubtotal').textContent =
    `Rs. ${subtotal.toLocaleString()}`;

  document.getElementById('cartTotal').textContent =
    `Rs. ${subtotal.toLocaleString()}`;
}
  updateFinalTotal();
}

function getOrderType() {
  const sel = document.querySelector('input[name="orderType"]:checked');
  return sel ? sel.value : 'pickup';
}

function toggleCart() {
  document.getElementById('cartSidebar').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

// ══════════════════════════════════════════════════════════════════════════════
//  CHECKOUT MODAL
// ══════════════════════════════════════════════════════════════════════════════

function openCheckout() {
  if (cart.length === 0) { showToast('Add items to cart first!', 'error'); return; }
  toggleCart();
  renderOrderSummary();
  updateFinalTotal();
  document.getElementById('checkoutOverlay').classList.add('open');
}

function closeCheckout() {
  document.getElementById('checkoutOverlay').classList.remove('open');
}

function renderOrderSummary() {
  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const orderType = getOrderType();
  const total = subtotal + (orderType === 'delivery' ? DELIVERY_FEE : 0);

  document.getElementById('orderSummaryMini').innerHTML = `
    ${cart.map(item => `
      <div class="summary-item">
        <span>${item.name} × ${item.quantity}</span>
        <span>Rs. ${(item.price * item.quantity).toLocaleString()}</span>
      </div>`).join('')}
    ${orderType === 'delivery' ? `<div class="summary-item"><span>Delivery Fee</span><span>Rs. 100</span></div>` : ''}
    <div class="summary-item total">
      <span>Total</span>
      <span>Rs. ${total.toLocaleString()}</span>
    </div>`;
}

function updateFinalTotal() {
  const subtotal  = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const orderType = getOrderType();
  const total     = subtotal + (orderType === 'delivery' ? DELIVERY_FEE : 0);
  const el = document.getElementById('finalTotal');
  if (el) el.textContent = `Rs. ${total.toLocaleString()}`;
}

// ─── Order Type Change ──────────────────────────────────────────────────────
function onOrderTypeChange() {
  const orderType = getOrderType();

  // Address field visibility
  document.getElementById('addressGroup').style.display =
    orderType === 'delivery' ? 'block' : 'none';

  // Cash option: only for delivery
  const cashOpt = document.getElementById('cashOpt');
  cashOpt.style.display = orderType === 'delivery' ? 'flex' : 'none';

  // If pickup was selected and cash was checked, deselect it
  if (orderType === 'pickup') {
    const cashRadio = cashOpt.querySelector('input');
    if (cashRadio.checked) {
      cashRadio.checked = false;
      // Auto-select JazzCash
      const jazz = document.querySelector('input[value="jazzcash"]');
      if (jazz) jazz.checked = true;
      onPaymentChange();
    }
  }

  updateCartUI();
  renderOrderSummary();
  updateFinalTotal();
}

// ─── Payment Change ─────────────────────────────────────────────────────────
function onPaymentChange() {
  const payment = document.querySelector('input[name="payment"]:checked')?.value;
  const detailsEl = document.getElementById('onlinePayDetails');
  const instrEl   = document.getElementById('payInstructions');

  if (payment === 'jazzcash' || payment === 'easypaisa') {
    detailsEl.style.display = 'block';

    const info = payment === 'jazzcash'
      ? { name: 'JazzCash', number: '03XX-XXXXXXX', color: '#c8102e' }
      : { name: 'Easypaisa', number: '03XX-XXXXXXX', color: '#005c2b' };

    instrEl.innerHTML = `
      <strong style="color:${info.color}">📲 Send payment via ${info.name}</strong>
      Account Number: <strong>${info.number}</strong><br/>
      Account Name: <strong>Wee'z Kitchen</strong><br/>
      After sending, enter your Transaction ID <strong>or</strong> upload a screenshot below.`;
  } else {
    detailsEl.style.display = 'none';
    screenshotBase64 = null;
    document.getElementById('uploadPreview').style.display = 'none';
    document.getElementById('uploadPlaceholder').style.display = 'block';
  }
}

// ─── Screenshot Upload ──────────────────────────────────────────────────────
function onScreenshotSelect(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    screenshotBase64 = e.target.result;
    document.getElementById('previewImg').src = screenshotBase64;
    document.getElementById('uploadPreview').style.display = 'block';
    document.getElementById('uploadPlaceholder').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ══════════════════════════════════════════════════════════════════════════════
//  PLACE ORDER
// ══════════════════════════════════════════════════════════════════════════════

async function placeOrder() {
  // ── Gather form values ────────────────────────────────────────────────────
  const customerName  = document.getElementById('custName').value.trim();
  const phone         = document.getElementById('custPhone').value.trim();
  const orderType     = getOrderType();
  const address       = document.getElementById('custAddress').value.trim();
  const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
  const transactionId = document.getElementById('transactionId').value.trim();

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const total    = subtotal + (orderType === 'delivery' ? DELIVERY_FEE : 0);

  // ── Validation ────────────────────────────────────────────────────────────
  if (!customerName)  return showToast('Please enter your name', 'error');
  if (!phone)         return showToast('Please enter your phone number', 'error');
  if (!/^0[0-9]{9,10}$/.test(phone.replace(/[-\s]/g, '')))
    return showToast('Enter a valid Pakistani phone number', 'error');
  if (!paymentMethod) return showToast('Please select a payment method', 'error');
  if (orderType === 'delivery' && !address)
    return showToast('Please enter your delivery address', 'error');
  if (orderType === 'pickup' && paymentMethod === 'cash')
    return showToast('Cash payment is not allowed for pickup', 'error');
  if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && !transactionId && !screenshotBase64)
    return showToast('Please enter Transaction ID or upload payment screenshot', 'error');

  // ── Show loading state ────────────────────────────────────────────────────
  const btn = document.getElementById('placeOrderBtn');
  document.getElementById('orderBtnText').style.display = 'none';
  document.getElementById('btnSpinner').style.display = 'block';
  btn.disabled = true;

  // ── Build payload ─────────────────────────────────────────────────────────
  const payload = {
    customerName,
    phone,
    orderType,
    address,
    items: cart,
    total,
    paymentMethod,
    transactionId: transactionId || null,
    screenshotData: screenshotBase64 || null
  };

  try {
    // ── POST to backend ─────────────────────────────────────────────────────
    const res = await fetch('/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();

    if (!json.success) throw new Error(json.message);

    // ── Build WhatsApp message ──────────────────────────────────────────────
    const waMsg = buildWhatsAppMessage({
      orderNumber: json.order.orderNumber,
      customerName,
      phone,
      orderType,
      address: orderType === 'delivery' ? address : 'Pickup at Restaurant',
      items: cart,
      subtotal,
      deliveryFee: orderType === 'delivery' ? DELIVERY_FEE : 0,
      total,
      paymentMethod,
      transactionId: transactionId || 'N/A'
    });

    // Clear cart
    cart = [];
    screenshotBase64 = null;
    updateCartUI();
    closeCheckout();

    showToast(`Order ${json.order.orderNumber} placed! Redirecting to WhatsApp...`, 'success');

    // ── Redirect to WhatsApp ────────────────────────────────────────────────
    setTimeout(() => {
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(waMsg)}`, '_blank');
    }, 1200);

  } catch (err) {
    showToast(err.message || 'Failed to place order. Try again.', 'error');
  } finally {
    document.getElementById('orderBtnText').style.display = 'inline';
    document.getElementById('btnSpinner').style.display = 'none';
    btn.disabled = false;
  }
}

// ─── Build WhatsApp message ─────────────────────────────────────────────────
function buildWhatsAppMessage({ orderNumber, customerName, phone, orderType, address, items, subtotal, deliveryFee, total, paymentMethod, transactionId }) {
  const payLabels = { cash: 'Cash on Delivery', jazzcash: 'JazzCash', easypaisa: 'Easypaisa' };
  const itemsList = items.map(i => `  • ${i.name} × ${i.quantity}  = Rs. ${(i.price * i.quantity).toLocaleString()}`).join('\n');

  return `🍛 *NEW ORDER — Wee'z Kitchen*
━━━━━━━━━━━━━━━━━━━━
📋 *Order ID:* ${orderNumber}
👤 *Name:* ${customerName}
📞 *Phone:* ${phone}
🚗 *Type:* ${orderType === 'pickup' ? 'Pickup 🏪' : 'Delivery 🛵'}
📍 *Address:* ${address}
━━━━━━━━━━━━━━━━━━━━
🛒 *Items Ordered:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
💰 *Subtotal:* Rs. ${subtotal.toLocaleString()}
${deliveryFee > 0 ? `🛵 *Delivery Fee:* Rs. ${deliveryFee}\n` : ''}💳 *Total:* Rs. ${total.toLocaleString()}
━━━━━━━━━━━━━━━━━━━━
💳 *Payment:* ${payLabels[paymentMethod] || paymentMethod}
🔖 *Transaction ID:* ${transactionId}
━━━━━━━━━━━━━━━━━━━━
Please confirm this order. Thank you! 🙏`;
}

// ══════════════════════════════════════════════════════════════════════════════
//  TOAST NOTIFICATION
// ══════════════════════════════════════════════════════════════════════════════

function showToast(msg, type = 'default') {
  // Remove existing toasts
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}
