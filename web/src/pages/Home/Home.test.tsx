import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { MailStateUtil } from '@app-types/utility';
import { createReadingMockModel } from '@mocks/handlers/reading/models/readingMockModel.mock';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { findNotification, queryAllNotifications, renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';

const NEWEST_DATE = '1 Oct 2026';
// The mock history's 1 Jun 2026 reading has no photo and was never sent.
const NO_PHOTO_DATE = '1 Jun 2026';
const DELETE_DIALOG = 'Delete this reading?';
const SERVER_ERROR = 500;

async function renderHome(path = BASE_ROUTES_PATHS.HOME) {
  renderRoutes(routes, { initialEntries: [path] });
  await screen.findByRole('heading', { name: 'History' });
}

function lastReadingCard() {
  return screen.getByRole('region', { name: 'Last reading' });
}

function earlierReadings() {
  return screen.getByRole('region', { name: 'Earlier readings' });
}

function earlierCards() {
  return within(earlierReadings()).getAllByRole('listitem');
}

function earlierCardFor(readingDate: string) {
  return earlierCards().find((card) => within(card).queryByRole('heading', { name: readingDate }));
}

async function openMenuFor(readingDate: string) {
  await userEvent.click(screen.getByRole('button', { name: `More actions for the reading of ${readingDate}` }));
}

async function chooseMenuItem(name: string) {
  await userEvent.click(await screen.findByRole('menuitem', { name }));
}

async function openDeleteDialogFor(readingDate: string) {
  await openMenuFor(readingDate);
  await chooseMenuItem('Delete');

  return screen.findByRole('alertdialog', { name: DELETE_DIALOG });
}

// An open dialog hides the page behind it from screen readers, the history included.
function pageBehindDialog() {
  return screen.getByRole('main', { hidden: true });
}

function historyCount() {
  return screen.getByText(/^Showing \d+ of \d+ readings$/);
}

function failSecondPage() {
  server.use(
    http.get(`${TEST_BASE_API_URL}/readings`, ({ request }) => {
      const isSecondPage = new URL(request.url).searchParams.get('page') === '2';

      if (isSecondPage) return HttpResponse.json({ message: 'Database unavailable' }, { status: SERVER_ERROR });
    }),
  );
}

describe('the last reading', () => {
  it('shows the newest reading big, with its day, its status and Send', async () => {
    await renderHome();

    const card = lastReadingCard();
    expect(card).toHaveTextContent('00529');
    expect(card).toHaveTextContent(NEWEST_DATE);
    expect(card).toHaveTextContent('Not sent');
    expect(within(card).getByRole('link', { name: `Send the reading of ${NEWEST_DATE}` })).toBeVisible();
  });

  it('is not repeated in the earlier readings', async () => {
    await renderHome();

    expect(earlierReadings()).not.toHaveTextContent('00529');
  });
});

it('lists the earlier readings as cards, newest first, with the date, the reading and its status', async () => {
  await renderHome();

  const [newest, next] = earlierCards();
  expect(within(newest).getByRole('heading', { name: '1 Sept 2026' })).toBeVisible();
  expect(newest).toHaveTextContent('00520');
  expect(newest).toHaveTextContent('Failed');
  expect(next).toHaveTextContent('1 Aug 2026');
  // The first page of ten readings: one on the last reading card, nine below it.
  expect(earlierCards()).toHaveLength(9);
  expect(historyCount()).toHaveTextContent('Showing 10 of 14 readings');
  expect(earlierReadings()).not.toHaveFocus();
});

describe("a reading's photo", () => {
  it('shows the full photo inside the app from the "⋯" menu', async () => {
    await renderHome();

    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem('View photo');

    const dialog = screen.getByRole('dialog', { name: `Photo of 00529 on ${NEWEST_DATE}` });
    expect(within(dialog).getByRole('img', { name: `The meter showing 00529 on ${NEWEST_DATE}` })).toHaveAttribute(
      'src',
      `${TEST_BASE_API_URL}/photos/14`,
    );
  });

  it('closes the full photo with Close', async () => {
    await renderHome();
    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem('View photo');

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is not offered when the reading was saved without one, and the card says so', async () => {
    await renderHome();

    expect(earlierCardFor(NO_PHOTO_DATE)).toHaveTextContent('No photo');
    await openMenuFor(NO_PHOTO_DATE);

    expect(await screen.findByRole('menuitem', { name: 'Delete' })).toBeVisible();
    expect(screen.queryByRole('menuitem', { name: 'View photo' })).not.toBeInTheDocument();
  });
});

describe('loading more of the history', () => {
  it('adds the older readings below with Load more', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(earlierCards()).toHaveLength(13));
    expect(earlierCards()[0]).toHaveTextContent('1 Sept 2026');
    expect(earlierCards()[12]).toHaveTextContent('00412');
    expect(historyCount()).toHaveTextContent('Showing 14 of 14 readings');
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    // The button went with the last page; focus stays at the end of the history, on the count.
    expect(historyCount()).toHaveFocus();
  });

  it('loads the next page by itself once the end of the list comes into view', async () => {
    const observed: IntersectionObserverCallback[] = [];
    onTestFinished(() => {
      vi.unstubAllGlobals();
    });
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          observed.push(callback);
        }
        observe() {}
        disconnect() {}
      },
    );
    await renderHome();

    const [comesIntoView] = observed;
    comesIntoView([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);

    await waitFor(() => expect(earlierCards()).toHaveLength(13));
  });

  it('shows the whole history when the url asks for more pages than there are', async () => {
    await renderHome(`${BASE_ROUTES_PATHS.HOME}?pages=3`);

    expect(earlierCards()).toHaveLength(13);
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
  });

  it('keeps what is shown and says so when the next page fails, and Load more tries again', async () => {
    failSecondPage();
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The older readings could not be loaded');
    expect(earlierCards()).toHaveLength(9);

    server.resetHandlers();
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(earlierCards()).toHaveLength(13));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('keeps every loaded reading after a delete', async () => {
    await renderHome();
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await waitFor(() => expect(earlierCards()).toHaveLength(13));

    const dialog = await openDeleteDialogFor('1 Jan 2026');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(historyCount()).toHaveTextContent('Showing 13 of 13 readings'));
    expect(earlierCards()).toHaveLength(12);
    expect(earlierCards()[11]).toHaveTextContent('00412');
  });
});

