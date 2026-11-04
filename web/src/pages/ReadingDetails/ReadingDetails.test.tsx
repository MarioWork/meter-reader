import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { BASE_ROUTES_PATHS, READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import type { ReadingApiModel } from '@app-types/models';
import { addMockBill } from '@mocks/handlers/bill/billMockState';
import { MOCK_FAILURE_REASON } from '@mocks/handlers/reading/models/readingMockModel.mock';
import { findMockReading, updateMockReading } from '@mocks/handlers/reading/readingMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import {
  deferred,
  findNotification,
  mockWideScreen,
  renderRoutes,
  screen,
  userEvent,
  waitFor,
  within,
} from '@test-utils';

// The mock history: reading 14 (1 Oct 2026) is the newest, not sent, with a photo and no cost; 13 (1 Sept) failed;
// 12 (1 Aug) was sent, with its photo, and cost €39.05; 10 (1 Jun) has no photo and was never sent.
const NEWEST_ID = 14;
const NEWEST_DATE = '1 Oct 2026';
const FAILED_ID = 13;
const SENT_ID = 12;
const SENT_DATE = '1 Aug 2026';
const NO_PHOTO_ID = 10;
const FILTERED_SEARCH = '?status=sent&pages=2';
const DELETE_DIALOG = 'Delete this reading?';
const SEND_DIALOG = 'Send this reading?';

async function renderReadingPage(readingId: number, search = '') {
  const { router } = renderRoutes(routes, {
    initialEntries: [`${READING_ROUTES_PATHS.details(String(readingId))}${search}`],
  });
  await screen.findByRole('heading', { level: 1, name: /^Reading of / });

  return router;
}

function pageRegion(name: string) {
  return screen.getByRole('region', { name });
}

function main() {
  return screen.getByRole('main');
}

async function openMenu() {
  await userEvent.click(screen.getByRole('button', { name: 'More actions' }));
}

describe('the header', () => {
  it('names the page after the day, with the status in words and Send while it is not sent', async () => {
    await renderReadingPage(NEWEST_ID);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`Reading of ${NEWEST_DATE}`);
    expect(within(main()).getByText('Not sent')).toBeVisible();
    // Send shows twice on purpose: in the header and in the email card. The header's comes first.
    expect(within(main()).getAllByRole('link', { name: 'Send' })[0]).toHaveAttribute(
      'href',
      READING_ROUTES_PATHS.detailsSend(String(NEWEST_ID)),
    );
  });

  it('offers Retry on a failed reading', async () => {
    await renderReadingPage(FAILED_ID);

    // In the status chip, and again in the email card's timeline.
    expect(within(main()).getAllByText('Failed')[0]).toBeVisible();
    expect(screen.getByRole('link', { name: 'Retry' })).toBeVisible();
  });

  it('offers Resend on a sent reading, with the time it was sent', async () => {
    await renderReadingPage(SENT_ID);

    // In the status chip, and again in the email card's timeline.
    expect(within(main()).getAllByText(/^Sent/)[0]).toBeVisible();
    expect(screen.getByRole('link', { name: 'Resend' })).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Send' })).not.toBeInTheDocument();
  });

  it('shows the digits as the meter does, with the unit', async () => {
    await renderReadingPage(NEWEST_ID);

    const digits = screen.getByText('00529');
    expect(digits.parentElement).toHaveTextContent('Reading00529m³');
  });

  it('puts the headings in order under the one h1', async () => {
    await renderReadingPage(SENT_ID);

    const sectionHeadings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
    expect(sectionHeadings).toEqual(['Cost & bill', 'Email', 'Details']);
  });
});

describe('the way back', () => {
  it('goes back to Home with the same filters and pages from "← Readings"', async () => {
    const router = await renderReadingPage(SENT_ID, FILTERED_SEARCH);

    await userEvent.click(screen.getByRole('link', { name: 'Readings' }));

    expect(await screen.findByRole('heading', { name: 'Water Readings' })).toBeVisible();
    expect(router.state.location.pathname).toBe(BASE_ROUTES_PATHS.HOME);
    expect(router.state.location.search).toBe(FILTERED_SEARCH);
  });

  it('goes back to Home with the same filters from the browser Back button', async () => {
    const { router } = renderRoutes(routes, { initialEntries: [`${BASE_ROUTES_PATHS.HOME}?status=failed`] });
    await userEvent.click(await screen.findByRole('link', { name: 'Details of the 1 Sept 2026 reading' }));
    await screen.findByRole('heading', { level: 1, name: 'Reading of 1 Sept 2026' });

    await router.navigate(-1);

    expect(await screen.findByRole('heading', { name: 'Water Readings' })).toBeVisible();
    expect(router.state.location.search).toBe('?status=failed');
  });
});

