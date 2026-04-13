import sql from "mssql";
import { pool } from "./db";
import {
  type InsertCashTransaction, type InsertFlightBooking, type InsertVehicle, type InsertCabBooking,
  type InsertCabRun, type InsertVisaApplication, type InsertCreditCard, type InsertVendor,
  type InsertVendorPayment, type InsertAttestationService, type InsertServiceCall,
  type CashTransaction, type FlightBooking, type Vehicle, type CabBooking, type CabRun,
  type VisaApplication, type CreditCard, type Vendor, type VendorPayment,
  type AttestationService, type ServiceCall,
} from "@shared/schema";

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/** Convert a Date or Date-string to YYYY-MM-DD, or null. */
function fmt(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === "string") return d.substring(0, 10);
  return d.toISOString().substring(0, 10);
}

/** Parse decimal values to string (mssql may return number). */
function dec(v: unknown): string {
  if (v === null || v === undefined) return "0";
  return String(v);
}

/** Convert SQL bit (0/1) to boolean. */
function bit(v: unknown): boolean {
  return v === true || v === 1;
}

/** Parse JSON stored in nvarchar(max). */
function parseJson(v: unknown): unknown {
  if (v === null || v === undefined) return [];
  if (typeof v === "string") { try { return JSON.parse(v); } catch { return []; } }
  return v;
}

/** Map a raw DB row (snake_case) to a CashTransaction. */
function mapCashTx(r: Record<string, unknown>): CashTransaction {
  return {
    id: r.id as number,
    type: r.type as string,
    personName: r.person_name as string,
    amount: dec(r.amount),
    reason: r.reason as string,
    createdAt: r.created_at as Date | null,
  };
}

/** Map a raw DB row to a FlightBooking. */
function mapFlight(r: Record<string, unknown>): FlightBooking {
  return {
    id: r.id as number,
    clientName: r.client_name as string,
    clientPhone: r.client_phone as string,
    referenceName: (r.reference_name as string) ?? null,
    referencePhone: (r.reference_phone as string) ?? null,
    sector: r.sector as string,
    travelDate: fmt(r.travel_date as Date | string) ?? "",
    airline: r.airline as string,
    platform: r.platform as string,
    platformNotes: (r.platform_notes as string) ?? null,
    totalAmount: dec(r.total_amount),
    advancePaid: r.advance_paid != null ? dec(r.advance_paid) : null,
    paymentMode: (r.payment_mode as string) ?? null,
    vendorId: (r.vendor_id as number) ?? null,
    reminderDate: r.reminder_date ? fmt(r.reminder_date as Date | string) : null,
    reminderNote: (r.reminder_note as string) ?? null,
    createdAt: r.created_at as Date | null,
  };
}

function mapVehicle(r: Record<string, unknown>): Vehicle {
  return {
    id: r.id as number,
    carNumber: r.car_number as string,
    createdAt: r.created_at as Date | null,
  };
}

function mapCabBooking(r: Record<string, unknown>): CabBooking {
  return {
    id: r.id as number,
    clientName: r.client_name as string,
    clientPhone: r.client_phone as string,
    referenceName: (r.reference_name as string) ?? null,
    referencePhone: (r.reference_phone as string) ?? null,
    travelDate: fmt(r.travel_date as Date | string) ?? "",
    pickupLocation: r.pickup_location as string,
    dropLocation: r.drop_location as string,
    vehicleId: (r.vehicle_id as number) ?? null,
    totalAmount: dec(r.total_amount),
    advanceAmount: dec(r.advance_amount),
    paymentMode: (r.payment_mode as string) ?? null,
    vendorId: (r.vendor_id as number) ?? null,
    reminderDate: r.reminder_date ? fmt(r.reminder_date as Date | string) : null,
    reminderNote: (r.reminder_note as string) ?? null,
    createdAt: r.created_at as Date | null,
  };
}

function mapCabRun(r: Record<string, unknown>): CabRun {
  return {
    id: r.id as number,
    bookingId: (r.booking_id as number) ?? null,
    clientName: (r.client_name as string) ?? null,
    advanceAmount: r.advance_amount != null ? dec(r.advance_amount) : null,
    referenceName: (r.reference_name as string) ?? null,
    referencePhone: (r.reference_phone as string) ?? null,
    members: parseJson(r.members),
    startKm: (r.start_km as number) ?? null,
    closingKm: (r.closing_km as number) ?? null,
    totalPrice: r.total_price != null ? dec(r.total_price) : null,
    pendingAmount: r.pending_amount != null ? dec(r.pending_amount) : null,
    isReturnTrip: r.is_return_trip != null ? bit(r.is_return_trip) : null,
    returnDate: r.return_date ? fmt(r.return_date as Date | string) : null,
    returnMembers: parseJson(r.return_members),
    returnAdvance: r.return_advance != null ? dec(r.return_advance) : null,
    driverCollection: r.driver_collection != null ? dec(r.driver_collection) : null,
    expenseDiesel: r.expense_diesel != null ? dec(r.expense_diesel) : null,
    expenseToll: r.expense_toll != null ? dec(r.expense_toll) : null,
    expenseParking: r.expense_parking != null ? dec(r.expense_parking) : null,
    expenseOthers: r.expense_others != null ? dec(r.expense_others) : null,
    driverSalary: r.driver_salary != null ? dec(r.driver_salary) : null,
    createdAt: r.created_at as Date | null,
  };
}

function mapVisa(r: Record<string, unknown>): VisaApplication {
  return {
    id: r.id as number,
    clientName: r.client_name as string,
    passportNumber: r.passport_number as string,
    phone: r.phone as string,
    visaType: r.visa_type as string,
    medicalStatus: (r.medical_status as string) ?? "pending",
    pccStatus: (r.pcc_status as string) ?? "locked",
    stampingStatus: (r.stamping_status as string) ?? "locked",
    paymentMode: (r.payment_mode as string) ?? null,
    vendorId: (r.vendor_id as number) ?? null,
    createdAt: r.created_at as Date | null,
  };
}

function mapCreditCard(r: Record<string, unknown>): CreditCard {
  return {
    id: r.id as number,
    cardName: r.card_name as string,
    bankName: r.bank_name as string,
    totalLimit: dec(r.total_limit),
    usedAmount: dec(r.used_amount),
    nextBillDate: fmt(r.next_bill_date as Date | string) ?? "",
    createdAt: r.created_at as Date | null,
  };
}

