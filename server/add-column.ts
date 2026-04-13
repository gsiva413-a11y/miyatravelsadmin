import "dotenv/config";
import sql from "mssql";

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

async function addMissingColumn() {
  const pool = await sql.connect(config);
  try {
    console.log("Checking if enquired_service_type column exists...");

    const result = await pool.request().query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_NAME = 'service_calls'
        AND COLUMN_NAME = 'enquired_service_type'
    `);

    if (result.recordset.length > 0) {
      console.log("Column already exists!");
      return;
    }

    console.log("Column not found. Adding...");

    await pool.request().query(`
      ALTER TABLE service_calls
      ADD enquired_service_type NVARCHAR(50) NULL;
    `);

    console.log("Column added successfully!");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
  } finally {
    await pool.close();
    process.exit(0);
  }
}

addMissingColumn();
