import { startAuthentication } from '@simplewebauthn/browser';
import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { AUTH_ROUTES_PATHS } from '@application/routes/routesUtils';
import { AuthStateUtil } from '@app-types/utility';
import { setMockAuthState } from '@mocks/handlers/auth/authMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent } from '@test-utils';

// The browser's passkey prompt cannot run in jsdom: the test plays the device's part.
vi.mock('@simplewebauthn/browser', () => ({ startAuthentication: vi.fn(), startRegistration: vi.fn() }));

const PASSWORD = 'the meter lives under the stairs';
const PASSKEY_ANSWER = {
  id: 'cGFzc2tleS1waG9uZQ',
  rawId: 'cGFzc2tleS1waG9uZQ',
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: { clientDataJSON: 'e30', authenticatorData: 'YXV0aA', signature: 'c2ln' },
};

async function renderLogin() {
  setMockAuthState(AuthStateUtil.SIGNED_OUT);
  renderRoutes(routes, { initialEntries: [AUTH_ROUTES_PATHS.LOGIN] });
  await screen.findByRole('heading', { name: 'Welcome back!' });
}

it('opens Home after a sign-in with the password', async () => {
  await renderLogin();

  await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('heading', { name: 'Water Readings' })).toBeVisible();
});

it("shows the API's message and keeps the page when the password is wrong", async () => {
  server.use(
    http.post(`${TEST_BASE_API_URL}/auth/login/password`, () =>
      HttpResponse.json(
        { code: 'SIGN_IN_FAILED', message: "That password doesn't match. Try again." },
        { status: 401 },
      ),
    ),
  );
  await renderLogin();

  await userEvent.type(screen.getByLabelText('Password'), 'not the password');
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('alert')).toHaveTextContent("That password doesn't match. Try again.");
  expect(screen.getByRole('heading', { name: 'Welcome back!' })).toBeVisible();
});

it('says too many tries were made when the API slows sign-in down', async () => {
  server.use(
    http.post(`${TEST_BASE_API_URL}/auth/login/password`, () =>
      HttpResponse.json(
        { code: 'FST_ERR_RATE_LIMIT', message: 'Rate limit exceeded, retry in 1 minute' },
        { status: 429 },
      ),
    ),
  );
  await renderLogin();

  await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('retry in 1 minute');
});

it('marks the field and sends nothing when the password is empty', async () => {
  await renderLogin();

  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

  expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('Type your password');
  expect(screen.getByLabelText('Password')).toBeInvalid();
});

it('opens Home after a sign-in with a passkey', async () => {
  vi.mocked(startAuthentication).mockResolvedValueOnce(PASSKEY_ANSWER);
  await renderLogin();

  await userEvent.click(screen.getByRole('button', { name: 'Sign in with a passkey' }));

  expect(await screen.findByRole('heading', { name: 'Water Readings' })).toBeVisible();
});

it('says the prompt closed when the passkey prompt is cancelled', async () => {
  vi.mocked(startAuthentication).mockRejectedValueOnce(new DOMException('cancelled', 'NotAllowedError'));
  await renderLogin();

  await userEvent.click(screen.getByRole('button', { name: 'Sign in with a passkey' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('The passkey prompt closed before it finished.');
});

it('opens Home straight away when the browser is already signed in', async () => {
  renderRoutes(routes, { initialEntries: [AUTH_ROUTES_PATHS.LOGIN] });

  expect(await screen.findByRole('heading', { name: 'Water Readings' })).toBeVisible();
});
