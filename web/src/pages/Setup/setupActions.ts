import type { RegistrationResponseJSON } from '@simplewebauthn/browser';
import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import authService from '@services/authService/authService';
import { SetUpSchema, StartPasskeySetupSchema } from '@services/authService/authService.type';
import { defaultRedirectRoute } from '@application/routes/routesUtils';
import type { JSONResponseUtil } from '@app-types/utility';
import { newPasswordSchema } from '@utils/authUtils';
import { parseFormData } from '@utils/formDataUtils';
import { askForNewPasskey, PASSKEY_CANCELLED_MESSAGE } from '@utils/passkeyUtils';
import type { SetupFormData } from './setupUtils';

// Options from the API (which checks the code), then the browser's prompt to make the passkey.
async function makePasskey(code: string): Promise<JSONResponseUtil<RegistrationResponseJSON>> {
  const options = await authService.startPasskeySetup({ code });

  if (!options.success || !options.data) return { success: false, error: options.error };

  const response = await askForNewPasskey(options.data);

  if (!response) return { success: false, error: { message: PASSKEY_CANCELLED_MESSAGE } };

  return { success: true, data: response };
}

async function finishSetup(setup: unknown): Promise<JSONResponseUtil | Response> {
  const fields = await SetUpSchema.validate(setup);
  const result = await authService.setUp(fields);

  if (!result.success) return result;

  return redirect(defaultRedirectRoute);
}

// Setup, started by the form: the code and password are checked first, so a short password never leaves a passkey
// behind on the device. Then the passkey (when asked for), then the API saves both and signs the user in.
export const setUpAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> => {
  const { setup } = parseFormData<SetupFormData>(await request.formData());

  try {
    const { code } = await StartPasskeySetupSchema.validate({ code: setup.code });
    const password = await newPasswordSchema.validate(setup.password);

    if (!setup.hasPasskey) return await finishSetup({ code, password });

    const passkey = await makePasskey(code);

    if (!passkey.success) return { success: false, error: passkey.error };

    return await finishSetup({ code, password, passkey: passkey.data });
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};
