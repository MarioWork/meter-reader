import { cn } from './classNameUtils';

it('joins class lists and drops the ones whose condition is off', () => {
  const isActive = false;

  expect(cn('flex', isActive && 'bg-primary', ['gap-2'])).toBe('flex gap-2');
});

it('lets a later utility win over an earlier one for the same property', () => {
  expect(cn('p-2 text-foreground', 'p-4')).toBe('text-foreground p-4');
});
