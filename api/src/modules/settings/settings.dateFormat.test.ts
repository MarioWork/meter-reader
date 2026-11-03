import { formatMessageDate } from './settings.dateFormat.ts';
import { MESSAGE_DATE_FORMATS } from './settings.type.ts';

// A Postgres `date` comes back as midnight UTC of that day.
const OCTOBER_31 = new Date('2026-10-31T00:00:00.000Z');
const NOVEMBER_3 = new Date('2026-11-03T00:00:00.000Z');
const SEPTEMBER_1 = new Date('2026-09-01T00:00:00.000Z');

describe('formatMessageDate', () => {
  it.each([
    [MESSAGE_DATE_FORMATS.LONG_MONTH, '31 October 2026'],
    [MESSAGE_DATE_FORMATS.SHORT_MONTH, '31 Oct 2026'],
    [MESSAGE_DATE_FORMATS.DAY_MONTH_YEAR, '31/10/2026'],
    [MESSAGE_DATE_FORMATS.ISO, '2026-10-31'],
  ])('writes the day in the chosen format when it is %s', (dateFormat, expected) => {
    expect(formatMessageDate(OCTOBER_31, dateFormat)).toBe(expected);
  });

  it.each([
    [MESSAGE_DATE_FORMATS.LONG_MONTH, '3 November 2026'],
    [MESSAGE_DATE_FORMATS.SHORT_MONTH, '3 Nov 2026'],
    [MESSAGE_DATE_FORMATS.DAY_MONTH_YEAR, '03/11/2026'],
    [MESSAGE_DATE_FORMATS.ISO, '2026-11-03'],
  ])('pads the day and month only in the numeric formats when they are single digits (%s)', (dateFormat, expected) => {
    expect(formatMessageDate(NOVEMBER_3, dateFormat)).toBe(expected);
  });

  it('writes Sep, three letters like every other month, when the month is September and the format is short', () => {
    expect(formatMessageDate(SEPTEMBER_1, MESSAGE_DATE_FORMATS.SHORT_MONTH)).toBe('1 Sep 2026');
  });
});
