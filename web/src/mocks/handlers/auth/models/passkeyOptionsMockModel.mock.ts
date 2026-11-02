import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser';

const MOCK_RP_ID = 'localhost';
const MOCK_CEREMONY_TIMEOUT_MS = 120000;

// What the API's @simplewebauthn/server builds for a new passkey, with fixed values.
export const createRegistrationOptionsMockModel = (
  overrides?: Partial<PublicKeyCredentialCreationOptionsJSON>,
): PublicKeyCredentialCreationOptionsJSON => ({
  challenge: 'c2V0dXAtY2hhbGxlbmdl',
  rp: { name: 'Meter Reader', id: MOCK_RP_ID },
  user: { id: 'bWV0ZXItcmVhZGVyLXVzZXI', name: 'Meter Reader', displayName: 'Meter Reader' },
  pubKeyCredParams: [
    { alg: -8, type: 'public-key' },
    { alg: -7, type: 'public-key' },
  ],
  timeout: MOCK_CEREMONY_TIMEOUT_MS,
  attestation: 'none',
  excludeCredentials: [],
  authenticatorSelection: { residentKey: 'required', userVerification: 'required', requireResidentKey: true },
  ...overrides,
});

// What it builds for a sign-in: no allowCredentials, the browser offers any passkey for this site.
export const createAuthenticationOptionsMockModel = (
  overrides?: Partial<PublicKeyCredentialRequestOptionsJSON>,
): PublicKeyCredentialRequestOptionsJSON => ({
  challenge: 'c2lnbi1pbi1jaGFsbGVuZ2U',
  rpId: MOCK_RP_ID,
  allowCredentials: [],
  timeout: MOCK_CEREMONY_TIMEOUT_MS,
  userVerification: 'required',
  ...overrides,
});