function mapVendor(r: Record<string, unknown>): Vendor {
  return {
    id: r.id as number,
    name: r.name as string,
    totalOwed: dec(r.total_owed),
    createdAt: r.created_at as Date | null,
  };
}

function mapVendorPayment(r: Record<string, unknown>): VendorPayment {
  return {
    id: r.id as number,
    vendorId: r.vendor_id as number,
    amount: dec(r.amount),
    paymentDate: fmt(r.payment_date as Date | string) ?? "",
    notes: (r.notes as string) ?? null,
    createdAt: r.created_at as Date | null,
  };
}

function mapAttestation(r: Record<string, unknown>): AttestationService {
  return {
    id: r.id as number,
    clientName: r.client_name as string,
    phone: r.phone as string,
    referenceName: (r.reference_name as string) ?? null,
    referencePhone: (r.reference_phone as string) ?? null,
    documentType: r.document_type as string,
    targetCountry: r.target_country as string,
    serviceCharge: dec(r.service_charge),
    ourCost: dec(r.our_cost),
    advanceReceived: dec(r.advance_received),
    paymentMode: (r.payment_mode as string) ?? null,
    vendorId: (r.vendor_id as number) ?? null,
    createdAt: r.created_at as Date | null,
  };
}

function mapServiceCall(r: Record<string, unknown>): ServiceCall {
  return {
    id: r.id as number,
    name: r.name as string,
    address: r.address as string,
    phoneNumber: r.phone_number as string,
    callDate: fmt(r.call_date as Date | string) ?? "",
    enquiredServiceType: (r.enquired_service_type as string) ?? null,
    status: (r.status as string) ?? "pending",
    notes: (r.notes as string) ?? null,
    createdAt: r.created_at as Date | null,
    updatedAt: r.updated_at as Date | null,
  };
}

// ─────────────────────────────────────────────────────────────────
// IStorage interface
// ─────────────────────────────────────────────────────────────────
export interface IStorage {
  getCashTransactions(): Promise<CashTransaction[]>;
  createCashTransaction(data: InsertCashTransaction): Promise<CashTransaction>;
  getCashStats(): Promise<{ totalBalance: number; totalIn: number; totalOut: number }>;

  getFlightBookings(): Promise<FlightBooking[]>;
  createFlightBooking(data: InsertFlightBooking): Promise<FlightBooking>;
  updateFlightBooking(id: number, data: Partial<InsertFlightBooking>): Promise<FlightBooking | undefined>;
  deleteFlightBooking(id: number): Promise<void>;

  getVehicles(): Promise<Vehicle[]>;
  createVehicle(data: InsertVehicle): Promise<Vehicle>;

  getCabBookings(): Promise<(CabBooking & { vehicle: Vehicle | null })[]>;
  createCabBooking(data: InsertCabBooking): Promise<CabBooking>;
  updateCabBooking(id: number, data: Partial<InsertCabBooking>): Promise<CabBooking | undefined>;
  getCabBooking(id: number): Promise<CabBooking | undefined>;

  getCabRuns(): Promise<CabRun[]>;
  createCabRun(data: InsertCabRun): Promise<CabRun>;
  updateCabRun(id: number, data: Partial<InsertCabRun>): Promise<CabRun | undefined>;

  getVisaApplications(search?: string): Promise<VisaApplication[]>;
  createVisaApplication(data: InsertVisaApplication): Promise<VisaApplication>;
  updateVisaApplication(id: number, data: Partial<InsertVisaApplication>): Promise<VisaApplication | undefined>;

  getCreditCards(): Promise<CreditCard[]>;
  createCreditCard(data: InsertCreditCard): Promise<CreditCard>;
  updateCreditCard(id: number, data: Partial<InsertCreditCard>): Promise<CreditCard | undefined>;
  repayCreditCard(id: number, amount: number): Promise<CreditCard | undefined>;

  getVendors(): Promise<Vendor[]>;
  createVendor(data: InsertVendor): Promise<Vendor>;
  updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined>;
  recordVendorPayment(data: InsertVendorPayment): Promise<VendorPayment>;
  updateVendorBalance(id: number, amount: number): Promise<void>;

  getAttestationServices(): Promise<AttestationService[]>;
  createAttestationService(data: InsertAttestationService): Promise<AttestationService>;
  updateAttestationService(id: number, data: Partial<InsertAttestationService>): Promise<AttestationService | undefined>;
  deleteAttestationService(id: number): Promise<void>;

  getServiceCalls(status?: string): Promise<ServiceCall[]>;
  getServiceCall(id: number): Promise<ServiceCall | undefined>;
  createServiceCall(data: InsertServiceCall): Promise<ServiceCall>;
  updateServiceCall(id: number, data: Partial<InsertServiceCall>): Promise<ServiceCall | undefined>;
  deleteServiceCall(id: number): Promise<void>;
  getServiceCallStats(): Promise<{ total: number; pending: number; remainder: number; completed: number; cancelled: number }>;

  searchGlobal(query: string): Promise<{ visa: VisaApplication[]; flights: FlightBooking[]; cabs: CabBooking[] }>;
}

// ─────────────────────────────────────────────────────────────────
// DatabaseStorage — raw SQL Server queries via mssql
// ─────────────────────────────────────────────────────────────────
export class DatabaseStorage implements IStorage {

  // ── CASH ──────────────────────────────────────────────────────

  async getCashTransactions(): Promise<CashTransaction[]> {
    const r = await pool.request().query(
      `SELECT * FROM cash_transactions ORDER BY created_at DESC`
    );
    return r.recordset.map(mapCashTx);
  }

  async createCashTransaction(data: InsertCashTransaction): Promise<CashTransaction> {
    const r = await pool.request()
      .input("type", sql.NVarChar(10), data.type)
      .input("personName", sql.NVarChar(255), data.personName)
      .input("amount", sql.Decimal(10, 2), parseFloat(data.amount))
      .input("reason", sql.NVarChar(1000), data.reason)
      .query(`
        INSERT INTO cash_transactions (type, person_name, amount, reason)
        OUTPUT INSERTED.*
        VALUES (@type, @personName, @amount, @reason)
      `);
    return mapCashTx(r.recordset[0]);
  }

  async getCashStats(): Promise<{ totalBalance: number; totalIn: number; totalOut: number }> {
    const txs = await this.getCashTransactions();
    let totalIn = 0, totalOut = 0;
    for (const t of txs) {
      const amt = Number(t.amount);
      if (t.type === "in") totalIn += amt; else totalOut += amt;
    }
    return { totalBalance: totalIn - totalOut, totalIn, totalOut };
  }

