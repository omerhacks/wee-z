const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static('public'));

// ─── FILE PATHS ─────────────────────────────────────────────
const MENU_FILE = 'menu.json';
const ORDERS_FILE = 'orders.json';
// ─── HELPERS ────────────────────────────────────────────────
function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file));
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}
// ─── SIMPLE TOKEN SYSTEM ────────────────────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "1234";
const ADMIN_TOKEN = "securetoken123";

function checkAuth(req, res, next) {
  const token = req.headers['x-admin-auth'];
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
}
// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    res.json({ success: true, token: ADMIN_TOKEN });
  } else {
    res.json({ success: false, message: "Invalid credentials" });
  }
});
// ════════════════════════════════════════════════════════════
//  MENU ROUTES
// ════════════════════════════════════════════════════════════
// Get menu
app.get('/menu', (req, res) => {
  const menu = readJSON(MENU_FILE);
  res.json({ data: menu });
});
// Add item
app.post('/admin/menu', checkAuth, (req, res) => {
  const menu = readJSON(MENU_FILE);
  const newItem = {
    id: Date.now(),
    ...req.body
  };
  menu.push(newItem);
  writeJSON(MENU_FILE, menu);
  res.json({ success: true });
});
// Update item
app.put('/admin/menu/:id', checkAuth, (req, res) => {
  let menu = readJSON(MENU_FILE);
  const id = parseInt(req.params.id);

  const index = menu.findIndex(item => item.id === id);

  if (index === -1) {
    return res.json({ success: false, message: "Item not found" });
  }

  menu[index] = { ...menu[index], ...req.body };

  writeJSON(MENU_FILE, menu);

  res.json({ success: true });
});

// Delete item
app.delete('/admin/menu/:id', checkAuth, (req, res) => {
  let menu = readJSON(MENU_FILE);
  const id = parseInt(req.params.id);

  const newMenu = menu.filter(item => item.id !== id);

  if (newMenu.length === menu.length) {
    return res.json({ success: false, message: "Item not found" });
  }

  writeJSON(MENU_FILE, newMenu);

  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════

// Get orders
app.get('/admin/orders', checkAuth, (req, res) => {
  const orders = readJSON(ORDERS_FILE);
  res.json({ data: orders });
});

// Update order status
app.patch('/admin/orders/:id/status', checkAuth, (req, res) => {
  let orders = readJSON(ORDERS_FILE);
  const id = parseInt(req.params.id);

  const index = orders.findIndex(o => o.id === id);

  if (index === -1) {
    return res.json({ success: false, message: "Order not found" });
  }

  orders[index].status = req.body.status;

  writeJSON(ORDERS_FILE, orders);

  res.json({ success: true });
});

// ════════════════════════════════════════════════════════════
//  START SERVER
// ════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
