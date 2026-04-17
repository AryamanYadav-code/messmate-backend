 const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.sessionId) {
      const sessionCheck = await db.query('SELECT 1 FROM user_sessions WHERE session_id = $1', [decoded.sessionId]);
      if (sessionCheck.rows.length === 0) {
        return res.status(401).json({ error: 'Session expired or logged out from another device' });
      }
    }

    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
