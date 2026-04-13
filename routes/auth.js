const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const axios = require('axios');



// Send OTP
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return res.status(400).json({ error: 'Email is required' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) return res.status(400).json({ error: 'Invalid email address' });

  const allowedDomains = ['@srmist.edu.in', '@srmuniv.ac.in', '@test.com', '@mess.com', '@gmail.com'];
  const isAllowed = allowedDomains.some(domain => cleanEmail.endsWith(domain));
  if (!isAllowed) return res.status(400).json({ error: 'Email not allowed' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires_at = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  try {
    await db.query('DELETE FROM otp_codes WHERE email = $1', [cleanEmail]);
    await db.query(
      'INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1, $2, $3)',
      [cleanEmail, otp, expires_at]
    );

  await axios.post('https://api.brevo.com/v3/smtp/email', {
  sender: { name: 'MessMate App', email: 'aryamanyadav19@gmail.com' },
  to: [{ email: cleanEmail }],
  subject: 'Your MessMate Verification Code',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #6C63FF;">MessMate Email Verification</h2>
      <p>Your verification code is:</p>
      <div style="background: #f0f0ff; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
        <h1 style="color: #6C63FF; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p style="color: #888;">This code expires in 10 minutes.</p>
    </div>
  `
}, {
  headers: {
    'api-key': process.env.BREVO_API_KEY,
    'Content-Type': 'application/json'
  }
});

    res.json({ message: 'OTP sent successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP and Register
router.post('/register', async (req, res) => {
  const { name, email, password, otp } = req.body;
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanName || !cleanEmail || !password || !otp)
    return res.status(400).json({ error: 'Name, email, password and OTP are required' });

  try {
    const otpResult = await db.query(
      'SELECT * FROM otp_codes WHERE email = $1 AND otp = $2',
      [cleanEmail, otp]
    );

    if (otpResult.rows.length === 0)
      return res.status(400).json({ error: 'Invalid OTP' });

    const otpRecord = otpResult.rows[0];
    if (new Date() > new Date(otpRecord.expires_at))
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });

    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1,$2,$3,$4,true) RETURNING user_id',
      [cleanName, cleanEmail, hash, 'student']
    );

    await db.query('DELETE FROM otp_codes WHERE email = $1', [cleanEmail]);

    res.json({ message: 'Registered successfully!', userId: result.rows[0].user_id });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered!' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail || !password) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Wrong password' });
    if (!user.is_verified) {
      return res.status(400).json({ error: 'Account not verified. Please check your email for verification link.' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact admin.' });
    }
    const token = jwt.sign(
      { userId: user.user_id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, role: user.role, name: user.name, userId: user.user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', async (req, res) => {
  const { user_id, old_password, new_password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = result.rows[0];
    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hash, user_id]);
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/save-token', async (req, res) => {
  const { user_id, push_token } = req.body;
  try {
    if (!user_id || !push_token) {
      return res.status(400).json({ error: 'user_id and push_token are required' });
    }

    const isExpoToken = /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(push_token);
    if (!isExpoToken) {
      return res.status(400).json({ error: 'Invalid Expo push token format' });
    }

    const result = await db.query(
      'UPDATE users SET push_token = $1 WHERE user_id = $2 RETURNING user_id',
      [push_token, user_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found for push token save' });
    }

    res.json({ message: 'Token saved!', userId: result.rows[0].user_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
