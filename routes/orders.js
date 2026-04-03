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

module.exports = router;
