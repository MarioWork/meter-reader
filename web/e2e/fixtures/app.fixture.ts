import { defineNetworkFixture, type NetworkFixture, type NetworkFixtureOptions } from '@msw/playwright';
import { test as base, expect } from '@playwright/test';
import { http, HttpResponse } from 'msw/http';
import { getHandlers } from '../../src/mocks/handlers';
import { BASE_URL } from '../playwright.config';

// The app calls the API on its own origin (VITE_BASE_API_URL='/api'), so the mocks listen on the dev server's URL.
export const BASE_API_URL = `${BASE_URL}/api`;

type Fixtures = {
  handlers: NetworkFixtureOptions['handlers'];
  network: NetworkFixture;
};

// The same MSW handlers as dev and Vitest, routed through Playwright's own network layer (page.route under the
// hood). The app's in-page worker stands down under VITE_PLAYWRIGHT, so this is the only mock layer running.
export const test = base.extend<Fixtures>({
  handlers: [getHandlers(BASE_API_URL), { option: true }],
  network: [
    async ({ context, handlers }, use) => {
      const network = defineNetworkFixture({ context, handlers });

      await network.enable();
      await use(network);
      await network.disable();
    },
    { auto: true },
  ],
});

export { expect, http, HttpResponse };
