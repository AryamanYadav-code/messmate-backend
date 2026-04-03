 const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get dashboard stats
router.get('/stats', (req, res) => {
  db.query('SELECT COUNT(*) as total_orders FROM orders', (err, orders) => {
    db.query('SELECT COUNT(*) as total_users FROM users WHERE role = "student"', (err2, users) => {
      db.query('SELECT SUM(total_amount) as revenue FROM orders WHERE status IN ("delivered","ready")', (err3, revenue) => {
        res.json({
          total_orders: orders[0].total_orders,
          total_users: users[0].total_users,
          revenue: revenue[0].revenue || 0
        });
      });
    });
  });
});

module.exports = router;
