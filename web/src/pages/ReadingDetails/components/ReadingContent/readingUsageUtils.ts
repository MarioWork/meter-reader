import type { ReadingDetailsApiModel, ReadingNeighbourApiModel } from '@app-types/models';
import { daysBetween } from '@utils/dateUtils';

// What the page can say about the water used since the previous reading.
export const ReadingUsageKind = {
  // The first reading ever: there is nothing to count from.
  FIRST: 'first',
  // The digits went up (or stayed): this many cubic metres in this many days.
  USED: 'used',
  // The digits went down: the meter was replaced, or one of the two readings was mistyped. Never a usage.
  WENT_DOWN: 'wentDown',
} as const;

export type ReadingUsageKind = (typeof ReadingUsageKind)[keyof typeof ReadingUsageKind];

type FirstReadingUsage = { kind: typeof ReadingUsageKind.FIRST };

type WaterUsedUsage = { kind: typeof ReadingUsageKind.USED; cubicMetres: number; days: number };

type DigitsWentDownUsage = {
  kind: typeof ReadingUsageKind.WENT_DOWN;
  cubicMetres: number;
  previous: ReadingNeighbourApiModel;
};

export type ReadingUsage = FirstReadingUsage | WaterUsedUsage | DigitsWentDownUsage;

const DECIMAL_RADIX = 10;

// The digits as a whole number of cubic metres, as the page shows them with "m³". Exact for every digit window the
// API takes: 15 digits stay below Number.MAX_SAFE_INTEGER.
function toCubicMetres(digits: string): number {
  return Number.parseInt(digits, DECIMAL_RADIX);
}

// The water used since the reading just before this one by date, or why there is none to show.
export function getReadingUsage({ digits, date, previous }: ReadingDetailsApiModel): ReadingUsage {
  if (!previous) return { kind: ReadingUsageKind.FIRST };

  const difference = toCubicMetres(digits) - toCubicMetres(previous.digits);
  const didGoDown = difference < 0;

  if (didGoDown) return { kind: ReadingUsageKind.WENT_DOWN, cubicMetres: -difference, previous };

  return { kind: ReadingUsageKind.USED, cubicMetres: difference, days: daysBetween(previous.date, date) };
}
