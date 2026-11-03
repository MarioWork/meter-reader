import { object, string, type InferType } from 'yup';
import { CENTS_DIGITS, CENTS_PER_EURO, COST_CENTS_MAX } from '@utils/costUtils';

// Euros, then up to 2 decimals after a comma or a point: "42", "42,1", "42.10". Never below 0, as there is no sign.
const COST_PATTERN = /^(\d+)(?:[.,](\d{1,2}))?$/;
const COST_FORMAT_MESSAGE = 'Write the cost in euros, like 42,10 or 42.10';
const COST_TOO_LARGE_MESSAGE = 'That cost is too large';

// The cents in a cost the user typed. Worked out on the digits, never through a float (0.1 + 0.2 is not 0.3). Null
// when the field is empty, or holds something COST_PATTERN does not match (costTextSchema says why).
export function toCostCents(costText: string): number | null {
  const match = COST_PATTERN.exec(costText.trim());

  if (!match) return null;

  const [, euros, cents = ''] = match;

  return Number(euros) * CENTS_PER_EURO + Number(cents.padEnd(CENTS_DIGITS, '0'));
}

function isWithinMax(costText: string): boolean {
  const costCents = toCostCents(costText);

  return costCents === null || costCents <= COST_CENTS_MAX;
}

// The Cost field as typed: empty (no cost), or euros with up to 2 decimals after a comma or a point.
export const costTextSchema = string()
  .trim()
  .defined()
  .matches(COST_PATTERN, { message: COST_FORMAT_MESSAGE, excludeEmptyString: true })
  .test('within-max', COST_TOO_LARGE_MESSAGE, isWithinMax);

// What the Cost field starts with: the saved cost with its 2 decimals ("42.10"), or empty when there is none.
export function toCostText(costCents: number | null): string {
  if (costCents === null) return '';

  return (costCents / CENTS_PER_EURO).toFixed(CENTS_DIGITS);
}

// The dialog's form: the cost as typed, in euros. Empty means no cost.
export const costAndBillFormSchema = object({
  cost: costTextSchema,
});

export type CostAndBillFormValues = InferType<typeof costAndBillFormSchema>;
