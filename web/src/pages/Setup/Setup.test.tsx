import { startRegistration } from '@simplewebauthn/browser';
import { http } from 'msw/http';
import routes from '@application/routes';
import { AUTH_ROUTES_PATHS, AUTH_SEARCH_PARAMS } from '@application/routes/routesUtils';
import { AuthStateUtil } from '@app-types/utility';
import { MOCK_SETUP_CODE, setMockAuthState } from '@mocks/handlers/auth/authMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent, waitFor } from '@test-utils';

// The browser's passkey prompt cannot run in jsdom: the test plays the device's part.
vi.mock('@simplewebauthn/browser', () => ({ startAuthentication: vi.fn(), startRegistration: vi.fn() }));

const PASSWORD = 'the meter lives under the stairs';
const PASSWORD_LABEL = 'Password (leave empty to use only a passkey)';
const PASSKEY_ANSWER = {
  id: 'bmV3LXBhc3NrZXk',
  rawId: 'bmV3LXBhc3NrZXk',
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: { clientDataJSON: 'e30', attestationObject: 'YXR0', transports: [] },
};

function setupPath(code: string) {
  return `${AUTH_ROUTES_PATHS.SETUP}?${AUTH_SEARCH_PARAMS.SETUP_CODE}=${code}`;
}

// Records every body the setup call receives, and still answers it with the shared handler.
function captureSetupBodies(): unknown[] {
  const bodies: unknown[] = [];
  server.use(
    http.post(`${TEST_BASE_API_URL}/auth/setup`, async ({ request }) => {
      bodies.push(await request.clone().json());
    }),
  );

  return bodies;
}

async function renderSetup(code = MOCK_SETUP_CODE) {
  setMockAuthState(AuthStateUtil.SETUP);
  renderRoutes(routes, { initialEntries: [setupPath(code)] });
  await screen.findByRole('heading', { name: 'Set up the login' });
}

it('saves the password and opens Home', async () => {
  const bodies = captureSetupBodies();
  await renderSetup();

  await userEvent.type(screen.getByLabelText(PASSWORD_LABEL), PASSWORD);
  await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByRole('heading', { name: 'History' })).toBeVisible();
  expect(bodies).toEqual([{ code: MOCK_SETUP_CODE, password: PASSWORD }]);
});

it('saves a password and a passkey together', async () => {
  vi.mocked(startRegistration).mockResolvedValueOnce(PASSKEY_ANSWER);
  const bodies = captureSetupBodies();
  await renderSetup();

  await userEvent.type(screen.getByLabelText(PASSWORD_LABEL), PASSWORD);
  await userEvent.click(screen.getByRole('checkbox', { name: 'Also add a passkey on this device' }));
  await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByRole('heading', { name: 'History' })).toBeVisible();
  expect(bodies).toEqual([{ code: MOCK_SETUP_CODE, password: PASSWORD, passkey: PASSKEY_ANSWER }]);
});

it('saves only a passkey when the password is left empty', async () => {
  vi.mocked(startRegistration).mockResolvedValueOnce(PASSKEY_ANSWER);
  const bodies = captureSetupBodies();
  await renderSetup();

  await userEvent.click(screen.getByRole('checkbox', { name: 'Also add a passkey on this device' }));
  await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByRole('heading', { name: 'History' })).toBeVisible();
  expect(bodies).toEqual([{ code: MOCK_SETUP_CODE, passkey: PASSKEY_ANSWER }]);
});

it('asks for a way in when there is neither a password nor a passkey', async () => {
  await renderSetup();

  await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }));

  await waitFor(() => expect(screen.getByLabelText(PASSWORD_LABEL)).toBeInvalid());
  expect(screen.getByText('Set a password, add a passkey, or both')).toBeVisible();
});

it('refuses a password shorter than 15 characters before asking for a passkey', async () => {
  await renderSetup();

  await userEvent.type(screen.getByLabelText(PASSWORD_LABEL), 'too short');
  await userEvent.click(screen.getByRole('checkbox', { name: 'Also add a passkey on this device' }));
  await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }));

  await waitFor(() => expect(screen.getByLabelText(PASSWORD_LABEL)).toBeInvalid());
  expect(screen.getByText(/Use at least 15 characters/)).toBeVisible();
  expect(startRegistration).not.toHaveBeenCalled();
});

it("shows the API's message when the setup link is wrong", async () => {
  await renderSetup('not-the-code');

  await userEvent.type(screen.getByLabelText(PASSWORD_LABEL), PASSWORD);
  await userEvent.click(screen.getByRole('button', { name: 'Finish setup' }));

  expect(await screen.findByRole('alert')).toHaveTextContent('This setup link is wrong or was already used');
});

it('asks for the setup link when the page is opened without one', async () => {
  setMockAuthState(AuthStateUtil.SETUP);

  renderRoutes(routes, { initialEntries: [AUTH_ROUTES_PATHS.SETUP] });

  expect(await screen.findByText(/Open the setup link the server printed/)).toBeVisible();
  expect(screen.queryByRole('button', { name: 'Finish setup' })).not.toBeInTheDocument();
});

it('sends a set-up app to the login page', async () => {
  setMockAuthState(AuthStateUtil.SIGNED_OUT);

  renderRoutes(routes, { initialEntries: [setupPath(MOCK_SETUP_CODE)] });

  expect(await screen.findByRole('heading', { name: 'Welcome back!' })).toBeVisible();
});
