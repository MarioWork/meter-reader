import { formatCost, formatWholeEuros } from './costUtils';

describe('formatCost', () => {
  it('shows the cost as euros with 2 decimals', () => {
    expect(formatCost(4210)).toBe('€42.10');
    expect(formatCost(0)).toBe('€0.00');
    expect(formatCost(123456)).toBe('€1,234.56');
  });
});

describe('formatWholeEuros', () => {
  it('writes cents as whole euros for a chart axis', () => {
    expect(formatWholeEuros(4000)).toBe('€40');
  });
});
