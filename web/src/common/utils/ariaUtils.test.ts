import { describedByIds } from './ariaUtils';

it('joins the ids that are there, in order', () => {
  expect(describedByIds('password-hint', undefined, 'password-error')).toBe('password-hint password-error');
});

it('leaves the attribute off when nothing describes the control', () => {
  expect(describedByIds(undefined, undefined)).toBeUndefined();
});
