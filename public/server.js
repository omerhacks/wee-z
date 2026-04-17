const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// FILES
const MENU_FILE = path.join(__dirname, 'menu.json');
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ THIS LINE IS CRITICAL (serves CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// HELPERS
function readJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ROUTES
app.get('/menu', (req, res) => {
  res.json({ success: true, data: readJSON(MENU_FILE) });
});

app.post('/order', (req, res) => {
  const orders = readJSON(ORDERS_FILE);

  const newOrder = {
    id: Date.now(),
    ...req.body,
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  writeJSON(ORDERS_FILE, orders);

  res.json({ success: true });
});
app.use(express.static('public'));

// ✅ IMPORTANT: always serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});, () => {
  console.log("Server running on port " + PORT);
});
