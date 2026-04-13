import { z } from "zod";

// ============================================================
// TYPESCRIPT TYPES (what the app works with)
// ============================================================

export type CashTransaction = {
  id: number;
  type: string;
  personName: string;
  amount: string;
  reason: string;
  createdAt: Date | null;
};

export type FlightBooking = {
  id: number;
  clientName: string;
  clientPhone: string;
  referenceName: string | null;
  referencePhone: string | null;
  sector: string;
  travelDate: string;
  airline: string;
  platform: string;
  platformNotes: string | null;
  totalAmount: string;
  advancePaid: string | null;
  paymentMode: string | null;
  vendorId: number | null;
  reminderDate: string | null;
  reminderNote: string | null;
  createdAt: Date | null;
};

export type Vehicle = {
  id: number;
  carNumber: string;
  createdAt: Date | null;
};

export type CabBooking = {
  id: number;
  clientName: string;
  clientPhone: string;
  referenceName: string | null;
  referencePhone: string | null;
  travelDate: string;
  pickupLocation: string;
  dropLocation: string;
  vehicleId: number | null;
  totalAmount: string;
  advanceAmount: string;
  paymentMode: string | null;
  vendorId: number | null;
  reminderDate: string | null;
  reminderNote: string | null;
  createdAt: Date | null;
};

export type CabRun = {
  id: number;
  bookingId: number | null;
  clientName: string | null;
  advanceAmount: string | null;
  referenceName: string | null;
  referencePhone: string | null;
  members: unknown;
  startKm: number | null;
  closingKm: number | null;
  totalPrice: string | null;
  pendingAmount: string | null;
  isReturnTrip: boolean | null;
  returnDate: string | null;
  returnMembers: unknown;
  returnAdvance: string | null;
  driverCollection: string | null;
  expenseDiesel: string | null;
  expenseToll: string | null;
  expenseParking: string | null;
  expenseOthers: string | null;
  driverSalary: string | null;
  createdAt: Date | null;
};

export type VisaApplication = {
  id: number;
  clientName: string;
  passportNumber: string;
  phone: string;
  visaType: string;
  medicalStatus: string;
  pccStatus: string;
  stampingStatus: string;
  paymentMode: string | null;
  vendorId: number | null;
  createdAt: Date | null;
};

export type CreditCard = {
  id: number;
  cardName: string;
  bankName: string;
  totalLimit: string;
  usedAmount: string;
  nextBillDate: string;
  createdAt: Date | null;
};

export type Vendor = {
  id: number;
  name: string;
  totalOwed: string;
  createdAt: Date | null;
};

export type VendorPayment = {
  id: number;
  vendorId: number;
  amount: string;
  paymentDate: string;
  notes: string | null;
  createdAt: Date | null;
};

export type AttestationService = {
  id: number;
  clientName: string;
  phone: string;
  referenceName: string | null;
  referencePhone: string | null;
  documentType: string;
  targetCountry: string;
  serviceCharge: string;
  ourCost: string;
  advanceReceived: string;
  paymentMode: string | null;
  vendorId: number | null;
  createdAt: Date | null;
};

export type ServiceCall = {
  id: number;
  name: string;
  address: string;
  phoneNumber: string;
  callDate: string;
  enquiredServiceType: string | null;
  status: string;
  notes: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type CabBookingWithVehicle = CabBooking & { vehicle: Vehicle | null; vendor: Vendor | null };

// ============================================================
// ZOD INSERT SCHEMAS (used for request validation)
// ============================================================

export const insertCashTransactionSchema = z.object({
  type: z.enum(["in", "out"]),
  personName: z.string().min(1),
  amount: z.string(),
  reason: z.string().min(1),
});

export const insertFlightBookingSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  referenceName: z.string().nullable().optional(),
  referencePhone: z.string().nullable().optional(),
  sector: z.string().min(1),
  travelDate: z.string().min(1),
  airline: z.string().min(1),
  platform: z.string().min(1),
  platformNotes: z.string().nullable().optional(),
  totalAmount: z.string(),
  advancePaid: z.string().nullable().optional(),
  paymentMode: z.string().nullable().optional(),
  vendorId: z.number().nullable().optional(),
  reminderDate: z.string().nullable().optional(),
  reminderNote: z.string().nullable().optional(),
});

export const insertVehicleSchema = z.object({
  carNumber: z.string().min(1),
});

