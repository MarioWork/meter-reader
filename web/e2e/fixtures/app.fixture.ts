import { defineNetworkFixture, type NetworkFixture, type NetworkFixtureOptions } from '@msw/playwright';
import { test as base, expect } from '@playwright/test';
import { http, HttpResponse } from 'msw/http';
import { getHandlers } from '../../src/mocks/handlers';
import { MailStateUtil } from '@app-types/utility';
import { resetMockAuthState } from '../../src/mocks/handlers/auth/authMockState';
import { resetMockPhotos } from '../../src/mocks/handlers/photo/photoMockState';
import { resetMockReadings } from '../../src/mocks/handlers/reading/readingMockState';
import { BASE_URL } from '../playwright.config';

// The app calls the API on its own origin (VITE_BASE_API_URL='/api'), so the mocks listen on the dev server's URL.
export const BASE_API_URL = `${BASE_URL}/api`;

type Fixtures = {
  handlers: NetworkFixtureOptions['handlers'];
  network: NetworkFixture;
  // The server holds no working Hotmail token (yarn mail:connect never ran, or the token was revoked).
  mockMailNotConnected: () => void;
};

// The same MSW handlers as dev and Vitest, routed through Playwright's own network layer (page.route under the
// hood). The app's in-page worker stands down under VITE_PLAYWRIGHT, so this is the only mock layer running.
export const test = base.extend<Fixtures>({
  handlers: [getHandlers(BASE_API_URL), { option: true }],
  network: [
    async ({ context, handlers }, use) => {
      // The mocks' state lives in this worker: each test starts signed in (a test may sign out), with the same rows
      // and no uploaded photos.
      resetMockAuthState();
      resetMockReadings();
      resetMockPhotos();
      const network = defineNetworkFixture({ context, handlers });

      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
  mockMailNotConnected: async ({ network }, provide) => {
    await provide(() =>
      network.use(
        http.get(`${BASE_API_URL}/mail/status`, () => HttpResponse.json({ state: MailStateUtil.NOT_CONNECTED })),
      ),
    );
  },
});

export { expect, http, HttpResponse };
