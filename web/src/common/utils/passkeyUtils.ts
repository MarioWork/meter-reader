import {
  startAuthentication,
  startRegistration,
  type AuthenticationResponseJSON,
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  type RegistrationResponseJSON,
} from '@simplewebauthn/browser';

// The browser's passkey prompts. Each gives back the browser's answer, or undefined when the user closed the
// prompt, the device has no passkey for this site, or the browser cannot make one: the page then says so.

export async function askForNewPasskey(
  optionsJSON: PublicKeyCredentialCreationOptionsJSON,
): Promise<RegistrationResponseJSON | undefined> {
  try {
    return await startRegistration({ optionsJSON });
  } catch {
    return undefined;
  }
}

export async function askForPasskey(
  optionsJSON: PublicKeyCredentialRequestOptionsJSON,
): Promise<AuthenticationResponseJSON | undefined> {
  try {
    return await startAuthentication({ optionsJSON });
  } catch {
    return undefined;
  }
}

export const PASSKEY_CANCELLED_MESSAGE = 'The passkey prompt closed before it finished. Try again.';
