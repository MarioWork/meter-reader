import { useState } from 'react';
import { readDigitsFromPhoto } from '../photoDigitsUtils';

const READ_FAILED_MESSAGE = 'Reading the number from the photo failed';

// A failure to read is the same to the user as a photo with no number: they type it in.
async function readDigitsOrNothing(photo: File): Promise<string> {
  try {
    return await readDigitsFromPhoto(photo);
  } catch (error) {
    console.warn(READ_FAILED_MESSAGE, error);

    return '';
  }
}

// The reading in the photo, read on the phone once the photo is picked. onFound gets the digits to fill in; the
// user still checks them and can change them.
export function usePhotoDigits(onFound: (digits: string) => void) {
  const [isFindingDigits, setIsFindingDigits] = useState(false);
  const [hasFoundNothing, setHasFoundNothing] = useState(false);

  async function readDigits(photo: File) {
    setIsFindingDigits(true);
    setHasFoundNothing(false);

    const digits = await readDigitsOrNothing(photo);

    setIsFindingDigits(false);

    if (digits) onFound(digits);
    else setHasFoundNothing(true);
  }

  function clearDigitsStatus() {
    setHasFoundNothing(false);
  }

  return { isFindingDigits, hasFoundNothing, readDigits, clearDigitsStatus };
}
