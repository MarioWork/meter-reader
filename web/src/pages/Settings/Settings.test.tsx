import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { getMockSettings, updateMockSettings } from '@mocks/handlers/settings/settingsMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { findNotification, renderRoutes, screen, userEvent, within } from '@test-utils';
import { MessageDateFormatUtil } from '@app-types/utility';
import { todayAsIsoDate } from '@utils/dateUtils';
import { formatMessageDate } from '@utils/messageDateFormatUtils';

const SAVED_ADDRESS = 'readings@water-provider.example';
const NEW_ADDRESS = 'meter@other-provider.example';
const INVALID_ADDRESS_ERROR = /Type a valid email address/;
const SAMPLE_READING = '00123';
const DATE_FORMAT_ERROR = 'Pick a date format from the list.';

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

function preview() {
  return screen.getByRole('region', { name: 'Preview' });
}

// The preview's value for one row (From, To, Subject, Body): the definition paired with the term of that label.
function previewRow(label: string) {
  const terms = within(preview()).getAllByRole('term');
  const definitions = within(preview()).getAllByRole('definition');
  const rowIndex = terms.findIndex((term) => term.textContent === label);

  return definitions[rowIndex];
}

function dateFormatField() {
  return screen.getByRole('combobox', { name: 'Date format' });
}

// Today as {date} reads in the email, in the mock settings' format unless another is given.
function today(dateFormat: MessageDateFormatUtil = MessageDateFormatUtil.LONG_MONTH) {
  return formatMessageDate(todayAsIsoDate(), dateFormat);
}

async function save() {
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
}

it("shows the saved provider's address ready to edit, and From as text that cannot be edited", async () => {
  await renderSettings();

  expect(toField()).toHaveValue(SAVED_ADDRESS);
  expect(within(screen.getByRole('region', { name: 'Email addresses' })).getByText('me@hotmail.example')).toBeVisible();
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

it('splits the page into cards, each with its own heading, in reading order', async () => {
  await renderSettings();

  const cardHeadings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);

  expect(cardHeadings).toEqual(['Email addresses', 'Message', 'Preview', 'Data']);
});

it('says From comes from the server, in the Email addresses card', async () => {
  await renderSettings();

  const emailAddresses = screen.getByRole('region', { name: 'Email addresses' });

  expect(within(emailAddresses).getByText(/set on the server/i)).toBeVisible();
});

it('explains both placeholders in the Message card, next to the templates', async () => {
  await renderSettings();

  const message = screen.getByRole('region', { name: 'Message' });

  expect(within(message).getByText('{reading}')).toBeVisible();
  expect(within(message).getByText('{date}')).toBeVisible();
  expect(within(message).getByRole('textbox', { name: 'Body template' })).toBeVisible();
});

it('says Save stores both the addresses and the message', async () => {
  await renderSettings();

  expect(screen.getByRole('button', { name: 'Save' })).toHaveAccessibleDescription(
    'Saves the email addresses and the message together.',
  );
});

it.each([
  ['Export everything (JSON)', `${TEST_BASE_API_URL}/readings/backup.json`],
  ['Export everything (CSV)', `${TEST_BASE_API_URL}/readings/backup.csv`],
  ['Export files (zip)', `${TEST_BASE_API_URL}/readings/backup.zip`],
])('offers %s as a download of every reading under Data', async (name, href) => {
  await renderSettings();

  const data = screen.getByRole('region', { name: 'Data' });
  const link = within(data).getByRole('link', { name });

  expect(link).toHaveAttribute('href', href);
  expect(link).toHaveAttribute('download');
});

it('previews the email with the saved settings, a sample reading and today', async () => {
  await renderSettings();

  expect(previewRow('From')).toHaveTextContent('me@hotmail.example');
  expect(previewRow('To')).toHaveTextContent(SAVED_ADDRESS);
  expect(previewRow('Subject')).toHaveTextContent(`Meter reading ${today()}`);
  expect(previewRow('Body')).toHaveTextContent(`Date: ${today()} Reading: ${SAMPLE_READING}`);
});

it('updates the preview while typing, before saving', async () => {
  await renderSettings();

  await typeAddress(NEW_ADDRESS);
  await typeTemplate(subjectTemplateField(), 'Leitura {reading}');
  await typeTemplate(bodyTemplateField(), 'Leitura - {reading} - {date}');

  expect(previewRow('To')).toHaveTextContent(NEW_ADDRESS);
  expect(previewRow('Subject')).toHaveTextContent(`Leitura ${SAMPLE_READING}`);
  expect(previewRow('Body')).toHaveTextContent(`Leitura - ${SAMPLE_READING} - ${today()}`);
  expect(getMockSettings().subjectTemplate).toBe('Meter reading {date}');
});

it('keeps an unknown placeholder in the preview as typed', async () => {
  await renderSettings();

  await typeTemplate(subjectTemplateField(), 'Leitura {readng}');

  expect(previewRow('Subject')).toHaveTextContent('Leitura {readng}');
});

it('previews To as not set while the address is empty', async () => {
  await renderSettings();

  await userEvent.clear(toField());

  expect(previewRow('To')).toHaveTextContent('Not set');
});

it('offers the four date formats, each as a sample, with the saved one chosen', async () => {
  await renderSettings();

  const options = within(dateFormatField()).getAllByRole('option');

  expect(options.map((option) => option.textContent)).toEqual([
    '31 October 2026',
    '31 Oct 2026',
    '31/10/2026',
    '2026-10-31',
  ]);
  expect(screen.getByRole('option', { name: '31 October 2026' })).toHaveProperty('selected', true);
});

it('shows the date format saved last when another one was saved', async () => {
  updateMockSettings({ dateFormat: MessageDateFormatUtil.ISO });

  await renderSettings();

  expect(screen.getByRole('option', { name: '2026-10-31' })).toHaveProperty('selected', true);
});

it('saves the chosen date format with the rest and says so', async () => {
  await renderSettings();

  await userEvent.selectOptions(dateFormatField(), '31/10/2026');
  await save();

  expect(await findNotification('Settings saved')).toBeVisible();
  expect(getMockSettings()).toMatchObject({ to: SAVED_ADDRESS, dateFormat: MessageDateFormatUtil.DAY_MONTH_YEAR });
});

it('writes the date in the preview in the chosen format, before saving', async () => {
  await renderSettings();

  await userEvent.selectOptions(dateFormatField(), '31 Oct 2026');

  expect(previewRow('Subject')).toHaveTextContent(`Meter reading ${today(MessageDateFormatUtil.SHORT_MONTH)}`);
  expect(previewRow('Body')).toHaveTextContent(`Date: ${today(MessageDateFormatUtil.SHORT_MONTH)}`);
  expect(getMockSettings().dateFormat).toBe(MessageDateFormatUtil.LONG_MONTH);
});

it('marks the date format when the server refuses it', async () => {
  server.use(
    http.put(`${TEST_BASE_API_URL}/settings`, () =>
      HttpResponse.json(
        {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          issues: [{ path: '/dateFormat', message: 'Invalid option' }],
        },
        { status: 400 },
      ),
    ),
  );
  await renderSettings();

  await save();

  expect(await screen.findByText(DATE_FORMAT_ERROR)).toBeVisible();
  expect(dateFormatField()).toHaveAttribute('aria-invalid', 'true');
  expect(dateFormatField()).toHaveAccessibleDescription(expect.stringContaining(DATE_FORMAT_ERROR));
});
