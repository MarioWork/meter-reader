import { useRef, useState } from 'react';
import type { PhotoCrop } from '../types';
import { usePhotoDigits } from './usePhotoDigits';
import { usePhotoPicker } from './usePhotoPicker';

// The Reading field, as the photo sees it: what is in it now, and a way to fill it in.
type DigitsField = {
  getDigits: () => string;
  fillDigits: (digits: string) => void;
};

// The photo for the new reading: shrunk once picked, then the user marks the digit window (or skips that), then the
// number in that part is read into the Reading field. A later photo may replace digits an earlier photo filled in,
// but never what the user typed.
export function useReadingPhoto({ getDigits, fillDigits }: DigitsField) {
  const { photo, previewUrl, isShrinking, errorMessage, pickPhoto, removePhoto } = usePhotoPicker();
  const [isCropping, setIsCropping] = useState(false);
  const digitsFromPhoto = useRef('');

  function fillFromPhoto(found: string) {
    const fieldDigits = getDigits();
    const isUntouched = fieldDigits === '' || fieldDigits === digitsFromPhoto.current;

    if (!isUntouched) return;

    digitsFromPhoto.current = found;
    fillDigits(found);
  }

  const { digitsStatus, readDigits, clearDigitsStatus } = usePhotoDigits(fillFromPhoto);

  async function pickAndCrop(picked: File) {
    setIsCropping(false);
    clearDigitsStatus();

    const shrunk = await pickPhoto(picked);

    setIsCropping(shrunk !== undefined);
  }

  // Reads the marked part of the photo; the photo itself is saved whole.
  async function readCrop(crop: PhotoCrop) {
    if (!photo) return;

    setIsCropping(false);
    await readDigits(photo, crop);
  }

  function removeAll() {
    removePhoto();
    setIsCropping(false);
    clearDigitsStatus();
  }

  return {
    photo,
    previewUrl,
    isShrinking,
    isCropping,
    errorMessage,
    digitsStatus,
    pickPhoto: pickAndCrop,
    readCrop,
    removePhoto: removeAll,
  };
}