  // ── FLIGHTS ───────────────────────────────────────────────────

  async getFlightBookings(): Promise<FlightBooking[]> {
    const r = await pool.request().query(
      `SELECT * FROM flight_bookings ORDER BY created_at DESC`
    );
    return r.recordset.map(mapFlight);
  }

  async createFlightBooking(data: InsertFlightBooking): Promise<FlightBooking> {
    const r = await pool.request()
      .input("clientName", sql.NVarChar(255), data.clientName)
      .input("clientPhone", sql.NVarChar(50), data.clientPhone)
      .input("referenceName", sql.NVarChar(255), data.referenceName ?? null)
      .input("referencePhone", sql.NVarChar(50), data.referencePhone ?? null)
      .input("sector", sql.NVarChar(100), data.sector)
      .input("travelDate", sql.Date, data.travelDate)
      .input("airline", sql.NVarChar(100), data.airline)
      .input("platform", sql.NVarChar(100), data.platform)
      .input("platformNotes", sql.NVarChar(500), data.platformNotes ?? null)
      .input("totalAmount", sql.Decimal(10, 2), parseFloat(data.totalAmount))
      .input("advancePaid", sql.Decimal(10, 2), data.advancePaid ? parseFloat(data.advancePaid) : 0)
      .input("paymentMode", sql.NVarChar(50), data.paymentMode ?? "Cash")
      .input("vendorId", sql.Int, data.vendorId ?? null)
      .input("reminderDate", sql.Date, data.reminderDate ?? null)
      .input("reminderNote", sql.NVarChar(500), data.reminderNote ?? null)
      .query(`
        INSERT INTO flight_bookings
          (client_name, client_phone, reference_name, reference_phone, sector, travel_date,
           airline, platform, platform_notes, total_amount, advance_paid, payment_mode,
           vendor_id, reminder_date, reminder_note)
        OUTPUT INSERTED.*
        VALUES
          (@clientName, @clientPhone, @referenceName, @referencePhone, @sector, @travelDate,
           @airline, @platform, @platformNotes, @totalAmount, @advancePaid, @paymentMode,
           @vendorId, @reminderDate, @reminderNote)
      `);
    const booking = mapFlight(r.recordset[0]);
    if (data.paymentMode === "Credit/Pay Later" && data.vendorId) {
      await this.updateVendorBalance(data.vendorId, Number(data.totalAmount));
    }
    return booking;
  }

