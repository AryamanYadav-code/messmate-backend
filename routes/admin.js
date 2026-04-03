const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/stats', async (req, res) => {
  try {
    const orders = await db.query('SELECT COUNT(*) as total_orders FROM orders');
    const users = await db.query('SELECT COUNT(*) as total_users FROM users WHERE role = $1', ['student']);
    const revenue = await db.query('SELECT SUM(total_amount) as revenue FROM orders WHERE status IN ($1,$2)', ['delivered', 'ready']);
    res.json({
      total_orders: orders.rows[0].total_orders,
      total_users: users.rows[0].total_users,
      revenue: revenue.rows[0].revenue || 0
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
