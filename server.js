const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'orders.json');

function readOrders() {
  if (!fs.existsSync(DATA_FILE)) return [];
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

function writeOrders(orders) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(orders, null, 2));
}

// Health check
app.get('/', (req, res) => {
  res.send('Al Haya Boutique backend is running.');
});

// Create a new order
app.post('/api/orders', (req, res) => {
  const { whatsappNumber, chest, waist, hips, length, sleeve, fabricType, designDetails } = req.body;

  if (!whatsappNumber) {
    return res.status(400).json({ error: 'whatsappNumber is required' });
  }

  const orders = readOrders();
  const newOrder = {
    id: Date.now().toString(),
    whatsappNumber,
    measurements: { chest, waist, hips, length, sleeve },
    fabricType: fabricType || 'customer-provided',
    designDetails: designDetails || '',
    status: 'received',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  writeOrders(orders);
  res.status(201).json(newOrder);
});

// List all orders
app.get('/api/orders', (req, res) => {
  res.json(readOrders());
});

// Get a single order by id
app.get('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update order status
app.patch('/api/orders/:id', (req, res) => {
  const orders = readOrders();
  const order = orders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const { status } = req.body;
  const validStatuses = ['received', 'cutting', 'stitching', 'ready', 'delivered'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  if (status) order.status = status;

  writeOrders(orders);
  res.json(order);
});

// Delete an order
app.delete('/api/orders/:id', (req, res) => {
  let orders = readOrders();
  const exists = orders.some(o => o.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Order not found' });

  orders = orders.filter(o => o.id !== req.params.id);
  writeOrders(orders);
  res.status(204).send();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
