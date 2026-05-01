const db = require('./config/db');

async function checkSchema() {
  const res1 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders'");
  console.log("Orders:", res1.rows);
  const res2 = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'wallet_transactions'");
  console.log("Wallet transactions:", res2.rows);
  process.exit(0);
}
checkSchema();
