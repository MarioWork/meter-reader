import { MessageDateFormatUtil, MessageDateLanguageUtil } from '@app-types/utility';
import { formatMessageDate } from './messageDateFormatUtils';

describe('formatMessageDate', () => {
  it.each([
    [MessageDateFormatUtil.LONG_MONTH, '31 October 2026'],
    [MessageDateFormatUtil.SHORT_MONTH, '31 Oct 2026'],
    [MessageDateFormatUtil.DAY_MONTH_YEAR, '31/10/2026'],
    [MessageDateFormatUtil.ISO, '2026-10-31'],
  ])('writes the day in the %s format', (dateFormat, expected) => {
    expect(formatMessageDate('2026-10-31', dateFormat)).toBe(expected);
  });

  it.each([
    [MessageDateFormatUtil.LONG_MONTH, '3 November 2026'],
    [MessageDateFormatUtil.SHORT_MONTH, '3 Nov 2026'],
    [MessageDateFormatUtil.DAY_MONTH_YEAR, '03/11/2026'],
    [MessageDateFormatUtil.ISO, '2026-11-03'],
  ])('pads the day and month only in the numeric formats, in the %s format', (dateFormat, expected) => {
    expect(formatMessageDate('2026-11-03', dateFormat)).toBe(expected);
  });

  it.each([
    [MessageDateFormatUtil.LONG_MONTH, '31 de outubro de 2026'],
    [MessageDateFormatUtil.SHORT_MONTH, '31 out 2026'],
    [MessageDateFormatUtil.DAY_MONTH_YEAR, '31/10/2026'],
    [MessageDateFormatUtil.ISO, '2026-10-31'],
  ])('writes the day in Portuguese in the %s format, as the API does', (dateFormat, expected) => {
    expect(formatMessageDate('2026-10-31', dateFormat, MessageDateLanguageUtil.PORTUGUESE)).toBe(expected);
  });

  it('writes September as Sep in the short format, as the API does', () => {
    expect(formatMessageDate('2026-09-01', MessageDateFormatUtil.SHORT_MONTH)).toBe('1 Sep 2026');
  });
});
