/**
 * Wee'z Kitchen - Backend Server
 * Node.js + Express REST API
 * Handles menu, orders, and admin operations
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── File paths ─────────────────────────────────────────────────────────────
const MENU_FILE = path.join(__dirname, 'menu.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));           // Parse JSON bodies (supports base64 screenshots)
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve frontend files
app.use(express.static('public'));

// ─── Admin Credentials (hardcoded for simplicity — change these!) ─────────
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'weez2024';

// ─── Helper: Read JSON file ───────────────────────────────────────────────
function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

// ─── Helper: Write JSON file ─────────────────────────────────────────────
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ══════════════════════════════════════════════════════════════════════════════
//  PUBLIC ROUTES
// ══════════════════════════════════════════════════════════════════════════════

// GET /menu — Return full menu
app.get('/menu', (req, res) => {
  const menu = readJSON(MENU_FILE);
  res.json({ success: true, data: menu });
});

// GET /menu/categories — Return unique categories
app.get('/menu/categories', (req, res) => {
  const menu = readJSON(MENU_FILE);
  const categories = [...new Set(menu.map(item => item.category))];
  res.json({ success: true, data: categories });
});

// POST /order — Place a new order
app.post('/order', (req, res) => {
  const {
    customerName,
    phone,
    orderType,    // 'pickup' or 'delivery'
    address,
    items,        // Array of { id, name, price, quantity }
    total,
    paymentMethod, // 'cash', 'jazzcash', 'easypaisa'
    transactionId,
    screenshotData // base64 image (optional)
  } = req.body;

  // ── Validation ──────────────────────────────────────────────────────────
  if (!customerName || !phone || !orderType || !items || !total || !paymentMethod) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  if (orderType === 'delivery' && !address) {
    return res.status(400).json({ success: false, message: 'Address is required for delivery' });
  }

  if (orderType === 'pickup' && paymentMethod === 'cash') {
    return res.status(400).json({ success: false, message: 'Cash payment is not allowed for pickup orders' });
  }

  if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && !transactionId && !screenshotData) {
    return res.status(400).json({ success: false, message: 'Transaction ID or screenshot is required for online payment' });
  }

  // ── Build order object ──────────────────────────────────────────────────
  const orders = readJSON(ORDERS_FILE);
  const newOrder = {
    id: Date.now(),                          // Unique order ID (timestamp)
    orderNumber: `WK-${Date.now().toString().slice(-6)}`, // Friendly order number
    customerName,
    phone,
    orderType,
    address: orderType === 'delivery' ? address : 'N/A (Pickup)',
    items,
    total,
    paymentMethod,
    transactionId: transactionId || null,
    hasScreenshot: !!screenshotData,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  // Save screenshot separately if provided (to keep orders.json lightweight)
  if (screenshotData) {
    const screenshotsDir = path.join(__dirname, 'screenshots');
    if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir);
    fs.writeFileSync(
      path.join(screenshotsDir, `${newOrder.id}.txt`),
      screenshotData
    );
  }

  orders.push(newOrder);
  writeJSON(ORDERS_FILE, orders);

  res.json({ success: true, message: 'Order placed successfully!', order: newOrder });
});

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN ROUTES (protected by simple auth middleware)
// ══════════════════════════════════════════════════════════════════════════════

// Simple auth middleware — checks Authorization header
function adminAuth(req, res, next) {
  const auth = req.headers['x-admin-auth'];
  if (!auth) return res.status(401).json({ success: false, message: 'Unauthorized' });

  // Decode base64 "username:password"
  const decoded = Buffer.from(auth, 'base64').toString('utf8');
  const [username, password] = decoded.split(':');

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
}

// POST /admin/login — Verify admin credentials
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    // Return a base64 token the client stores and sends back
    const token = Buffer.from(`${username}:${password}`).toString('base64');
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Invalid username or password' });
  }
});

// GET /admin/orders — View all orders
app.get('/admin/orders', adminAuth, (req, res) => {
  const orders = readJSON(ORDERS_FILE);
  // Return newest first
  res.json({ success: true, data: orders.reverse() });
});

// PATCH /admin/orders/:id/status — Update order status
app.patch('/admin/orders/:id/status', adminAuth, (req, res) => {
  const orderId = parseInt(req.params.id);
  const { status } = req.body; // 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'
  const orders = readJSON(ORDERS_FILE);
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Order not found' });
  orders[idx].status = status;
  writeJSON(ORDERS_FILE, orders);
  res.json({ success: true, message: 'Status updated' });
});

// POST /admin/menu — Add new menu item
app.post('/admin/menu', adminAuth, (req, res) => {
  const { name, price, category, description, image } = req.body;
  if (!name || !price || !category) {
    return res.status(400).json({ success: false, message: 'Name, price and category are required' });
  }
  const menu = readJSON(MENU_FILE);
  const newItem = {
    id: Date.now(),
    name,
    price: parseFloat(price),
    category,
    description: description || '',
    image: image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop'
  };
  menu.push(newItem);
  writeJSON(MENU_FILE, menu);
  res.json({ success: true, message: 'Menu item added!', item: newItem });
});

// PUT /admin/menu/:id — Edit menu item
app.put('/admin/menu/:id', adminAuth, (req, res) => {
  const itemId = parseInt(req.params.id);
  const { name, price, category, description, image } = req.body;
  const menu = readJSON(MENU_FILE);
  const idx = menu.findIndex(item => item.id === itemId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Item not found' });
  menu[idx] = { ...menu[idx], name, price: parseFloat(price), category, description, image };
  writeJSON(MENU_FILE, menu);
  res.json({ success: true, message: 'Menu item updated!', item: menu[idx] });
});

// DELETE /admin/menu/:id — Delete menu item
app.delete('/admin/menu/:id', adminAuth, (req, res) => {
  const itemId = parseInt(req.params.id);
  let menu = readJSON(MENU_FILE);
  const idx = menu.findIndex(item => item.id === itemId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Item not found' });
  menu.splice(idx, 1);
  writeJSON(MENU_FILE, menu);
  res.json({ success: true, message: 'Menu item deleted!' });
});

// ── Catch-all: serve index.html for unknown routes ──────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start Server ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🍽️  Wee'z Kitchen server running on http://localhost:${PORT}`);
  console.log(`📋  Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`🔑  Admin login: ${ADMIN_USERNAME} / ${ADMIN_PASSWORD}\n`);
});
