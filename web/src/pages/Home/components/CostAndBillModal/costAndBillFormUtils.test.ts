import { costTextSchema, toCostCents, toCostText } from './costAndBillFormUtils';

describe('toCostCents', () => {
  it.each([
    ['42,10', 4210],
    ['42.10', 4210],
    ['42,1', 4210],
    ['42', 4200],
    ['0', 0],
    ['0,05', 5],
    ['  42,10  ', 4210],
  ])('reads %j as %i cents', (costText, costCents) => {
    expect(toCostCents(costText)).toBe(costCents);
  });

  it('works on the digits, so no float rounding creeps in', () => {
    expect(toCostCents('0.29')).toBe(29);
    expect(toCostCents('1.15')).toBe(115);
  });

  it('is null when the field is empty', () => {
    expect(toCostCents('  ')).toBeNull();
  });
});

describe('costTextSchema', () => {
  it.each(['42,10', '42.10', '42', '0', '', '  '])('accepts %j', (costText) => {
    expect(costTextSchema.isValidSync(costText)).toBe(true);
  });

  it.each(['-1', '42,105', 'abc', '42 €', '1.234,56', ',50', '42,'])(
    'refuses %j and says how to write it',
    (costText) => {
      expect(() => costTextSchema.validateSync(costText)).toThrow('Write the cost in euros, like 42,10 or 42.10');
    },
  );

  it('refuses a cost over what the API can store', () => {
    expect(() => costTextSchema.validateSync('21474836.48')).toThrow('That cost is too large');
    expect(costTextSchema.isValidSync('21474836.47')).toBe(true);
  });
});

describe('toCostText', () => {
  it('shows the saved cost with its 2 decimals', () => {
    expect(toCostText(4210)).toBe('42.10');
    expect(toCostText(5)).toBe('0.05');
  });

  it('is empty when there is no cost', () => {
    expect(toCostText(null)).toBe('');
  });
});
