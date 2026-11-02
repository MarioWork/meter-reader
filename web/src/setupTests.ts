import '@testing-library/jest-dom/vitest';
import axios from 'axios';
import { resetMockAuthState } from './mocks/handlers/auth/authMockState';
import { server, TEST_BASE_API_URL } from './mocks/server';

axios.defaults.baseURL = TEST_BASE_API_URL;
// jsdom's XMLHttpRequest performs real requests that MSW's Node interception never sees; fetch is intercepted
// in both the node and the jsdom projects, so every test talks to the same mock layer.
axios.defaults.adapter = 'fetch';

// A request with no handler fails the test instead of passing on a warning nobody reads.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockAuthState();
});
afterAll(() => server.close());
