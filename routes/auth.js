const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const axios = require('axios');
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const auth = require('../middleware/auth');
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
  sender: { name: 'SRM_KITCHEN App', email: 'aryamanyadav19@gmail.com' },
  to: [{ email: cleanEmail }],
  subject: 'Your SRM_KITCHEN Verification Code',
  htmlContent: `
    <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
      <h2 style="color: #6C63FF;">SRM_KITCHEN Email Verification</h2>
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

    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return res.status(403).json({ error: 'Account temporarily locked due to too many failed login attempts. Please try again later.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      let failedAttempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;
      if (failedAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await db.query('UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE user_id = $3', [failedAttempts, lockedUntil, user.user_id]);
      
      if (lockedUntil) {
         return res.status(403).json({ error: 'Too many failed login attempts. Account locked for 15 minutes.' });
      }
      return res.status(400).json({ error: 'Wrong password' });
    }

    if (user.failed_login_attempts > 0 || user.locked_until) {
      await db.query('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE user_id = $1', [user.user_id]);
    }

    if (!user.is_verified) {
      return res.status(400).json({ error: 'Account not verified. Please check your email for verification link.' });
    }
    if (user.is_active === false) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact admin.' });
    }

    const sessionRes = await db.query('INSERT INTO user_sessions (user_id) VALUES ($1) RETURNING session_id', [user.user_id]);
    const sessionId = sessionRes.rows[0].session_id;

    const activeSessions = await db.query('SELECT session_id FROM user_sessions WHERE user_id = $1 ORDER BY created_at ASC', [user.user_id]);
    if (activeSessions.rows.length > 3) {
      const excessCount = activeSessions.rows.length - 3;
      const sessionIdsToDelete = activeSessions.rows.slice(0, excessCount).map(s => s.session_id);
      await db.query('DELETE FROM user_sessions WHERE session_id = ANY($1::uuid[])', [sessionIdsToDelete]);
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, email: user.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, role: user.role, name: user.name, userId: user.user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── GOOGLE LOGIN ────────────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'idToken is required' });

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID,
        '344290150113-e75lk49v36hb3hlei2410sb40s9s2kgl.apps.googleusercontent.com' // Ensure matches both env and hardcoded if different
      ], 
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;
    const cleanEmail = email.toLowerCase().trim();

    // Check if user exists
    let result = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    let user;
    
    if (result.rows.length === 0) {
      // Create new user automatically since Google verified them
      // We generate a long, random un-guessable password hash for them
      const randomPass = require('crypto').randomBytes(32).toString('hex');
      const hash = await bcrypt.hash(randomPass, 10);
      
      const insertResult = await db.query(
        'INSERT INTO users (name, email, password_hash, role, is_verified) VALUES ($1,$2,$3,$4,true) RETURNING *',
        [name, cleanEmail, hash, 'student']
      );
      user = insertResult.rows[0];
    } else {
      user = result.rows[0];
      if (user.is_active === false) {
        return res.status(403).json({ error: 'Your account has been deactivated. Please contact admin.' });
      }
      // Set to verified if they previously signed up manually but hadn't verified email yet
      if (!user.is_verified) {
         await db.query('UPDATE users SET is_verified = true WHERE user_id = $1', [user.user_id]);
      }
    }

    const sessionRes = await db.query('INSERT INTO user_sessions (user_id) VALUES ($1) RETURNING session_id', [user.user_id]);
    const sessionId = sessionRes.rows[0].session_id;

    const activeSessions = await db.query('SELECT session_id FROM user_sessions WHERE user_id = $1 ORDER BY created_at ASC', [user.user_id]);
    if (activeSessions.rows.length > 3) {
      const excessCount = activeSessions.rows.length - 3;
      const sessionIdsToDelete = activeSessions.rows.slice(0, excessCount).map(s => s.session_id);
      await db.query('DELETE FROM user_sessions WHERE session_id = ANY($1::uuid[])', [sessionIdsToDelete]);
    }

    const token = jwt.sign(
      { userId: user.user_id, role: user.role, email: user.email, sessionId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, role: user.role, name: user.name, userId: user.user_id });
  } catch (err) {
    console.error('Google Auth Error:', err);
    res.status(401).json({ error: 'Invalid Google Identity token' });
  }
});

// ─── LOGOUT ─────────────────────────────────────────────────────────────
router.post('/logout', auth, async (req, res) => {
  try {
    if (req.user && req.user.sessionId) {
      await db.query('DELETE FROM user_sessions WHERE session_id = $1', [req.user.sessionId]);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// ─── FORGOT PASSWORD: Send reset link via email ─────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return res.status(400).json({ error: 'Email is required' });

  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'No account found with this email' });

    const user = result.rows[0];
    const token = require('crypto').randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Remove any existing token for this email
    await db.query('DELETE FROM password_reset_tokens WHERE email = $1', [cleanEmail]);
    await db.query(
      'INSERT INTO password_reset_tokens (email, token, expires_at) VALUES ($1,$2,$3)',
      [cleanEmail, token, expires_at]
    );

    const resetLink = `https://messmate-backend-gmb0.onrender.com/api/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(cleanEmail)}`;

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'SRM_KITCHEN App', email: 'aryamanyadav19@gmail.com' },
      to: [{ email: cleanEmail }],
      subject: 'SRM_KITCHEN Password Reset',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #6C63FF;">Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your SRM_KITCHEN password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" style="background: #6C63FF; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Reset My Password
            </a>
          </div>
          <p style="color: #888;">This link expires in 1 hour.</p>
          <p style="color: #888;">If you did not request this, please ignore this email.</p>
        </div>
      `
    }, {
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
    });

    res.json({ message: 'Password reset link sent to your email!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── FORGOT PASSWORD: Show HTML form to enter new password ───────────────────
router.get('/reset-password', async (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) return res.status(400).send('Invalid link');

  try {
    const result = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND email = $2 AND is_used = false',
      [token, email]
    );
    if (result.rows.length === 0) {
      return res.send(`<html><body style="font-family:Arial;text-align:center;padding:50px">
        <h2 style="color:#f44336">Invalid or Expired Link</h2>
        <p>This password reset link is invalid or has already been used.</p>
      </body></html>`);
    }
    if (new Date() > new Date(result.rows[0].expires_at)) {
      return res.send(`<html><body style="font-family:Arial;text-align:center;padding:50px">
        <h2 style="color:#f44336">Link Expired</h2>
        <p>This link has expired. Please request a new one.</p>
      </body></html>`);
    }

    // Serve a beautiful HTML form
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Reset Password - SRM_KITCHEN</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; background: #f0f0ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
          .card { background: white; padding: 36px 28px; border-radius: 20px; width: 100%; max-width: 400px; box-shadow: 0 4px 24px rgba(108,99,255,0.12); }
          .logo { font-size: 40px; text-align: center; margin-bottom: 8px; }
          h2 { color: #6C63FF; text-align: center; margin-bottom: 6px; font-size: 22px; }
          p { color: #888; text-align: center; font-size: 13px; margin-bottom: 24px; }
          label { display: block; font-size: 13px; font-weight: 600; color: #444; margin-bottom: 6px; }
          input { width: 100%; padding: 13px 14px; border: 1.5px solid #ddd; border-radius: 10px; font-size: 15px; margin-bottom: 14px; outline: none; transition: border-color 0.2s; }
          input:focus { border-color: #6C63FF; }
          button { width: 100%; padding: 14px; background: #6C63FF; color: white; border: none; border-radius: 10px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 4px; }
          button:hover { background: #5a52d5; }
          .error { color: #f44336; text-align: center; font-size: 13px; margin-top: 10px; }
          .success { display: none; text-align: center; }
          .success h2 { color: #4CAF50; margin-bottom: 12px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">🍱</div>
          <h2>Reset Password</h2>
          <p>Enter your new password below</p>
          <form id="form">
            <label>New Password</label>
            <input type="password" id="pass" placeholder="Min 6 characters" required minlength="6" />
            <label>Confirm Password</label>
            <input type="password" id="confirm" placeholder="Repeat new password" required />
            <button type="submit" id="btn">Set New Password</button>
            <div class="error" id="err"></div>
          </form>
          <div class="success" id="ok">
            <h2>✅ Password Reset!</h2>
            <p>Your password has been updated successfully.</p>
            <p style="margin-top:12px">You can now log in to the SRM_KITCHEN app with your new password.</p>
          </div>
        </div>
        <script>
          document.getElementById('form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const pass = document.getElementById('pass').value;
            const confirm = document.getElementById('confirm').value;
            const err = document.getElementById('err');
            if (pass !== confirm) { err.innerText = 'Passwords do not match'; return; }
            if (pass.length < 6) { err.innerText = 'Password must be at least 6 characters'; return; }
            document.getElementById('btn').innerText = 'Saving...';
            const res = await fetch('/api/auth/reset-password', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: '${token}', email: '${email}', new_password: pass })
            });
            const data = await res.json();
            if (res.ok) {
              document.getElementById('form').style.display = 'none';
              document.getElementById('ok').style.display = 'block';
            } else {
              err.innerText = data.error || 'Something went wrong';
              document.getElementById('btn').innerText = 'Set New Password';
            }
          });
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send('Something went wrong');
  }
});

// ─── FORGOT PASSWORD: Handle form submission (POST) ──────────────────────────
router.post('/reset-password', async (req, res) => {
  const { token, email, new_password } = req.body;
  if (!token || !email || !new_password)
    return res.status(400).json({ error: 'Missing fields' });
  if (new_password.length < 6)
    return res.status(400).json({ error: 'Password must be at least 6 characters' });

  try {
    const result = await db.query(
      'SELECT * FROM password_reset_tokens WHERE token = $1 AND email = $2 AND is_used = false',
      [token, email]
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: 'Invalid or already used link' });
    if (new Date() > new Date(result.rows[0].expires_at))
      return res.status(400).json({ error: 'Link expired. Please request a new one.' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, email]);
    await db.query('UPDATE password_reset_tokens SET is_used = true WHERE token = $1', [token]);

    res.json({ message: 'Password reset successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── CHANGE PASSWORD (Settings): Send OTP to registered email ────────────────
router.post('/change-password/send-otp', async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  try {
    const result = await db.query('SELECT email, name FROM users WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const { email, name } = result.rows[0];

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires_at = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('DELETE FROM otp_codes WHERE email = $1', [email]);
    await db.query('INSERT INTO otp_codes (email, otp, expires_at) VALUES ($1,$2,$3)', [email, otp, expires_at]);

    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: 'SRM_KITCHEN App', email: 'aryamanyadav19@gmail.com' },
      to: [{ email }],
      subject: 'SRM_KITCHEN — Password Change Verification',
      htmlContent: `
        <div style="font-family:Arial,sans-serif;max-width:400px;margin:0 auto">
          <h2 style="color:#6C63FF">Password Change Request</h2>
          <p>Hi ${name},</p>
          <p>Your verification code to change your SRM_KITCHEN password:</p>
          <div style="background:#f0f0ff;padding:20px;text-align:center;border-radius:10px;margin:20px 0">
            <h1 style="color:#6C63FF;letter-spacing:8px;margin:0">${otp}</h1>
          </div>
          <p style="color:#888">This code expires in 10 minutes.</p>
          <p style="color:#888">If you didn't request this, someone on your device may have opened Settings.</p>
        </div>
      `
    }, { headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' } });

    res.json({ message: `OTP sent to your registered email`, email: email.replace(/(.{2}).+(@.+)/, '$1***$2') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', async (req, res) => {
  const { user_id, otp, new_password } = req.body;
  try {
    const userResult = await db.query('SELECT * FROM users WHERE user_id = $1', [user_id]);
    if (userResult.rows.length === 0) return res.status(400).json({ error: 'User not found' });
    const user = userResult.rows[0];

    // Verify OTP
    const otpResult = await db.query(
      'SELECT * FROM otp_codes WHERE email = $1 AND otp = $2',
      [user.email, otp]
    );
    if (otpResult.rows.length === 0)
      return res.status(400).json({ error: 'Invalid OTP' });
    if (new Date() > new Date(otpResult.rows[0].expires_at))
      return res.status(400).json({ error: 'OTP expired. Please request a new one.' });

    if (!new_password || new_password.length < 6)
      return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = await bcrypt.hash(new_password, 10);
    await db.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [hash, user_id]);
    await db.query('DELETE FROM otp_codes WHERE email = $1', [user.email]);
    res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/save-token', async (req, res) => {
  const { user_id, push_token, remove } = req.body;
  try {
    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    // If remove flag is present or push_token is null, we unregister the specific token
    if (remove || push_token === null) {
      if (!push_token) {
        // If they just send push_token: null, we'll clear all (per legacy behavior)
        await db.query('DELETE FROM user_push_tokens WHERE user_id = $1', [user_id]);
        await db.query('UPDATE users SET push_token = NULL WHERE user_id = $1', [user_id]);
        return res.json({ message: 'All notification tokens removed for user', userId: user_id });
      } else {
        // Unregister specific token
        await db.query('DELETE FROM user_push_tokens WHERE user_id = $1 AND push_token = $2', [user_id, push_token]);
        return res.json({ message: 'Specific device token removed', userId: user_id });
      }
    }

    const isExpoToken = /^ExponentPushToken\[.+\]$|^ExpoPushToken\[.+\]$/.test(push_token);
    if (!isExpoToken) {
      return res.status(400).json({ error: 'Invalid Expo push token format' });
    }

    // Save/Update in the multi-device table
    await db.query(
      'INSERT INTO user_push_tokens (user_id, push_token, last_used_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (user_id, push_token) DO UPDATE SET last_used_at = CURRENT_TIMESTAMP',
      [user_id, push_token]
    );

    // Keep the legacy column updated for backward compatibility (optional but safer)
    await db.query('UPDATE users SET push_token = $1 WHERE user_id = $2', [push_token, user_id]);

    res.json({ message: 'Token saved for device!', userId: user_id });
  } catch (err) { 
    console.error('Save Token Error:', err);
    res.status(500).json({ error: err.message }); 
  }
});

module.exports = router;
