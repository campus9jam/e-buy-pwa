/**
 * Central pricing rules for E-Buy.
 *
 * Two products, two deposit rules:
 *
 * - Bikes carry a flat ₦300,000 deposit taken at checkout. It is made up of a
 *   ₦50,000 registration fee, ₦10,000 VAT and a ₦240,000 first payment towards
 *   the bike. Only the first payment reduces the balance.
 * - Phones keep the percentage deposit plus the flat VAT on top.
 *
 * Either way the balance is paid in installments after delivery.
 */

export type ProductCategory = "bike" | "phone";

/** Flat deposit for a bike, in naira (registration + VAT + first payment). */
export const BIKE_DEPOSIT = 300000;

/** Bike registration / plate fee, part of the deposit. */
export const BIKE_REGISTRATION_FEE = 50000;

/** Flat VAT charged on every order, in naira. */
export const VAT_AMOUNT = 10000;

/** Bike first payment towards the bike itself, part of the deposit. */
export const BIKE_FIRST_PAYMENT = BIKE_DEPOSIT - BIKE_REGISTRATION_FEE - VAT_AMOUNT;

/** Phones only: deposit as a share of the price. */
export const DOWN_PAYMENT_PERCENT = 20;
export const DOWN_PAYMENT_RATE = DOWN_PAYMENT_PERCENT / 100;

/** Every order must carry this many guarantors. */
export const GUARANTOR_COUNT = 3;

export interface Pricing {
  /** Product price */
  price: number;
  category: ProductCategory;
  /** Bike registration fee (0 for phones) */
  registration: number;
  /** Flat VAT amount */
  vat: number;
  /** What goes towards the product up front (bike first payment / phone %) */
  downPayment: number;
  /** Label for the down payment line */
  downPaymentLabel: string;
  /** What the customer transfers at checkout */
  dueNow: number;
  /** Balance paid in installments after delivery */
  remaining: number;
}

/** Coerces anything (DB row, request body) into a known category. */
export function normalizeCategory(value: unknown): ProductCategory {
  return String(value ?? "").trim().toLowerCase() === "bike" ? "bike" : "phone";
}

export function computePricing(price: number, category: unknown = "phone"): Pricing {
  const safePrice = Number(price) > 0 ? Math.round(Number(price)) : 0;
  const kind = normalizeCategory(category);
  const isBike = kind === "bike";

  const registration = isBike ? BIKE_REGISTRATION_FEE : 0;
  const vat = VAT_AMOUNT;

  // A bike's first payment is fixed, but never more than the bike is worth.
  const downPayment = isBike
    ? Math.min(BIKE_FIRST_PAYMENT, Math.max(0, safePrice - registration - vat))
    : Math.round(safePrice * DOWN_PAYMENT_RATE);

  return {
    price: safePrice,
    category: kind,
    registration,
    vat,
    downPayment,
    downPaymentLabel: isBike ? "First payment" : "Down payment",
    dueNow: registration + vat + downPayment,
    remaining: Math.max(0, safePrice - downPayment),
  };
}

export function formatNaira(amount: number): string {
  return `₦${Math.round(Number(amount) || 0).toLocaleString("en-NG")}`;
}
