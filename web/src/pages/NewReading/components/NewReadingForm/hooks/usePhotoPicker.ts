import { useState } from 'react';
import { PhotoShrinkError, readAsDataUrl, shrinkPhoto } from '@utils/photoShrinkUtils';
import { TimeLimitError, withTimeLimit } from '../timeLimitUtils';

// About 15 seconds to shrink the photo and make its preview, then the user is told to try again: a photo the
// browser chokes on would otherwise spin for ever.
export const SHRINK_TIME_LIMIT_MS = 15_000;
const SHRINK_TIMED_OUT_MESSAGE = "Couldn't get the photo ready. Try again or pick another.";

type PickedPhoto = { file: File; previewUrl: string };

async function shrinkWithPreview(photo: File): Promise<PickedPhoto> {
  const file = await shrinkPhoto(photo);
  const previewUrl = await readAsDataUrl(file);

  return { file, previewUrl };
}

// What the picker says about a photo it could not get ready, or undefined for a fault that is not the photo's.
function messageForUser(error: unknown): string | undefined {
  if (error instanceof PhotoShrinkError) return error.message;
  if (error instanceof TimeLimitError) return SHRINK_TIMED_OUT_MESSAGE;

  return undefined;
}

// The photo for the new reading: shrunk on the phone as soon as it is picked, so the save sends the small one.
// pickPhoto hands back the shrunk photo, or nothing when the file could not be used in time.
export function usePhotoPicker() {
  const [picked, setPicked] = useState<PickedPhoto>();
  const [isShrinking, setIsShrinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function pickPhoto(photo: File): Promise<File | undefined> {
    setIsShrinking(true);
    setErrorMessage(undefined);

    try {
      const shrunk = await withTimeLimit(shrinkWithPreview(photo), SHRINK_TIME_LIMIT_MS);

      setPicked(shrunk);

      return shrunk.file;
    } catch (error) {
      const message = messageForUser(error);

      if (message === undefined) throw error;

      setPicked(undefined);
      setErrorMessage(message);

      return undefined;
    } finally {
      setIsShrinking(false);
    }
  }

  function removePhoto() {
    setPicked(undefined);
    setErrorMessage(undefined);
  }

  return { photo: picked?.file, previewUrl: picked?.previewUrl, isShrinking, errorMessage, pickPhoto, removePhoto };
}
