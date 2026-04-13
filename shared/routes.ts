
import { z } from 'zod';
import {
  insertCashTransactionSchema,
  insertFlightBookingSchema,
  insertVehicleSchema,
  insertCabBookingSchema,
  insertCabRunSchema,
  insertVisaApplicationSchema,
  insertCreditCardSchema,
  insertVendorSchema,
  insertVendorPaymentSchema,
  insertAttestationServiceSchema,
  type CashTransaction, type FlightBooking, type Vehicle,
  type CabBooking, type CabRun, type VisaApplication,
  type CreditCard, type Vendor, type VendorPayment, type AttestationService,
} from './schema';

// Re-export Insert* types so client hooks can import from @shared/routes
export type {
  InsertCashTransaction,
  InsertFlightBooking,
  InsertVehicle,
  InsertCabBooking,
  InsertCabRun,
  InsertVisaApplication,
  InsertCreditCard,
  InsertVendor,
  InsertVendorPayment,
  InsertAttestationService,
  InsertServiceCall,
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  cash: {
    list: {
      method: 'GET' as const,
      path: '/api/cash-transactions' as const,
      responses: {
        200: z.array(z.custom<CashTransaction>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/cash-transactions' as const,
      input: insertCashTransactionSchema,
      responses: {
        201: z.custom<CashTransaction>(),
        400: errorSchemas.validation,
      },
    },
    stats: {
      method: 'GET' as const,
      path: '/api/cash-stats' as const,
      responses: {
        200: z.object({
          totalBalance: z.number(),
          totalIn: z.number(),
          totalOut: z.number(),
        }),
      },
    }
  },
  flights: {
    list: {
      method: 'GET' as const,
      path: '/api/flight-bookings' as const,
      responses: {
        200: z.array(z.custom<FlightBooking>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/flight-bookings' as const,
      input: insertFlightBookingSchema,
      responses: {
        201: z.custom<FlightBooking>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/flight-bookings/:id' as const,
      input: insertFlightBookingSchema.partial(),
      responses: {
        200: z.custom<FlightBooking>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/flight-bookings/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  vehicles: {
    list: {
      method: 'GET' as const,
      path: '/api/vehicles' as const,
      responses: {
        200: z.array(z.custom<Vehicle>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vehicles' as const,
      input: insertVehicleSchema,
      responses: {
        201: z.custom<Vehicle>(),
        400: errorSchemas.validation,
      },
    },
  },
  cabBookings: {
    list: {
      method: 'GET' as const,
      path: '/api/cab-bookings' as const,
      responses: {
        200: z.array(z.custom<CabBooking & { vehicle: Vehicle | null }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/cab-bookings' as const,
      input: insertCabBookingSchema,
      responses: {
        201: z.custom<CabBooking>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/cab-bookings/:id' as const,
      input: insertCabBookingSchema.partial(),
      responses: {
        200: z.custom<CabBooking>(),
        404: errorSchemas.notFound,
      },
    }
  },
  cabRuns: {
    list: {
      method: 'GET' as const,
      path: '/api/cab-runs' as const,
      responses: {
        200: z.array(z.custom<CabRun>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/cab-runs' as const,
      input: insertCabRunSchema,
      responses: {
        201: z.custom<CabRun>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/cab-runs/:id' as const,
      input: insertCabRunSchema.partial(),
      responses: {
        200: z.custom<CabRun>(),
        404: errorSchemas.notFound,
      },
    },
  },
  visa: {
    list: {
      method: 'GET' as const,
      path: '/api/visa-applications' as const,
      input: z.object({
        search: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<VisaApplication>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/visa-applications' as const,
      input: insertVisaApplicationSchema,
      responses: {
        201: z.custom<VisaApplication>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/visa-applications/:id' as const,
      input: insertVisaApplicationSchema.partial(),
      responses: {
        200: z.custom<VisaApplication>(),
        404: errorSchemas.notFound,
      },
    },
    updateStatus: {
      method: 'PATCH' as const,
      path: '/api/visa-applications/:id/status' as const,
      input: z.object({
        medicalStatus: z.enum(["pending", "fit", "unfit"]).optional(),
        pccStatus: z.enum(["locked", "pending", "completed"]).optional(),
        stampingStatus: z.enum(["locked", "pending", "completed"]).optional(),
      }),
      responses: {
        200: z.custom<VisaApplication>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  creditCards: {
    list: {
      method: 'GET' as const,
      path: '/api/credit-cards' as const,
      responses: {
        200: z.array(z.custom<CreditCard>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/credit-cards' as const,
      input: insertCreditCardSchema,
      responses: {
        201: z.custom<CreditCard>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/credit-cards/:id' as const,
      input: insertCreditCardSchema.partial(),
      responses: {
        200: z.custom<CreditCard>(),
        404: errorSchemas.notFound,
      },
    },
    repay: {
      method: 'POST' as const,
      path: '/api/credit-cards/:id/repay' as const,
      input: z.object({ amount: z.coerce.number() }),
      responses: {
        200: z.custom<CreditCard>(),
        404: errorSchemas.notFound,
      },
    }
  },
  vendors: {
    list: {
      method: 'GET' as const,
      path: '/api/vendors' as const,
      responses: {
        200: z.array(z.custom<Vendor>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/vendors' as const,
      input: insertVendorSchema,
      responses: {
        201: z.custom<Vendor>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/vendors/:id' as const,
      input: insertVendorSchema.partial(),
      responses: {
        200: z.custom<Vendor>(),
        404: errorSchemas.notFound,
      },
    },
    recordPayment: {
      method: 'POST' as const,
      path: '/api/vendors/:id/payments' as const,
      input: insertVendorPaymentSchema,
      responses: {
        201: z.custom<VendorPayment>(),
        404: errorSchemas.notFound,
      },
    }
  },
  attestation: {
    list: {
      method: 'GET' as const,
      path: '/api/attestation-services' as const,
      responses: {
        200: z.array(z.custom<AttestationService>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/attestation-services' as const,
      input: insertAttestationServiceSchema,
      responses: {
        201: z.custom<AttestationService>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/attestation-services/:id' as const,
      input: insertAttestationServiceSchema.partial(),
      responses: {
        200: z.custom<AttestationService>(),
        404: errorSchemas.notFound,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/attestation-services/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
  },
  globalSearch: {
    search: {
      method: 'GET' as const,
      path: '/api/search' as const,
      input: z.object({ q: z.string() }),
      responses: {
        200: z.object({
          visa: z.array(z.custom<VisaApplication>()),
          flights: z.array(z.custom<FlightBooking>()),
          cabs: z.array(z.custom<CabBooking>()),
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}



