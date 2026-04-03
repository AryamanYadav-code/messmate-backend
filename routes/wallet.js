const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/balance/:user_id', async (req, res) => {
  try {
    const result = await db.query('SELECT wallet_balance FROM users WHERE user_id = $1', [req.params.user_id]);
    res.json({ balance: result.rows[0].wallet_balance });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/add', async (req, res) => {
  const { user_id, amount, payment_method } = req.body;
  try {
    await db.query('UPDATE users SET wallet_balance = wallet_balance + $1 WHERE user_id = $2', [amount, user_id]);
    await db.query(
      'INSERT INTO wallet_transactions (user_id, amount, type, payment_method) VALUES ($1,$2,$3,$4)',
      [user_id, amount, 'credit', payment_method || 'UPI']
    );
    res.json({ message: 'Money added!', amount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/history/:user_id', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/pay', async (req, res) => {
  const { user_id, amount } = req.body;
  try {
    const result = await db.query('SELECT wallet_balance FROM users WHERE user_id = $1', [user_id]);
    const balance = result.rows[0].wallet_balance;
    if (balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
    await db.query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE user_id = $2', [amount, user_id]);
    await db.query(
      'INSERT INTO wallet_transactions (user_id, amount, type, payment_method) VALUES ($1,$2,$3,$4)',
      [user_id, amount, 'debit', 'wallet']
    );
    res.json({ message: 'Payment successful!', remaining: balance - amount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
