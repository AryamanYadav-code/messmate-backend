 const express = require('express');
const router = express.Router();
const db = require('../config/db');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Place order
router.post('/', (req, res) => {
  const { user_id, items, total_amount, meal_slot, special_note } = req.body;
  const pickup_code = generateCode();
  db.query(
    'INSERT INTO orders (user_id, total_amount, meal_slot, special_note, pickup_code) VALUES (?,?,?,?,?)',
    [user_id, total_amount, meal_slot, special_note, pickup_code],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      const order_id = result.insertId;
      const orderItems = items.map(i => [order_id, i.item_id, i.quantity, i.price, i.special_instruction || '']);
      db.query('INSERT INTO order_items (order_id, item_id, quantity, price_at_order, special_instruction) VALUES ?',
        [orderItems], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ message: 'Order placed!', order_id, pickup_code });
        });
    }
  );
});

// Get user orders
router.get('/user/:user_id', (req, res) => {
  db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
    [req.params.user_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
});

// Get single order
router.get('/:order_id', (req, res) => {
  db.query('SELECT * FROM orders WHERE order_id = ?',
    [req.params.order_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    });
});

// Update order status (admin)
router.put('/:order_id/status', (req, res) => {
  const { status } = req.body;
  db.query('UPDATE orders SET status = ? WHERE order_id = ?',
    [status, req.params.order_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Status updated!', status });
    });
});

// Get all pending orders (admin)
router.get('/admin/pending', (req, res) => {
  db.query(
    `SELECT o.*, u.name, u.email FROM orders o 
     JOIN users u ON o.user_id = u.user_id 
     WHERE o.status IN ('pending','approved','preparing','ready') 
     ORDER BY o.created_at ASC`,
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
});

// Verify pickup code (admin)
router.post('/verify-code', (req, res) => {
  const { pickup_code } = req.body;
  db.query(
    `SELECT o.*, u.name FROM orders o 
     JOIN users u ON o.user_id = u.user_id 
     WHERE o.pickup_code = ?`,
    [pickup_code], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ error: 'Invalid code' });
      res.json(results[0]);
    });
});

module.exports = router;
