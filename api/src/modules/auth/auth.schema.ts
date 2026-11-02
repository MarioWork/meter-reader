// The schemas the auth jobs share: the passkey shapes a browser sends and the options sent back to it.
import { z } from 'zod';

// Room for long passphrases; anything longer is an absurd body, not a password.
export const PASSWORD_MAX_LENGTH = 256;
// Generous ceilings: real values are a few hundred bytes, these only stop absurd bodies early.
export const ID_MAX_LENGTH = 1024;
const ENCODED_MAX_LENGTH = 65_536;
const AUTHENTICATOR_TRANSPORTS = ['ble', 'cable', 'hybrid', 'internal', 'nfc', 'smart-card', 'usb'] as const;
const AUTHENTICATOR_ATTACHMENTS = ['platform', 'cross-platform'] as const;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

function base64Url(maxLength: number) {
  return z.string().min(1).max(maxLength).regex(BASE64URL_PATTERN, 'Must be base64url');
}

// What @simplewebauthn/browser sends back; the library checks the signed contents, this only checks the shape.
const ClientExtensionResultsSchema = z.object({
  credProps: z.object({ rk: z.boolean().optional() }).optional(),
});

export const RegistrationResponseSchema = z.object({
  id: base64Url(ID_MAX_LENGTH),
  rawId: base64Url(ID_MAX_LENGTH),
  type: z.literal('public-key'),
  authenticatorAttachment: z.enum(AUTHENTICATOR_ATTACHMENTS).optional(),
  clientExtensionResults: ClientExtensionResultsSchema,
  response: z.object({
    clientDataJSON: base64Url(ENCODED_MAX_LENGTH),
    attestationObject: base64Url(ENCODED_MAX_LENGTH),
    authenticatorData: base64Url(ENCODED_MAX_LENGTH).optional(),
    transports: z.array(z.enum(AUTHENTICATOR_TRANSPORTS)).optional(),
    publicKeyAlgorithm: z.number().int().optional(),
    publicKey: base64Url(ENCODED_MAX_LENGTH).optional(),
  }),
});

export const AuthenticationResponseSchema = z.object({
  id: base64Url(ID_MAX_LENGTH),
  rawId: base64Url(ID_MAX_LENGTH),
  type: z.literal('public-key'),
  authenticatorAttachment: z.enum(AUTHENTICATOR_ATTACHMENTS).optional(),
  clientExtensionResults: ClientExtensionResultsSchema,
  response: z.object({
    clientDataJSON: base64Url(ENCODED_MAX_LENGTH),
    authenticatorData: base64Url(ENCODED_MAX_LENGTH),
    signature: base64Url(ENCODED_MAX_LENGTH),
    userHandle: base64Url(ID_MAX_LENGTH).optional(),
  }),
});

// The options objects are built by @simplewebauthn/server and passed straight to the browser library: only the
// challenge is pinned here, the rest passes through untouched.
export const RegistrationOptionsResponseSchema = z
  .looseObject({ challenge: z.string() })
  .meta({ id: 'PasskeyRegistrationOptions' });

export const AuthenticationOptionsResponseSchema = z
  .looseObject({ challenge: z.string() })
  .meta({ id: 'PasskeyAuthenticationOptions' });

export type RegistrationResponse = z.infer<typeof RegistrationResponseSchema>;
export type AuthenticationResponse = z.infer<typeof AuthenticationResponseSchema>;
export type RegistrationOptionsResponse = z.infer<typeof RegistrationOptionsResponseSchema>;
export type AuthenticationOptionsResponse = z.infer<typeof AuthenticationOptionsResponseSchema>;
