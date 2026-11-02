import type { Worker } from 'tesseract.js';
import { READING_DIGITS_MAX_LENGTH } from '@utils/readingUtils';
import { drawForReading } from './photoContrastUtils';

const LINE_BREAK = /\r?\n/;
const NOT_A_DIGIT = /\D/g;

function digitsOnly(line: string): string {
  return line.replace(NOT_A_DIGIT, '');
}

function longestFirst(digits: string, otherDigits: string): number {
  return otherDigits.length - digits.length;
}

// The digit window is the longest run of digits in the photo: a serial number or a scale mark is shorter. Spaces
// inside a line are dropped, since the gaps between a meter's wheels read as spaces. Every digit is kept, leading
// zeros and red digits included. Empty when nothing usable was found, so the user types it in.
export function pickReadingDigits(ocrText: string): string {
  const [longest = ''] = ocrText.split(LINE_BREAK).map(digitsOnly).sort(longestFirst);
  const isTooLong = longest.length > READING_DIGITS_MAX_LENGTH;

  if (isTooLong) return '';

  return longest;
}

// Served by the app itself (tesseractAssetsPlugin.ts in the web root) and precached by the service worker, so OCR
// works offline and the photo never leaves the phone. Never a CDN, which is Tesseract's default.
const TESSERACT_ASSETS_PATH = `${import.meta.env.BASE_URL}tesseract`;
const LANGUAGE = 'eng';
const DIGITS = '0123456789';

let digitsWorker: Promise<Worker> | undefined;

async function createDigitsWorker(): Promise<Worker> {
  // Loaded on the first photo only: Tesseract stays out of the main bundle.
  const { createWorker, OEM } = await import('tesseract.js');

  const worker = await createWorker(LANGUAGE, OEM.LSTM_ONLY, {
    workerPath: `${TESSERACT_ASSETS_PATH}/worker.min.js`,
    // A folder: Tesseract picks the core build this phone's WebAssembly supports.
    corePath: TESSERACT_ASSETS_PATH,
    langPath: TESSERACT_ASSETS_PATH,
    // A real worker file, not a blob: the CSP allows workers from the app's own origin.
    workerBlobURL: false,
    // The service worker already keeps the language data; a second copy in IndexedDB would only take space.
    cacheMethod: 'none',
  });

  await worker.setParameters({ tessedit_char_whitelist: DIGITS });

  return worker;
}

// One worker for the whole visit: loading the language data is the slow part, so the next photo reads faster.
function getDigitsWorker(): Promise<Worker> {
  digitsWorker ??= createDigitsWorker().catch((error: unknown) => {
    // Not kept, so the next photo tries again.
    digitsWorker = undefined;
    throw error;
  });

  return digitsWorker;
}

// OCR on the phone: the photo is turned black and white, then Tesseract reads it with digits only allowed. Gives
// back the reading's digits, or '' when none were found. Rejects when Tesseract cannot load or read.
export async function readDigitsFromPhoto(photo: Blob): Promise<string> {
  const [worker, canvas] = await Promise.all([getDigitsWorker(), drawForReading(photo)]);
  const { data } = await worker.recognize(canvas);

  return pickReadingDigits(data.text);
}
