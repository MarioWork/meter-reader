import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { COSTS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { addMockBill } from '@mocks/handlers/bill/billMockState';
import { createBillMockModel } from '@mocks/handlers/bill/models/billMockModel.mock';
import { updateMockReading } from '@mocks/handlers/reading/readingMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { mockWideScreen, renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';

// The mock history has a cost on 11 of its 14 readings: none on 1 Mar 2026, 1 Sep 2026 and 1 Oct 2026.
const ALL_COSTS_TOTAL = '€444.80';
const ALL_COSTS_COUNT = 11;
// 1 Jan 2026 (€44.10) and 1 Feb 2026 (€37.75); 1 Mar 2026 has no cost.
const FIRST_QUARTER_2026 = `${COSTS_ROUTES_PATHS.BASE}?from=2026-01-01&to=2026-03-31`;
// The mock history's 1 Sep 2026 reading (no cost) and 1 Aug 2026 reading (€39.05).
const NO_COST_READING_ID = 13;
const COSTED_READING_ID = 12;
const EXPORT_LINK_NAME = 'Export costs as a spreadsheet';
// September and October 2026 have no cost.
const SEPT_OCT_2026 = `${COSTS_ROUTES_PATHS.BASE}?from=2026-09-01&to=2026-10-31`;

async function renderCosts(path = COSTS_ROUTES_PATHS.BASE) {
  const { router } = renderRoutes(routes, { initialEntries: [path] });
  await screen.findByRole('heading', { level: 1, name: 'Water Readings Costs' });

  return router;
}

function total() {
  return screen.getByRole('region', { name: 'Total' });
}

function costItems() {
  return within(screen.getByRole('list', { name: 'Readings with a cost or a bill' })).getAllByRole('listitem');
}

// A bill saved on the mock reading, as the API answers the reading once updated with one. Its id, for the link.
function saveMockBill(readingId: number): number {
  const { contentType, sizeBytes } = createBillMockModel();
  const { id } = addMockBill(new Blob([new Uint8Array(sizeBytes)]), contentType);

  updateMockReading(readingId, { bill: { id, contentType, sizeBytes } });

  return id;
}

function exportUrl() {
  return new URL(screen.getByRole('link', { name: EXPORT_LINK_NAME }).getAttribute('href') ?? '');
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

describe('readings with a bill', () => {
  it('lists a reading with only a bill, says it has no cost, and leaves it out of the sum and the chart', async () => {
    saveMockBill(NO_COST_READING_ID);

    await renderCosts();

    expect(costItems()).toHaveLength(ALL_COSTS_COUNT + 1);
    expect(costItems()[0]).toHaveTextContent('1 Sept 2026');
    expect(costItems()[0]).toHaveTextContent('No cost');
    expect(total()).toHaveTextContent(ALL_COSTS_TOTAL);
    expect(total()).toHaveTextContent(`${ALL_COSTS_COUNT} readings`);
    expect(
      screen.getByRole('img', {
        name: new RegExp(`^Bar chart of ${ALL_COSTS_COUNT} costs, from 1 Sept 2025 to 1 Aug 2026\\.`),
      }),
    ).toBeVisible();
  });

  it('links each row with a bill to it, in a new tab, and the rows without one to nothing', async () => {
    const onlyBillId = saveMockBill(NO_COST_READING_ID);
    const costedBillId = saveMockBill(COSTED_READING_ID);

    await renderCosts();

    const onlyBill = within(costItems()[0]).getByRole('link', { name: 'Bill of 1 Sept 2026, opens in a new tab' });
    expect(onlyBill).toHaveAttribute('href', `${TEST_BASE_API_URL}/bills/${onlyBillId}`);
    expect(onlyBill).toHaveAttribute('target', '_blank');
    expect(onlyBill).toHaveAttribute('rel', 'noopener noreferrer');
    const costedBill = within(costItems()[1]).getByRole('link', { name: 'Bill of 1 Aug 2026, opens in a new tab' });
    expect(costedBill).toHaveAttribute('href', `${TEST_BASE_API_URL}/bills/${costedBillId}`);
    expect(costItems()[1]).toHaveTextContent('€39.05');
    expect(within(costItems()[2]).queryByRole('link')).not.toBeInTheDocument();
  });

  it('lists the readings with only a bill when no reading in the dates has a cost', async () => {
    saveMockBill(NO_COST_READING_ID);

    await renderCosts(SEPT_OCT_2026);

    expect(costItems()).toHaveLength(1);
    expect(total()).toHaveTextContent('€0.00');
    expect(total()).toHaveTextContent('0 readings');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});

describe('exporting the costs', () => {
  it('downloads every listed reading as a spreadsheet when no date filter is on', async () => {
    await renderCosts();

    const url = exportUrl();

    expect(screen.getByRole('link', { name: EXPORT_LINK_NAME })).toHaveAttribute('download');
    expect(`${url.origin}${url.pathname}`).toBe(`${TEST_BASE_API_URL}/readings/costs/export.xlsx`);
    expect([...url.searchParams.keys()]).toEqual([]);
  });

  it("downloads only the readings in the page's day range when it is filtered", async () => {
    await renderCosts(FIRST_QUARTER_2026);

    const url = exportUrl();

    expect(url.searchParams.get('from')).toBe('2026-01-01');
    expect(url.searchParams.get('to')).toBe('2026-03-31');
  });

  it('is not offered when no reading in the dates has a cost or a bill', async () => {
    await renderCosts(SEPT_OCT_2026);

    expect(screen.queryByRole('link', { name: EXPORT_LINK_NAME })).not.toBeInTheDocument();
  });
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
  const router = await renderCosts(SEPT_OCT_2026);

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
