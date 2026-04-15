# 🍛 Wee'z Kitchen — Restaurant Ordering System

**Location:** Model Town Link Road, Lahore, Pakistan  
**WhatsApp:** +92 300 0609339

---

## 📁 Project Structure

```
/project
  server.js          ← Express backend (API + static server)
  menu.json          ← Menu data (auto-updated via admin panel)
  orders.json        ← Order storage
  package.json       ← Dependencies
  /public
    index.html       ← Customer-facing website
    style.css        ← Customer styles
    script.js        ← Customer JavaScript
    admin.html       ← Admin panel
    admin.css        ← Admin styles
    admin.js         ← Admin JavaScript
```

---

## 🚀 Quick Start (Local)

### 1. Prerequisites
- Node.js v16 or higher: https://nodejs.org

### 2. Install dependencies
```bash
cd project
npm install
```

### 3. Start the server
```bash
npm start
```
Or with auto-reload during development:
```bash
npm run dev
```

### 4. Open in browser
- **Customer site:** http://localhost:3000
- **Admin panel:** http://localhost:3000/admin.html

---

## 🔑 Admin Credentials
- **Username:** `admin`
- **Password:** `weez2024`

> ⚠️ Change these in `server.js` before deploying!
> Look for: `const ADMIN_USERNAME` and `const ADMIN_PASSWORD`

---

## 🌐 Deploy on Render (Free Hosting)

1. Push your code to GitHub
2. Go to https://render.com → Sign up free
3. Click **"New Web Service"**
4. Connect your GitHub repository
5. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
6. Click **Deploy**

> 📝 **Note:** On Render's free tier, the server sleeps after inactivity.
> `orders.json` and `menu.json` will reset on each deploy.
> For persistent data, upgrade to a paid plan or use a database like MongoDB Atlas (free tier available).

---

## 🌐 Deploy on Railway (Recommended)

1. Go to https://railway.app → Sign up
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your repo
4. Railway auto-detects Node.js
5. Add environment variable: `PORT=3000`
6. Deploy!

Railway keeps your server running 24/7 and preserves files between restarts.

---

## 📱 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/menu` | Get all menu items |
| GET | `/menu/categories` | Get all categories |
| POST | `/order` | Place a new order |
| POST | `/admin/login` | Admin login |
| GET | `/admin/orders` | View all orders (auth required) |
| PATCH | `/admin/orders/:id/status` | Update order status (auth required) |
| POST | `/admin/menu` | Add menu item (auth required) |
| PUT | `/admin/menu/:id` | Edit menu item (auth required) |
| DELETE | `/admin/menu/:id` | Delete menu item (auth required) |

---

## 💳 Payment Setup

### JazzCash & Easypaisa
Update the account numbers in `public/script.js`:
```javascript
// Find this section in onPaymentChange():
const info = payment === 'jazzcash'
  ? { name: 'JazzCash', number: '03XX-XXXXXXX', ... }
  : { name: 'Easypaisa', number: '03XX-XXXXXXX', ... }
```
Replace `03XX-XXXXXXX` with your actual registered account numbers.

---

## 📞 WhatsApp Number
Update in `public/script.js`:
```javascript
const WHATSAPP_NUMBER = '923000609339'; // Change to your number (country code + number, no +)
```

---

## 🎨 Customization

- **Colors:** Edit CSS variables in `public/style.css` (`:root` block)
- **Menu:** Use admin panel or edit `menu.json` directly
- **Delivery fee:** Change `const DELIVERY_FEE = 100;` in `script.js`
- **Opening hours:** Update in `index.html` footer section

---

## 🐛 Troubleshooting

**Port already in use:**
```bash
PORT=3001 npm start
```

**Menu not loading:**
- Make sure server is running: `npm start`
- Check `menu.json` is valid JSON

**Orders not saving:**
- Check `orders.json` exists and is writable
- Check server console for errors
