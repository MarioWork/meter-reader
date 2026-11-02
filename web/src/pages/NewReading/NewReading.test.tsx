import { http, HttpResponse } from 'msw/http';
import routes from '@application/routes';
import { READING_ROUTES_PATHS } from '@application/routes/routesUtils';
import { server, TEST_BASE_API_URL } from '@mocks/server';
import { deferred, renderRoutes, screen, userEvent, waitFor, within } from '@test-utils';
import { todayAsIsoDate } from '@utils/dateUtils';
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

function newestHistoryRow() {
  return within(screen.getByRole('table', { name: 'History' })).getAllByRole('row')[1];
}

it('starts the date on today', async () => {
  await renderNewReading();

  expect(screen.getByLabelText('Date')).toHaveValue(todayAsIsoDate());
});

it('saves the reading with its leading zeros and the chosen date, then shows it on Home', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await userEvent.clear(screen.getByLabelText('Date'));
  await userEvent.type(screen.getByLabelText('Date'), '2026-10-31');
  await save();

  await screen.findByRole('heading', { name: 'History' });
  const newest = within(screen.getByRole('table', { name: 'History' })).getAllByRole('row')[1];
  expect(newest).toHaveTextContent('31 Oct 2026');
  expect(newest).toHaveTextContent(HIGHER_THAN_LAST);
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

  await screen.findByRole('heading', { name: 'History' });
  expect(screen.getByRole('table', { name: 'History' })).toHaveTextContent(LOWER_THAN_LAST);
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

it('marks the field and sends nothing when the reading has something other than digits', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), '12.5');
  await save();

  expect(readingField()).toHaveAccessibleDescription('Use digits only, as the meter shows them');
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
});

it('marks the date and sends nothing when the day has not happened yet', async () => {
  await renderNewReading();

  await userEvent.type(readingField(), HIGHER_THAN_LAST);
  await userEvent.clear(screen.getByLabelText('Date'));
  await userEvent.type(screen.getByLabelText('Date'), '2999-01-01');
  await save();

  expect(screen.getByLabelText('Date')).toHaveAccessibleDescription('Pick today or a day before it');
  expect(screen.getByRole('heading', { name: 'New reading' })).toBeVisible();
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

  await screen.findByRole('heading', { name: 'History' });
  expect(newestHistoryRow()).toHaveTextContent('No photo');
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
  await screen.findByRole('heading', { name: 'History' });
  expect(newestHistoryRow()).toHaveTextContent('No photo');
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
