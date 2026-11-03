import { authMockHandlers } from './auth';
import { billMockHandlers } from './bill';
import { photoMockHandlers } from './photo';
import { readingMockHandlers } from './reading';
import { mailMockHandlers } from './mail';
import { settingsMockHandlers } from './settings';

// Long enough to show loading states in local dev, short enough not to slow the tests.
const MOCK_DELAY = 200;

export const getHandlers = (baseUrl: string) => [
  ...authMockHandlers(baseUrl),
  ...readingMockHandlers(baseUrl),
  ...photoMockHandlers(baseUrl),
  ...billMockHandlers(baseUrl),
  ...mailMockHandlers(baseUrl),
  ...settingsMockHandlers(baseUrl),
];

export { MOCK_DELAY };
