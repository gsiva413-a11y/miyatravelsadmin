import "dotenv/config";
import { pool } from "./db";

async function migrate() {
  try {
    console.log("Running migration...");

    // Create enum for enquired_service_type if it doesn't exist
    try {
      await pool.query(`
        CREATE TYPE enquired_service_type AS ENUM(
          'Flight Ticket',
          'Stamping',
          'Cab',
          'Passport / Visa',
          'Medical'
        );
      `);
      console.log("✓ Created enquired_service_type enum");
    } catch (err: any) {
      if (err.code === '42710') {
        // Error code 42710 means "duplicate object", so enum already exists
        console.log("✓ enquired_service_type enum already exists");
      } else {
        throw err;
      }
    }

    // Create service_calls table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_calls (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT NOT NULL,
        phone_number VARCHAR(20) NOT NULL,
        call_date DATE NOT NULL,
        enquired_service_type enquired_service_type,
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✓ service_calls table created");

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_service_calls_status ON service_calls(status);
      CREATE INDEX IF NOT EXISTS idx_service_calls_call_date ON service_calls(call_date);
      CREATE INDEX IF NOT EXISTS idx_service_calls_phone ON service_calls(phone_number);
    `);

    console.log("✓ Indexes created");
    console.log("✓ Migration completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  }
}

migrate();
