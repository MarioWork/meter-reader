import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent, within } from '@test-utils';

async function renderHome() {
  renderRoutes(routes, { initialEntries: [BASE_ROUTES_PATHS.HOME] });
  await screen.findByRole('heading', { name: 'History' });
}

function historyRows() {
  // The first row is the header.
  return within(screen.getByRole('table', { name: 'History' }))
    .getAllByRole('row')
    .slice(1);
}

it('lists the history newest first with the date, the reading and its status', async () => {
  await renderHome();

  const [newest, next] = historyRows();
  expect(newest).toHaveTextContent('1 Oct 2026');
  expect(newest).toHaveTextContent('00529');
  expect(newest).toHaveTextContent('Not sent');
  expect(next).toHaveTextContent('1 Sept 2026');
  expect(historyRows()).toHaveLength(10);
});

it('shows the older readings on the next page', async () => {
  await renderHome();

  await userEvent.click(screen.getByRole('link', { name: 'Older readings' }));

  expect(await screen.findByText('Page 2 of 2')).toBeVisible();
  expect(historyRows()).toHaveLength(4);
  expect(historyRows()[3]).toHaveTextContent('00412');
});

it('says there are no readings yet when the history is empty', async () => {
  server.use(
    http.get(`${TEST_BASE_API_URL}/readings`, () =>
      HttpResponse.json({ data: [], totalResultNumber: 0, currentPage: 1 }),
    ),
  );

  await renderHome();

  expect(screen.getByText('No readings yet. Save your first one.')).toBeVisible();
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

it('opens the new reading page from the New reading link', async () => {
  await renderHome();

  await userEvent.click(screen.getByRole('link', { name: 'New reading' }));

  expect(await screen.findByRole('heading', { name: 'New reading' })).toBeVisible();
});
