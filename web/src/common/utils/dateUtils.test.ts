import { daysBetween, formatIsoDate, todayAsIsoDate } from './dateUtils';

describe('daysBetween', () => {
  it('counts the calendar days from one day to a later one', () => {
    expect(daysBetween('2026-09-01', '2026-10-01')).toBe(30);
  });

  it('counts across a year end and a leap day', () => {
    expect(daysBetween('2027-12-31', '2028-03-01')).toBe(61);
  });

  it('is 0 on the same day', () => {
    expect(daysBetween('2026-10-31', '2026-10-31')).toBe(0);
  });
});

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
