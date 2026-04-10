const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const crypto = require('crypto');

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



// Register staff with email verification
router.post('/staff', async (req, res) => {
  const { name, email, password } = req.body;
  const cleanName = (name || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  if (!cleanName || !cleanEmail || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });
  if (password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail))
    return res.status(400).json({ error: 'Invalid email address' });

  try {
    // Check if email already exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0)
      return res.status(400).json({ error: 'Email already registered!' });

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    // Store pending staff with unverified status
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1,$2,$3,$4,false) RETURNING user_id',
      [cleanName, cleanEmail, hash, 'admin']
    );

    // Store token
    await db.query(
      'INSERT INTO staff_tokens (email, token, expires_at) VALUES ($1,$2,$3)',
      [cleanEmail, token, expires_at]
    );

    // Send verification email
    const verifyLink = `https://messmate-backend-gmb0.onrender.com/api/admin/verify-staff?token=${encodeURIComponent(token)}&email=${encodeURIComponent(cleanEmail)}`;

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'MessMate App', email: 'aryamanyadav19@gmail.com' },
      to: [{ email: cleanEmail }],
      subject: 'MessMate Staff Account Verification',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #6C63FF;">Welcome to MessMate Staff!</h2>
          <p>Hi ${cleanName},</p>
          <p>You have been registered as a staff member on MessMate. Click the button below to verify your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background: #6C63FF; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Verify My Account
            </a>
          </div>
          <p style="color: #888;">This link expires in 24 hours.</p>
          <p style="color: #888;">If you didn't expect this email, ignore it.</p>
        </div>
      `
    }, {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    res.json({ message: 'Staff registered! Verification email sent.' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already registered!' });
    res.status(500).json({ error: err.message });
  }
});

// Verify staff email
router.get('/verify-staff', async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) return res.status(400).send('Missing token or email');
  try {
    const result = await db.query(
      'SELECT * FROM staff_tokens WHERE token = $1 AND email = $2 AND is_used = false',
      [token, email]
    );

    if (result.rows.length === 0) {
      return res.send(`
        <html><body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #f44336;">Invalid or Expired Link</h2>
          <p>This verification link is invalid or has already been used.</p>
        </body></html>
      `);
    }

    const tokenRecord = result.rows[0];
    if (new Date() > new Date(tokenRecord.expires_at)) {
      return res.send(`
        <html><body style="font-family: Arial; text-align: center; padding: 50px;">
          <h2 style="color: #f44336;">Link Expired</h2>
          <p>This verification link has expired. Please ask admin to resend.</p>
        </body></html>
      `);
    }

    // Verify the staff account
    await db.query('UPDATE users SET is_verified = true WHERE email = $1', [email]);
    await db.query('UPDATE staff_tokens SET is_used = true WHERE token = $1', [token]);

    res.send(`
      <html><body style="font-family: Arial; text-align: center; padding: 50px;">
        <h2 style="color: #6C63FF;">Account Verified! ✅</h2>
        <p>Your MessMate staff account has been verified successfully.</p>
        <p>You can now login to the MessMate app with your credentials.</p>
        <div style="margin-top: 20px; padding: 20px; background: #f0f0ff; border-radius: 10px;">
          <p><strong>Email:</strong> ${email}</p>
        </div>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('Something went wrong');
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
