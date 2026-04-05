const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get dashboard stats
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

// Get all students
router.get('/students', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT user_id, name, email, wallet_balance, is_verified, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['student']
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Remove student
router.delete('/students/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE user_id = $1 AND role = $2', [req.params.id, 'student']);
    res.json({ message: 'Student removed!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all staff (sub-admins)
router.get('/staff', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT user_id, name, email, created_at FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['admin']
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Register staff (sub-admin)
router.post('/staff', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING user_id',
      [name, email, hash, 'admin']
    );
    res.json({ message: 'Staff registered!', userId: result.rows[0].user_id });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered!' });
    res.status(500).json({ error: err.message });
  }
});

// Remove staff
router.delete('/staff/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE user_id = $1 AND role = $2', [req.params.id, 'admin']);
    res.json({ message: 'Staff removed!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