  async updateFlightBooking(id: number, data: Partial<InsertFlightBooking>): Promise<FlightBooking | undefined> {
    const sets: string[] = [];
    const req = pool.request().input("id", sql.Int, id);
    if (data.clientName !== undefined) { sets.push("client_name = @clientName"); req.input("clientName", sql.NVarChar(255), data.clientName); }
    if (data.clientPhone !== undefined) { sets.push("client_phone = @clientPhone"); req.input("clientPhone", sql.NVarChar(50), data.clientPhone); }
    if (data.referenceName !== undefined) { sets.push("reference_name = @referenceName"); req.input("referenceName", sql.NVarChar(255), data.referenceName ?? null); }
    if (data.referencePhone !== undefined) { sets.push("reference_phone = @referencePhone"); req.input("referencePhone", sql.NVarChar(50), data.referencePhone ?? null); }
    if (data.sector !== undefined) { sets.push("sector = @sector"); req.input("sector", sql.NVarChar(100), data.sector); }
    if (data.travelDate !== undefined) { sets.push("travel_date = @travelDate"); req.input("travelDate", sql.Date, data.travelDate); }
    if (data.airline !== undefined) { sets.push("airline = @airline"); req.input("airline", sql.NVarChar(100), data.airline); }
    if (data.platform !== undefined) { sets.push("platform = @platform"); req.input("platform", sql.NVarChar(100), data.platform); }
    if (data.platformNotes !== undefined) { sets.push("platform_notes = @platformNotes"); req.input("platformNotes", sql.NVarChar(500), data.platformNotes ?? null); }
    if (data.totalAmount !== undefined) { sets.push("total_amount = @totalAmount"); req.input("totalAmount", sql.Decimal(10, 2), parseFloat(data.totalAmount)); }
    if (data.advancePaid !== undefined) { sets.push("advance_paid = @advancePaid"); req.input("advancePaid", sql.Decimal(10, 2), data.advancePaid ? parseFloat(data.advancePaid) : 0); }
    if (data.paymentMode !== undefined) { sets.push("payment_mode = @paymentMode"); req.input("paymentMode", sql.NVarChar(50), data.paymentMode ?? null); }
    if (data.vendorId !== undefined) { sets.push("vendor_id = @vendorId"); req.input("vendorId", sql.Int, data.vendorId ?? null); }
    if (data.reminderDate !== undefined) { sets.push("reminder_date = @reminderDate"); req.input("reminderDate", sql.Date, data.reminderDate ?? null); }
    if (data.reminderNote !== undefined) { sets.push("reminder_note = @reminderNote"); req.input("reminderNote", sql.NVarChar(500), data.reminderNote ?? null); }
    if (sets.length === 0) return undefined;
    const r = await req.query(`UPDATE flight_bookings SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapFlight(r.recordset[0]) : undefined;
  }

  async deleteFlightBooking(id: number): Promise<void> {
    await pool.request().input("id", sql.Int, id).query(`DELETE FROM flight_bookings WHERE id = @id`);
  }

  // ── VEHICLES ──────────────────────────────────────────────────

  async getVehicles(): Promise<Vehicle[]> {
    const r = await pool.request().query(`SELECT * FROM vehicles`);
    return r.recordset.map(mapVehicle);
  }

  async createVehicle(data: InsertVehicle): Promise<Vehicle> {
    const r = await pool.request()
      .input("carNumber", sql.NVarChar(50), data.carNumber.toUpperCase())
      .query(`INSERT INTO vehicles (car_number) OUTPUT INSERTED.* VALUES (@carNumber)`);
    return mapVehicle(r.recordset[0]);
  }

  // ── CAB BOOKINGS ──────────────────────────────────────────────

  async getCabBookings(): Promise<(CabBooking & { vehicle: Vehicle | null })[]> {
    const r = await pool.request().query(`
      SELECT cb.*, v.id AS v_id, v.car_number AS v_car_number, v.created_at AS v_created_at
      FROM cab_bookings cb
      LEFT JOIN vehicles v ON cb.vehicle_id = v.id
      ORDER BY cb.created_at DESC
    `);
    return r.recordset.map((row: Record<string, unknown>) => ({
      ...mapCabBooking(row),
      vehicle: row.v_id != null
        ? { id: row.v_id as number, carNumber: row.v_car_number as string, createdAt: row.v_created_at as Date | null }
        : null,
    }));
  }

  async createCabBooking(data: InsertCabBooking): Promise<CabBooking> {
    const r = await pool.request()
      .input("clientName", sql.NVarChar(255), data.clientName)
      .input("clientPhone", sql.NVarChar(50), data.clientPhone)
      .input("referenceName", sql.NVarChar(255), data.referenceName ?? null)
      .input("referencePhone", sql.NVarChar(50), data.referencePhone ?? null)
      .input("travelDate", sql.Date, data.travelDate)
      .input("pickupLocation", sql.NVarChar(500), data.pickupLocation)
      .input("dropLocation", sql.NVarChar(500), data.dropLocation)
      .input("vehicleId", sql.Int, data.vehicleId ?? null)
      .input("totalAmount", sql.Decimal(10, 2), parseFloat(data.totalAmount))
      .input("advanceAmount", sql.Decimal(10, 2), data.advanceAmount ? parseFloat(data.advanceAmount) : 0)
      .input("paymentMode", sql.NVarChar(50), data.paymentMode ?? "Cash")
      .input("vendorId", sql.Int, data.vendorId ?? null)
      .input("reminderDate", sql.Date, data.reminderDate ?? null)
      .input("reminderNote", sql.NVarChar(500), data.reminderNote ?? null)
      .query(`
        INSERT INTO cab_bookings
          (client_name, client_phone, reference_name, reference_phone, travel_date,
           pickup_location, drop_location, vehicle_id, total_amount, advance_amount,
           payment_mode, vendor_id, reminder_date, reminder_note)
        OUTPUT INSERTED.*
        VALUES
          (@clientName, @clientPhone, @referenceName, @referencePhone, @travelDate,
           @pickupLocation, @dropLocation, @vehicleId, @totalAmount, @advanceAmount,
           @paymentMode, @vendorId, @reminderDate, @reminderNote)
      `);
    const booking = mapCabBooking(r.recordset[0]);
    if (data.paymentMode === "Credit/Pay Later" && data.vendorId) {
      await this.updateVendorBalance(data.vendorId, Number(data.totalAmount));
    }
    return booking;
  }

  async updateCabBooking(id: number, data: Partial<InsertCabBooking>): Promise<CabBooking | undefined> {
    const sets: string[] = [];
    const req = pool.request().input("id", sql.Int, id);
    if (data.clientName !== undefined) { sets.push("client_name = @clientName"); req.input("clientName", sql.NVarChar(255), data.clientName); }
    if (data.clientPhone !== undefined) { sets.push("client_phone = @clientPhone"); req.input("clientPhone", sql.NVarChar(50), data.clientPhone); }
    if (data.referenceName !== undefined) { sets.push("reference_name = @referenceName"); req.input("referenceName", sql.NVarChar(255), data.referenceName ?? null); }
    if (data.referencePhone !== undefined) { sets.push("reference_phone = @referencePhone"); req.input("referencePhone", sql.NVarChar(50), data.referencePhone ?? null); }
    if (data.travelDate !== undefined) { sets.push("travel_date = @travelDate"); req.input("travelDate", sql.Date, data.travelDate); }
    if (data.pickupLocation !== undefined) { sets.push("pickup_location = @pickupLocation"); req.input("pickupLocation", sql.NVarChar(500), data.pickupLocation); }
    if (data.dropLocation !== undefined) { sets.push("drop_location = @dropLocation"); req.input("dropLocation", sql.NVarChar(500), data.dropLocation); }
    if (data.vehicleId !== undefined) { sets.push("vehicle_id = @vehicleId"); req.input("vehicleId", sql.Int, data.vehicleId ?? null); }
    if (data.totalAmount !== undefined) { sets.push("total_amount = @totalAmount"); req.input("totalAmount", sql.Decimal(10, 2), parseFloat(data.totalAmount)); }
    if (data.advanceAmount !== undefined) { sets.push("advance_amount = @advanceAmount"); req.input("advanceAmount", sql.Decimal(10, 2), parseFloat(data.advanceAmount)); }
    if (data.paymentMode !== undefined) { sets.push("payment_mode = @paymentMode"); req.input("paymentMode", sql.NVarChar(50), data.paymentMode ?? null); }
    if (data.vendorId !== undefined) { sets.push("vendor_id = @vendorId"); req.input("vendorId", sql.Int, data.vendorId ?? null); }
    if (data.reminderDate !== undefined) { sets.push("reminder_date = @reminderDate"); req.input("reminderDate", sql.Date, data.reminderDate ?? null); }
    if (data.reminderNote !== undefined) { sets.push("reminder_note = @reminderNote"); req.input("reminderNote", sql.NVarChar(500), data.reminderNote ?? null); }
    if (sets.length === 0) return undefined;
    const r = await req.query(`UPDATE cab_bookings SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapCabBooking(r.recordset[0]) : undefined;
  }

  async getCabBooking(id: number): Promise<CabBooking | undefined> {
    const r = await pool.request().input("id", sql.Int, id)
      .query(`SELECT * FROM cab_bookings WHERE id = @id`);
    return r.recordset[0] ? mapCabBooking(r.recordset[0]) : undefined;
  }

  // ── CAB RUNS ──────────────────────────────────────────────────

  async getCabRuns(): Promise<CabRun[]> {
    const r = await pool.request().query(`SELECT * FROM cab_runs ORDER BY created_at DESC`);
    return r.recordset.map(mapCabRun);
  }

  async createCabRun(data: InsertCabRun): Promise<CabRun> {
    const r = await pool.request()
      .input("bookingId", sql.Int, data.bookingId ?? null)
      .input("clientName", sql.NVarChar(255), data.clientName ?? null)
      .input("advanceAmount", sql.Decimal(10, 2), data.advanceAmount ? parseFloat(data.advanceAmount) : 0)
      .input("referenceName", sql.NVarChar(255), data.referenceName ?? null)
      .input("referencePhone", sql.NVarChar(50), data.referencePhone ?? null)
      .input("members", sql.NVarChar(sql.MAX), JSON.stringify(data.members ?? []))
      .input("startKm", sql.Int, data.startKm ?? null)
      .input("closingKm", sql.Int, data.closingKm ?? null)
      .input("totalPrice", sql.Decimal(10, 2), data.totalPrice ? parseFloat(data.totalPrice) : 0)
      .input("pendingAmount", sql.Decimal(10, 2), data.pendingAmount ? parseFloat(data.pendingAmount) : 0)
      .input("isReturnTrip", sql.Bit, data.isReturnTrip ? 1 : 0)
      .input("returnDate", sql.Date, data.returnDate ?? null)
      .input("returnMembers", sql.NVarChar(sql.MAX), JSON.stringify(data.returnMembers ?? []))
      .input("returnAdvance", sql.Decimal(10, 2), data.returnAdvance ? parseFloat(data.returnAdvance) : 0)
      .input("driverCollection", sql.Decimal(10, 2), data.driverCollection ? parseFloat(data.driverCollection) : 0)
      .input("expenseDiesel", sql.Decimal(10, 2), data.expenseDiesel ? parseFloat(data.expenseDiesel) : 0)
      .input("expenseToll", sql.Decimal(10, 2), data.expenseToll ? parseFloat(data.expenseToll) : 0)
      .input("expenseParking", sql.Decimal(10, 2), data.expenseParking ? parseFloat(data.expenseParking) : 0)
      .input("expenseOthers", sql.Decimal(10, 2), data.expenseOthers ? parseFloat(data.expenseOthers) : 0)
      .input("driverSalary", sql.Decimal(10, 2), data.driverSalary ? parseFloat(data.driverSalary) : 0)
      .query(`
        INSERT INTO cab_runs
          (booking_id, client_name, advance_amount, reference_name, reference_phone,
           members, start_km, closing_km, total_price, pending_amount, is_return_trip,
           return_date, return_members, return_advance, driver_collection,
           expense_diesel, expense_toll, expense_parking, expense_others, driver_salary)
        OUTPUT INSERTED.*
        VALUES
          (@bookingId, @clientName, @advanceAmount, @referenceName, @referencePhone,
           @members, @startKm, @closingKm, @totalPrice, @pendingAmount, @isReturnTrip,
           @returnDate, @returnMembers, @returnAdvance, @driverCollection,
           @expenseDiesel, @expenseToll, @expenseParking, @expenseOthers, @driverSalary)
      `);
    return mapCabRun(r.recordset[0]);
  }

  async updateCabRun(id: number, data: Partial<InsertCabRun>): Promise<CabRun | undefined> {
    const sets: string[] = [];
    const req = pool.request().input("id", sql.Int, id);
    if (data.bookingId !== undefined) { sets.push("booking_id = @bookingId"); req.input("bookingId", sql.Int, data.bookingId ?? null); }
    if (data.clientName !== undefined) { sets.push("client_name = @clientName"); req.input("clientName", sql.NVarChar(255), data.clientName ?? null); }
    if (data.advanceAmount !== undefined) { sets.push("advance_amount = @advanceAmount"); req.input("advanceAmount", sql.Decimal(10, 2), data.advanceAmount ? parseFloat(data.advanceAmount) : 0); }
    if (data.referenceName !== undefined) { sets.push("reference_name = @referenceName"); req.input("referenceName", sql.NVarChar(255), data.referenceName ?? null); }
    if (data.referencePhone !== undefined) { sets.push("reference_phone = @referencePhone"); req.input("referencePhone", sql.NVarChar(50), data.referencePhone ?? null); }
    if (data.members !== undefined) { sets.push("members = @members"); req.input("members", sql.NVarChar(sql.MAX), JSON.stringify(data.members ?? [])); }
    if (data.startKm !== undefined) { sets.push("start_km = @startKm"); req.input("startKm", sql.Int, data.startKm ?? null); }
    if (data.closingKm !== undefined) { sets.push("closing_km = @closingKm"); req.input("closingKm", sql.Int, data.closingKm ?? null); }
    if (data.totalPrice !== undefined) { sets.push("total_price = @totalPrice"); req.input("totalPrice", sql.Decimal(10, 2), data.totalPrice ? parseFloat(data.totalPrice) : 0); }
    if (data.pendingAmount !== undefined) { sets.push("pending_amount = @pendingAmount"); req.input("pendingAmount", sql.Decimal(10, 2), data.pendingAmount ? parseFloat(data.pendingAmount) : 0); }
    if (data.isReturnTrip !== undefined) { sets.push("is_return_trip = @isReturnTrip"); req.input("isReturnTrip", sql.Bit, data.isReturnTrip ? 1 : 0); }
    if (data.returnDate !== undefined) { sets.push("return_date = @returnDate"); req.input("returnDate", sql.Date, data.returnDate ?? null); }
    if (data.returnMembers !== undefined) { sets.push("return_members = @returnMembers"); req.input("returnMembers", sql.NVarChar(sql.MAX), JSON.stringify(data.returnMembers ?? [])); }
    if (data.returnAdvance !== undefined) { sets.push("return_advance = @returnAdvance"); req.input("returnAdvance", sql.Decimal(10, 2), data.returnAdvance ? parseFloat(data.returnAdvance) : 0); }
    if (data.driverCollection !== undefined) { sets.push("driver_collection = @driverCollection"); req.input("driverCollection", sql.Decimal(10, 2), data.driverCollection ? parseFloat(data.driverCollection) : 0); }
    if (data.expenseDiesel !== undefined) { sets.push("expense_diesel = @expenseDiesel"); req.input("expenseDiesel", sql.Decimal(10, 2), data.expenseDiesel ? parseFloat(data.expenseDiesel) : 0); }
    if (data.expenseToll !== undefined) { sets.push("expense_toll = @expenseToll"); req.input("expenseToll", sql.Decimal(10, 2), data.expenseToll ? parseFloat(data.expenseToll) : 0); }
    if (data.expenseParking !== undefined) { sets.push("expense_parking = @expenseParking"); req.input("expenseParking", sql.Decimal(10, 2), data.expenseParking ? parseFloat(data.expenseParking) : 0); }
    if (data.expenseOthers !== undefined) { sets.push("expense_others = @expenseOthers"); req.input("expenseOthers", sql.Decimal(10, 2), data.expenseOthers ? parseFloat(data.expenseOthers) : 0); }
    if (data.driverSalary !== undefined) { sets.push("driver_salary = @driverSalary"); req.input("driverSalary", sql.Decimal(10, 2), data.driverSalary ? parseFloat(data.driverSalary) : 0); }
    if (sets.length === 0) return undefined;
    const r = await req.query(`UPDATE cab_runs SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapCabRun(r.recordset[0]) : undefined;
  }

  // ── VISA APPLICATIONS ─────────────────────────────────────────

  async getVisaApplications(search?: string): Promise<VisaApplication[]> {
    if (!search) {
      const r = await pool.request().query(`SELECT * FROM visa_applications ORDER BY created_at DESC`);
      return r.recordset.map(mapVisa);
    }
    const s = `%${search}%`;
    const r = await pool.request()
      .input("s", sql.NVarChar(255), s)
      .query(`
        SELECT * FROM visa_applications
        WHERE client_name LIKE @s OR passport_number LIKE @s OR phone LIKE @s
        ORDER BY created_at DESC
      `);
    return r.recordset.map(mapVisa);
  }

  async createVisaApplication(data: InsertVisaApplication): Promise<VisaApplication> {
    const r = await pool.request()
      .input("clientName", sql.NVarChar(255), data.clientName)
      .input("passportNumber", sql.NVarChar(50), data.passportNumber)
      .input("phone", sql.NVarChar(50), data.phone)
      .input("visaType", sql.NVarChar(100), data.visaType)
      .input("medicalStatus", sql.NVarChar(20), data.medicalStatus ?? "pending")
      .input("pccStatus", sql.NVarChar(20), data.pccStatus ?? "locked")
      .input("stampingStatus", sql.NVarChar(20), data.stampingStatus ?? "locked")
      .input("paymentMode", sql.NVarChar(50), data.paymentMode ?? "Cash")
      .input("vendorId", sql.Int, data.vendorId ?? null)
      .query(`
        INSERT INTO visa_applications
          (client_name, passport_number, phone, visa_type, medical_status, pcc_status, stamping_status, payment_mode, vendor_id)
        OUTPUT INSERTED.*
        VALUES
          (@clientName, @passportNumber, @phone, @visaType, @medicalStatus, @pccStatus, @stampingStatus, @paymentMode, @vendorId)
      `);
    return mapVisa(r.recordset[0]);
  }

  async updateVisaApplication(id: number, data: Partial<InsertVisaApplication>): Promise<VisaApplication | undefined> {
    const sets: string[] = [];
    const req = pool.request().input("id", sql.Int, id);
    if (data.clientName !== undefined) { sets.push("client_name = @clientName"); req.input("clientName", sql.NVarChar(255), data.clientName); }
    if (data.passportNumber !== undefined) { sets.push("passport_number = @passportNumber"); req.input("passportNumber", sql.NVarChar(50), data.passportNumber); }
    if (data.phone !== undefined) { sets.push("phone = @phone"); req.input("phone", sql.NVarChar(50), data.phone); }
    if (data.visaType !== undefined) { sets.push("visa_type = @visaType"); req.input("visaType", sql.NVarChar(100), data.visaType); }
    if (data.medicalStatus !== undefined) { sets.push("medical_status = @medicalStatus"); req.input("medicalStatus", sql.NVarChar(20), data.medicalStatus); }
    if (data.pccStatus !== undefined) { sets.push("pcc_status = @pccStatus"); req.input("pccStatus", sql.NVarChar(20), data.pccStatus); }
    if (data.stampingStatus !== undefined) { sets.push("stamping_status = @stampingStatus"); req.input("stampingStatus", sql.NVarChar(20), data.stampingStatus); }
    if (data.paymentMode !== undefined) { sets.push("payment_mode = @paymentMode"); req.input("paymentMode", sql.NVarChar(50), data.paymentMode ?? null); }
    if (data.vendorId !== undefined) { sets.push("vendor_id = @vendorId"); req.input("vendorId", sql.Int, data.vendorId ?? null); }
    if (sets.length === 0) return undefined;
    const r = await req.query(`UPDATE visa_applications SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapVisa(r.recordset[0]) : undefined;
  }

  // ── CREDIT CARDS ──────────────────────────────────────────────

  async getCreditCards(): Promise<CreditCard[]> {
    const r = await pool.request().query(`SELECT * FROM credit_cards ORDER BY created_at DESC`);
    return r.recordset.map(mapCreditCard);
  }

  async createCreditCard(data: InsertCreditCard): Promise<CreditCard> {
    const r = await pool.request()
      .input("cardName", sql.NVarChar(255), data.cardName)
      .input("bankName", sql.NVarChar(255), data.bankName)
      .input("totalLimit", sql.Decimal(10, 2), parseFloat(data.totalLimit))
      .input("usedAmount", sql.Decimal(10, 2), data.usedAmount ? parseFloat(data.usedAmount) : 0)
      .input("nextBillDate", sql.Date, data.nextBillDate)
      .query(`
        INSERT INTO credit_cards (card_name, bank_name, total_limit, used_amount, next_bill_date)
        OUTPUT INSERTED.*
        VALUES (@cardName, @bankName, @totalLimit, @usedAmount, @nextBillDate)
      `);
    return mapCreditCard(r.recordset[0]);
  }

  async updateCreditCard(id: number, data: Partial<InsertCreditCard>): Promise<CreditCard | undefined> {
    const sets: string[] = [];
    const req = pool.request().input("id", sql.Int, id);
    if (data.cardName !== undefined) { sets.push("card_name = @cardName"); req.input("cardName", sql.NVarChar(255), data.cardName); }
    if (data.bankName !== undefined) { sets.push("bank_name = @bankName"); req.input("bankName", sql.NVarChar(255), data.bankName); }
    if (data.totalLimit !== undefined) { sets.push("total_limit = @totalLimit"); req.input("totalLimit", sql.Decimal(10, 2), parseFloat(data.totalLimit)); }
    if (data.usedAmount !== undefined) { sets.push("used_amount = @usedAmount"); req.input("usedAmount", sql.Decimal(10, 2), parseFloat(data.usedAmount)); }
    if (data.nextBillDate !== undefined) { sets.push("next_bill_date = @nextBillDate"); req.input("nextBillDate", sql.Date, data.nextBillDate); }
    if (sets.length === 0) return undefined;
    const r = await req.query(`UPDATE credit_cards SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapCreditCard(r.recordset[0]) : undefined;
  }

  async repayCreditCard(id: number, amount: number): Promise<CreditCard | undefined> {
    const card = await pool.request().input("id", sql.Int, id)
      .query(`SELECT used_amount FROM credit_cards WHERE id = @id`);
    if (!card.recordset[0]) return undefined;
    const newUsed = Math.max(0, Number(card.recordset[0].used_amount) - amount);
    const r = await pool.request()
      .input("id", sql.Int, id)
      .input("usedAmount", sql.Decimal(10, 2), newUsed)
      .query(`UPDATE credit_cards SET used_amount = @usedAmount OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapCreditCard(r.recordset[0]) : undefined;
  }

  // ── VENDORS ───────────────────────────────────────────────────

  async getVendors(): Promise<Vendor[]> {
    const r = await pool.request().query(`SELECT * FROM vendors ORDER BY created_at DESC`);
    return r.recordset.map(mapVendor);
  }

  async createVendor(data: InsertVendor): Promise<Vendor> {
    const r = await pool.request()
      .input("name", sql.NVarChar(255), data.name)
      .input("totalOwed", sql.Decimal(10, 2), data.totalOwed ? parseFloat(data.totalOwed) : 0)
      .query(`
        INSERT INTO vendors (name, total_owed)
        OUTPUT INSERTED.*
        VALUES (@name, @totalOwed)
      `);
    return mapVendor(r.recordset[0]);
  }

  async updateVendor(id: number, data: Partial<InsertVendor>): Promise<Vendor | undefined> {
    const sets: string[] = [];
    const req = pool.request().input("id", sql.Int, id);
    if (data.name !== undefined) { sets.push("name = @name"); req.input("name", sql.NVarChar(255), data.name); }
    if (data.totalOwed !== undefined) { sets.push("total_owed = @totalOwed"); req.input("totalOwed", sql.Decimal(10, 2), parseFloat(data.totalOwed)); }
    if (sets.length === 0) return undefined;
    const r = await req.query(`UPDATE vendors SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapVendor(r.recordset[0]) : undefined;
  }

  async recordVendorPayment(data: InsertVendorPayment): Promise<VendorPayment> {
    const r = await pool.request()
      .input("vendorId", sql.Int, data.vendorId)
      .input("amount", sql.Decimal(10, 2), parseFloat(data.amount))
      .input("paymentDate", sql.Date, data.paymentDate)
      .input("notes", sql.NVarChar(500), data.notes ?? null)
      .query(`
        INSERT INTO vendor_payments (vendor_id, amount, payment_date, notes)
        OUTPUT INSERTED.*
        VALUES (@vendorId, @amount, @paymentDate, @notes)
      `);
    const payment = mapVendorPayment(r.recordset[0]);
    await this.updateVendorBalance(data.vendorId, -Number(data.amount));
    return payment;
  }

  async updateVendorBalance(id: number, amount: number): Promise<void> {
    await pool.request()
      .input("id", sql.Int, id)
      .input("amount", sql.Decimal(10, 2), amount)
      .query(`UPDATE vendors SET total_owed = total_owed + @amount WHERE id = @id`);
  }

  // ── ATTESTATION SERVICES ──────────────────────────────────────

  async getAttestationServices(): Promise<AttestationService[]> {
    const r = await pool.request().query(`SELECT * FROM attestation_services ORDER BY created_at DESC`);
    return r.recordset.map(mapAttestation);
  }

  async createAttestationService(data: InsertAttestationService): Promise<AttestationService> {
    const r = await pool.request()
      .input("clientName", sql.NVarChar(255), data.clientName)
      .input("phone", sql.NVarChar(50), data.phone)
      .input("referenceName", sql.NVarChar(255), data.referenceName ?? null)
      .input("referencePhone", sql.NVarChar(50), data.referencePhone ?? null)
      .input("documentType", sql.NVarChar(255), data.documentType)
      .input("targetCountry", sql.NVarChar(100), data.targetCountry)
      .input("serviceCharge", sql.Decimal(10, 2), parseFloat(data.serviceCharge))
      .input("ourCost", sql.Decimal(10, 2), data.ourCost ? parseFloat(data.ourCost) : 0)
      .input("advanceReceived", sql.Decimal(10, 2), data.advanceReceived ? parseFloat(data.advanceReceived) : 0)
      .input("paymentMode", sql.NVarChar(50), data.paymentMode ?? "Cash")
      .input("vendorId", sql.Int, data.vendorId ?? null)
      .query(`
        INSERT INTO attestation_services
          (client_name, phone, reference_name, reference_phone, document_type, target_country,
           service_charge, our_cost, advance_received, payment_mode, vendor_id)
        OUTPUT INSERTED.*
        VALUES
          (@clientName, @phone, @referenceName, @referencePhone, @documentType, @targetCountry,
           @serviceCharge, @ourCost, @advanceReceived, @paymentMode, @vendorId)
      `);
    const service = mapAttestation(r.recordset[0]);
    if (data.paymentMode === "Credit/Pay Later" && data.vendorId) {
      await this.updateVendorBalance(data.vendorId, Number(data.serviceCharge));
    }
    return service;
  }

  async updateAttestationService(id: number, data: Partial<InsertAttestationService>): Promise<AttestationService | undefined> {
    const sets: string[] = [];
    const req = pool.request().input("id", sql.Int, id);
    if (data.clientName !== undefined) { sets.push("client_name = @clientName"); req.input("clientName", sql.NVarChar(255), data.clientName); }
    if (data.phone !== undefined) { sets.push("phone = @phone"); req.input("phone", sql.NVarChar(50), data.phone); }
    if (data.referenceName !== undefined) { sets.push("reference_name = @referenceName"); req.input("referenceName", sql.NVarChar(255), data.referenceName ?? null); }
    if (data.referencePhone !== undefined) { sets.push("reference_phone = @referencePhone"); req.input("referencePhone", sql.NVarChar(50), data.referencePhone ?? null); }
    if (data.documentType !== undefined) { sets.push("document_type = @documentType"); req.input("documentType", sql.NVarChar(255), data.documentType); }
    if (data.targetCountry !== undefined) { sets.push("target_country = @targetCountry"); req.input("targetCountry", sql.NVarChar(100), data.targetCountry); }
    if (data.serviceCharge !== undefined) { sets.push("service_charge = @serviceCharge"); req.input("serviceCharge", sql.Decimal(10, 2), parseFloat(data.serviceCharge)); }
    if (data.ourCost !== undefined) { sets.push("our_cost = @ourCost"); req.input("ourCost", sql.Decimal(10, 2), parseFloat(data.ourCost)); }
    if (data.advanceReceived !== undefined) { sets.push("advance_received = @advanceReceived"); req.input("advanceReceived", sql.Decimal(10, 2), parseFloat(data.advanceReceived)); }
    if (data.paymentMode !== undefined) { sets.push("payment_mode = @paymentMode"); req.input("paymentMode", sql.NVarChar(50), data.paymentMode ?? null); }
    if (data.vendorId !== undefined) { sets.push("vendor_id = @vendorId"); req.input("vendorId", sql.Int, data.vendorId ?? null); }
    if (sets.length === 0) return undefined;
    const r = await req.query(`UPDATE attestation_services SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapAttestation(r.recordset[0]) : undefined;
  }

  async deleteAttestationService(id: number): Promise<void> {
    await pool.request().input("id", sql.Int, id).query(`DELETE FROM attestation_services WHERE id = @id`);
  }

  // ── SERVICE CALLS ─────────────────────────────────────────────

  async getServiceCalls(status?: string): Promise<ServiceCall[]> {
    let query = `SELECT * FROM service_calls`;
    const req = pool.request();
    if (status && status !== "all") {
      query += ` WHERE status = @status`;
      req.input("status", sql.NVarChar(20), status);
    }
    query += ` ORDER BY created_at DESC`;
    const r = await req.query(query);
    return r.recordset.map(mapServiceCall);
  }

  async getServiceCall(id: number): Promise<ServiceCall | undefined> {
    const r = await pool.request().input("id", sql.Int, id)
      .query(`SELECT * FROM service_calls WHERE id = @id`);
    return r.recordset[0] ? mapServiceCall(r.recordset[0]) : undefined;
  }

  async createServiceCall(data: InsertServiceCall): Promise<ServiceCall> {
    const r = await pool.request()
      .input("name", sql.NVarChar(255), data.name)
      .input("address", sql.NVarChar(1000), data.address)
      .input("phoneNumber", sql.NVarChar(50), data.phoneNumber)
      .input("callDate", sql.Date, data.callDate)
      .input("enquiredServiceType", sql.NVarChar(50), data.enquiredServiceType ?? null)
      .input("status", sql.NVarChar(20), data.status ?? "pending")
      .input("notes", sql.NVarChar(2000), data.notes ?? null)
      .query(`
        INSERT INTO service_calls (name, address, phone_number, call_date, enquired_service_type, status, notes)
        OUTPUT INSERTED.*
        VALUES (@name, @address, @phoneNumber, @callDate, @enquiredServiceType, @status, @notes)
      `);
    return mapServiceCall(r.recordset[0]);
  }

  async updateServiceCall(id: number, data: Partial<InsertServiceCall>): Promise<ServiceCall | undefined> {
    const sets: string[] = ["updated_at = GETDATE()"];
    const req = pool.request().input("id", sql.Int, id);
    if (data.name !== undefined) { sets.push("name = @name"); req.input("name", sql.NVarChar(255), data.name); }
    if (data.address !== undefined) { sets.push("address = @address"); req.input("address", sql.NVarChar(1000), data.address); }
    if (data.phoneNumber !== undefined) { sets.push("phone_number = @phoneNumber"); req.input("phoneNumber", sql.NVarChar(50), data.phoneNumber); }
    if (data.callDate !== undefined) { sets.push("call_date = @callDate"); req.input("callDate", sql.Date, data.callDate); }
    if (data.enquiredServiceType !== undefined) { sets.push("enquired_service_type = @enquiredServiceType"); req.input("enquiredServiceType", sql.NVarChar(50), data.enquiredServiceType ?? null); }
    if (data.status !== undefined) { sets.push("status = @status"); req.input("status", sql.NVarChar(20), data.status); }
    if (data.notes !== undefined) { sets.push("notes = @notes"); req.input("notes", sql.NVarChar(2000), data.notes ?? null); }
    const r = await req.query(`UPDATE service_calls SET ${sets.join(", ")} OUTPUT INSERTED.* WHERE id = @id`);
    return r.recordset[0] ? mapServiceCall(r.recordset[0]) : undefined;
  }

  async deleteServiceCall(id: number): Promise<void> {
    await pool.request().input("id", sql.Int, id).query(`DELETE FROM service_calls WHERE id = @id`);
  }

  async getServiceCallStats(): Promise<{ total: number; pending: number; remainder: number; completed: number; cancelled: number }> {
    const today = new Date().toISOString().substring(0, 10);
    // Auto-promote pending calls with today's date to remainder
    await pool.request()
      .input("today", sql.Date, today)
      .query(`
        UPDATE service_calls
        SET status = 'remainder', updated_at = GETDATE()
        WHERE status = 'pending' AND CONVERT(date, call_date) = @today
      `);

    const r = await pool.request().query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'remainder' THEN 1 ELSE 0 END) AS remainder,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled
      FROM service_calls
    `);
    const row = r.recordset[0];
    return {
      total: Number(row.total),
      pending: Number(row.pending),
      remainder: Number(row.remainder),
      completed: Number(row.completed),
      cancelled: Number(row.cancelled),
    };
  }

  // ── GLOBAL SEARCH ─────────────────────────────────────────────

  async searchGlobal(query: string): Promise<{ visa: VisaApplication[]; flights: FlightBooking[]; cabs: CabBooking[] }> {
    const s = `%${query}%`;
    const [visaRes, flightRes, cabRes] = await Promise.all([
      pool.request().input("s", sql.NVarChar(255), s).query(`
        SELECT TOP 5 * FROM visa_applications WHERE client_name LIKE @s OR passport_number LIKE @s OR phone LIKE @s
      `),
      pool.request().input("s", sql.NVarChar(255), s).query(`
        SELECT TOP 5 * FROM flight_bookings WHERE client_name LIKE @s OR client_phone LIKE @s
      `),
      pool.request().input("s", sql.NVarChar(255), s).query(`
        SELECT TOP 5 * FROM cab_bookings WHERE client_name LIKE @s OR client_phone LIKE @s
      `),
    ]);
    return {
      visa: visaRes.recordset.map(mapVisa),
      flights: flightRes.recordset.map(mapFlight),
      cabs: cabRes.recordset.map(mapCabBooking),
    };
  }
}

export const storage = new DatabaseStorage();
