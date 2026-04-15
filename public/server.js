// POST /order — Place a new order
app.post('/order', (req, res) => {
  const {
    customerName,
    phone,
    orderType,
    address,
    items,
    total,
    paymentMethod,
    transactionId,
    screenshotData
  } = req.body;

  // ── Validation ──────────────────────────────────────────
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

  // ── DELIVERY TIME CHECK (NEW) ────────────────────────────
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" }));
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const cutoffTime = 22 * 60 + 30; // 10:30 PM

  if (orderType === "delivery" && currentTime >= cutoffTime) {
    return res.status(400).json({
      success: false,
      message: "Delivery not available after 10:30 PM"
    });
  }

  // ── Build order object ──────────────────────────────────
  const orders = readJSON(ORDERS_FILE);

  const newOrder = {
    id: Date.now(),
    orderNumber: `WK-${Date.now().toString().slice(-6)}`,
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

  // Save screenshot
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

  res.json({
    success: true,
    message: 'Order placed successfully!',
    order: newOrder
  });
});
