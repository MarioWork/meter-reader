import { useState } from 'react';
import { stopDigitsWorker } from '../digitsWorkerUtils';
import { readDigitsFromPhoto } from '../photoDigitsUtils';
import { TimeLimitError, withTimeLimit } from '../timeLimitUtils';
import { DigitsReadStatus, type PhotoCrop } from '../types';

// About 20 seconds, then the user types the number in: OCR on a slow phone or a hard photo can run for minutes.
export const READ_TIME_LIMIT_MS = 20_000;
const READ_FAILED_MESSAGE = 'Reading the number from the photo failed';

type DigitsOutcome = { status: DigitsReadStatus; digits: string };

// A failure to read is the same to the user as a photo with no number: they type it in. Running out of time says so,
// and stops Tesseract, which would otherwise keep reading in the background.
async function readDigitsInTime(photo: File, crop: PhotoCrop): Promise<DigitsOutcome> {
  try {
    const digits = await withTimeLimit(readDigitsFromPhoto(photo, crop), READ_TIME_LIMIT_MS);
    const status = digits ? DigitsReadStatus.IDLE : DigitsReadStatus.NOTHING_FOUND;

    return { status, digits };
  } catch (error) {
    if (error instanceof TimeLimitError) {
      void stopDigitsWorker();

      return { status: DigitsReadStatus.TIMED_OUT, digits: '' };
    }

    console.warn(READ_FAILED_MESSAGE, error);

    return { status: DigitsReadStatus.NOTHING_FOUND, digits: '' };
  }
}

// The reading in the photo, read on the phone from the part of the photo the user marked. onFound gets the digits
// to fill in; the user still checks them and can change them.
export function usePhotoDigits(onFound: (digits: string) => void) {
  const [digitsStatus, setDigitsStatus] = useState<DigitsReadStatus>(DigitsReadStatus.IDLE);

  async function readDigits(photo: File, crop: PhotoCrop) {
    setDigitsStatus(DigitsReadStatus.READING);

    const { status, digits } = await readDigitsInTime(photo, crop);

    setDigitsStatus(status);

    if (digits) onFound(digits);
  }

  function clearDigitsStatus() {
    setDigitsStatus(DigitsReadStatus.IDLE);
  }

  return { digitsStatus, readDigits, clearDigitsStatus };
}