describe('sending from the page', () => {
  it('sends a reading not sent yet and stays on its page, which then shows it sent', async () => {
    const router = await renderReadingPage(NEWEST_ID);

    // The header's Send; the email card has the same one.
    await userEvent.click(within(main()).getAllByRole('link', { name: 'Send' })[0]);
    const preview = await screen.findByRole('dialog', { name: SEND_DIALOG });
    await userEvent.click(within(preview).getByRole('button', { name: 'Send' }));

    expect(await findNotification('Reading sent')).toBeVisible();
    await waitFor(() => expect(screen.queryByRole('dialog', { name: SEND_DIALOG })).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe(READING_ROUTES_PATHS.details(String(NEWEST_ID)));
    expect(await screen.findByRole('link', { name: 'Resend' })).toBeVisible();
    expect(pageRegion('Email')).toHaveTextContent(/Sent 2 Nov 2026/);
  });

  it('resends a sent reading, starting from the email it went out with', async () => {
    await renderReadingPage(SENT_ID);

    await userEvent.click(screen.getByRole('link', { name: 'Resend' }));
    const preview = await screen.findByRole('dialog', { name: SEND_DIALOG });
    const sentSubject = findMockReading(SENT_ID)?.sentEmail?.subject;
    expect(within(preview).getByRole('textbox', { name: 'Subject' })).toHaveValue(sentSubject);
    await userEvent.click(within(preview).getByRole('button', { name: 'Send' }));

    expect(await findNotification('Reading sent')).toBeVisible();
  });

  it('opens the preview over the page from Retry, and Close goes back to the page', async () => {
    const router = await renderReadingPage(FAILED_ID, FILTERED_SEARCH);

    await userEvent.click(screen.getByRole('link', { name: 'Retry' }));
    const preview = await screen.findByRole('dialog', { name: SEND_DIALOG });
    expect(router.state.location.pathname).toBe(READING_ROUTES_PATHS.detailsSend(String(FAILED_ID)));
    await userEvent.click(within(preview).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: SEND_DIALOG })).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe(READING_ROUTES_PATHS.details(String(FAILED_ID)));
    expect(router.state.location.search).toBe(FILTERED_SEARCH);
  });
});

describe('the "⋯" menu', () => {
  it('opens the cost & bill dialog over the page, and closing it comes back to the page', async () => {
    const router = await renderReadingPage(SENT_ID);
    await openMenu();

    await userEvent.click(await screen.findByRole('menuitem', { name: 'Edit cost & bill' }));

    const dialog = await screen.findByRole('dialog', { name: 'Edit cost & bill' });
    expect(router.state.location.pathname).toBe(READING_ROUTES_PATHS.detailsCostAndBill(String(SENT_ID)));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(router.state.location.pathname).toBe(READING_ROUTES_PATHS.details(String(SENT_ID)));
  });

  it('deletes the reading once confirmed, and goes back to Home with its filters and a toast', async () => {
    const router = await renderReadingPage(SENT_ID, FILTERED_SEARCH);
    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog', { name: DELETE_DIALOG });

    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }));

    expect(await findNotification('Reading deleted')).toBeVisible();
    expect(await screen.findByRole('heading', { name: 'Water Readings' })).toBeVisible();
    expect(router.state.location.pathname).toBe(BASE_ROUTES_PATHS.HOME);
    expect(router.state.location.search).toBe(FILTERED_SEARCH);
    expect(findMockReading(SENT_ID)).toBeUndefined();
  });

  it('keeps the reading when Delete is cancelled', async () => {
    await renderReadingPage(SENT_ID);
    await openMenu();
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));
    const confirm = await screen.findByRole('alertdialog', { name: DELETE_DIALOG });

    await userEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(findMockReading(SENT_ID)).toBeDefined();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(`Reading of ${SENT_DATE}`);
  });
});

