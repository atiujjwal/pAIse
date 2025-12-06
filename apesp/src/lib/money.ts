/**
 * Safe monetary arithmetic utilities.
 * Operations are performed in integer cents to avoid floating point errors.
 */

export const toCents = (amount: string | number): number => {
  return Math.round(Number(amount) * 100);
};

export const fromCents = (cents: number): string => {
  return (cents / 100).toFixed(2);
};

export const safeAdd = (a: string, b: string): string => {
  return fromCents(toCents(a) + toCents(b));
};

export const safeSub = (a: string, b: string): string => {
  return fromCents(toCents(a) - toCents(b));
};

export const safeDiv = (amount: string, divisor: number): string => {
  const cents = toCents(amount);
  // Floor division to ensure we don't over-allocate
  const partCents = Math.floor(cents / divisor);
  return fromCents(partCents);
};
