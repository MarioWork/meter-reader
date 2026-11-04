import { createReadingMockModel } from '@mocks/handlers/reading/models/readingMockModel.mock';
import { getReadingUsage, ReadingUsageKind } from './readingUsageUtils';

function readingWithPrevious(digits: string, previousDigits: string | null) {
  const previous = previousDigits === null ? null : { id: 1, digits: previousDigits, date: '2026-09-01' };

  return { ...createReadingMockModel({ id: 2, digits, date: '2026-10-01' }), previous, next: null };
}

describe('getReadingUsage', () => {
  it('gives the cubic metres used since the previous reading and the days between them', () => {
    expect(getReadingUsage(readingWithPrevious('00529', '00520'))).toEqual({
      kind: ReadingUsageKind.USED,
      cubicMetres: 9,
      days: 30,
    });
  });

  it('says it is the first reading when there is none before it', () => {
    expect(getReadingUsage(readingWithPrevious('00529', null))).toEqual({ kind: ReadingUsageKind.FIRST });
  });

  it('gives how far the digits went down, never a negative usage, when they are lower than the previous reading', () => {
    expect(getReadingUsage(readingWithPrevious('00012', '00900'))).toEqual({
      kind: ReadingUsageKind.WENT_DOWN,
      cubicMetres: 888,
      previous: { id: 1, digits: '00900', date: '2026-09-01' },
    });
  });

  it('counts no water used when the digits did not move', () => {
    expect(getReadingUsage(readingWithPrevious('00520', '00520'))).toMatchObject({
      kind: ReadingUsageKind.USED,
      cubicMetres: 0,
    });
  });

  it('works on every digit of a long digit window', () => {
    expect(getReadingUsage(readingWithPrevious('900000000000001', '900000000000000'))).toMatchObject({
      cubicMetres: 1,
    });
  });
});
