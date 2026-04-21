const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const db = require('../config/db');
const auth = require('../middleware/auth');

// Middleware to check if user is superadmin
const isSuperAdmin = (req) => req.user.role === 'superadmin';

// Middleware to verify superadmin role
const verifySuperAdmin = (req, res, next) => {
  if (!isSuperAdmin(req)) {
    return res.status(403).json({ error: 'Access denied. Superadmin only.' });
  }
  next();
};

// --- PUBLIC ROUTES (No JWT required) ---

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
        <p>Your SRM_KITCHEN staff account has been verified successfully.</p>
        <p>You can now login to the SRM_KITCHEN app with your credentials.</p>
        <div style="margin-top: 20px; padding: 20px; background: #f0f0ff; border-radius: 10px;">
          <p><strong>Email:</strong> ${email}</p>
        </div>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send('Something went wrong');
  }
});

// --- PROTECTED ROUTES (JWT required) ---
router.use(auth); 

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const orders = await db.query('SELECT COUNT(*) as total_orders FROM orders');
    const users = await db.query('SELECT COUNT(*) as total_users FROM users WHERE role = $1', ['student']);
    const revenue = await db.query('SELECT SUM(total_amount) as revenue FROM orders WHERE status IN ($1,$2)', ['delivered', 'ready']);
    const scheduled = await db.query('SELECT COUNT(*) as scheduled_count FROM orders WHERE is_scheduled = true AND status = $1', ['pending']);
    
    res.json({
      total_orders: orders.rows[0].total_orders,
      total_users: users.rows[0].total_users,
      revenue: revenue.rows[0].revenue || 0,
      scheduled_count: scheduled.rows[0].scheduled_count || 0
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all students (searchable) - Superadmin only
router.get('/students', verifySuperAdmin, async (req, res) => {
  const { search } = req.query;
  try {
    let query = `
      SELECT 
        u.user_id, 
        COALESCE(u.name, 'Registered Student') as name, 
        u.email, 
        u.wallet_balance, 
        u.is_verified, 
        u.is_active, 
        u.push_token, 
        u.created_at,
        COUNT(o.order_id) as total_orders
      FROM users u
      LEFT JOIN orders o ON u.user_id = o.user_id
      WHERE u.role = $1
    `;
    const params = ['student'];

    if (search) {
      query += ` AND (u.name ILIKE $2 OR u.email ILIKE $2 OR u.user_id::text ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += ` GROUP BY u.user_id ORDER BY u.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Adjust student balance - Superadmin only
router.post('/students/:id/adjust-balance', verifySuperAdmin, async (req, res) => {
  const { amount } = req.body;
  if (isNaN(amount)) return res.status(400).json({ error: 'Invalid amount' });

  try {
    const userId = req.params.id;
    await db.query(
      'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE user_id = $2 AND role = $3',
      [amount, userId, 'student']
    );

    // Track the transaction
    await db.query(
      'INSERT INTO wallet_transactions (user_id, amount, type, payment_method) VALUES ($1, $2, $3, $4)',
      [userId, Math.abs(amount), amount > 0 ? 'credit' : 'debit', 'Admin Adjust']
    );

    res.json({ message: 'Balance adjusted successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Remove or Deactivate student - Superadmin only
router.delete('/students/:id', verifySuperAdmin, async (req, res) => {
  const { mode = 'soft' } = req.query; // 'soft' (deactivate) or 'hard' (delete)
  
  try {
    if (mode === 'soft') {
      await db.query('UPDATE users SET is_active = false WHERE user_id = $1 AND role = $2', [req.params.id, 'student']);
      return res.json({ message: 'Student account deactivated!' });
    }

    if (mode === 'hard') {
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        
        await client.query('DELETE FROM user_push_tokens WHERE user_id = $1', [req.params.id]);
        await client.query('DELETE FROM feedback WHERE user_id = $1', [req.params.id]);
        await client.query(`
          DELETE FROM order_items 
          WHERE order_id IN (SELECT order_id FROM orders WHERE user_id = $1)
        `, [req.params.id]);
        await client.query('DELETE FROM orders WHERE user_id = $1', [req.params.id]);
        await client.query('DELETE FROM wallet_transactions WHERE user_id = $1', [req.params.id]);
        await client.query('DELETE FROM user_sessions WHERE user_id = $1', [req.params.id]);
        await client.query('DELETE FROM users WHERE user_id = $1 AND role = $2', [req.params.id, 'student']);
        
        await client.query('COMMIT');
        return res.json({ message: 'Student and all related records deleted permanently!' });
      } catch (txErr) {
        await client.query('ROLLBACK');
        throw txErr;
      } finally {
        client.release();
      }
    }

    res.status(400).json({ error: 'Invalid deletion mode' });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
});

// Get all staff (searchable/sub-admins) - Superadmin only
router.get('/staff', verifySuperAdmin, async (req, res) => {
  const { search } = req.query;
  try {
    let query = `SELECT user_id, name, email, push_token, is_active, created_at FROM users WHERE role = $1`;
    const params = ['admin'];

    if (search) {
      query += ` AND (name ILIKE $2 OR email ILIKE $2)`;
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Toggle user status (Deactivate/Activate) - Superadmin only
router.patch('/users/:id/status', verifySuperAdmin, async (req, res) => {
  const { is_active } = req.body;
  try {
    await db.query('UPDATE users SET is_active = $1 WHERE user_id = $2', [is_active, req.params.id]);
    res.json({ message: `Account ${is_active ? 'activated' : 'deactivated'} successfully!` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});



// Register staff with email verification - Superadmin only
router.post('/staff', verifySuperAdmin, async (req, res) => {
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
      sender: { name: 'SRM_KITCHEN App', email: 'aryamanyadav19@gmail.com' },
      to: [{ email: cleanEmail }],
      subject: 'SRM_KITCHEN Staff Account Verification',
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #6C63FF;">Welcome to SRM_KITCHEN Staff!</h2>
          <p>Hi ${cleanName},</p>
          <p>You have been registered as a staff member on SRM_KITCHEN. Click the button below to verify your account:</p>
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

// Send test notification
router.post('/test-notification', async (req, res) => {
  const { user_id } = req.body;
  const { broadcastPushNotification } = require('../utils/notifications');
  
  console.log(`[Test Notif] Request for user_id: ${user_id}`);
  
  try {
    const result = await db.query('SELECT name, email FROM users WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) {
      console.log(`[Test Notif] User ${user_id} not found`);
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = result.rows[0];
    console.log(`[Test Notif] Target: ${user.name} (${user.email})`);
    
    await broadcastPushNotification(
      user_id,
      'Test Bell 🔔',
      `For ${user.name} (Multi-device Test)`,
    );
    
    return res.json({ 
      message: 'Test notification broadcast sent!', 
      target: user.name 
    });
  } catch (err) { 
    console.error(`[Test Notif] FATAL Error: ${err.message}`);
    res.status(500).json({ error: 'Internal Server Error during notification' }); 
  }
});

// Remove staff - Superadmin only
router.delete('/staff/:id', verifySuperAdmin, async (req, res) => {
  try {
    await db.query('DELETE FROM users WHERE user_id = $1 AND role = $2', [req.params.id, 'admin']);
    res.json({ message: 'Staff removed!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Full analytics
router.get('/analytics', async (req, res) => {
  try {
    // Revenue by day (last 7 days)
    const revenueByDay = await db.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(total_amount) as revenue,
        COUNT(*) as order_count
      FROM orders
      WHERE status IN ('delivered', 'ready')
      AND created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Most ordered items
    const topItems = await db.query(`
      SELECT 
        m.name,
        m.category,
        m.is_veg,
        SUM(oi.quantity) as total_ordered,
        SUM(oi.quantity * oi.price_at_order) as total_revenue
      FROM order_items oi
      JOIN menu_items m ON oi.item_id = m.item_id
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status IN ('delivered', 'ready')
      GROUP BY m.item_id, m.name, m.category, m.is_veg
      ORDER BY total_ordered DESC
      LIMIT 5
    `);

    // Orders by meal slot
    const bySlot = await db.query(`
      SELECT 
        meal_slot,
        COUNT(*) as count,
        SUM(total_amount) as revenue
      FROM orders
      WHERE status IN ('delivered', 'ready')
      GROUP BY meal_slot
    `);

    // Orders by hour
    const byHour = await db.query(`
      SELECT 
        EXTRACT(HOUR FROM created_at) as hour,
        COUNT(*) as count
      FROM orders
      GROUP BY hour
      ORDER BY hour ASC
    `);

    // Average rating
    const avgRating = await db.query(`
      SELECT 
        AVG(rating) as avg_rating,
        COUNT(*) as total_reviews
      FROM feedback
    `);

    // Rating distribution
    const ratingDist = await db.query(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM feedback
      GROUP BY rating
      ORDER BY rating DESC
    `);

    // Total stats
    const totalStats = await db.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status IN ('delivered','ready') THEN total_amount ELSE 0 END) as total_revenue,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_orders,
        COUNT(CASE WHEN is_scheduled = true THEN 1 END) as scheduled_orders
      FROM orders
    `);

    // New students this week
    const newStudents = await db.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role = 'student'
      AND created_at >= NOW() - INTERVAL '7 days'
    `);

    res.json({
      revenueByDay: revenueByDay.rows,
      topItems: topItems.rows,
      bySlot: bySlot.rows,
      byHour: byHour.rows,
      avgRating: avgRating.rows[0],
      ratingDist: ratingDist.rows,
      totalStats: totalStats.rows[0],
      newStudents: newStudents.rows[0].count
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
