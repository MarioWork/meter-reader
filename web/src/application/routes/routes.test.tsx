import { http, HttpResponse } from 'msw/http';
import { AuthStateUtil } from '@app-types/utility';
import { setMockAuthState } from '@mocks/handlers/auth/authMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent } from '@test-utils';
import routes from '.';
import { BASE_ROUTES_PATHS, READING_ROUTES_PATHS } from './routesUtils';

const UNKNOWN_PATH = '/no-such-page';

describe('an unknown page', () => {
  it('shows the not-found page with one heading and a link home', async () => {
    renderRoutes(routes, { initialEntries: [UNKNOWN_PATH] });

    expect(await screen.findByRole('heading', { level: 1, name: 'This page went off the dial' })).toBeVisible();
    expect(screen.getByText('Reading 404')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', BASE_ROUTES_PATHS.HOME);
  });

  it('opens Home from the link', async () => {
    renderRoutes(routes, { initialEntries: [UNKNOWN_PATH] });

    await userEvent.click(await screen.findByRole('link', { name: 'Back to home' }));

    expect(await screen.findByRole('heading', { name: 'History' })).toBeVisible();
  });
});

describe('a page that breaks while opening', () => {
  it('shows the error page with Try again and a link home, never the error itself', async () => {
    server.use(
      http.get(`${TEST_BASE_API_URL}/readings`, () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' }, { status: 500 }),
      ),
    );

    renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

    expect(await screen.findByRole('heading', { level: 1, name: 'Something sprang a leak' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to home' })).toHaveAttribute('href', BASE_ROUTES_PATHS.HOME);
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});

describe('signed-in pages', () => {
  it('opens the page when the browser is signed in', async () => {
    renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

    expect(await screen.findByRole('heading', { name: 'History' })).toBeVisible();
  });

  it('sends a signed-out browser to the login page', async () => {
    setMockAuthState(AuthStateUtil.SIGNED_OUT);

    renderRoutes(routes, { initialEntries: [READING_ROUTES_PATHS.NEW] });

    expect(await screen.findByRole('heading', { name: 'Welcome back!' })).toBeVisible();
  });

  it('sends a browser to the setup page before the app is set up', async () => {
    setMockAuthState(AuthStateUtil.SETUP);

    renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });

    expect(await screen.findByRole('heading', { name: 'Set up the login' })).toBeVisible();
  });

  it('sends the browser to the login page when the session ends while the app is open', async () => {
    renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });
    await screen.findByRole('heading', { name: 'History' });
    // The session ends (it expired, or auth:reset ran): from now on the API refuses the reads.
    setMockAuthState(AuthStateUtil.SIGNED_OUT);
    server.use(
      http.get(`${TEST_BASE_API_URL}/readings`, () =>
        HttpResponse.json({ code: 'UNAUTHORIZED', message: 'Sign in to continue' }, { status: 401 }),
      ),
    );

    await userEvent.click(screen.getByRole('link', { name: 'New reading' }));

    expect(await screen.findByRole('heading', { name: 'Welcome back!' })).toBeVisible();
  });
});
