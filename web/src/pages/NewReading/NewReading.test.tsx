import { http, HttpResponse } from 'msw/http';
import { MessageDateFormatUtil } from '@app-types/utility';
import routes from '@application/routes';
import { READING_ROUTES_PATHS, SETTINGS_ROUTES_PATHS } from '@application/routes/routesUtils';
import { updateMockSettings } from '@mocks/handlers/settings/settingsMockState';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import {
  act,
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
import { READ_TIME_LIMIT_MS } from './components/NewReadingForm/hooks/usePhotoDigits';
import { SHRINK_TIME_LIMIT_MS } from './components/NewReadingForm/hooks/usePhotoPicker';
import { WHOLE_PHOTO } from './components/NewReadingForm/photoCropUtils';
import { readDigitsFromPhoto } from './components/NewReadingForm/photoDigitsUtils';
import { PhotoShrinkError, shrinkPhoto } from '@utils/photoShrinkUtils';

// jsdom has no canvas to shrink with: the shrink runs for real in the e2e test. Here it hands back a small JPEG.
vi.mock('@utils/photoShrinkUtils', async (importOriginal) => ({
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
const READ_TIMED_OUT_STATUS = "Couldn't read the number from the photo. Type it in.";
const SHRINK_TIMED_OUT_MESSAGE = "Couldn't get the photo ready. Try again or pick another.";
const SHRINKING_STATUS = 'Shrinking the photo…';
const CROP_STEP = 'Mark the digit window';
const SKIP_CROP = 'Skip crop, read whole photo';
const CLOSE_TO_DIGITS = 6;
const ALMOST_THE_LIMIT_MS = 1000;

async function renderNewReading() {
  renderRoutes(routes, { initialEntries: [READING_ROUTES_PATHS.NEW] });
  await screen.findByRole('heading', { name: 'New reading' });
}

function readingField() {
  return screen.getByRole('textbox', { name: 'Reading' });
}

async function save() {
  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
}

async function takePhoto() {
  await userEvent.upload(screen.getByLabelText('Take a photo'), CAMERA_PHOTO);
}

function cropStep() {
  return screen.getByRole('group', { name: CROP_STEP });
}

async function takePhotoToCrop() {
  await takePhoto();
  await screen.findByRole('group', { name: CROP_STEP });
}

async function clickCropButton(name: string) {
  await userEvent.click(within(cropStep()).getByRole('button', { name }));
}

async function pressCropButton(name: string) {
  within(cropStep()).getByRole('button', { name }).focus();
  await userEvent.keyboard('{Enter}');
}

// The crop step, skipped: the whole photo is read, as before there was a crop.
async function takePhotoAndReadIt() {
  await takePhoto();
  await userEvent.click(await screen.findByRole('button', { name: SKIP_CROP }));
}

type BoxSides = Record<'x' | 'y' | 'width' | 'height', number>;

// The part of the photo OCR was handed: turned by `turn`, cut to `box` (fractions of the turned photo).
function expectReadPart(turn: number, box: BoxSides) {
  const closeBox = Object.fromEntries(
    Object.entries(box).map(([side, value]) => [side, expect.closeTo(value, CLOSE_TO_DIGITS)]),
  );

  expect(readDigitsFromPhoto).toHaveBeenCalledWith(SHRUNK_PHOTO, { turn, box: closeBox });
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

it('saves and sends the reading in one go with Send, then shows it as sent on Home', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));

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
  await userEvent.click(screen.getByRole('button', { name: 'Send' }));

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

it("turns Send off and says why while the provider's address is not set, but still saves", async () => {
  updateMockSettings({ to: null });
  await renderNewReading();

  expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
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

  await takePhotoAndReadIt();

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

describe('marking the digit window', () => {
  it('asks for the digit window once the photo is ready, before reading the number', async () => {
    await renderNewReading();

    await takePhoto();

    expect(await screen.findByRole('group', { name: CROP_STEP })).toBeVisible();
    expect(within(cropStep()).getByRole('img', { name: 'The meter, turned as it will be read' })).toHaveAttribute(
      'src',
      expect.stringMatching(/^data:image\/jpeg;base64,/),
    );
    expect(readDigitsFromPhoto).not.toHaveBeenCalled();
  });

  it('reads only the marked part, turned, and keeps the whole photo to save', async () => {
    vi.mocked(readDigitsFromPhoto).mockResolvedValueOnce(READING_IN_PHOTO);
    await renderNewReading();
    await takePhotoToCrop();

    // The box starts as a strip across the middle; a quarter turn right stands it on end, over the same part.
    await clickCropButton('Rotate right');
    await clickCropButton('Make box wider');
    await clickCropButton('Move box down');
    await clickCropButton('Read the number');

    // OCR gets the shrunk photo itself, the one the save uploads, with the part to read beside it.
    expectReadPart(90, { x: 0.375, y: 0.25, width: 0.25, height: 0.6 });
    await waitFor(() => expect(readingField()).toHaveValue(READING_IN_PHOTO));
    expect(screen.queryByRole('group', { name: CROP_STEP })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'The meter, as it will be saved' })).toBeVisible();
  });

  it('turns the photo a quarter each way with Rotate left and Rotate right', async () => {
    await renderNewReading();
    await takePhotoToCrop();

    await clickCropButton('Rotate left');
    await clickCropButton('Rotate left');
    await clickCropButton('Rotate right');
    await clickCropButton('Read the number');

    expectReadPart(270, { x: 0.4, y: 0.2, width: 0.2, height: 0.6 });
  });

  it('moves and sizes the box from the keyboard alone, then puts focus in the reading field', async () => {
    await renderNewReading();
    await takePhotoToCrop();

    await pressCropButton('Move box up');
    await pressCropButton('Make box taller');
    await pressCropButton('Read the number');

    expectReadPart(0, { x: 0.2, y: 0.325, width: 0.6, height: 0.25 });
    expect(readingField()).toHaveFocus();
  });

  it('names every button that moves or sizes the box', async () => {
    await renderNewReading();
    await takePhotoToCrop();

    const moves = within(cropStep()).getByRole('group', { name: 'Move the box' });
    const sizes = within(cropStep()).getByRole('group', { name: 'Size the box' });

    for (const name of ['Move box left', 'Move box up', 'Move box down', 'Move box right']) {
      expect(within(moves).getByRole('button', { name })).toBeEnabled();
    }
    for (const name of ['Make box narrower', 'Make box wider', 'Make box shorter', 'Make box taller']) {
      expect(within(sizes).getByRole('button', { name })).toBeEnabled();
    }
  });

  it('reads the whole photo, unturned, when the crop is skipped', async () => {
    await renderNewReading();

    await takePhotoAndReadIt();

    expect(readDigitsFromPhoto).toHaveBeenCalledWith(SHRUNK_PHOTO, WHOLE_PHOTO);
  });
});

it('reads the number from the picked photo into the reading field, saying so while it works', async () => {
  const digitsFound = deferred<string>();
  vi.mocked(readDigitsFromPhoto).mockReturnValueOnce(digitsFound.promise);
  await renderNewReading();

  await takePhotoAndReadIt();

  expect(await screen.findByText(FINDING_DIGITS_STATUS)).toHaveRole('status');
  digitsFound.resolve(READING_IN_PHOTO);
  await waitFor(() => expect(readingField()).toHaveValue(READING_IN_PHOTO));
  expect(screen.queryByText(FINDING_DIGITS_STATUS)).not.toBeInTheDocument();
});

it('lets the user fix the number read from the photo', async () => {
  vi.mocked(readDigitsFromPhoto).mockResolvedValueOnce(MISREAD_IN_PHOTO);
  await renderNewReading();

  await takePhotoAndReadIt();
  await waitFor(() => expect(readingField()).toHaveValue(MISREAD_IN_PHOTO));
  await userEvent.clear(readingField());
  await userEvent.type(readingField(), READING_IN_PHOTO);

  expect(readingField()).toHaveValue(READING_IN_PHOTO);
});

it('leaves the reading field empty for typing when the photo shows no number', async () => {
  await renderNewReading();

  await takePhotoAndReadIt();

  expect(await screen.findByText(NOTHING_FOUND_STATUS)).toBeVisible();
  expect(readingField()).toHaveValue('');
});

it('leaves the reading field empty for typing when reading the photo fails', async () => {
  vi.mocked(readDigitsFromPhoto).mockRejectedValueOnce(new Error('The OCR engine did not load'));
  await renderNewReading();

  await takePhotoAndReadIt();

  expect(await screen.findByText(NOTHING_FOUND_STATUS)).toBeVisible();
  expect(readingField()).toHaveValue('');
});

it('keeps what the user typed while the photo was being read', async () => {
  const digitsFound = deferred<string>();
  vi.mocked(readDigitsFromPhoto).mockReturnValueOnce(digitsFound.promise);
  await renderNewReading();

  await takePhotoAndReadIt();
  await screen.findByText(FINDING_DIGITS_STATUS);
  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  digitsFound.resolve(READING_IN_PHOTO);

  await waitFor(() => expect(screen.queryByText(FINDING_DIGITS_STATUS)).not.toBeInTheDocument());
  expect(readingField()).toHaveValue(HIGHER_THAN_LAST);
});

it('reads the next photo over the number the last photo filled in', async () => {
  vi.mocked(readDigitsFromPhoto).mockResolvedValueOnce(MISREAD_IN_PHOTO).mockResolvedValueOnce(READING_IN_PHOTO);
  await renderNewReading();

  await takePhotoAndReadIt();
  await waitFor(() => expect(readingField()).toHaveValue(MISREAD_IN_PHOTO));
  await takePhotoAndReadIt();

  await waitFor(() => expect(readingField()).toHaveValue(READING_IN_PHOTO));
});

describe('time limits', () => {
  beforeEach(() => {
    // Real time still runs (the mocks' delays, the router); each test jumps the clock up to a limit.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stops getting the photo ready after the time limit and says so next to the photo', async () => {
    vi.mocked(shrinkPhoto).mockReturnValueOnce(new Promise(() => {}));
    await renderNewReading();

    await takePhoto();
    expect(await screen.findByText(SHRINKING_STATUS)).toHaveRole('status');
    await act(() => vi.advanceTimersByTimeAsync(SHRINK_TIME_LIMIT_MS));

    expect(screen.getByRole('alert')).toHaveTextContent(SHRINK_TIMED_OUT_MESSAGE);
    expect(screen.getByLabelText('Take a photo')).toHaveAccessibleDescription(SHRINK_TIMED_OUT_MESSAGE);
    expect(screen.getByLabelText('Take a photo')).toBeEnabled();
    expect(screen.queryByText(SHRINKING_STATUS)).not.toBeInTheDocument();
  });

  it('stops reading the number after the time limit, says so, and leaves the field to type in and save', async () => {
    vi.mocked(readDigitsFromPhoto).mockReturnValueOnce(new Promise(() => {}));
    await renderNewReading();

    await takePhotoAndReadIt();
    await screen.findByText(FINDING_DIGITS_STATUS);
    await act(() => vi.advanceTimersByTimeAsync(READ_TIME_LIMIT_MS));

    expect(screen.getByText(READ_TIMED_OUT_STATUS)).toHaveRole('status');
    expect(screen.getByRole('img', { name: 'The meter, as it will be saved' })).toBeVisible();
    expect(readingField()).toHaveValue('');
    await userEvent.type(readingField(), HIGHER_THAN_LAST);
    expect(readingField()).toHaveValue(HIGHER_THAN_LAST);
    // Saving with a photo cannot run in jsdom (undici refuses jsdom's File when the router reads the form data):
    // newReadingActions.test.ts and the e2e suite cover the upload.
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('keeps reading a slow photo that finishes within the time limit', async () => {
    const digitsFound = deferred<string>();
    vi.mocked(readDigitsFromPhoto).mockReturnValueOnce(digitsFound.promise);
    await renderNewReading();

    await takePhotoAndReadIt();
    await act(() => vi.advanceTimersByTimeAsync(READ_TIME_LIMIT_MS - ALMOST_THE_LIMIT_MS));
    digitsFound.resolve(READING_IN_PHOTO);

    await waitFor(() => expect(readingField()).toHaveValue(READING_IN_PHOTO));
    expect(screen.queryByText(READ_TIMED_OUT_STATUS)).not.toBeInTheDocument();
  });
});
