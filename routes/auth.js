 const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?,?)',
      [name, email, hash, role || 'student'],
      (err, result) => {
        if (err) return res.status(400).json({ error: err.message });
        res.json({ message: 'Registered successfully!', userId: result.insertId });
      }
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0)
      return res.status(400).json({ error: 'User not found' });
    const user = results[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Wrong password' });
    const token = jwt.sign(
      { userId: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, role: user.role, name: user.name, userId: user.user_id });
  });
});

// Change password
router.post('/change-password', async (req, res) => {
  const { user_id, old_password, new_password } = req.body;
  db.query('SELECT * FROM users WHERE user_id = ?', [user_id], async (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = results[0];
    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    db.query('UPDATE users SET password_hash = ? WHERE user_id = ?', [hash, user_id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: 'Password changed successfully!' });
    });
  });
});

module.exports = router;
