const db = require('./config/db');

async function migrate() {
  try {
    console.log('Adding payment_method to orders...');
    await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'wallet'");
    console.log('Successfully added payment_method to orders table.');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
migrate();