export const insertCabBookingSchema = z.object({
  clientName: z.string().min(1),
  clientPhone: z.string().min(1),
  referenceName: z.string().nullable().optional(),
  referencePhone: z.string().nullable().optional(),
  travelDate: z.string().min(1),
  pickupLocation: z.string().min(1),
  dropLocation: z.string().min(1),
  vehicleId: z.number().nullable().optional(),
  totalAmount: z.string(),
  advanceAmount: z.string(),
  paymentMode: z.string().nullable().optional(),
  vendorId: z.number().nullable().optional(),
  reminderDate: z.string().nullable().optional(),
  reminderNote: z.string().nullable().optional(),
});

export const insertCabRunSchema = z.object({
  bookingId: z.number().nullable().optional(),
  clientName: z.string().nullable().optional(),
  advanceAmount: z.string().nullable().optional(),
  referenceName: z.string().nullable().optional(),
  referencePhone: z.string().nullable().optional(),
  members: z.unknown().optional(),
  startKm: z.number().nullable().optional(),
  closingKm: z.number().nullable().optional(),
  totalPrice: z.string().nullable().optional(),
  pendingAmount: z.string().nullable().optional(),
  isReturnTrip: z.boolean().nullable().optional(),
  returnDate: z.string().nullable().optional(),
  returnMembers: z.unknown().optional(),
  returnAdvance: z.string().nullable().optional(),
  driverCollection: z.string().nullable().optional(),
  expenseDiesel: z.string().nullable().optional(),
  expenseToll: z.string().nullable().optional(),
  expenseParking: z.string().nullable().optional(),
  expenseOthers: z.string().nullable().optional(),
  driverSalary: z.string().nullable().optional(),
});

export const insertVisaApplicationSchema = z.object({
  clientName: z.string().min(1),
  passportNumber: z.string().min(1),
  phone: z.string().min(1),
  visaType: z.string().min(1),
  medicalStatus: z.enum(["pending", "fit", "unfit"]).default("pending"),
  pccStatus: z.enum(["locked", "pending", "completed"]).default("locked"),
  stampingStatus: z.enum(["locked", "pending", "completed"]).default("locked"),
  paymentMode: z.string().nullable().optional(),
  vendorId: z.number().nullable().optional(),
});

export const insertCreditCardSchema = z.object({
  cardName: z.string().min(1),
  bankName: z.string().min(1),
  totalLimit: z.string(),
  usedAmount: z.string().optional(),
  nextBillDate: z.string().min(1),
});

export const insertVendorSchema = z.object({
  name: z.string().min(1),
  totalOwed: z.string().optional(),
});

export const insertVendorPaymentSchema = z.object({
  vendorId: z.number(),
  amount: z.string(),
  paymentDate: z.string().min(1),
  notes: z.string().nullable().optional(),
});

export const insertAttestationServiceSchema = z.object({
  clientName: z.string().min(1),
  phone: z.string().min(1),
  referenceName: z.string().nullable().optional(),
  referencePhone: z.string().nullable().optional(),
  documentType: z.string().min(1),
  targetCountry: z.string().min(1),
  serviceCharge: z.string(),
  ourCost: z.string().optional(),
  advanceReceived: z.string().optional(),
  paymentMode: z.string().nullable().optional(),
  vendorId: z.number().nullable().optional(),
});

export const insertServiceCallSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phoneNumber: z.string().min(1),
  callDate: z.string().min(1),
  enquiredServiceType: z.string().nullable().optional(),
  status: z.string().default("pending"),
  notes: z.string().nullable().optional(),
});

// ============================================================
// INSERT TYPES (derived from Zod schemas)
// ============================================================

export type InsertCashTransaction = z.infer<typeof insertCashTransactionSchema>;
export type InsertFlightBooking = z.infer<typeof insertFlightBookingSchema>;
export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type InsertCabBooking = z.infer<typeof insertCabBookingSchema>;
export type InsertCabRun = z.infer<typeof insertCabRunSchema>;
export type InsertVisaApplication = z.infer<typeof insertVisaApplicationSchema>;
export type InsertCreditCard = z.infer<typeof insertCreditCardSchema>;
export type InsertVendor = z.infer<typeof insertVendorSchema>;
export type InsertVendorPayment = z.infer<typeof insertVendorPaymentSchema>;
export type InsertAttestationService = z.infer<typeof insertAttestationServiceSchema>;
export type InsertServiceCall = z.infer<typeof insertServiceCallSchema>;

// ============================================================
// MEMBER TYPE (for cab runs)
// ============================================================
export const cabRunMemberSchema = z.object({
  name: z.string(),
  phone: z.string().optional(),
  referenceName: z.string().optional(),
  referencePhone: z.string().optional(),
  advancePaid: z.string().optional(),
});
export type CabRunMember = z.infer<typeof cabRunMemberSchema>;
