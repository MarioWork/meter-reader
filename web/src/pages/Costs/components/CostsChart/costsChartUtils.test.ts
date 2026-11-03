import { createReadingMockModel } from '@mocks/handlers/reading/models/readingMockModel.mock';
import { costBars, costsChartLabel, formatTickDate } from './costsChartUtils';

describe('costBars', () => {
  it('makes one bar per reading with a cost, oldest first, from readings that come newest first', () => {
    const readings = [
      createReadingMockModel({ id: 3, date: '2026-03-01', costCents: 3990 }),
      createReadingMockModel({ id: 2, date: '2026-02-01', costCents: null }),
      createReadingMockModel({ id: 1, date: '2026-01-01', costCents: 0 }),
    ];

    expect(costBars(readings)).toEqual([
      { readingId: 1, date: '2026-01-01', costCents: 0 },
      { readingId: 3, date: '2026-03-01', costCents: 3990 },
    ]);
  });
});

describe('costsChartLabel', () => {
  it('names how many costs the chart shows and over which days', () => {
    const bars = [
      { readingId: 1, date: '2026-01-01', costCents: 4410 },
      { readingId: 2, date: '2026-02-01', costCents: 3775 },
    ];

    expect(costsChartLabel(bars)).toBe(
      'Bar chart of 2 costs, from 1 Jan 2026 to 1 Feb 2026. Every amount is in the list below.',
    );
  });

  it('names the one day when the chart has a single bar', () => {
    const bars = [{ readingId: 1, date: '2026-01-01', costCents: 4410 }];

    expect(costsChartLabel(bars)).toBe('Bar chart of 1 cost, on 1 Jan 2026. Every amount is in the list below.');
  });
});

describe('formatTickDate', () => {
  it('writes a short day for the axis', () => {
    expect(formatTickDate('2026-01-01')).toBe('1 Jan 26');
  });
});
