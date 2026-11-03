import { number } from 'yup';

// A Cost (docs/GLOSSARY.md) travels in euro cents, a whole number, so €42.10 is 4210 and never a rounded float.
// The most the API stores (a Postgres `integer`).
export const COST_CENTS_MAX = 2_147_483_647;
export const CENTS_PER_EURO = 100;
export const CENTS_DIGITS = 2;
const DISPLAY_LOCALE = 'en-GB';
const COST_FORMAT = new Intl.NumberFormat(DISPLAY_LOCALE, {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: CENTS_DIGITS,
  maximumFractionDigits: CENTS_DIGITS,
});

// A chart's value axis in whole euros: the cents are in the tooltip and the list.
const WHOLE_EURO_FORMAT = new Intl.NumberFormat(DISPLAY_LOCALE, {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

// What the API takes: whole cents, 0 or more. Shared by the service's payload schema.
export const costCentsSchema = number().integer().min(0).max(COST_CENTS_MAX);

// 4210 → "€42.10".
export function formatCost(costCents: number): string {
  return COST_FORMAT.format(costCents / CENTS_PER_EURO);
}

// 4000 → "€40".
export function formatWholeEuros(costCents: number): string {
  return WHOLE_EURO_FORMAT.format(costCents / CENTS_PER_EURO);
}
