import { redirect, type ActionFunctionArgs } from 'react-router';
import { ValidationError } from 'yup';
import authService from '@services/authService/authService';
import { PasskeySignInSchema, PasswordSignInSchema } from '@services/authService/authService.type';
import { AUTH_ROUTES_PATHS, defaultRedirectRoute } from '@application/routes/routesUtils';
import type { JSONResponseUtil } from '@app-types/utility';
import { parseFormData } from '@utils/formDataUtils';
import { askForPasskey, PASSKEY_CANCELLED_MESSAGE } from '@utils/passkeyUtils';
import { LoginIntents, type LoginFormData } from './loginUtils';

type SignIn = (formData: LoginFormData) => Promise<JSONResponseUtil>;

async function signInWithPassword({ credentials }: LoginFormData): Promise<JSONResponseUtil> {
  const fields = await PasswordSignInSchema.validate(credentials);

  return authService.signInWithPassword(fields);
}

// The whole passkey sign-in runs here, started by the button: options from the API, the browser's passkey prompt,
// then the API's check.
async function signInWithPasskey(): Promise<JSONResponseUtil> {
  const options = await authService.startPasskeySignIn();

  if (!options.success || !options.data) return { success: false, error: options.error };

  const response = await askForPasskey(options.data);

  if (!response) return { success: false, error: { message: PASSKEY_CANCELLED_MESSAGE } };

  const fields = await PasskeySignInSchema.validate({ response });

  return authService.signInWithPasskey(fields);
}

const SIGN_IN_MAP: Record<LoginIntents, SignIn> = {
  [LoginIntents.PASSWORD]: signInWithPassword,
  [LoginIntents.PASSKEY]: signInWithPasskey,
};

// Signed in either way, the app opens on Home.
export const signInAction = async ({ request }: ActionFunctionArgs): Promise<JSONResponseUtil | Response> => {
  const formData = parseFormData<LoginFormData>(await request.formData());
  const signIn = SIGN_IN_MAP[formData.intent] ?? SIGN_IN_MAP[LoginIntents.PASSWORD];

  try {
    const result = await signIn(formData);

    if (!result.success) return result;

    return redirect(defaultRedirectRoute);
  } catch (error) {
    if (error instanceof ValidationError) return { success: false };

    throw error;
  }
};

// Signing out always lands on the login page: the API clears the cookie even when the session was already gone.
export const logoutAction = async (): Promise<JSONResponseUtil | Response> => {
  const result = await authService.logout();

  if (!result.success) return result;

  return redirect(AUTH_ROUTES_PATHS.LOGIN);
};
