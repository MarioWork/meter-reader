import { isReadingLower } from './readingUtils';

describe('isReadingLower', () => {
  it('is true when the number is smaller', () => {
    expect(isReadingLower('00122', '00123')).toBe(true);
  });

  it('is false when the number is the same, whatever the leading zeros', () => {
    expect(isReadingLower('123', '00123')).toBe(false);
  });

  it('is false when the number is bigger but has fewer leading zeros', () => {
    expect(isReadingLower('1000', '00999')).toBe(false);
  });

  it('is true when the number is smaller but has more digits shown', () => {
    expect(isReadingLower('000999', '1000')).toBe(true);
  });

  it('compares numbers too long for a JavaScript number exactly', () => {
    expect(isReadingLower('123456789012345', '123456789012346')).toBe(true);
  });
});
