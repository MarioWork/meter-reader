import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';

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

it('moves to the last page when the asked page is past the end of the history', async () => {
  renderRoutes(routes, { initialEntries: [`${BASE_ROUTES_PATHS.HOME}?page=3`] });

  expect(await screen.findByText('Page 2 of 2')).toBeVisible();
  expect(historyRows()).toHaveLength(4);
});

describe('deleting a reading', () => {
  const NEWEST_READING = 'Delete the reading of 1 Oct 2026';

  it('asks for confirmation before anything is deleted', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: NEWEST_READING }));

    const dialog = screen.getByRole('dialog', { name: 'Delete this reading?' });
    expect(dialog).toHaveTextContent('00529 from 1 Oct 2026');
    expect(historyRows()[0]).toHaveTextContent('00529');
  });

  it('removes the reading from the history when the user confirms', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: NEWEST_READING }));
    const dialog = screen.getByRole('dialog', { name: 'Delete this reading?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(historyRows()[0]).toHaveTextContent('1 Sept 2026'));
    expect(screen.getByRole('table', { name: 'History' })).not.toHaveTextContent('00529');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps the reading when the user cancels', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: NEWEST_READING }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(historyRows()[0]).toHaveTextContent('00529');
  });

  it('keeps the dialog open with the reason when the delete fails', async () => {
    server.use(
      http.delete(`${TEST_BASE_API_URL}/readings/:id`, () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'Reading 14 not found' }, { status: 404 }),
      ),
    );
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: NEWEST_READING }));
    const dialog = screen.getByRole('dialog', { name: 'Delete this reading?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Reading 14 not found');
    expect(historyRows()[0]).toHaveTextContent('00529');
  });
});
