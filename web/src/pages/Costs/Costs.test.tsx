import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { COSTS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { mockWideScreen, renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';

// The mock history has a cost on 11 of its 14 readings: none on 1 Mar 2026, 1 Sep 2026 and 1 Oct 2026.
const ALL_COSTS_TOTAL = '€444.80';
const ALL_COSTS_COUNT = 11;
// 1 Jan 2026 (€44.10) and 1 Feb 2026 (€37.75); 1 Mar 2026 has no cost.
const FIRST_QUARTER_2026 = `${COSTS_ROUTES_PATHS.BASE}?from=2026-01-01&to=2026-03-31`;

async function renderCosts(path = COSTS_ROUTES_PATHS.BASE) {
  const { router } = renderRoutes(routes, { initialEntries: [path] });
  await screen.findByRole('heading', { level: 1, name: 'Costs' });

  return router;
}

function total() {
  return screen.getByRole('region', { name: 'Total' });
}

function costItems() {
  return within(screen.getByRole('list', { name: 'Readings with a cost' })).getAllByRole('listitem');
}

// Keeps the query of every costs request, then lets the mock API answer it as usual.
function recordCostsRequests() {
  const received: URLSearchParams[] = [];

  server.use(
    http.get(`${TEST_BASE_API_URL}/readings/costs`, ({ request }) => {
      received.push(new URL(request.url).searchParams);
    }),
  );

  return received;
}

beforeEach(() => {
  // 15 October 2026, so "Last year" is all of 2025.
  vi.setSystemTime(new Date(2026, 9, 15, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

it('lists only the readings that have a cost, newest first, with the sum of their costs', async () => {
  await renderCosts();

  expect(total()).toHaveTextContent(ALL_COSTS_TOTAL);
  expect(total()).toHaveTextContent(`${ALL_COSTS_COUNT} readings`);
  expect(costItems()).toHaveLength(ALL_COSTS_COUNT);
  expect(costItems()[0]).toHaveTextContent('1 Aug 2026');
  expect(costItems()[0]).toHaveTextContent('€39.05');
  expect(screen.queryByText('1 Mar 2026')).not.toBeInTheDocument();
  expect(screen.queryByText('1 Oct 2026')).not.toBeInTheDocument();
});

it('describes the chart in words and points at the list, which has the same amounts', async () => {
  await renderCosts();

  expect(
    screen.getByRole('img', {
      name: 'Bar chart of 11 costs, from 1 Sept 2025 to 1 Aug 2026. Every amount is in the list below.',
    }),
  ).toBeInTheDocument();
});

it('narrows the chart, the sum and the list to the day range in the url', async () => {
  const received = recordCostsRequests();
  await renderCosts(FIRST_QUARTER_2026);

  expect(received.at(-1)?.get('from')).toBe('2026-01-01');
  expect(received.at(-1)?.get('to')).toBe('2026-03-31');
  expect(total()).toHaveTextContent('€81.85');
  expect(total()).toHaveTextContent('2 readings');
  expect(costItems()).toHaveLength(2);
  expect(screen.getByRole('img', { name: /Bar chart of 2 costs/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Remove filter: Jan 2026 – Mar 2026' })).toBeVisible();
});

it("puts a preset's days in the url and updates the sum and the list", async () => {
  const router = await renderCosts();

  await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
  const sheet = await screen.findByRole('dialog', { name: 'Filter readings' });
  await userEvent.click(within(sheet).getByRole('button', { name: 'Last year' }));
  await userEvent.click(within(sheet).getByRole('button', { name: 'Show readings' }));

  await waitFor(() => expect(router.state.location.search).toBe('?from=2025-01-01&to=2025-12-31'));
  await waitFor(() => expect(total()).toHaveTextContent('€155.65'));
  expect(costItems()).toHaveLength(4);
});

it('shows every cost again once the date filter is removed', async () => {
  const router = await renderCosts(FIRST_QUARTER_2026);

  await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Jan 2026 – Mar 2026' }));

  await waitFor(() => expect(router.state.location.search).toBe(''));
  await waitFor(() => expect(total()).toHaveTextContent(ALL_COSTS_TOTAL));
});

it('filters by day only: no status choices, and a status in the url is ignored', async () => {
  await renderCosts(`${COSTS_ROUTES_PATHS.BASE}?status=failed`);

  expect(costItems()).toHaveLength(ALL_COSTS_COUNT);
  expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
  const sheet = await screen.findByRole('dialog', { name: 'Filter readings' });
  expect(within(sheet).queryByRole('button', { name: 'Failed' })).not.toBeInTheDocument();
});

it('says there are no costs yet when no reading has one', async () => {
  server.use(http.get(`${TEST_BASE_API_URL}/readings/costs`, () => HttpResponse.json({ data: [], totalCostCents: 0 })));

  await renderCosts();

  expect(screen.getByRole('heading', { name: 'No costs yet' })).toBeVisible();
  expect(screen.queryByRole('region', { name: 'Total' })).not.toBeInTheDocument();
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
});

it('says no cost matches the dates, and Clear filters shows every cost again', async () => {
  // September and October 2026 have no cost.
  const router = await renderCosts(`${COSTS_ROUTES_PATHS.BASE}?from=2026-09-01&to=2026-10-31`);

  expect(screen.getByRole('heading', { name: 'No costs in these dates' })).toBeVisible();

  await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

  await waitFor(() => expect(router.state.location.search).toBe(''));
  await waitFor(() => expect(total()).toHaveTextContent(ALL_COSTS_TOTAL));
  expect(screen.getByRole('button', { name: 'Filter' })).toHaveFocus();
});

describe('on a wide screen', () => {
  beforeEach(() => {
    mockWideScreen();
  });

  it('filters the moment a day range is pressed, with no status choices in the bar', async () => {
    const router = await renderCosts();
    const filterBar = screen.getByRole('region', { name: 'Filters' });

    expect(within(filterBar).queryByRole('button', { name: 'Sent' })).not.toBeInTheDocument();

    await userEvent.click(within(filterBar).getByRole('button', { name: 'Last year' }));

    await waitFor(() => expect(router.state.location.search).toBe('?from=2025-01-01&to=2025-12-31'));
    await waitFor(() => expect(total()).toHaveTextContent('€155.65'));
  });
});
