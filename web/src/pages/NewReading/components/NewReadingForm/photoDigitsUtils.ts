import { READING_DIGITS_MAX_LENGTH } from '@utils/readingUtils';
import { getDigitsWorker } from './digitsWorkerUtils';
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

// OCR on the phone: the photo is turned black and white, then Tesseract reads it with digits only allowed. Gives
// back the reading's digits, or '' when none were found. Rejects when Tesseract cannot load or read.
export async function readDigitsFromPhoto(photo: Blob): Promise<string> {
  const [worker, canvas] = await Promise.all([getDigitsWorker(), drawForReading(photo)]);
  const { data } = await worker.recognize(canvas);

  return pickReadingDigits(data.text);
}
