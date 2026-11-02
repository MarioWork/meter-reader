import { useRef } from 'react';
import { usePhotoDigits } from './usePhotoDigits';
import { usePhotoPicker } from './usePhotoPicker';

// The Reading field, as the photo sees it: what is in it now, and a way to fill it in.
type DigitsField = {
  getDigits: () => string;
  fillDigits: (digits: string) => void;
};

// The photo for the new reading: shrunk once picked, then the number in it is read into the Reading field. A later
// photo may replace digits an earlier photo filled in, but never what the user typed.
export function useReadingPhoto({ getDigits, fillDigits }: DigitsField) {
  const { photo, previewUrl, isShrinking, errorMessage, pickPhoto, removePhoto } = usePhotoPicker();
  const digitsFromPhoto = useRef('');

  function fillFromPhoto(found: string) {
    const fieldDigits = getDigits();
    const isUntouched = fieldDigits === '' || fieldDigits === digitsFromPhoto.current;

    if (!isUntouched) return;

    digitsFromPhoto.current = found;
    fillDigits(found);
  }

  const { isFindingDigits, hasFoundNothing, readDigits, clearDigitsStatus } = usePhotoDigits(fillFromPhoto);

  async function pickAndRead(picked: File) {
    const shrunk = await pickPhoto(picked);

    if (shrunk) await readDigits(shrunk);
  }

  function removeAll() {
    removePhoto();
    clearDigitsStatus();
  }

  return {
    photo,
    previewUrl,
    isShrinking,
    errorMessage,
    isFindingDigits,
    hasFoundNothing,
    pickPhoto: pickAndRead,
    removePhoto: removeAll,
  };
}
