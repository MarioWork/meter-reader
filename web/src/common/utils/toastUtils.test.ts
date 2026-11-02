import { redirect } from 'react-router';
import { toast } from '@components/ui/toast';
import { toastOnSuccess } from './toastUtils';

const MESSAGE = 'Reading saved';

it('says it worked when the action answers with a success', () => {
  const addToast = vi.spyOn(toast, 'add');
  const result = { success: true };

  expect(toastOnSuccess(result, MESSAGE)).toBe(result);
  expect(addToast).toHaveBeenCalledWith({ type: 'success', title: MESSAGE });
});

it('says it worked when the action redirects', () => {
  const addToast = vi.spyOn(toast, 'add');

  toastOnSuccess(redirect('/'), MESSAGE);

  expect(addToast).toHaveBeenCalledWith({ type: 'success', title: MESSAGE });
});

it('stays quiet on a failure, which its form shows, and hands the failure on', () => {
  const addToast = vi.spyOn(toast, 'add');
  const result = { success: false, error: { statusCode: 500 } };

  expect(toastOnSuccess(result, MESSAGE)).toBe(result);
  expect(addToast).not.toHaveBeenCalled();
});
