const db = require('../config/db');

async function migrate() {
    try {
        console.log("Starting migration...");
        await db.query(`
            ALTER TABLE wallet_transactions 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed',
            ADD COLUMN IF NOT EXISTS transaction_ref VARCHAR(50);
        `);
        // Update existing ones to completed
        await db.query(`UPDATE wallet_transactions SET status = 'completed' WHERE status IS NULL`);
        console.log("Migration successful!");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
