import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent, within } from '@test-utils';
import { todayAsIsoDate } from '@utils/dateUtils';

// The newest reading in the mock history is 00529, read on 1 Oct 2026.
const LOWER_THAN_LAST = '00500';
const HIGHER_THAN_LAST = '00600';
const WARNING = /lower than your last reading/;

async function renderNewReading() {
  renderRoutes(routes, { initialEntries: [READING_ROUTES_PATHS.NEW] });
  await screen.findByRole('heading', { name: 'New reading' });
}

function readingField() {
  return screen.getByRole('textbox', { name: 'Reading' });
}

async function save() {
  await userEvent.click(screen.getByRole('button', { name: 'Save reading' }));
}

it('starts the date on today', async () => {
  await renderNewReading();

  expect(screen.getByLabelText('Date')).toHaveValue(todayAsIsoDate());
});

it('saves the reading with its leading zeros and the chosen date, then shows it on Home', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await userEvent.clear(screen.getByLabelText('Date'));
  await userEvent.type(screen.getByLabelText('Date'), '2026-10-31');
  await save();

  await screen.findByRole('heading', { name: 'History' });
  const newest = within(screen.getByRole('table', { name: 'History' })).getAllByRole('row')[1];
  expect(newest).toHaveTextContent('31 Oct 2026');
  expect(newest).toHaveTextContent(HIGHER_THAN_LAST);
});

it('warns when the reading is lower than the last one', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), LOWER_THAN_LAST);

  expect(screen.getByText(WARNING)).toHaveTextContent('00529 on 1 Oct 2026');
  expect(readingField()).toHaveAccessibleDescription(WARNING);
  expect(readingField()).toBeValid();
});

it('still saves a reading lower than the last one', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), LOWER_THAN_LAST);
  await save();

  await screen.findByRole('heading', { name: 'History' });
  expect(screen.getByRole('table', { name: 'History' })).toHaveTextContent(LOWER_THAN_LAST);
});

it('does not warn when the reading is higher than the last one', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);

  expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
});

it('does not warn when there is no reading yet', async () => {
  server.use(
    http.get(`${TEST_BASE_API_URL}/readings`, () =>
      HttpResponse.json({ data: [], totalResultNumber: 0, currentPage: 1 }),
    ),
  );
  await renderNewReading();

  await userEvent.type(readingField(), '00001');

  expect(screen.queryByText(WARNING)).not.toBeInTheDocument();
});

it('marks the field and sends nothing when the reading has something other than digits', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), '12.5');
  await save();

  expect(readingField()).toHaveAccessibleDescription('Use digits only, as the meter shows them');
  expect(readingField()).toBeInvalid();
  expect(screen.getByRole('heading', { name: 'New reading' })).toBeVisible();
});

it("shows the API's message and keeps the input when the save fails", async () => {
  server.use(
    http.post(`${TEST_BASE_API_URL}/readings`, () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' }, { status: 500 }),
    ),
  );
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await save();

  expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong');
  expect(readingField()).toHaveValue(HIGHER_THAN_LAST);
});
