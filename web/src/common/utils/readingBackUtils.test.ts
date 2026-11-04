import { backPageOf, readingSearchFrom } from './readingBackUtils';

describe('readingSearchFrom', () => {
  it('adds where the reading was opened from when it is Costs, keeping its dates', () => {
    expect(readingSearchFrom('/costs', '?from=2026-01-01&to=2026-12-31')).toBe(
      '?from=2026-01-01&to=2026-12-31&back=costs',
    );
  });

  it("keeps Home's search as it is", () => {
    expect(readingSearchFrom('/home', '?status=sent')).toBe('?status=sent');
  });
});

describe('backPageOf', () => {
  it('goes back to Costs, with its dates and without the marker, when the reading was opened from there', () => {
    expect(backPageOf('?from=2026-01-01&to=2026-12-31&back=costs')).toEqual({
      to: { pathname: '/costs', search: '?from=2026-01-01&to=2026-12-31' },
      label: 'Costs',
      iconLabel: 'Back to costs',
    });
  });

  it('goes back to Home, with its search, otherwise', () => {
    expect(backPageOf('?status=sent')).toEqual({
      to: { pathname: '/home', search: '?status=sent' },
      label: 'Readings',
      iconLabel: 'Back to readings',
    });
  });

  it('never goes anywhere but Home or Costs, whatever the marker says', () => {
    expect(backPageOf('?back=javascript:alert(1)').to).toEqual({ pathname: '/home', search: '' });
  });
});
