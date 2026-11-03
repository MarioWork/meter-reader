import { http, HttpResponse } from 'msw/http';
import { MessageDateFormatUtil } from '@app-types/utility';
import routes from '@application/routes';
import { READING_ROUTES_PATHS, SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { updateMockSettings } from '@mocks/handlers/settings/settingsMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import {
  deferred,
  findNotification,
  queryAllNotifications,
  renderRoutes,
  screen,
  userEvent,
  waitFor,
  within,
} from '@test-utils';
import { formatIsoDate, todayAsIsoDate } from '@utils/dateUtils';
import { formatMessageDate } from '@utils/messageDateFormatUtils';
import { readDigitsFromPhoto } from './components/NewReadingForm/photoDigitsUtils';
import { PhotoShrinkError, shrinkPhoto } from './components/NewReadingForm/photoShrinkUtils';

// jsdom has no canvas to shrink with: the shrink runs for real in the e2e test. Here it hands back a small JPEG.
vi.mock('./components/NewReadingForm/photoShrinkUtils', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  shrinkPhoto: vi.fn(),
}));

// Tesseract needs a canvas and WebAssembly: real OCR runs in the e2e test. Here the digits found are handed back.
vi.mock('./components/NewReadingForm/photoDigitsUtils', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  readDigitsFromPhoto: vi.fn(),
}));

const CAMERA_PHOTO = new File(['a big photo straight from the camera'], 'IMG_0042.HEIC', { type: 'image/heic' });
const SHRUNK_PHOTO = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], 'meter.jpg', { type: 'image/jpeg' });

// The newest reading in the mock history is 00529, read on 1 Oct 2026.
const LOWER_THAN_LAST = '00500';
const HIGHER_THAN_LAST = '00600';
const WARNING = /lower than your last reading/;
const READING_IN_PHOTO = '00612';
const MISREAD_IN_PHOTO = '00812';
// Today as the email writes it in the mock settings' format: "3 November 2026".
const TODAY_IN_EMAIL = formatMessageDate(todayAsIsoDate(), MessageDateFormatUtil.LONG_MONTH);
const FINDING_DIGITS_STATUS = 'Reading the number from the photo…';
const NOTHING_FOUND_STATUS = 'No number found in the photo. Type it in.';

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

beforeEach(() => {
  vi.mocked(shrinkPhoto).mockResolvedValue(SHRUNK_PHOTO);
  vi.mocked(readDigitsFromPhoto).mockResolvedValue('');
});

// A reading saved without a photo has no View photo in its "⋯" menu.
async function expectNewestHasNoPhoto() {
  await userEvent.click(within(newestHistoryRow()).getByRole('button', { name: /More actions/ }));

  expect(await screen.findByRole('menuitem', { name: 'Delete' })).toBeVisible();
  expect(screen.queryByRole('menuitem', { name: 'View photo' })).not.toBeInTheDocument();
}

function newestHistoryRow() {
  return screen.getByRole('region', { name: 'Last reading' });
}

it("has no date to pick: a reading is always today's", async () => {
  await renderNewReading();

  expect(screen.queryByLabelText('Date')).not.toBeInTheDocument();
});

it("saves the reading with its leading zeros as today's, then shows it on Home", async () => {
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await save();

  await screen.findByRole('heading', { name: 'Water Readings' });
  const newest = newestHistoryRow();
  expect(newest).toHaveTextContent(formatIsoDate(todayAsIsoDate()));
  expect(newest).toHaveTextContent(HIGHER_THAN_LAST);
  expect(await findNotification('Reading saved')).toBeVisible();
});

it('saves and sends the reading in one go with Send reading, then shows it as sent on Home', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await userEvent.click(screen.getByRole('button', { name: 'Send reading' }));

  await screen.findByRole('heading', { name: 'Water Readings' });
  expect(await findNotification('Reading saved and sent')).toBeVisible();
  expect(newestHistoryRow()).toHaveTextContent(HIGHER_THAN_LAST);
  expect(newestHistoryRow()).toHaveTextContent(/sent/i);
});

it('shows who the email is from and to, with the subject ready to edit', async () => {
  await renderNewReading();

  const email = screen.getByRole('group', { name: 'Email' });
  expect(email).toHaveTextContent('Fromme@hotmail.example');
  expect(email).toHaveTextContent('Toreadings@water-provider.example');
  expect(within(email).getByRole('textbox', { name: 'Subject' })).toHaveValue(`Meter reading ${TODAY_IN_EMAIL}`);
  expect(within(email).getByRole('textbox', { name: 'Message' })).toHaveValue(`Date: ${TODAY_IN_EMAIL}\nReading: `);
});