describe('the photo', () => {
  it('shows large, and opens full screen with a Close button that gives focus back', async () => {
    await renderReadingPage(NEWEST_ID);
    expect(within(main()).getByRole('img', { name: `The meter showing 00529 on ${NEWEST_DATE}` })).toHaveAttribute(
      'src',
      `${TEST_BASE_API_URL}/photos/${NEWEST_ID}`,
    );
    const openButton = screen.getByRole('button', { name: 'Open the photo full screen' });

    await userEvent.click(openButton);

    const fullScreen = screen.getByRole('dialog', { name: `Photo of the reading of ${NEWEST_DATE}` });
    expect(within(fullScreen).getByRole('img', { name: `The meter showing 00529 on ${NEWEST_DATE}` })).toBeVisible();
    await userEvent.click(within(fullScreen).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });

  it('says "No photo" when the reading was saved without one', async () => {
    await renderReadingPage(NO_PHOTO_ID);

    expect(within(main()).getByText('No photo')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Open the photo full screen' })).not.toBeInTheDocument();
  });
});

describe('the cost & bill card', () => {
  const BILL_NAME = 'Fatura de Agosto.pdf';

  function saveMockBill(readingId: number) {
    const { id, name, contentType, sizeBytes } = addMockBill(new Blob(['%PDF']), 'application/pdf', BILL_NAME);

    updateMockReading(readingId, { bill: { id, name, contentType, sizeBytes } });
  }

  it('shows the cost and the bill, which opens in the viewer, with Edit', async () => {
    saveMockBill(SENT_ID);
    await renderReadingPage(SENT_ID);

    const card = pageRegion('Cost & bill');
    expect(card).toHaveTextContent('€39.05');
    expect(within(card).getByRole('button', { name: `${BILL_NAME}, opens the bill` })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
    expect(within(card).getByRole('link', { name: 'Edit cost & bill' })).toHaveAttribute(
      'href',
      READING_ROUTES_PATHS.detailsCostAndBill(String(SENT_ID)),
    );
  });

  it('says which one is missing when the reading has only one of them', async () => {
    await renderReadingPage(SENT_ID);

    expect(pageRegion('Cost & bill')).toHaveTextContent('No bill');
  });

  it('shows one "Add cost & bill" instead of empty rows when the reading has neither', async () => {
    await renderReadingPage(NEWEST_ID);

    const card = pageRegion('Cost & bill');
    expect(within(card).getAllByRole('link')).toHaveLength(1);
    expect(within(card).getByRole('link', { name: 'Add cost & bill' })).toBeVisible();
    expect(card).not.toHaveTextContent('No cost');
  });

  it('saves a cost from the dialog and shows it on the page, with a toast', async () => {
    const router = await renderReadingPage(NEWEST_ID);

    await userEvent.click(within(pageRegion('Cost & bill')).getByRole('link', { name: 'Add cost & bill' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add cost & bill' });
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Cost (€)' }), '42,10');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await findNotification('Cost saved')).toBeVisible();
    await waitFor(() => expect(pageRegion('Cost & bill')).toHaveTextContent('€42.10'));
    expect(router.state.location.pathname).toBe(READING_ROUTES_PATHS.details(String(NEWEST_ID)));
  });
});

describe('the email card', () => {
  it('shows the saved → sent timeline and the email exactly as it went out', async () => {
    await renderReadingPage(SENT_ID);

    const email = pageRegion('Email');
    const steps = within(email).getAllByRole('listitem');
    expect(steps[0]).toHaveTextContent(`Saved ${SENT_DATE}`);
    expect(steps[1]).toHaveTextContent(`Sent ${SENT_DATE}`);
    expect(email).toHaveTextContent('Fromme@hotmail.example');
    expect(email).toHaveTextContent('Toreadings@water-provider.example');
    expect(email).toHaveTextContent('Date: 1 August 2026');
    expect(email).toHaveTextContent('Photo attached');
  });

  it('shows when a failed reading failed, and why', async () => {
    await renderReadingPage(FAILED_ID);

    const [, failed] = within(pageRegion('Email')).getAllByRole('listitem');
    expect(failed).toHaveTextContent('Failed 1 Sept 2026');
    expect(failed).toHaveTextContent(MOCK_FAILURE_REASON);
  });

  it('says the email did not go out when the reason was never kept', async () => {
    updateMockReading(FAILED_ID, { failedAt: null, failureReason: null });

    await renderReadingPage(FAILED_ID);

    expect(pageRegion('Email')).toHaveTextContent('FailedThe email did not go out.');
  });

  it('says it is not sent yet, with Send beside it', async () => {
    await renderReadingPage(NEWEST_ID);

    const email = pageRegion('Email');
    expect(email).toHaveTextContent('Not sent yet');
    expect(within(email).getByRole('link', { name: 'Send' })).toBeVisible();
  });

  it('says so when the reading was sent before its email was kept', async () => {
    updateMockReading(SENT_ID, { sentEmail: null });

    await renderReadingPage(SENT_ID);

    expect(pageRegion('Email')).toHaveTextContent('sent before the app kept a copy of its email');
  });
});

it('shows the day it was read and when it was saved under Details', async () => {
  await renderReadingPage(SENT_ID);

  expect(pageRegion('Details')).toHaveTextContent(`Read on${SENT_DATE}Saved${SENT_DATE}`);
});

describe('the layout', () => {
  it('puts the send action right under the digits on a phone, before the photo', async () => {
    await renderReadingPage(SENT_ID);

    const digits = screen.getByText('00511');
    const resend = screen.getByRole('link', { name: 'Resend' });
    const photo = screen.getByRole('button', { name: 'Open the photo full screen' });
    expect(digits.compareDocumentPosition(resend) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(resend.compareDocumentPosition(photo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('puts the send action and the menu in the header on a wide screen, before the photo and the digits', async () => {
    mockWideScreen();
    await renderReadingPage(SENT_ID);

    const header = screen.getByRole('heading', { level: 1 }).closest('header');
    if (!header) throw new Error('The title is not in a header');
    expect(within(header).getByRole('link', { name: 'Resend' })).toBeVisible();
    expect(within(header).getByRole('button', { name: 'More actions' })).toBeVisible();
    const photo = screen.getByRole('button', { name: 'Open the photo full screen' });
    expect(photo.compareDocumentPosition(screen.getByText('00511')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});

describe('loading and a missing reading', () => {
  it('holds the place of the reading while it loads', async () => {
    const reading = deferred<ReadingApiModel>();
    server.use(http.get(`${TEST_BASE_API_URL}/readings/:id`, async () => HttpResponse.json(await reading.promise)));
    renderRoutes(routes, { initialEntries: [READING_ROUTES_PATHS.details(String(SENT_ID))] });

    expect(await screen.findByText('Loading the reading…')).toBeInTheDocument();

    const sent = findMockReading(SENT_ID);
    if (!sent) throw new Error('No mock reading 12');
    reading.resolve(sent);
    expect(await screen.findByRole('heading', { level: 1, name: `Reading of ${SENT_DATE}` })).toBeVisible();
    expect(screen.queryByText('Loading the reading…')).not.toBeInTheDocument();
  });

  it('says the reading is not there, with the way back, when it was deleted', async () => {
    renderRoutes(routes, { initialEntries: [READING_ROUTES_PATHS.details('999')] });

    expect(await screen.findByRole('heading', { level: 1, name: 'This reading is not here' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Readings' })).toHaveAttribute('href', BASE_ROUTES_PATHS.HOME);
  });

  it('says the same for a link that names no reading at all', async () => {
    renderRoutes(routes, { initialEntries: [READING_ROUTES_PATHS.details('abc')] });

    expect(await screen.findByRole('heading', { level: 1, name: 'This reading is not here' })).toBeVisible();
  });
});

describe('an old link to the details modal', () => {
  it("redirects to the reading's page, keeping Home's filters", async () => {
    const { router } = renderRoutes(routes, {
      initialEntries: [`${READING_ROUTES_PATHS.detailsModal(String(SENT_ID))}${FILTERED_SEARCH}`],
    });

    expect(await screen.findByRole('heading', { level: 1, name: `Reading of ${SENT_DATE}` })).toBeVisible();
    expect(router.state.location.pathname).toBe(READING_ROUTES_PATHS.details(String(SENT_ID)));
    expect(router.state.location.search).toBe(FILTERED_SEARCH);
  });
});
