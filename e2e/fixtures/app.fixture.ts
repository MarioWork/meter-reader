import { defineNetworkFixture, type NetworkFixture, type NetworkFixtureOptions } from '@msw/playwright';
import { test as base, expect } from '@playwright/test';
import { http, HttpResponse } from 'msw/http';
import { getHandlers } from '../../src/mocks/handlers';

// Matches VITE_BASE_API_URL in .env.development, which the dev server runs with.
export const BASE_API_URL = 'http://localhost:8080/api';

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