it('fills the message with the reading as it is typed, and sends the edited subject with it', async () => {
  const received: unknown[] = [];
  server.use(
    http.post(`${TEST_BASE_API_URL}/readings/:id/send`, async ({ request }) => {
      received.push(await request.clone().json());
    }),
  );
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  const subject = screen.getByRole('textbox', { name: 'Subject' });
  await userEvent.clear(subject);
  await userEvent.type(subject, 'Water meter reading');
  await userEvent.click(screen.getByRole('button', { name: 'Send reading' }));

  await screen.findByRole('heading', { name: 'Water Readings' });
  expect(received).toEqual([
    {
      attachPhoto: false,
      subject: 'Water meter reading',
      body: `Date: ${TODAY_IN_EMAIL}\nReading: ${HIGHER_THAN_LAST}`,
    },
  ]);
});

it('fills the subject and the message from the templates saved in Settings, following the reading', async () => {
  updateMockSettings({ subjectTemplate: 'Leitura {reading} {date}', bodyTemplate: 'Leitura - {reading} - {date}' });
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);

  expect(screen.getByRole('textbox', { name: 'Subject' })).toHaveValue(`Leitura ${HIGHER_THAN_LAST} ${TODAY_IN_EMAIL}`);
  expect(screen.getByRole('textbox', { name: 'Message' })).toHaveValue(
    `Leitura - ${HIGHER_THAN_LAST} - ${TODAY_IN_EMAIL}`,
  );
});

it('writes the date in the date format saved in Settings', async () => {
  updateMockSettings({ subjectTemplate: 'Leitura {date}', dateFormat: MessageDateFormatUtil.ISO });
  await renderNewReading();

  expect(screen.getByRole('textbox', { name: 'Subject' })).toHaveValue(`Leitura ${todayAsIsoDate()}`);
});

it('keeps a subject the user edited, even when the reading changes', async () => {
  updateMockSettings({ subjectTemplate: 'Leitura {reading}' });
  await renderNewReading();
  const subject = screen.getByRole('textbox', { name: 'Subject' });

  await userEvent.type(readingField(), '00');
  expect(subject).toHaveValue('Leitura 00');
  await userEvent.clear(subject);
  await userEvent.type(subject, 'Meter');
  await userEvent.type(readingField(), '600');

  expect(subject).toHaveValue('Meter');
});

it('keeps a message the user edited, even when the reading changes', async () => {
  await renderNewReading();
  const message = screen.getByRole('textbox', { name: 'Message' });

  await userEvent.type(readingField(), '00');
  expect(message).toHaveValue(`Date: ${TODAY_IN_EMAIL}\nReading: 00`);
  await userEvent.clear(message);
  await userEvent.type(message, 'Hello');
  await userEvent.type(readingField(), '600');

  expect(message).toHaveValue('Hello');
});

it("turns Send reading off and says why while the provider's address is not set, but still saves", async () => {
  updateMockSettings({ to: null });
  await renderNewReading();

  expect(screen.getByRole('button', { name: 'Send reading' })).toBeDisabled();
  expect(screen.getByText(/Set the provider's address in/)).toHaveTextContent(
    "Set the provider's address in Settings.",
  );
  expect(screen.getByRole('link', { name: 'Settings' })).toHaveAttribute('href', SETTINGS_ROUTES_PATHS.BASE);

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await save();

  expect(await findNotification('Reading saved')).toBeVisible();
});

it('goes back Home without saving when the user cancels', async () => {
  let isAnythingPosted = false;
  server.use(
    http.post(`${TEST_BASE_API_URL}/*`, () => {
      isAnythingPosted = true;
      return HttpResponse.json({}, { status: 201 });
    }),
  );
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await userEvent.click(screen.getByRole('link', { name: 'Cancel' }));

  expect(await screen.findByRole('heading', { name: 'Water Readings' })).toBeVisible();
  expect(isAnythingPosted).toBe(false);
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

  await screen.findByRole('heading', { name: 'Water Readings' });
  expect(screen.getByRole('main')).toHaveTextContent(LOWER_THAN_LAST);
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

it('keeps only the digits of what is typed in the reading field', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), 'a0b0.5 2x9');

  expect(readingField()).toHaveValue('00529');
});

it('marks the field and sends nothing when the reading is left empty', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), 'abc');
  await save();

  expect(readingField()).toHaveValue('');
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
  // The failure shows next to the form only, not as a toast too.
  expect(queryAllNotifications()).toHaveLength(0);
});

