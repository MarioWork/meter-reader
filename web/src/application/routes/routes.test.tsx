import { http, HttpResponse } from 'msw/http';
import { AuthStateUtil } from '@app-types/utility';
import { setMockAuthState } from '@mocks/handlers/auth/authMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent } from '@test-utils';
import routes from '.';
import { BASE_ROUTES_PATHS, ITEM_ROUTES_PATHS } from './routesUtils';

describe('signed-in pages', () => {
  it('opens the page when the browser is signed in', async () => {
    renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

    expect(await screen.findByRole('heading', { name: 'Hello world' })).toBeVisible();
  });

  it('sends a signed-out browser to the login page', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);

    renderRoutes(routes, { initialEntries: [ITEM_ROUTES_PATHS.BASE] });

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
  });

  it('sends a browser to the setup page before the app is set up', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

    expect(await screen.findByRole('heading', { name: 'Set up the login' })).toBeVisible();
  });

  it('sends the browser to the login page when the session ends while the app is open', async () => {
    renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });
    await screen.findByRole('heading', { name: 'Hello world' });
    // The session ends (it expired, or auth:reset ran): from now on the API refuses the reads.
    setMockAuthState(AuthStateUtil.SIGNED_OUT);
    server.use(
      http.get(`${TEST_BASE_API_URL}/items`, () =>
        HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Sign in to continue' }, { status: 401 }),
      ),
    );

    await userEvent.click(screen.getByRole('link', { name: 'See the items example' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});

describe('signing out', () => {
  it('ends the session and opens the login page', async () => {
    renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });
    await screen.findByRole('heading', { name: 'Hello world' });

    await userEvent.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeVisible();
  });
});
