import { costTextSchema, toCostCents, toCostText, toSaveFailure } from './costAndBillFormUtils';

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

describe('toSaveFailure', () => {
  const FALLBACK = 'The cost and bill could not be saved. Please try again.';

  it.each([
    ['BILL_NOT_SUPPORTED', 400, 'Bills must be a PDF.'],
    ['BILL_TOO_LARGE', 413, 'The bill must be at most 10 MB'],
    ['FST_ERR_CTP_BODY_TOO_LARGE', 413, 'Request body is too large'],
  ])("puts the server's %s reason on the Bill field", (code, statusCode, message) => {
    expect(toSaveFailure({ success: false, error: { code, statusCode, message } }, FALLBACK)).toEqual({
      billError: message,
    });
  });

  it("puts any other failure in the form's alert, or the fallback when the server sent no reason", () => {
    const serverError = { code: 'INTERNAL_ERROR', statusCode: 500, message: 'Something went wrong' };

    expect(toSaveFailure({ success: false, error: serverError }, FALLBACK)).toEqual({ formError: serverError.message });
    expect(toSaveFailure({ success: false }, FALLBACK)).toEqual({ formError: FALLBACK });
  });

  it('is empty before a save and after a success', () => {
    expect(toSaveFailure(undefined, FALLBACK)).toEqual({});
    expect(toSaveFailure({ success: true }, FALLBACK)).toEqual({});
  });
});
