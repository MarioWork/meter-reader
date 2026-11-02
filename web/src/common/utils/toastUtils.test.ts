import { redirect } from 'react-router';
import { toast } from '@components/ui/toast';
import { toastActionResult } from './toastUtils';

const MESSAGES = { success: 'Reading saved', failure: 'Reading not saved' };

it('says it worked when the action answers with a success', () => {
  const addToast = vi.spyOn(toast, 'add');
  const result = { success: true };

  expect(toastActionResult(result, MESSAGES)).toBe(result);
  expect(addToast).toHaveBeenCalledWith({ type: 'success', title: 'Reading saved' });
});

it('says it worked when the action redirects', () => {
  const addToast = vi.spyOn(toast, 'add');

  toastActionResult(redirect('/'), MESSAGES);

  expect(addToast).toHaveBeenCalledWith({ type: 'success', title: 'Reading saved' });
});

it('says it failed when the action answers with a failure, and hands the failure on', () => {
  const addToast = vi.spyOn(toast, 'add');
  const result = { success: false, error: { statusCode: 500 } };

  expect(toastActionResult(result, MESSAGES)).toBe(result);
  expect(addToast).toHaveBeenCalledWith({ type: 'error', title: 'Reading not saved' });
});
