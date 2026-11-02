import getAuthStatusHandler from './getAuthStatus.mock.handler';
import logoutHandler from './logout.mock.handler';
import setUpHandler from './setUp.mock.handler';
import signInWithPasskeyHandler from './signInWithPasskey.mock.handler';
import signInWithPasswordHandler from './signInWithPassword.mock.handler';
import startPasskeySetupHandler from './startPasskeySetup.mock.handler';
import startPasskeySignInHandler from './startPasskeySignIn.mock.handler';

export const authMockHandlers = (baseUrl: string) => [
  ...getAuthStatusHandler(baseUrl),
  ...startPasskeySetupHandler(baseUrl),
  ...setUpHandler(baseUrl),
  ...signInWithPasswordHandler(baseUrl),
  ...startPasskeySignInHandler(baseUrl),
  ...signInWithPasskeyHandler(baseUrl),
  ...logoutHandler(baseUrl),
];
