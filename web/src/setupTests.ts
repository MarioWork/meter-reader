import '@testing-library/jest-dom/vitest';
import axios from 'axios';
import { resetMockAuthState } from './mocks/handlers/auth/authMockState';
import { resetMockPhotos } from './mocks/handlers/photo/photoMockState';
import { resetMockReadings } from './mocks/handlers/reading/readingMockState';
import { server, TEST_BASE_API_URL } from './mocks/server';

axios.defaults.baseURL = TEST_BASE_API_URL;
// jsdom's XMLHttpRequest performs real requests that MSW's Node interception never sees; fetch is intercepted
// in both the node and the jsdom projects, so every test talks to the same mock layer.
axios.defaults.adapter = 'fetch';

// jsdom has <dialog> but not its modal methods. Only the open state is faked here; focus and Escape are the
// browser's job and are covered by the e2e suite.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.open = true;
  };
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  };
}

// A request with no handler fails the test instead of passing on a warning nobody reads.
beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockAuthState();
  resetMockReadings();
  resetMockPhotos();
});
afterAll(() => server.close());
