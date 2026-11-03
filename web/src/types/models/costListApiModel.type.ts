import type { ReadingApiModel } from './readingApiModel.type';

// The Costs page's readings: every reading with a Cost (docs/GLOSSARY.md) in the day range, newest first, and what they
// cost together in euro cents. Not paged: the chart draws every one of them.
export interface CostListApiModel {
  data: ReadingApiModel[];
  totalCostCents: number;
}