it('points to New reading when the history is empty', async () => {
  server.use(
    http.get(`${TEST_BASE_API_URL}/readings`, () =>
      HttpResponse.json({ data: [], totalResultNumber: 0, currentPage: 1 }),
    ),
  );

  await renderHome();

  expect(screen.getByRole('heading', { name: 'No readings yet' })).toBeVisible();
  expect(screen.getByText(/Tap New reading below/)).toBeVisible();
  expect(screen.queryByRole('region', { name: 'Last reading' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
});

it('shows only the last reading card when it is the only reading', async () => {
  server.use(
    http.get(`${TEST_BASE_API_URL}/readings`, () =>
      HttpResponse.json({ data: [createReadingMockModel()], totalResultNumber: 1, currentPage: 1 }),
    ),
  );

  await renderHome();

  expect(lastReadingCard()).toHaveTextContent('00412');
  expect(screen.queryByRole('region', { name: 'Earlier readings' })).not.toBeInTheDocument();
});

it('opens the new reading page from the New reading link', async () => {
  await renderHome();

  await userEvent.click(screen.getByRole('link', { name: 'New reading' }));

  expect(await screen.findByRole('heading', { name: 'New reading' })).toBeVisible();
});

describe('deleting a reading', () => {
  it('asks for confirmation before anything is deleted', async () => {
    await renderHome();

    const dialog = await openDeleteDialogFor(NEWEST_DATE);

    expect(dialog).toHaveTextContent(`00529 from ${NEWEST_DATE}`);
    expect(pageBehindDialog()).toHaveTextContent('00529');
  });

  it('says the photo goes too when the reading has one', async () => {
    await renderHome();

    const dialog = await openDeleteDialogFor(NEWEST_DATE);

    expect(dialog).toHaveTextContent('will be removed from the history, with its photo.');
  });

  it('does not mention a photo when the reading has none', async () => {
    await renderHome();

    const dialog = await openDeleteDialogFor(NO_PHOTO_DATE);

    expect(dialog).toHaveTextContent('will be removed from the history. This cannot be undone.');
    expect(dialog).not.toHaveTextContent('photo');
  });

  it('removes the reading from the history when the user confirms', async () => {
    await renderHome();

    const dialog = await openDeleteDialogFor(NEWEST_DATE);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(lastReadingCard()).toHaveTextContent('1 Sept 2026'));
    expect(await findNotification('Reading deleted')).toBeVisible();
    expect(screen.getByRole('main')).not.toHaveTextContent('00529');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(lastReadingCard()).toHaveFocus();
  });

  it('gives focus to the earlier readings when one of them is deleted', async () => {
    await renderHome();

    const dialog = await openDeleteDialogFor('1 May 2026');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(earlierReadings()).not.toHaveTextContent('1 May 2026'));
    expect(earlierReadings()).toHaveFocus();
    expect(lastReadingCard()).toHaveTextContent('00529');
  });

  it('keeps the reading when the user cancels', async () => {
    await renderHome();

    await openDeleteDialogFor(NEWEST_DATE);
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(lastReadingCard()).toHaveTextContent('00529');
  });

  it('keeps the dialog open with the reason when the delete fails', async () => {
    server.use(
      http.delete(`${TEST_BASE_API_URL}/readings/:id`, () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'Reading 9 not found' }, { status: 404 }),
      ),
    );
    await renderHome();

    const dialog = await openDeleteDialogFor('1 May 2026');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Reading 9 not found');
    expect(pageBehindDialog()).toHaveTextContent('1 May 2026');
    // The failure shows in the dialog only, not as a toast too.
    expect(queryAllNotifications()).toHaveLength(0);
  });

  it('does not show an earlier failure when the dialog is opened again', async () => {
    server.use(
      http.delete(`${TEST_BASE_API_URL}/readings/:id`, () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'Reading 14 not found' }, { status: 404 }),
      ),
    );
    await renderHome();
    const dialog = await openDeleteDialogFor(NEWEST_DATE);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await within(dialog).findByRole('alert');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    const reopened = await openDeleteDialogFor(NEWEST_DATE);

    expect(within(reopened).queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('sending a reading', () => {
  const SEND_NEWEST = `Send the reading of ${NEWEST_DATE}`;
  const SEND_DIALOG = 'Send this reading?';

  async function openNewestPreview() {
    await renderHome();
    await userEvent.click(within(lastReadingCard()).getByRole('link', { name: SEND_NEWEST }));

    return screen.findByRole('dialog', { name: SEND_DIALOG });
  }

  // Keeps what the app asked to send, then lets the mock API answer it as usual (a resolver that returns nothing
  // falls through to the next handler).
  function recordSendRequests() {
    const received: unknown[] = [];

    server.use(
      http.post(`${TEST_BASE_API_URL}/readings/:id/send`, async ({ request }) => {
        received.push(await request.clone().json());
      }),
    );

    return received;
  }

  // A screen at least as wide as Tailwind's `sm` breakpoint; every other media query (dark mode) still answers "no".
  function showOnAWideScreen() {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: query.includes('min-width'),
          media: query,
          addEventListener: () => {},
          removeEventListener: () => {},
        }) as unknown as MediaQueryList,
    );
  }

  it('previews exactly what will be sent: the address, the subject, the body and the photo', async () => {
    const dialog = await openNewestPreview();

    expect(within(dialog).getByText('readings@water-provider.example')).toBeVisible();
    expect(within(dialog).getByText('test')).toBeVisible();
    // The body's line break reads as a space once the text is normalised.
    expect(within(dialog).getByText('Date: 1 October 2026 Reading: 00529')).toBeVisible();
    expect(within(dialog).getByRole('switch', { name: 'Attach photo' })).toBeChecked();
    expect(within(dialog).getByRole('img', { name: 'meter-2026-10-01.jpg' })).toHaveAttribute(
      'src',
      `${TEST_BASE_API_URL}/photos/14`,
    );
  });

  it('sends the reading with its photo and shows it as sent', async () => {
    const received = recordSendRequests();
    const dialog = await openNewestPreview();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: SEND_DIALOG })).not.toBeInTheDocument());
    await waitFor(() => expect(lastReadingCard()).toHaveTextContent(/Sent 2 Nov 2026/));
    expect(await findNotification('Reading sent')).toBeVisible();
    expect(received).toEqual([{ attachPhoto: true }]);
    expect(within(lastReadingCard()).queryByRole('link', { name: SEND_NEWEST })).not.toBeInTheDocument();
  });

  it('keeps every loaded reading after a send', async () => {
    await renderHome();
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    await waitFor(() => expect(earlierCards()).toHaveLength(13));

    await userEvent.click(screen.getByRole('link', { name: SEND_NEWEST }));
    const dialog = await screen.findByRole('dialog', { name: SEND_DIALOG });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(lastReadingCard()).toHaveTextContent(/Sent 2 Nov 2026/));
    expect(earlierCards()).toHaveLength(13);
  });

  it('sends the reading without its photo when Attach photo is unticked', async () => {
    const received = recordSendRequests();
    const dialog = await openNewestPreview();

    await userEvent.click(within(dialog).getByRole('switch', { name: 'Attach photo' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(received).toEqual([{ attachPhoto: false }]));
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
  });

  it('offers no photo to attach when the reading has none', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('link', { name: `Send the reading of ${NO_PHOTO_DATE}` }));

    const dialog = await screen.findByRole('dialog', { name: SEND_DIALOG });
    expect(within(dialog).queryByRole('switch')).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent('No photo');
  });

  it("keeps the preview open with the server's reason when the send fails", async () => {
    server.use(
      http.post(`${TEST_BASE_API_URL}/readings/:id/send`, () =>
        HttpResponse.json(
          { code: 'MAIL_REFUSED', message: 'Microsoft did not send the email (ErrorInvalidRecipients). Try again' },
          { status: 502 },
        ),
      ),
    );
    const dialog = await openNewestPreview();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Microsoft did not send the email (ErrorInvalidRecipients). Try again',
    );
    // The failure shows in the preview only, not as a toast too.
    expect(queryAllNotifications()).toHaveLength(0);
  });

  it('opens the preview again from Try again on a failed reading', async () => {
    await renderHome();

    // The mock history's 1 Sept 2026 reading failed to send.
    const failed = earlierCardFor('1 Sept 2026')!;
    expect(failed).toHaveTextContent('Failed');
    await userEvent.click(within(failed).getByRole('link', { name: 'Try again: send the reading of 1 Sept 2026' }));

    expect(await screen.findByRole('dialog', { name: SEND_DIALOG })).toHaveTextContent('Reading: 00520');
  });

  it('disables Send and says why when Hotmail is not connected', async () => {
    server.use(
      http.get(`${TEST_BASE_API_URL}/mail/status`, () => HttpResponse.json({ state: MailStateUtil.NOT_CONNECTED })),
    );

    const dialog = await openNewestPreview();

    expect(within(dialog).getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(dialog).toHaveTextContent('Hotmail is not connected');
  });

  it('closes the preview and sends nothing when the user presses Close', async () => {
    const received = recordSendRequests();
    const dialog = await openNewestPreview();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog', { name: SEND_DIALOG })).not.toBeInTheDocument();
    expect(received).toEqual([]);
    expect(lastReadingCard()).toHaveTextContent('Not sent');
  });

  it('gives focus back to the Send link that opened the preview when it closes', async () => {
    const dialog = await openNewestPreview();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(screen.getByRole('link', { name: SEND_NEWEST })).toHaveFocus();
  });

  // jsdom answers "no" to every media query, so the tests above get the phone's bottom sheet. A wide screen gets a
  // centred dialog instead, with the same content and the same Close.
  it('previews and closes the same way on a wide screen', async () => {
    showOnAWideScreen();
    const received = recordSendRequests();
    const dialog = await openNewestPreview();

    expect(within(dialog).getByText('readings@water-provider.example')).toBeVisible();
    expect(within(dialog).getByRole('switch', { name: 'Attach photo' })).toBeChecked();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog', { name: SEND_DIALOG })).not.toBeInTheDocument();
    expect(received).toEqual([]);
  });

  it('shows a sent reading with the day it was sent and no way to send it again', async () => {
    await renderHome();

    // The mock history's 1 Aug 2026 reading was sent on 1 Aug 2026.
    const sent = earlierCardFor('1 Aug 2026')!;
    expect(sent).toHaveTextContent(/Sent 1 Aug 2026/);
    expect(within(sent).queryByRole('link', { name: /Send|Try again/ })).not.toBeInTheDocument();
  });
});
