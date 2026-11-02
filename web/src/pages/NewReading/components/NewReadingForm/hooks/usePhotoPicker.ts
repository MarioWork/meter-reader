import { useState } from 'react';
import { PhotoShrinkError, readAsDataUrl, shrinkPhoto } from '../photoShrinkUtils';

type PickedPhoto = { file: File; previewUrl: string };

// The photo for the new reading: shrunk on the phone as soon as it is picked, so the save sends the small one.
export function usePhotoPicker() {
  const [picked, setPicked] = useState<PickedPhoto>();
  const [isShrinking, setIsShrinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  async function pickPhoto(photo: File) {
    setIsShrinking(true);
    setErrorMessage(undefined);

    try {
      const shrunk = await shrinkPhoto(photo);
      const previewUrl = await readAsDataUrl(shrunk);

      setPicked({ file: shrunk, previewUrl });
    } catch (error) {
      if (!(error instanceof PhotoShrinkError)) throw error;

      setPicked(undefined);
      setErrorMessage(error.message);
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
