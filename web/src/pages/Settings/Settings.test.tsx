import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { getMockSettings, setMockProviderEmail } from '@mocks/handlers/settings/settingsMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { findNotification, renderRoutes, screen, userEvent } from '@test-utils';

const SAVED_ADDRESS = 'readings@water-provider.example';
const NEW_ADDRESS = 'meter@other-provider.example';
const INVALID_ADDRESS_ERROR = /Type a valid email address/;

async function renderSettings() {
  renderRoutes(routes, { initialEntries: [SETTINGS_ROUTES_PATHS.BASE] });
  await screen.findByRole('heading', { level: 1, name: 'Settings' });
}

function toField() {
  return screen.getByRole('textbox', { name: 'To' });
}

async function typeAddress(address: string) {
  await userEvent.clear(toField());
  await userEvent.type(toField(), address);
}

async function save() {
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
}

it("shows the saved provider's address ready to edit, and From as text that cannot be edited", async () => {
  await renderSettings();

  expect(toField()).toHaveValue(SAVED_ADDRESS);
  expect(screen.getByText('me@hotmail.example')).toBeVisible();
  expect(screen.queryByRole('textbox', { name: 'From' })).not.toBeInTheDocument();
});

it('starts with an empty To when no address is saved yet', async () => {
  setMockProviderEmail(null);

  await renderSettings();

  expect(toField()).toHaveValue('');
});

it('saves a valid address and says so', async () => {
  await renderSettings();

  await typeAddress(`  ${NEW_ADDRESS} `);
  await save();

  expect(await findNotification('Settings saved')).toBeVisible();
  expect(getMockSettings().to).toBe(NEW_ADDRESS);
});

it('marks an address that is not an email address under its field and saves nothing', async () => {
  await renderSettings();

  await typeAddress('readings at provider');
  await save();

  expect(toField()).toHaveAttribute('aria-invalid', 'true');
  expect(toField()).toHaveAccessibleDescription(INVALID_ADDRESS_ERROR);
  expect(getMockSettings().to).toBe(SAVED_ADDRESS);
});

it('marks an empty address under its field and saves nothing', async () => {
  await renderSettings();

  await userEvent.clear(toField());
  await save();

  expect(toField()).toHaveAccessibleDescription("Type the provider's address");
  expect(getMockSettings().to).toBe(SAVED_ADDRESS);
});

it('marks the field when the server refuses the address', async () => {
  server.use(
    http.put(`${TEST_BASE_API_URL}/settings`, () =>
      HttpResponse.json({ code: 'VALIDATION_ERROR', message: 'Request validation failed' }, { status: 400 }),
    ),
  );
  await renderSettings();

  await typeAddress(NEW_ADDRESS);
  await save();

  expect(await screen.findByText(INVALID_ADDRESS_ERROR)).toBeVisible();
  expect(toField()).toHaveAttribute('aria-invalid', 'true');
  expect(toField()).toHaveAccessibleDescription(INVALID_ADDRESS_ERROR);
});

it("shows the server's reason and keeps the input when the save fails", async () => {
  server.use(
    http.put(`${TEST_BASE_API_URL}/settings`, () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' }, { status: 500 }),
    ),
  );
  await renderSettings();

  await typeAddress(NEW_ADDRESS);
  await save();

  expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  expect(toField()).toHaveValue(NEW_ADDRESS);
});
