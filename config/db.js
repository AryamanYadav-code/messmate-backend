const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err, client, release) => {
  if (err) {
    console.log('DB Connection Failed:', err.message);
    return;
  }
  release();
  console.log('Supabase PostgreSQL Connected!');
});

module.exports = pool;