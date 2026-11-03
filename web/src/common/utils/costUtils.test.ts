import { formatCost } from './costUtils';

describe('formatCost', () => {
  it('shows the cost as euros with 2 decimals', () => {
    expect(formatCost(4210)).toBe('€42.10');
    expect(formatCost(0)).toBe('€0.00');
    expect(formatCost(123456)).toBe('€1,234.56');
  });
});
