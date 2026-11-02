import { pickReadingDigits } from './photoDigitsUtils';

describe('pickReadingDigits', () => {
  it('keeps every digit of the reading, leading zeros and red digits included', () => {
    expect(pickReadingDigits('00529 47\n')).toBe('0052947');
  });

  it('takes the line with the most digits when the photo shows other numbers too', () => {
    expect(pickReadingDigits('12\n0 0 6 1 2\n3\n')).toBe('00612');
  });

  it('finds nothing in text with no digits', () => {
    expect(pickReadingDigits('  \n\n')).toBe('');
  });

  it('drops anything other than digits that slips past the whitelist', () => {
    expect(pickReadingDigits('00-61.2|')).toBe('00612');
  });

  it('finds nothing when the longest line is longer than any reading can be', () => {
    expect(pickReadingDigits('1234567890123456')).toBe('');
  });
});
