import { authMockHandlers } from './auth';
import { itemMockHandlers } from './item';

// Long enough to show loading states in local dev, short enough not to slow the tests.
const MOCK_DELAY = 200;

export const getHandlers = (baseUrl: string) => [...authMockHandlers(baseUrl), ...itemMockHandlers(baseUrl)];

export { MOCK_DELAY };
