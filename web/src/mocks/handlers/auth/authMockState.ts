// The mock login: one state shared by every auth handler, so signing out in the demo really signs out.
import { AuthStateUtil } from '@app-types/utility';

// The code the mocks accept, as the server would print it in /setup?code=...
export const MOCK_SETUP_CODE = 'meter-reader-first-run';

// Signed in by default, so dev, the demo, Vitest and Playwright open on the app itself.
const DEFAULT_AUTH_STATE = AuthStateUtil.SIGNED_IN;

let authState: AuthStateUtil = DEFAULT_AUTH_STATE;

export function getMockAuthState(): AuthStateUtil {
  return authState;
}

export function setMockAuthState(state: AuthStateUtil): void {
  authState = state;
}

// Between tests: back to signed in.
export function resetMockAuthState(): void {
  authState = DEFAULT_AUTH_STATE;
}