it('puts the cursor in the reading field when the user skips the photo', async () => {
  await renderNewReading();

  await userEvent.click(screen.getByRole('button', { name: 'Skip photo, type it' }));

  expect(readingField()).toHaveFocus();
});

it('offers the camera and the files on the device for the photo', async () => {
  await renderNewReading();

  expect(screen.getByLabelText('Take a photo')).toHaveAttribute('capture', 'environment');
  expect(screen.getByLabelText('Take a photo')).toHaveAttribute('accept', 'image/*');
  expect(screen.getByLabelText('Choose a photo')).not.toHaveAttribute('capture');
  expect(screen.getByLabelText('Choose a photo')).toHaveAttribute('accept', 'image/*');
});

it('shrinks the picked photo and shows it before the save', async () => {
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);

  expect(await screen.findByRole('img', { name: 'The meter, as it will be saved' })).toHaveAttribute(
    'src',
    expect.stringMatching(/^data:image\/jpeg;base64,/),
  );
});

it('saves the reading without a photo once the photo is removed', async () => {
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Choose a photo'), CAMERA_PHOTO);
  await userEvent.click(await screen.findByRole('button', { name: 'Remove photo' }));
  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await save();

  await screen.findByRole('heading', { name: 'Water Readings' });
  await expectNewestHasNoPhoto();
});

it('says why a file cannot be used and still saves the reading without it', async () => {
  vi.mocked(shrinkPhoto).mockRejectedValueOnce(new PhotoShrinkError('This file is not a photo the app can read.'));
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Choose a photo'), CAMERA_PHOTO);

  expect(screen.getByLabelText('Choose a photo')).toHaveAccessibleDescription(
    'This file is not a photo the app can read.',
  );
  expect(screen.getByLabelText('Choose a photo')).toBeInvalid();
  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await save();
  await screen.findByRole('heading', { name: 'Water Readings' });
  await expectNewestHasNoPhoto();
});

it('reads the number from the picked photo into the reading field, saying so while it works', async () => {
  const digitsFound = deferred<string>();
  vi.mocked(readDigitsFromPhoto).mockReturnValueOnce(digitsFound.promise);
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);

  expect(await screen.findByText(FINDING_DIGITS_STATUS)).toHaveRole('status');
  expect(readDigitsFromPhoto).toHaveBeenCalledWith(SHRUNK_PHOTO);
  digitsFound.resolve(READING_IN_PHOTO);
  await waitFor(() => expect(readingField()).toHaveValue(READING_IN_PHOTO));
  expect(screen.queryByText(FINDING_DIGITS_STATUS)).not.toBeInTheDocument();
});

it('lets the user fix the number read from the photo', async () => {
  vi.mocked(readDigitsFromPhoto).mockResolvedValueOnce(MISREAD_IN_PHOTO);
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);
  await waitFor(() => expect(readingField()).toHaveValue(MISREAD_IN_PHOTO));
  await userEvent.clear(readingField());
  await userEvent.type(readingField(), READING_IN_PHOTO);

  expect(readingField()).toHaveValue(READING_IN_PHOTO);
});

it('leaves the reading field empty for typing when the photo shows no number', async () => {
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);

  expect(await screen.findByText(NOTHING_FOUND_STATUS)).toBeVisible();
  expect(readingField()).toHaveValue('');
});

it('leaves the reading field empty for typing when reading the photo fails', async () => {
  vi.mocked(readDigitsFromPhoto).mockRejectedValueOnce(new Error('The OCR engine did not load'));
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);

  expect(await screen.findByText(NOTHING_FOUND_STATUS)).toBeVisible();
  expect(readingField()).toHaveValue('');
});

it('keeps what the user typed while the photo was being read', async () => {
  const digitsFound = deferred<string>();
  vi.mocked(readDigitsFromPhoto).mockReturnValueOnce(digitsFound.promise);
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);
  await screen.findByText(FINDING_DIGITS_STATUS);
  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  digitsFound.resolve(READING_IN_PHOTO);

  await waitFor(() => expect(screen.queryByText(FINDING_DIGITS_STATUS)).not.toBeInTheDocument());
  expect(readingField()).toHaveValue(HIGHER_THAN_LAST);
});

it('reads the next photo over the number the last photo filled in', async () => {
  vi.mocked(readDigitsFromPhoto).mockResolvedValueOnce(MISREAD_IN_PHOTO).mockResolvedValueOnce(READING_IN_PHOTO);
  await renderNewReading();

  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);
  await waitFor(() => expect(readingField()).toHaveValue(MISREAD_IN_PHOTO));
  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);

  await waitFor(() => expect(readingField()).toHaveValue(READING_IN_PHOTO));
});
