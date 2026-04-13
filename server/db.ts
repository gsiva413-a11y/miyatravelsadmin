import "dotenv/config";
import sql from "mssql";

if (!process.env.DB_SERVER || !process.env.DB_DATABASE || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  throw new Error(
    "SQL Server environment variables must be set: DB_SERVER, DB_DATABASE, DB_USER, DB_PASSWORD",
  );
}

const mssqlConfig: sql.config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT || "1433", 10),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

export const pool = new sql.ConnectionPool(mssqlConfig);

export async function connectDb(): Promise<void> {
  await pool.connect();
  console.log("✓ SQL Server connected successfully");
}
