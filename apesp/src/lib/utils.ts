import { type ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";


/**
 * Merges Tailwind classes with logical conflict resolution.
 * Standard utility for modern React/Next.js applications.
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatAmount(n: number, currency = "INR") {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(
    n
  );
}

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Formats a decimal string into a currency string based on locale.
 * Handles the "string-only" constraint for financial values.
 */
export function formatCurrency(amount: string, currency: string = 'INR', locale: string = 'en-IN') {
  const numberValue = parseFloat(amount);
  if (isNaN(numberValue)) return amount;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(numberValue);
}