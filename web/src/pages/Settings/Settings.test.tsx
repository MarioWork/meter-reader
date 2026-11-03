import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { getMockSettings, updateMockSettings } from '@mocks/handlers/settings/settingsMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { findNotification, renderRoutes, screen, userEvent, within } from '@test-utils';

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

function subjectTemplateField() {
  return screen.getByRole('textbox', { name: 'Subject template' });
}

function bodyTemplateField() {
  return screen.getByRole('textbox', { name: 'Body template' });
}

// user-event reads braces as key names, so a literal one is typed doubled.
async function typeTemplate(field: HTMLElement, template: string) {
  await userEvent.clear(field);
  await userEvent.type(field, template.replaceAll('{', '{{'));
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
  updateMockSettings({ to: null });

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
      HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          issues: [{ path: '/to', message: 'Invalid email address' }],
        },
        { status: 400 },
      ),
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

it('shows the saved subject and body templates ready to edit', async () => {
  await renderSettings();

  expect(subjectTemplateField()).toHaveValue('Meter reading {date}');
  expect(bodyTemplateField()).toHaveValue('Date: {date}\nReading: {reading}');
  expect(subjectTemplateField()).toHaveAccessibleDescription(/Leitura \{date\}/);
});

it('saves the templates with the address and says so', async () => {
  await renderSettings();

  await typeTemplate(subjectTemplateField(), 'Leitura {date}');
  await typeTemplate(bodyTemplateField(), 'Leitura - {reading} - {date}');
  await save();

  expect(await findNotification('Settings saved')).toBeVisible();
  expect(getMockSettings()).toMatchObject({
    to: SAVED_ADDRESS,
    subjectTemplate: 'Leitura {date}',
    bodyTemplate: 'Leitura - {reading} - {date}',
  });
});

it('marks an unknown placeholder under its template and saves nothing', async () => {
  await renderSettings();

  await typeTemplate(subjectTemplateField(), 'Leitura {readng}');
  await typeTemplate(bodyTemplateField(), 'Leitura {dat}');
  await save();

  expect(subjectTemplateField()).toHaveAttribute('aria-invalid', 'true');
  expect(subjectTemplateField()).toHaveAccessibleDescription(
    /\{readng\} is not a placeholder\. Use \{reading\} or \{date\}\./,
  );
  expect(bodyTemplateField()).toHaveAccessibleDescription(/\{dat\} is not a placeholder/);
  expect(getMockSettings().subjectTemplate).toBe('Meter reading {date}');
});

it('marks an empty template under its field and saves nothing', async () => {
  await renderSettings();

  await userEvent.clear(subjectTemplateField());
  await userEvent.clear(bodyTemplateField());
  await save();

  expect(subjectTemplateField()).toHaveAccessibleDescription(/Write a subject template\./);
  expect(bodyTemplateField()).toHaveAccessibleDescription(/Write a body template\./);
  expect(getMockSettings().bodyTemplate).toBe('Date: {date}\nReading: {reading}');
});

it("marks the template the server refuses with the server's reason", async () => {
  const reason = '{day} is not a placeholder. Use {reading} or {date}.';
  server.use(
    http.put(`${TEST_BASE_API_URL}/settings`, () =>
      HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          issues: [{ path: '/bodyTemplate', message: reason }],
        },
        { status: 400 },
      ),
    ),
  );
  await renderSettings();

  await save();

  expect(await screen.findByText(reason)).toBeVisible();
  expect(bodyTemplateField()).toHaveAttribute('aria-invalid', 'true');
  expect(bodyTemplateField()).toHaveAccessibleDescription(expect.stringContaining(reason));
  expect(toField()).not.toHaveAttribute('aria-invalid', 'true');
});

it('has one main heading', async () => {
  await renderSettings();

  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
});

it.each([
  ['Export everything (JSON)', `${TEST_BASE_API_URL}/readings/backup.json`],
  ['Export everything (CSV)', `${TEST_BASE_API_URL}/readings/backup.csv`],
])('offers %s as a download of every reading under Data', async (name, href) => {
  await renderSettings();

  const data = screen.getByRole('region', { name: 'Data' });
  const link = within(data).getByRole('link', { name });

  expect(link).toHaveAttribute('href', href);
  expect(link).toHaveAttribute('download');
});
