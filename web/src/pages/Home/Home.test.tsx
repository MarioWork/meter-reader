import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { BASE_ROUTES_PATHS, SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { MailStateUtil, MessageDateFormatUtil } from '@app-types/utility';
import { addMockBill } from '@mocks/handlers/bill/billMockState';
import { createReadingMockModel } from '@mocks/handlers/reading/models/readingMockModel.mock';
import { updateMockReading } from '@mocks/handlers/reading/readingMockState';
import { updateMockSettings } from '@mocks/handlers/settings/settingsMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import {
  findNotification,
  fireEvent,
  mockWideScreen,
  queryAllNotifications,
  renderRoutes,
  screen,
  userEvent,
  waitFor,
  within,
} from '@test-utils';

const NEWEST_DATE = '1 Oct 2026';
// The mock history's 1 Jun 2026 reading has no photo and was never sent.
const NO_PHOTO_DATE = '1 Jun 2026';
const DELETE_DIALOG = 'Delete this reading?';
const SERVER_ERROR = 500;

async function renderHome(path = BASE_ROUTES_PATHS.HOME) {
  const { router } = renderRoutes(routes, { initialEntries: [path] });
  await screen.findByRole('heading', { name: 'Water Readings' });

  return router;
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

describe("a reading's details", () => {
  it('opens from a tap on the card, with the digits, the day, the save time, the status and the photo on request', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('link', { name: `Details of the ${NEWEST_DATE} reading` }));

    const dialog = await screen.findByRole('dialog', { name: `Reading of ${NEWEST_DATE}` });
    // The photo stays hidden until asked for.
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
    const showPhoto = within(dialog).getByRole('button', { name: 'Show photo' });
    await userEvent.click(showPhoto);
    expect(showPhoto).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(showPhoto);
    expect(showPhoto).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(showPhoto);
    expect(within(dialog).getByRole('img', { name: `The meter showing 00529 on ${NEWEST_DATE}` })).toHaveAttribute(
      'src',
      `${TEST_BASE_API_URL}/photos/14`,
    );
    expect(dialog).toHaveTextContent('00529');
    expect(dialog).toHaveTextContent('Not sent');
    expect(within(dialog).getByRole('link', { name: `Send the reading of ${NEWEST_DATE}` })).toHaveTextContent('Send');
  });

  it('offers no way to send a reading that was sent', async () => {
    await renderHome();

    // The mock history's 1 Aug 2026 reading was sent.
    await userEvent.click(screen.getByRole('link', { name: 'Details of the 1 Aug 2026 reading' }));

    const dialog = await screen.findByRole('dialog', { name: 'Reading of 1 Aug 2026' });
    expect(dialog).toHaveTextContent(/Sent 1 Aug 2026/);
    expect(within(dialog).queryByRole('link', { name: /Send|Try again/ })).not.toBeInTheDocument();
  });

  it('shows the email a sent reading went out with', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('link', { name: 'Details of the 1 Aug 2026 reading' }));

    const dialog = await screen.findByRole('dialog', { name: 'Reading of 1 Aug 2026' });
    const email = within(dialog).getByRole('region', { name: 'Email sent' });
    expect(email).toHaveTextContent('Fromme@hotmail.example');
    expect(email).toHaveTextContent('Toreadings@water-provider.example');
    expect(email).toHaveTextContent('Date: 1 August 2026');
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();

    await userEvent.click(within(email).getByRole('button', { name: 'Photo attached' }));

    expect(within(email).getByRole('img', { name: 'The meter showing 00511 on 1 Aug 2026' })).toBeVisible();
    // The email shows the photo, so there is no second way to it.
    expect(within(dialog).queryByRole('button', { name: 'Show photo' })).not.toBeInTheDocument();
  });

  it('shows the edited subject and message once a reading is sent with them', async () => {
    await renderHome();
    await userEvent.click(within(lastReadingCard()).getByRole('link', { name: `Send the reading of ${NEWEST_DATE}` }));
    const preview = await screen.findByRole('dialog', { name: 'Send this reading?' });
    const subject = within(preview).getByRole('textbox', { name: 'Subject' });
    await userEvent.clear(subject);
    await userEvent.type(subject, 'Water meter reading');
    await userEvent.click(within(preview).getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(lastReadingCard()).toHaveTextContent(/Sent 2 Nov 2026/));

    await userEvent.click(screen.getByRole('link', { name: `Details of the ${NEWEST_DATE} reading` }));

    const dialog = await screen.findByRole('dialog', { name: `Reading of ${NEWEST_DATE}` });
    expect(within(dialog).getByRole('region', { name: 'Email sent' })).toHaveTextContent('Water meter reading');
  });

  it('shows no email section for a reading not sent yet', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('link', { name: `Details of the ${NEWEST_DATE} reading` }));

    const dialog = await screen.findByRole('dialog', { name: `Reading of ${NEWEST_DATE}` });
    expect(within(dialog).queryByRole('region', { name: 'Email sent' })).not.toBeInTheDocument();
  });

  it('closes with Close and leaves the history as it was', async () => {
    await renderHome();
    await userEvent.click(screen.getByRole('link', { name: `Details of the ${NEWEST_DATE} reading` }));
    const dialog = await screen.findByRole('dialog', { name: `Reading of ${NEWEST_DATE}` });

    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(lastReadingCard()).toHaveTextContent('00529');
  });

  it("keeps the card's own buttons working: the menu opens, not the details", async () => {
    await renderHome();

    await openMenuFor(NEWEST_DATE);

    expect(await screen.findByRole('menuitem', { name: 'View photo' })).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe("a reading's photo", () => {
  it('shows the full photo inside the app from the "⋯" menu', async () => {
    await renderHome();

    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem('View photo');

    const dialog = screen.getByRole('dialog', { name: `Photo of the ${NEWEST_DATE} reading` });
    expect(within(dialog).getByRole('img', { name: `The meter showing 00529 on ${NEWEST_DATE}` })).toHaveAttribute(
      'src',
      `${TEST_BASE_API_URL}/photos/14`,
    );
  });

  it('says the photo is loading until it arrives, then shows it', async () => {
    await renderHome();
    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem('View photo');
    const dialog = screen.getByRole('dialog', { name: `Photo of the ${NEWEST_DATE} reading` });

    expect(within(dialog).getByRole('status')).toHaveTextContent('Loading the photo…');
    fireEvent.load(within(dialog).getByRole('img'));

    expect(within(dialog).queryByRole('status')).not.toBeInTheDocument();
    expect(dialog).toHaveTextContent('Reading 00529');
  });

  it('says so when the photo cannot be loaded', async () => {
    await renderHome();
    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem('View photo');
    const dialog = screen.getByRole('dialog', { name: `Photo of the ${NEWEST_DATE} reading` });

    fireEvent.error(within(dialog).getByRole('img'));

    expect(within(dialog).getByRole('alert')).toHaveTextContent("The photo couldn't be loaded.");
  });

  it('closes the full photo with a click outside it, but not with a click on the photo', async () => {
    await renderHome();
    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem('View photo');
    const dialog = screen.getByRole('dialog');

    await userEvent.click(within(dialog).getByRole('img'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    // A click on the dim backdrop lands on the <dialog> element itself.
    await userEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the full photo with Close', async () => {
    await renderHome();
    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem('View photo');

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is not offered when the reading was saved without one', async () => {
    await renderHome();

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
  // The mock settings' templates, filled in for the newest reading.
  const SUBJECT = 'Meter reading 1 October 2026';
  const NEWEST_BODY = 'Date: 1 October 2026\nReading: 00529';

  async function openNewestPreview() {
    await renderHome();
    // The only Send link for the newest reading, on its card on a phone and in its row on a wide screen.
    await userEvent.click(screen.getByRole('link', { name: SEND_NEWEST }));

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

  it('fills the subject and the message from the templates saved in Settings when the preview opens', async () => {
    updateMockSettings({ subjectTemplate: 'Leitura {date}', bodyTemplate: 'Leitura - {reading} - {date}' });

    const dialog = await openNewestPreview();

    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveValue('Leitura 1 October 2026');
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveValue('Leitura - 00529 - 1 October 2026');
  });

  it('writes the date in the date format saved in Settings when the preview opens', async () => {
    updateMockSettings({ subjectTemplate: 'Leitura {date}', dateFormat: MessageDateFormatUtil.DAY_MONTH_YEAR });

    const dialog = await openNewestPreview();

    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveValue('Leitura 01/10/2026');
  });

  it('previews what will be sent: the address, the subject and the body ready to edit, and the photo', async () => {
    const dialog = await openNewestPreview();

    expect(within(dialog).getByText('me@hotmail.example')).toBeVisible();
    expect(within(dialog).getByText('readings@water-provider.example')).toBeVisible();
    expect(within(dialog).getByRole('textbox', { name: 'Subject' })).toHaveValue(SUBJECT);
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveValue(NEWEST_BODY);
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
    expect(received).toEqual([{ attachPhoto: true, subject: SUBJECT, body: NEWEST_BODY }]);
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

    await waitFor(() => expect(received).toEqual([{ attachPhoto: false, subject: SUBJECT, body: NEWEST_BODY }]));
    // Lets the send finish here, so it cannot land in the next test's fresh mock history.
    await waitFor(() => expect(screen.queryByRole('dialog', { name: SEND_DIALOG })).not.toBeInTheDocument());
  });

  it('sends the subject and message as the user edited them', async () => {
    const received = recordSendRequests();
    const dialog = await openNewestPreview();
    const subject = within(dialog).getByRole('textbox', { name: 'Subject' });
    const message = within(dialog).getByRole('textbox', { name: 'Message' });

    await userEvent.clear(subject);
    await userEvent.type(subject, 'Water meter reading');
    await userEvent.clear(message);
    await userEvent.type(message, 'Hello, the meter shows 00529.');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }));

    await waitFor(() =>
      expect(received).toEqual([
        { attachPhoto: true, subject: 'Water meter reading', body: 'Hello, the meter shows 00529.' },
      ]),
    );
    await waitFor(() => expect(screen.queryByRole('dialog', { name: SEND_DIALOG })).not.toBeInTheDocument());
  });

  it('marks an empty subject and sends nothing', async () => {
    const received = recordSendRequests();
    const dialog = await openNewestPreview();
    const subject = within(dialog).getByRole('textbox', { name: 'Subject' });

    await userEvent.clear(subject);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }));

    expect(subject).toBeInvalid();
    expect(subject).toHaveAccessibleDescription('Write a subject.');
    expect(received).toEqual([]);
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

    const dialog = await screen.findByRole('dialog', { name: SEND_DIALOG });
    expect(within(dialog).getByRole('textbox', { name: 'Message' })).toHaveValue(
      'Date: 1 September 2026\nReading: 00520',
    );
  });

  it('disables Send and says why when Hotmail is not connected', async () => {
    server.use(
      http.get(`${TEST_BASE_API_URL}/mail/status`, () => HttpResponse.json({ state: MailStateUtil.NOT_CONNECTED })),
    );

    const dialog = await openNewestPreview();

    expect(within(dialog).getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(dialog).toHaveTextContent('Hotmail is not connected');
  });

  it("disables Send and says why when the provider's address is not set", async () => {
    updateMockSettings({ to: null });

    const dialog = await openNewestPreview();

    expect(within(dialog).getByRole('button', { name: 'Send' })).toBeDisabled();
    expect(dialog).toHaveTextContent("Set the provider's address in Settings.");
    expect(within(dialog).getByRole('link', { name: 'Settings' })).toHaveAttribute('href', SETTINGS_ROUTES_PATHS.BASE);
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

describe("a reading's cost", () => {
  const ADD_COST = 'Add cost & bill';
  const EDIT_COST = 'Edit cost & bill';
  // The newest reading is reading 14 in the mock history.
  const NEWEST_ID = 14;
  const NEWEST_COST_PATH = `/home/readings/${NEWEST_ID}/cost-and-bill`;

  async function openCostDialog(name = ADD_COST) {
    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem(name);

    return screen.findByRole('dialog', { name });
  }

  function costField(dialog: HTMLElement) {
    return within(dialog).getByRole('textbox', { name: 'Cost (€)' });
  }

  async function saveCost(dialog: HTMLElement, costText: string) {
    await userEvent.clear(costField(dialog));
    if (costText) await userEvent.type(costField(dialog), costText);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
  }

  // Keeps what the app asked to save, then lets the mock API answer it as usual.
  function recordUpdateRequests() {
    const received: unknown[] = [];

    server.use(
      http.patch(`${TEST_BASE_API_URL}/readings/:id`, async ({ request }) => {
        received.push(await request.clone().json());
      }),
    );

    return received;
  }

  it('shows no cost on a card or in the details while the reading has none', async () => {
    await renderHome();

    expect(lastReadingCard()).not.toHaveTextContent('€');
    await userEvent.click(screen.getByRole('link', { name: `Details of the ${NEWEST_DATE} reading` }));
    const details = await screen.findByRole('dialog', { name: `Reading of ${NEWEST_DATE}` });
    expect(details).not.toHaveTextContent('Cost');
  });

  it('opens from the "⋯" menu as a dialog with its own url', async () => {
    const router = await renderHome();

    const dialog = await openCostDialog();

    expect(router.state.location.pathname).toBe(NEWEST_COST_PATH);
    expect(costField(dialog)).toHaveValue('');
  });

  it('opens straight from its url', async () => {
    renderRoutes(routes, { initialEntries: [NEWEST_COST_PATH] });

    expect(await screen.findByRole('dialog', { name: ADD_COST })).toBeVisible();
  });

  it('opens and saves with the keyboard alone', async () => {
    await renderHome();

    screen.getByRole('button', { name: `More actions for the reading of ${NEWEST_DATE}` }).focus();
    await userEvent.keyboard('{Enter}');
    await screen.findByRole('menuitem', { name: ADD_COST });
    // View photo comes first, then this one.
    await userEvent.keyboard('{ArrowDown}');
    // The menu moves focus once it has opened, which can land a tick after the key.
    await waitFor(() => expect(screen.getByRole('menuitem', { name: ADD_COST })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: ADD_COST });
    // The dialog takes focus; its × comes first, then the field.
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.tab();
    await userEvent.tab();
    expect(costField(dialog)).toHaveFocus();
    await userEvent.keyboard('42,10');
    // Past the Bill picker to Save. (A browser also saves on Enter in the field; user-event only does so in a form with
    // a single input.)
    await userEvent.tab();
    await userEvent.tab();
    expect(within(dialog).getByRole('button', { name: 'Save' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: ADD_COST })).not.toBeInTheDocument());
    expect(lastReadingCard()).toHaveTextContent('Cost €42.10');
  });

  it('saves a cost typed with a comma, in cents, and shows it on the card and in the details', async () => {
    const received = recordUpdateRequests();
    await renderHome();
    const dialog = await openCostDialog();

    await saveCost(dialog, '42,10');

    await waitFor(() => expect(screen.queryByRole('dialog', { name: ADD_COST })).not.toBeInTheDocument());
    expect(received).toEqual([{ costCents: 4210 }]);
    expect(await findNotification('Cost saved')).toBeVisible();
    await waitFor(() => expect(lastReadingCard()).toHaveTextContent('Cost €42.10'));
    await userEvent.click(screen.getByRole('link', { name: `Details of the ${NEWEST_DATE} reading` }));
    const details = await screen.findByRole('dialog', { name: `Reading of ${NEWEST_DATE}` });
    expect(within(details).getByText('Cost')).toBeVisible();
    expect(within(details).getByText('€42.10')).toBeVisible();
  });

  it('changes a cost already set, starting from it, typed with a point', async () => {
    const received = recordUpdateRequests();
    await renderHome();
    await saveCost(await openCostDialog(), '42,10');
    await waitFor(() => expect(lastReadingCard()).toHaveTextContent('Cost €42.10'));

    const dialog = await openCostDialog(EDIT_COST);
    expect(costField(dialog)).toHaveValue('42.10');
    await saveCost(dialog, '39.9');

    await waitFor(() => expect(lastReadingCard()).toHaveTextContent('Cost €39.90'));
    expect(received).toEqual([{ costCents: 4210 }, { costCents: 3990 }]);
  });

  it('removes the cost when the field is cleared', async () => {
    const received = recordUpdateRequests();
    await renderHome();
    await saveCost(await openCostDialog(), '42,10');
    await waitFor(() => expect(lastReadingCard()).toHaveTextContent('Cost €42.10'));

    await saveCost(await openCostDialog(EDIT_COST), '');

    await waitFor(() => expect(lastReadingCard()).not.toHaveTextContent('€'));
    expect(received).toEqual([{ costCents: 4210 }, { costCents: null }]);
    expect(await findNotification('Cost removed')).toBeVisible();
    await openMenuFor(NEWEST_DATE);
    expect(await screen.findByRole('menuitem', { name: ADD_COST })).toBeVisible();
  });

  it.each(['abc', '-5', '42,105'])('refuses %j with an error on the field and saves nothing', async (costText) => {
    const received = recordUpdateRequests();
    await renderHome();
    const dialog = await openCostDialog();

    await saveCost(dialog, costText);

    const field = costField(dialog);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAccessibleDescription(/Write the cost in euros, like 42,10 or 42.10/);
    expect(received).toEqual([]);
    expect(screen.getByRole('dialog', { name: ADD_COST })).toBeVisible();
  });

  it("keeps the dialog open with the server's reason when the save fails", async () => {
    server.use(
      http.patch(`${TEST_BASE_API_URL}/readings/:id`, () =>
        HttpResponse.json({ code: 'INTERNAL_ERROR', message: 'Something went wrong' }, { status: SERVER_ERROR }),
      ),
    );
    await renderHome();
    const dialog = await openCostDialog();

    await saveCost(dialog, '42,10');

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Something went wrong');
    expect(costField(dialog)).toHaveValue('42,10');
    expect(queryAllNotifications()).toHaveLength(0);
  });

  it('closes with Close, saves nothing and gives focus back to the "⋯" button', async () => {
    const received = recordUpdateRequests();
    await renderHome();
    const dialog = await openCostDialog();

    await userEvent.type(costField(dialog), '42,10');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog', { name: ADD_COST })).not.toBeInTheDocument();
    expect(received).toEqual([]);
    await waitFor(() =>
      expect(screen.getByRole('button', { name: `More actions for the reading of ${NEWEST_DATE}` })).toHaveFocus(),
    );
  });

  it("keeps the cost out of the reading's email", async () => {
    await renderHome();
    await saveCost(await openCostDialog(), '42,10');
    await waitFor(() => expect(lastReadingCard()).toHaveTextContent('Cost €42.10'));

    await userEvent.click(within(lastReadingCard()).getByRole('link', { name: `Send the reading of ${NEWEST_DATE}` }));

    const preview = await screen.findByRole('dialog', { name: 'Send this reading?' });
    expect(within(preview).getByRole('textbox', { name: 'Message' })).toHaveValue(
      'Date: 1 October 2026\nReading: 00529',
    );
    expect(preview).not.toHaveTextContent(/42[.,]10/);
  });
});

describe("a reading's bill", () => {
  const ADD_COST_AND_BILL = 'Add cost & bill';
  const EDIT_COST_AND_BILL = 'Edit cost & bill';
  // The newest reading is reading 14 in the mock history.
  const NEWEST_ID = 14;
  const PDF_BYTES = 184_320;
  const BILL_NAME = 'Fatura de Outubro.pdf';
  const BILL_BUTTON_NAME = `${BILL_NAME}, opens the bill`;
  const NEW_PDF_BILL = new File([new Uint8Array(PDF_BYTES)], 'november-bill.pdf', { type: 'application/pdf' });

  // The newest reading with a bill already saved, as the API answers it once updated with one. (A bill picked in the
  // dialog cannot go through the router in jsdom: its File is not the kind the router's Request reads. The upload
  // itself is covered in costAndBillModalActions.test.ts.)
  function saveMockBill() {
    const { id, name, contentType, sizeBytes } = addMockBill(
      new Blob([new Uint8Array(PDF_BYTES)]),
      'application/pdf',
      BILL_NAME,
    );

    updateMockReading(NEWEST_ID, { bill: { id, name, contentType, sizeBytes } });

    return id;
  }

  async function openBillDialog(name = EDIT_COST_AND_BILL) {
    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem(name);

    return screen.findByRole('dialog', { name });
  }

  function billField(dialog: HTMLElement) {
    return within(dialog).getByLabelText('Bill');
  }

  async function openDetails() {
    await userEvent.click(screen.getByRole('link', { name: `Details of the ${NEWEST_DATE} reading` }));

    return screen.findByRole('dialog', { name: `Reading of ${NEWEST_DATE}` });
  }

  // Keeps what the app asked to save, then lets the mock API answer it as usual.
  function recordUpdateRequests() {
    const received: unknown[] = [];

    server.use(
      http.patch(`${TEST_BASE_API_URL}/readings/:id`, async ({ request }) => {
        received.push(await request.clone().json());
      }),
    );

    return received;
  }

  it("shows the bill in the details as one button, named after its file, that opens the app's viewer", async () => {
    saveMockBill();
    await renderHome();

    const details = await openDetails();

    expect(within(details).getByText('Bill')).toBeVisible();
    const button = within(details).getByRole('button', { name: BILL_BUTTON_NAME });
    expect(button).toHaveTextContent(BILL_NAME);
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(within(details).getByText('PDF, 184.3 KB')).toBeVisible();
    expect(within(details).queryByRole('link', { name: new RegExp(BILL_NAME) })).not.toBeInTheDocument();
    expect(within(details).queryByRole('button', { name: /^Download/ })).not.toBeInTheDocument();
  });

  it('shows no bill in the details while the reading has none', async () => {
    await renderHome();

    expect(await openDetails()).not.toHaveTextContent('Bill');
  });

  it('calls the menu item "Edit" once the reading has a bill, even with no cost', async () => {
    saveMockBill();
    await renderHome();

    await openMenuFor(NEWEST_DATE);

    expect(await screen.findByRole('menuitem', { name: EDIT_COST_AND_BILL })).toBeVisible();
  });

  it('offers a file picker for PDF files only when the reading has no bill', async () => {
    await renderHome();

    const dialog = await openBillDialog(ADD_COST_AND_BILL);

    expect(billField(dialog)).toHaveAttribute('type', 'file');
    expect(billField(dialog)).toHaveAttribute('accept', 'application/pdf,.pdf');
    expect(billField(dialog)).toHaveAccessibleDescription('A PDF of up to 10 MB.');
    expect(within(dialog).queryByRole('button', { name: 'Remove bill' })).not.toBeInTheDocument();
  });

  it('shows the saved bill as a button that opens it, and says a new file replaces it', async () => {
    saveMockBill();
    await renderHome();

    const dialog = await openBillDialog();
    await userEvent.upload(billField(dialog), NEW_PDF_BILL);

    expect(within(dialog).getByText('Saved bill:')).toBeVisible();
    expect(within(dialog).getByRole('button', { name: BILL_BUTTON_NAME })).toHaveAttribute('aria-haspopup', 'dialog');
    expect(within(dialog).getByText('PDF, 184.3 KB')).toBeVisible();
    expect(billField(dialog)).toHaveAccessibleDescription(/It replaces the saved bill/);
  });

  it('removes the saved bill with Remove bill, and Keep bill takes that back', async () => {
    const received = recordUpdateRequests();
    saveMockBill();
    await renderHome();
    const dialog = await openBillDialog();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove bill' }));
    expect(within(dialog).getByText('The saved bill is removed when you save.')).toBeVisible();
    expect(within(dialog).queryByRole('button', { name: BILL_BUTTON_NAME })).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Keep bill' }));
    expect(within(dialog).getByRole('button', { name: BILL_BUTTON_NAME })).toBeVisible();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove bill' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: EDIT_COST_AND_BILL })).not.toBeInTheDocument());
    expect(await findNotification('Bill removed')).toBeVisible();
    expect(received).toEqual([{ costCents: null, billId: null }]);
    expect(await openDetails()).not.toHaveTextContent('Bill');
  });

  it('keeps the saved bill when only the cost changes', async () => {
    const received = recordUpdateRequests();
    saveMockBill();
    await renderHome();
    const dialog = await openBillDialog();

    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Cost (€)' }), '42,10');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: EDIT_COST_AND_BILL })).not.toBeInTheDocument());
    expect(await findNotification('Cost saved')).toBeVisible();
    expect(received).toEqual([{ costCents: 4210 }]);
    expect(within(await openDetails()).getByText('PDF, 184.3 KB')).toBeVisible();
  });

  it("keeps the bill out of the reading's email", async () => {
    saveMockBill();
    await renderHome();

    await userEvent.click(within(lastReadingCard()).getByRole('link', { name: `Send the reading of ${NEWEST_DATE}` }));

    const preview = await screen.findByRole('dialog', { name: 'Send this reading?' });
    expect(preview).not.toHaveTextContent(/bill/i);
  });
});

describe('filtering the history', () => {
  const THIS_MONTH = `${BASE_ROUTES_PATHS.HOME}?from=2026-10-01&to=2026-10-15`;
  const AUGUST_TO_MID_OCTOBER = 'from=2026-08-01&to=2026-10-15';

  beforeEach(() => {
    // 15 October 2026: "This month" is 1–15 Oct, which holds the mock history's newest reading only.
    vi.setSystemTime(new Date(2026, 9, 15, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Keeps the query of every history request, then lets the mock API answer it as usual.
  function recordHistoryRequests() {
    const received: URLSearchParams[] = [];

    server.use(
      http.get(`${TEST_BASE_API_URL}/readings`, ({ request }) => {
        received.push(new URL(request.url).searchParams);
      }),
    );

    return received;
  }

  function matchingCards() {
    return within(screen.getByRole('region', { name: 'Matching readings' })).getAllByRole('listitem');
  }

  function activeFilters() {
    return within(screen.getByRole('list', { name: 'Active filters' })).getAllByRole('button');
  }

  function filterSheet() {
    return screen.getByRole('dialog', { name: 'Filter readings' });
  }

  async function openFilterSheet() {
    await userEvent.click(screen.getByRole('button', { name: 'Filter' }));

    return screen.findByRole('dialog', { name: 'Filter readings' });
  }

  async function showReadings() {
    await userEvent.click(within(filterSheet()).getByRole('button', { name: 'Show readings' }));
  }

  it("puts a preset's days in the url and asks the API for them", async () => {
    const received = recordHistoryRequests();
    const router = await renderHome();

    const sheet = await openFilterSheet();
    await userEvent.click(within(sheet).getByRole('button', { name: 'This month' }));
    await showReadings();

    await waitFor(() => expect(matchingCards()).toHaveLength(1));
    const searchParams = new URLSearchParams(router.state.location.search);
    expect(searchParams.get('from')).toBe('2026-10-01');
    expect(searchParams.get('to')).toBe('2026-10-15');
    expect(received.at(-1)?.get('from')).toBe('2026-10-01');
    expect(received.at(-1)?.get('to')).toBe('2026-10-15');
    expect(matchingCards()[0]).toHaveTextContent('00529');
    expect(screen.getByRole('button', { name: 'Remove filter: This month' })).toBeVisible();
    expect(screen.queryByRole('dialog', { name: 'Filter readings' })).not.toBeInTheDocument();
  });

  it('hides the last reading card while a filter is on', async () => {
    await renderHome(THIS_MONTH);

    expect(screen.queryByRole('region', { name: 'Last reading' })).not.toBeInTheDocument();
    expect(matchingCards()).toHaveLength(1);
  });

  it('asks the API for the statuses in the url, and shows each as a chip', async () => {
    const received = recordHistoryRequests();
    await renderHome(`${BASE_ROUTES_PATHS.HOME}?status=failed,notSent`);

    expect(received.at(-1)?.get('status')).toBe('notSent,failed');
    expect(activeFilters().map((chip) => chip.textContent)).toEqual(['Not sent', 'Failed']);
    expect(matchingCards()).toHaveLength(3);
  });

  it('picks statuses in the sheet, starting from the ones in the url', async () => {
    const router = await renderHome(`${BASE_ROUTES_PATHS.HOME}?status=sent`);

    const sheet = await openFilterSheet();
    expect(within(sheet).getByRole('button', { name: 'Sent', pressed: true })).toBeVisible();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Failed' }));
    await showReadings();

    await waitFor(() => expect(new URLSearchParams(router.state.location.search).get('status')).toBe('sent,failed'));
    expect(matchingCards()).toHaveLength(10);
  });

  it('leaves the filters as they were when the sheet is closed', async () => {
    const router = await renderHome(`${BASE_ROUTES_PATHS.HOME}?status=sent`);

    const sheet = await openFilterSheet();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Failed' }));
    await userEvent.click(within(sheet).getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Filter readings' })).not.toBeInTheDocument());
    expect(router.state.location.search).toBe('?status=sent');
    expect(screen.getByRole('button', { name: 'Filter' })).toHaveFocus();
  });

  it('removes one filter with its chip and keeps the others', async () => {
    const router = await renderHome(`${BASE_ROUTES_PATHS.HOME}?${AUGUST_TO_MID_OCTOBER}&status=sent`);
    expect(matchingCards()).toHaveLength(1);

    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: Sent' }));

    await waitFor(() => expect(matchingCards()).toHaveLength(3));
    expect(router.state.location.search).toBe(`?${AUGUST_TO_MID_OCTOBER}`);
    expect(activeFilters().map((chip) => chip.textContent)).toEqual(['1 Aug 2026 – 15 Oct 2026']);
    expect(screen.getByRole('button', { name: 'Filter' })).toHaveFocus();
  });

  it('shows the whole history again once the last chip is removed', async () => {
    await renderHome(THIS_MONTH);

    await userEvent.click(screen.getByRole('button', { name: 'Remove filter: This month' }));

    await waitFor(() => expect(lastReadingCard()).toHaveTextContent('00529'));
    expect(earlierCards()).toHaveLength(9);
    expect(screen.queryByRole('list', { name: 'Active filters' })).not.toBeInTheDocument();
  });

  it('says when nothing matches, and Clear filters shows the whole history', async () => {
    const router = await renderHome(`${THIS_MONTH}&status=failed`);

    expect(screen.getByRole('heading', { name: 'No readings match these filters' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));

    await waitFor(() => expect(lastReadingCard()).toHaveTextContent('00529'));
    expect(router.state.location.search).toBe('');
    expect(screen.getByRole('button', { name: 'Filter' })).toHaveFocus();
  });

  it('filters by custom months, and refuses a range that ends before it starts', async () => {
    const router = await renderHome();

    const sheet = await openFilterSheet();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Custom' }));
    await userEvent.selectOptions(within(sheet).getByRole('combobox', { name: 'From month' }), 'Mar');
    await userEvent.selectOptions(within(sheet).getByRole('combobox', { name: 'From year' }), '2026');
    const toMonth = within(sheet).getByRole('combobox', { name: 'To month' });
    await userEvent.selectOptions(toMonth, 'Jan');
    await userEvent.selectOptions(within(sheet).getByRole('combobox', { name: 'To year' }), '2026');
    await showReadings();

    expect(within(sheet).getByRole('alert')).toHaveTextContent('Pick a To month on or after the From month');
    expect(toMonth).toHaveAccessibleDescription('Pick a To month on or after the From month');
    expect(toMonth).toHaveFocus();
    expect(router.state.location.search).toBe('');

    await userEvent.selectOptions(toMonth, 'May');
    await showReadings();

    await waitFor(() => expect(matchingCards()).toHaveLength(3));
    expect(router.state.location.search).toBe('?from=2026-03-01&to=2026-05-31');
    expect(screen.getByRole('button', { name: 'Remove filter: Mar 2026 – May 2026' })).toBeVisible();
  });

  describe('on a wide screen', () => {
    beforeEach(() => {
      vi.spyOn(window, 'matchMedia').mockImplementation(
        (query) =>
          ({
            matches: query.includes('min-width'),
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      );
    });

    function filterBar() {
      return screen.getByRole('region', { name: 'Filters' });
    }

    it('shows every filter at once, with no Filter button', async () => {
      await renderHome();

      expect(within(filterBar()).getByRole('button', { name: 'Last year' })).toBeVisible();
      expect(within(filterBar()).getByRole('button', { name: 'Sent' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Filter' })).not.toBeInTheDocument();
    });

    it('filters the moment a choice is pressed, and Clear all shows everything again', async () => {
      const router = await renderHome();

      await userEvent.click(within(filterBar()).getByRole('button', { name: 'This month' }));
      await waitFor(() => expect(router.state.location.search).toBe('?from=2026-10-01&to=2026-10-15'));
      await userEvent.click(within(filterBar()).getByRole('button', { name: 'Not sent' }));
      await waitFor(() => expect(router.state.location.search).toBe('?from=2026-10-01&to=2026-10-15&status=notSent'));

      await userEvent.click(within(filterBar()).getByRole('button', { name: 'Clear all' }));

      await waitFor(() => expect(router.state.location.search).toBe(''));
      await waitFor(() =>
        expect(within(filterBar()).queryByRole('button', { name: 'Clear all' })).not.toBeInTheDocument(),
      );
    });

    it('filters by last calendar year', async () => {
      const router = await renderHome();

      await userEvent.click(within(filterBar()).getByRole('button', { name: 'Last year' }));

      await waitFor(() => expect(router.state.location.search).toBe('?from=2025-01-01&to=2025-12-31'));
    });

    it('applies custom months only once Apply is pressed', async () => {
      const router = await renderHome();

      await userEvent.click(within(filterBar()).getByRole('button', { name: 'Custom' }));
      await userEvent.selectOptions(within(filterBar()).getByRole('combobox', { name: 'From month' }), 'Mar');
      await userEvent.selectOptions(within(filterBar()).getByRole('combobox', { name: 'From year' }), '2026');
      expect(router.state.location.search).toBe('');

      await userEvent.click(within(filterBar()).getByRole('button', { name: 'Apply' }));

      await waitFor(() => expect(router.state.location.search).toBe('?from=2026-03-01'));
    });
  });

  it('starts again from the first page when the filters change, and Load more keeps them', async () => {
    const received = recordHistoryRequests();
    await renderHome(`${BASE_ROUTES_PATHS.HOME}?pages=2`);
    await waitFor(() => expect(earlierCards()).toHaveLength(13));

    const sheet = await openFilterSheet();
    await userEvent.click(within(sheet).getByRole('button', { name: 'Sent' }));
    await showReadings();

    // Eleven sent readings: the first page of ten, then the eleventh with Load more.
    await waitFor(() => expect(matchingCards()).toHaveLength(10));
    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(matchingCards()).toHaveLength(11));
    expect(received.at(-1)?.get('page')).toBe('2');
    expect(received.at(-1)?.get('status')).toBe('sent');
  });

  it('keeps the filtered readings and says so when the next page fails', async () => {
    failSecondPage();
    await renderHome(`${BASE_ROUTES_PATHS.HOME}?status=sent`);

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The older readings could not be loaded');
    expect(matchingCards()).toHaveLength(10);
    expect(activeFilters().map((chip) => chip.textContent)).toEqual(['Sent']);
  });
});

describe('the history on a wide screen', () => {
  beforeEach(() => {
    mockWideScreen();
  });

  function readingTable(name = 'Readings') {
    return screen.getByRole('table', { name });
  }

  // Every row but the header row, newest first.
  function readingRows(name?: string) {
    const [, ...bodyRows] = within(readingTable(name)).getAllByRole('row');

    return bodyRows;
  }

  function detailsLinkName(readingDate: string) {
    return `${readingDate} reading details`;
  }

  function rowFor(readingDate: string) {
    const row = readingRows().find((bodyRow) =>
      within(bodyRow).queryByRole('link', { name: detailsLinkName(readingDate) }),
    );

    if (!row) throw new Error(`No row for the ${readingDate} reading`);

    return row;
  }

  it('shows the readings as a table, newest first, with the date, the digits, the status, the cost and the bill', async () => {
    await renderHome();

    const headers = within(readingTable()).getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
      'Date',
      'Reading',
      'Status',
      'Cost',
      'Bill',
      'Actions',
    ]);
    // The first page of ten readings, every one a row: no separate last reading card.
    expect(readingRows()).toHaveLength(10);
    expect(screen.queryByRole('region', { name: 'Last reading' })).not.toBeInTheDocument();

    const [date, digits, status, cost, bill] = within(rowFor('1 Aug 2026')).getAllByRole('cell');
    expect(date).toHaveTextContent('1 Aug 2026');
    expect(digits).toHaveTextContent('00511');
    expect(status).toHaveTextContent('Sent 1 Aug 2026');
    expect(cost).toHaveTextContent('€39.05');
    expect(bill).toHaveTextContent('No bill');
    expect(within(rowFor(NEWEST_DATE)).getAllByRole('cell')[3]).toHaveTextContent('No cost');
  });

  it("shows a reading's bill as a link that opens it", async () => {
    const { id, name, contentType, sizeBytes } = addMockBill(new Blob(['%PDF']), 'application/pdf', 'October.pdf');
    updateMockReading(14, { bill: { id, name, contentType, sizeBytes } });

    await renderHome();

    expect(
      within(rowFor(NEWEST_DATE)).getByRole('link', {
        name: `October.pdf, opens the bill of ${NEWEST_DATE} in a new tab`,
      }),
    ).toHaveAttribute('href', `${TEST_BASE_API_URL}/bills/${id}`);
  });

  it("opens a reading's details from its row", async () => {
    await renderHome();

    await userEvent.click(within(rowFor(NEWEST_DATE)).getByRole('link', { name: detailsLinkName(NEWEST_DATE) }));

    expect(await screen.findByRole('dialog', { name: `Reading of ${NEWEST_DATE}` })).toHaveTextContent('00529');
  });

  it('keeps Send and the ⋯ actions on each row', async () => {
    await renderHome();

    const row = rowFor(NEWEST_DATE);
    expect(within(row).getByRole('link', { name: `Send the reading of ${NEWEST_DATE}` })).toBeVisible();
    await userEvent.click(within(row).getByRole('button', { name: `More actions for the reading of ${NEWEST_DATE}` }));

    expect(await screen.findByRole('menuitem', { name: 'Delete' })).toBeVisible();
  });

  it("opens the cost & bill dialog from a row's ⋯ menu", async () => {
    await renderHome();

    await openMenuFor(NEWEST_DATE);
    await chooseMenuItem('Add cost & bill');

    expect(await screen.findByRole('dialog', { name: 'Add cost & bill' })).toBeVisible();
  });

  it('sits below the filters bar', async () => {
    await renderHome();

    const filterBar = screen.getByRole('region', { name: 'Filters' });
    expect(filterBar.compareDocumentPosition(readingTable())).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('adds the older readings as rows with Load more', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(readingRows()).toHaveLength(14));
    expect(readingRows()[13]).toHaveTextContent('00412');
    expect(historyCount()).toHaveTextContent('Showing 14 of 14 readings');
  });

  it('names the table after the filters while they are on', async () => {
    await renderHome(`${BASE_ROUTES_PATHS.HOME}?status=failed`);

    expect(readingRows('Matching readings')).toHaveLength(1);
    expect(readingRows('Matching readings')[0]).toHaveTextContent('Failed');
  });

  it('gives focus to the table once a deleted reading took its ⋯ button away', async () => {
    await renderHome();

    const dialog = await openDeleteDialogFor(NEWEST_DATE);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(readingRows()).toHaveLength(10));
    expect(screen.getByRole('region', { name: 'Readings' })).toHaveFocus();
    expect(readingTable()).not.toHaveTextContent('00529');
  });
});

it('shows the history as cards, not a table, on a phone', async () => {
  await renderHome();

  expect(lastReadingCard()).toHaveTextContent('00529');
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});

describe('exporting the history', () => {
  const EXPORT_LINK_NAME = 'Export readings as a spreadsheet';

  function exportUrl() {
    return new URL(screen.getByRole('link', { name: EXPORT_LINK_NAME }).getAttribute('href') ?? '');
  }

  it("downloads every reading as a spreadsheet, with the user's time zone, when no filter is on", async () => {
    await renderHome();

    const url = exportUrl();

    expect(screen.getByRole('link', { name: EXPORT_LINK_NAME })).toHaveAttribute('download');
    expect(`${url.origin}${url.pathname}`).toBe(`${TEST_BASE_API_URL}/readings/export.xlsx`);
    expect([...url.searchParams.keys()]).toEqual(['timeZone']);
    expect(url.searchParams.get('timeZone')).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it("downloads only the readings Home's filters match when filters are on", async () => {
    await renderHome(`${BASE_ROUTES_PATHS.HOME}?from=2026-01-01&to=2026-06-30&status=failed,notSent`);

    const url = exportUrl();

    expect(url.searchParams.get('from')).toBe('2026-01-01');
    expect(url.searchParams.get('to')).toBe('2026-06-30');
    expect(url.searchParams.get('status')).toBe('notSent,failed');
  });

  it('is not offered when no reading matches the filters', async () => {
    await renderHome(`${BASE_ROUTES_PATHS.HOME}?from=2020-01-01&to=2020-01-31`);

    expect(screen.queryByRole('link', { name: EXPORT_LINK_NAME })).not.toBeInTheDocument();
  });
});
