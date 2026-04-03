 const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get wallet balance
router.get('/balance/:user_id', (req, res) => {
  db.query('SELECT wallet_balance FROM users WHERE user_id = ?',
    [req.params.user_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ balance: results[0].wallet_balance });
    });
});

// Add money to wallet
router.post('/add', (req, res) => {
  const { user_id, amount, payment_method } = req.body;
  db.query('UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?',
    [amount, user_id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query(
        'INSERT INTO wallet_transactions (user_id, amount, type, payment_method) VALUES (?,?,?,?)',
        [user_id, amount, 'credit', payment_method || 'UPI'],
        (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          res.json({ message: 'Money added!', amount });
        }
      );
    });
});

// Get transaction history
router.get('/history/:user_id', (req, res) => {
  db.query(
    'SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC',
    [req.params.user_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
});

// Pay using wallet
router.post('/pay', (req, res) => {
  const { user_id, amount } = req.body;
  db.query('SELECT wallet_balance FROM users WHERE user_id = ?',
    [user_id], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      const balance = results[0].wallet_balance;
      if (balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
      db.query('UPDATE users SET wallet_balance = wallet_balance - ? WHERE user_id = ?',
        [amount, user_id], (err2) => {
          if (err2) return res.status(500).json({ error: err2.message });
          db.query(
            'INSERT INTO wallet_transactions (user_id, amount, type, payment_method) VALUES (?,?,?,?)',
            [user_id, amount, 'debit', 'wallet'],
            (err3) => {
              if (err3) return res.status(500).json({ error: err3.message });
              res.json({ message: 'Payment successful!', remaining: balance - amount });
            }
          );
        });
    });
});

module.exports = router;
