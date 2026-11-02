import { formatIsoDate, todayAsIsoDate } from './dateUtils';

describe('todayAsIsoDate', () => {
  it('gives the local calendar day with zero-padded month and day', () => {
    expect(todayAsIsoDate(new Date(2026, 2, 7, 23, 59))).toBe('2026-03-07');
  });
});

describe('formatIsoDate', () => {
  it('shows the calendar day as written, with a short month', () => {
    expect(formatIsoDate('2026-10-31')).toBe('31 Oct 2026');
  });
});
