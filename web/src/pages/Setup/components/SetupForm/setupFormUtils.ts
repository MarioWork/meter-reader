import { boolean, object, type InferType } from 'yup';
import { newPasswordSchema } from '@utils/authUtils';
import type { SetupFormData } from '../../setupUtils';

const NO_WAY_IN_MESSAGE = 'Set a password, add a passkey, or both';

export const setupFormSchema = object({
  password: newPasswordSchema,
  hasPasskey: boolean().required(),
}).test('has-a-way-in', NO_WAY_IN_MESSAGE, (values, context) => {
  const hasWayIn = Boolean(values.password) || values.hasPasskey;

  // Shown under the password field, the first of the two choices.
  return hasWayIn || context.createError({ path: 'password', message: NO_WAY_IN_MESSAGE });
});

export type SetupFormValues = InferType<typeof setupFormSchema>;

export const getInitialValues = (): SetupFormValues => ({ password: '', hasPasskey: false });

export const toPayload = (code: string, values: SetupFormValues): SetupFormData['setup'] => ({
  code,
  password: values.password ?? undefined,
  hasPasskey: values.hasPasskey,
});
