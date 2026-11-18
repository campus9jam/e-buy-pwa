/**
 * Central pricing rules for E-Buy.
 *
 * Customer pays a down payment percentage of the device price plus a flat VAT
 * charge at checkout. The balance is paid in installments after delivery.
 */

export const DOWN_PAYMENT_PERCENT = 20;
export const DOWN_PAYMENT_RATE = DOWN_PAYMENT_PERCENT / 100;

/** Flat VAT charged on every order, in naira. */
export const VAT_AMOUNT = 10000;

/** Every order must carry this many guarantors. */
export const GUARANTOR_COUNT = 3;

export interface Pricing {
  /** Device price */
  price: number;
  /** Down payment amount (20% of price) */
  downPayment: number;
  /** Flat VAT amount */
  vat: number;
  /** What the customer transfers at checkout (down payment + VAT) */
  dueNow: number;
  /** Balance paid in installments after delivery */
  remaining: number;
}

export function computePricing(price: number): Pricing {
  const safePrice = Number(price) > 0 ? Math.round(Number(price)) : 0;
  const downPayment = Math.round(safePrice * DOWN_PAYMENT_RATE);
  const vat = VAT_AMOUNT;

  return {
    price: safePrice,
    downPayment,
    vat,
    dueNow: downPayment + vat,
    remaining: safePrice - downPayment,
  };
}

export function formatNaira(amount: number): string {
  return `₦${Math.round(Number(amount) || 0).toLocaleString("en-NG")}`;
}
