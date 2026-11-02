import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { BASE_ROUTES_PATHS } from '@application/routes/routesUtils';
import { MailStateUtil } from '@app-types/utility';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';

const NEWEST_DELETE_BUTTON = 'Delete the reading of 1 Oct 2026';
const DELETE_DIALOG = 'Delete this reading?';

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
  expect(screen.getByRole('table', { name: 'History' })).not.toHaveFocus();
});

describe("a reading's photo", () => {
  const SHOW_NEWEST_PHOTO = 'Show the photo of 00529 on 1 Oct 2026';
  const NEWEST_PHOTO_DIALOG = 'Photo of 00529 on 1 Oct 2026';

  it('shows the full photo inside the app when its preview is tapped', async () => {
    await renderHome();

    await userEvent.click(within(historyRows()[0]).getByRole('button', { name: SHOW_NEWEST_PHOTO }));

    const dialog = screen.getByRole('dialog', { name: NEWEST_PHOTO_DIALOG });
    expect(within(dialog).getByRole('img', { name: 'The meter showing 00529 on 1 Oct 2026' })).toHaveAttribute(
      'src',
      `${TEST_BASE_API_URL}/photos/14`,
    );
  });

  it('closes the full photo with Close', async () => {
    await renderHome();
    await userEvent.click(within(historyRows()[0]).getByRole('button', { name: SHOW_NEWEST_PHOTO }));

    await userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

it('says when a reading was saved without a photo', async () => {
  await renderHome();

  // The mock history's 1 Jun 2026 reading has no photo.
  const withoutPhoto = historyRows().find((row) => row.textContent?.includes('1 Jun 2026'));
  expect(withoutPhoto).toHaveTextContent('No photo');
  expect(within(withoutPhoto!).queryByRole('button', { name: /^Show the photo/ })).not.toBeInTheDocument();
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
  it('asks for confirmation before anything is deleted', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: NEWEST_DELETE_BUTTON }));

    const dialog = screen.getByRole('dialog', { name: DELETE_DIALOG });
    expect(dialog).toHaveTextContent('00529 from 1 Oct 2026');
    expect(historyRows()[0]).toHaveTextContent('00529');
  });

  it('says the photo goes too when the reading has one', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: NEWEST_DELETE_BUTTON }));

    expect(screen.getByRole('dialog', { name: DELETE_DIALOG })).toHaveTextContent(
      'will be removed from the history, with its photo.',
    );
  });

  it('does not mention a photo when the reading has none', async () => {
    await renderHome();

    // The mock history's 1 Jun 2026 reading has no photo.
    await userEvent.click(screen.getByRole('button', { name: 'Delete the reading of 1 Jun 2026' }));

    const dialog = screen.getByRole('dialog', { name: DELETE_DIALOG });
    expect(dialog).toHaveTextContent('will be removed from the history. This cannot be undone.');
    expect(dialog).not.toHaveTextContent('photo');
  });

  it('removes the reading from the history when the user confirms', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: NEWEST_DELETE_BUTTON }));
    const dialog = screen.getByRole('dialog', { name: DELETE_DIALOG });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(historyRows()[0]).toHaveTextContent('1 Sept 2026'));
    expect(screen.getByRole('table', { name: 'History' })).not.toHaveTextContent('00529');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'History' })).toHaveFocus();
  });

  it('keeps the reading when the user cancels', async () => {
    await renderHome();

    await userEvent.click(screen.getByRole('button', { name: NEWEST_DELETE_BUTTON }));
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

    await userEvent.click(screen.getByRole('button', { name: NEWEST_DELETE_BUTTON }));
    const dialog = screen.getByRole('dialog', { name: DELETE_DIALOG });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Reading 14 not found');
    expect(historyRows()[0]).toHaveTextContent('00529');
  });

  it('does not show an earlier failure when the dialog is opened again', async () => {
    server.use(
      http.delete(`${TEST_BASE_API_URL}/readings/:id`, () =>
        HttpResponse.json({ code: 'NOT_FOUND', message: 'Reading 14 not found' }, { status: 404 }),
      ),
    );
    await renderHome();
    await userEvent.click(screen.getByRole('button', { name: NEWEST_DELETE_BUTTON }));
    const dialog = screen.getByRole('dialog', { name: DELETE_DIALOG });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));
    await within(dialog).findByRole('alert');

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await userEvent.click(screen.getByRole('button', { name: NEWEST_DELETE_BUTTON }));

    expect(within(screen.getByRole('dialog')).queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('sending a reading', () => {
  const SEND_NEWEST = 'Send the reading of 1 Oct 2026';
  const SEND_DIALOG = 'Send this reading?';

  async function openNewestPreview() {
    await renderHome();
    await userEvent.click(within(historyRows()[0]).getByRole('link', { name: SEND_NEWEST }));

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

  it('previews exactly what will be sent: the address, the subject, the body and the photo', async () => {
    const dialog = await openNewestPreview();

    expect(within(dialog).getByText('readings@water-provider.example')).toBeVisible();
    expect(within(dialog).getByText('test')).toBeVisible();
    expect(within(dialog).getByTestId('email-body')).toHaveTextContent('Date: 1 October 2026 Reading: 00529');
    expect(within(dialog).getByRole('checkbox', { name: 'Attach photo' })).toBeChecked();
    expect(within(dialog).getByRole('img', { name: 'meter-2026-10-01.jpg' })).toHaveAttribute(
      'src',
      `${TEST_BASE_API_URL}/photos/14`,
    );
  });

  it('sends the reading with its photo and shows it as sent', async () => {
    const received = recordSendRequests();
    const dialog = await openNewestPreview();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(historyRows()[0]).toHaveTextContent(/Sent 2 Nov 2026/));
    expect(received).toEqual([{ attachPhoto: true }]);
    expect(within(historyRows()[0]).queryByRole('link', { name: SEND_NEWEST })).not.toBeInTheDocument();
  });

  it('sends the reading without its photo when Attach photo is unticked', async () => {
    const received = recordSendRequests();
    const dialog = await openNewestPreview();

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Attach photo' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(received).toEqual([{ attachPhoto: false }]));
    expect(within(dialog).queryByRole('img')).not.toBeInTheDocument();
  });

  it('offers no photo to attach when the reading has none', async () => {
    await renderHome();

    // The mock history's 1 Jun 2026 reading has no photo and was never sent.
    await userEvent.click(screen.getByRole('link', { name: 'Send the reading of 1 Jun 2026' }));

    const dialog = await screen.findByRole('dialog', { name: SEND_DIALOG });
    expect(within(dialog).queryByRole('checkbox')).not.toBeInTheDocument();
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
  });

  it('opens the preview again from Try again on a failed reading', async () => {
    await renderHome();

    // The mock history's 1 Sept 2026 reading failed to send.
    const failed = historyRows()[1];
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

  it('closes the preview and sends nothing when the user cancels', async () => {
    const received = recordSendRequests();
    const dialog = await openNewestPreview();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(received).toEqual([]);
    expect(historyRows()[0]).toHaveTextContent('Not sent');
  });

  it('shows a sent reading with the day it was sent and no way to send it again', async () => {
    await renderHome();

    // The mock history's 1 Aug 2026 reading was sent on 1 Aug 2026.
    const sent = historyRows().find((row) => row.textContent?.includes('1 Aug 2026'));
    expect(sent).toHaveTextContent(/Sent 1 Aug 2026/);
    expect(within(sent!).queryByRole('link', { name: /Send|Try again/ })).not.toBeInTheDocument();
  });
});
