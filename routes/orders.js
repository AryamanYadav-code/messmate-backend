const { sendPushNotification } = require('../utils/notifications');
const express = require('express');
const router = express.Router();
const db = require('../config/db');

function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post('/', async (req, res) => {
  const { user_id, items, total_amount, meal_slot, special_note } = req.body;
  const pickup_code = generateCode();
  try {
    const result = await db.query(
      'INSERT INTO orders (user_id, total_amount, meal_slot, special_note, pickup_code) VALUES ($1,$2,$3,$4,$5) RETURNING order_id',
      [user_id, total_amount, meal_slot, special_note, pickup_code]
    );
    const order_id = result.rows[0].order_id;
    for (const item of items) {
      await db.query(
        'INSERT INTO order_items (order_id, item_id, quantity, price_at_order, special_instruction) VALUES ($1,$2,$3,$4,$5)',
        [order_id, item.item_id, item.quantity, item.price, item.special_instruction || '']
      );
    }
    res.json({ message: 'Order placed!', order_id, pickup_code });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/user/:user_id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin/pending', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, u.name, u.email FROM orders o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.status IN ('pending','approved','preparing','ready')
       ORDER BY o.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/admin/history', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.*, u.name, u.email FROM orders o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.status IN ('delivered', 'cancelled', 'rejected')
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:order_id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM orders WHERE order_id = $1', [req.params.order_id]);
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:order_id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = $1 WHERE order_id = $2', [status, req.params.order_id]);
    
    // Get user push token
    const orderResult = await db.query(
      `SELECT o.*, u.push_token, u.name FROM orders o 
       JOIN users u ON o.user_id = u.user_id 
       WHERE o.order_id = $1`,
      [req.params.order_id]
    );
    
    const order = orderResult.rows[0];
    
    // Send notification based on status
    const messages = {
      approved: { title: '✅ Order Approved!', body: 'Your order has been approved and will be prepared soon.' },
      preparing: { title: '👨‍🍳 Order Being Prepared!', body: 'Your order is now being prepared. Almost there!' },
      ready: { title: '🎉 Order Ready!', body: 'Your order is ready for pickup! Show your pickup code at the counter.' },
      delivered: { title: '✅ Order Collected!', body: 'Your order has been collected. Enjoy your meal!' },
      rejected: { title: '❌ Order Rejected', body: 'Your order was rejected. Please contact the mess staff.' }
    };

    if (messages[status] && order?.push_token) {
      await sendPushNotification(
        order.push_token,
        messages[status].title,
        messages[status].body,
        { order_id: req.params.order_id, status }
      );
    }

    res.json({ message: 'Status updated!', status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/verify-code', async (req, res) => {
  const { pickup_code } = req.body;
  try {
    const result = await db.query(
      `SELECT o.*, u.name FROM orders o
       JOIN users u ON o.user_id = u.user_id
       WHERE o.pickup_code = $1`,
      [pickup_code]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invalid code' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Submit feedback
router.post('/:order_id/feedback', async (req, res) => {
  const { rating, review_text } = req.body;
  try {
    const existing = await db.query(
      'SELECT * FROM feedback WHERE order_id = $1',
      [req.params.order_id]
    );
    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'Feedback already submitted!' });

    await db.query(
      'INSERT INTO feedback (order_id, rating, review_text) VALUES ($1,$2,$3)',
      [req.params.order_id, rating, review_text]
    );
    res.json({ message: 'Feedback submitted! Thank you!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get feedback for admin
router.get('/feedback/all', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT f.*, o.total_amount, o.meal_slot, u.name as student_name
       FROM feedback f
       JOIN orders o ON f.order_id = o.order_id
       JOIN users u ON o.user_id = u.user_id
       ORDER BY f.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
