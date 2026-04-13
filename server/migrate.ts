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

async function migrate() {
  const pool = await sql.connect(config);
  try {
    console.log("Running SQL Server migration...");

    // Create tables using IF NOT EXISTS equivalent for SQL Server
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cash_transactions')
      CREATE TABLE cash_transactions (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        type       NVARCHAR(10)  NOT NULL,
        person_name NVARCHAR(255) NOT NULL,
        amount     DECIMAL(10,2) NOT NULL,
        reason     NVARCHAR(1000) NOT NULL,
        created_at DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ cash_transactions");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vendors')
      CREATE TABLE vendors (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        name       NVARCHAR(255) NOT NULL UNIQUE,
        total_owed DECIMAL(10,2) NOT NULL DEFAULT 0,
        created_at DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ vendors");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vehicles')
      CREATE TABLE vehicles (
        id         INT IDENTITY(1,1) PRIMARY KEY,
        car_number NVARCHAR(50)  NOT NULL UNIQUE,
        created_at DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ vehicles");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'flight_bookings')
      CREATE TABLE flight_bookings (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        client_name    NVARCHAR(255) NOT NULL,
        client_phone   NVARCHAR(50)  NOT NULL,
        reference_name NVARCHAR(255),
        reference_phone NVARCHAR(50),
        sector         NVARCHAR(100) NOT NULL,
        travel_date    DATE          NOT NULL,
        airline        NVARCHAR(100) NOT NULL,
        platform       NVARCHAR(100) NOT NULL,
        platform_notes NVARCHAR(500),
        total_amount   DECIMAL(10,2) NOT NULL,
        advance_paid   DECIMAL(10,2) DEFAULT 0,
        payment_mode   NVARCHAR(50)  DEFAULT 'Cash',
        vendor_id      INT,
        reminder_date  DATE,
        reminder_note  NVARCHAR(500),
        created_at     DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ flight_bookings");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cab_bookings')
      CREATE TABLE cab_bookings (
        id               INT IDENTITY(1,1) PRIMARY KEY,
        client_name      NVARCHAR(255) NOT NULL,
        client_phone     NVARCHAR(50)  NOT NULL,
        reference_name   NVARCHAR(255),
        reference_phone  NVARCHAR(50),
        travel_date      DATE          NOT NULL,
        pickup_location  NVARCHAR(500) NOT NULL,
        drop_location    NVARCHAR(500) NOT NULL,
        vehicle_id       INT REFERENCES vehicles(id),
        total_amount     DECIMAL(10,2) NOT NULL,
        advance_amount   DECIMAL(10,2) NOT NULL DEFAULT 0,
        payment_mode     NVARCHAR(50)  DEFAULT 'Cash',
        vendor_id        INT,
        reminder_date    DATE,
        reminder_note    NVARCHAR(500),
        created_at       DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ cab_bookings");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'cab_runs')
      CREATE TABLE cab_runs (
        id                INT IDENTITY(1,1) PRIMARY KEY,
        booking_id        INT REFERENCES cab_bookings(id),
        client_name       NVARCHAR(255),
        advance_amount    DECIMAL(10,2) DEFAULT 0,
        reference_name    NVARCHAR(255),
        reference_phone   NVARCHAR(50),
        members           NVARCHAR(MAX) DEFAULT '[]',
        start_km          INT,
        closing_km        INT,
        total_price       DECIMAL(10,2) DEFAULT 0,
        pending_amount    DECIMAL(10,2) DEFAULT 0,
        is_return_trip    BIT           DEFAULT 0,
        return_date       DATE,
        return_members    NVARCHAR(MAX) DEFAULT '[]',
        return_advance    DECIMAL(10,2) DEFAULT 0,
        driver_collection DECIMAL(10,2) DEFAULT 0,
        expense_diesel    DECIMAL(10,2) DEFAULT 0,
        expense_toll      DECIMAL(10,2) DEFAULT 0,
        expense_parking   DECIMAL(10,2) DEFAULT 0,
        expense_others    DECIMAL(10,2) DEFAULT 0,
        driver_salary     DECIMAL(10,2) DEFAULT 0,
        created_at        DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ cab_runs");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'visa_applications')
      CREATE TABLE visa_applications (
        id               INT IDENTITY(1,1) PRIMARY KEY,
        client_name      NVARCHAR(255) NOT NULL,
        passport_number  NVARCHAR(50)  NOT NULL,
        phone            NVARCHAR(50)  NOT NULL,
        visa_type        NVARCHAR(100) NOT NULL,
        medical_status   NVARCHAR(20)  NOT NULL DEFAULT 'pending',
        pcc_status       NVARCHAR(20)  NOT NULL DEFAULT 'locked',
        stamping_status  NVARCHAR(20)  NOT NULL DEFAULT 'locked',
        payment_mode     NVARCHAR(50)  DEFAULT 'Cash',
        vendor_id        INT,
        created_at       DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ visa_applications");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'credit_cards')
      CREATE TABLE credit_cards (
        id             INT IDENTITY(1,1) PRIMARY KEY,
        card_name      NVARCHAR(255) NOT NULL,
        bank_name      NVARCHAR(255) NOT NULL,
        total_limit    DECIMAL(10,2) NOT NULL,
        used_amount    DECIMAL(10,2) NOT NULL DEFAULT 0,
        next_bill_date DATE          NOT NULL,
        created_at     DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ credit_cards");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'attestation_services')
      CREATE TABLE attestation_services (
        id               INT IDENTITY(1,1) PRIMARY KEY,
        client_name      NVARCHAR(255) NOT NULL,
        phone            NVARCHAR(50)  NOT NULL,
        reference_name   NVARCHAR(255),
        reference_phone  NVARCHAR(50),
        document_type    NVARCHAR(255) NOT NULL,
        target_country   NVARCHAR(100) NOT NULL,
        service_charge   DECIMAL(10,2) NOT NULL,
        our_cost         DECIMAL(10,2) NOT NULL DEFAULT 0,
        advance_received DECIMAL(10,2) NOT NULL DEFAULT 0,
        payment_mode     NVARCHAR(50)  DEFAULT 'Cash',
        vendor_id        INT,
        created_at       DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ attestation_services");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_payments')
      CREATE TABLE vendor_payments (
        id           INT IDENTITY(1,1) PRIMARY KEY,
        vendor_id    INT           NOT NULL REFERENCES vendors(id),
        amount       DECIMAL(10,2) NOT NULL,
        payment_date DATE          NOT NULL,
        notes        NVARCHAR(500),
        created_at   DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ vendor_payments");

    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'service_calls')
      CREATE TABLE service_calls (
        id                    INT IDENTITY(1,1) PRIMARY KEY,
        name                  NVARCHAR(255) NOT NULL,
        address               NVARCHAR(1000) NOT NULL,
        phone_number          NVARCHAR(50)  NOT NULL,
        call_date             DATE          NOT NULL,
        enquired_service_type NVARCHAR(50),
        status                NVARCHAR(20)  NOT NULL DEFAULT 'pending',
        notes                 NVARCHAR(2000),
        created_at            DATETIME2     DEFAULT GETDATE(),
        updated_at            DATETIME2     DEFAULT GETDATE()
      );
    `);
    console.log("✓ service_calls");

    // Indexes
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_service_calls_status')
        CREATE INDEX idx_service_calls_status ON service_calls(status);
    `);
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_service_calls_call_date')
        CREATE INDEX idx_service_calls_call_date ON service_calls(call_date);
    `);
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_service_calls_phone')
        CREATE INDEX idx_service_calls_phone ON service_calls(phone_number);
    `);
    console.log("✓ Indexes created");

    console.log("✓ Migration completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.close();
  }
}

migrate();
