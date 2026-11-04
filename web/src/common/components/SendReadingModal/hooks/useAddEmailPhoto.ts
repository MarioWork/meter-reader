import { useState, type ChangeEvent } from 'react';
import { useFetcher } from 'react-router';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { useFetcherFailure } from '@hooks/useFetcherFailure';
import { createFormData } from '@utils/formDataUtils';
import { PhotoShrinkError, shrinkPhoto } from '@utils/photoShrinkUtils';
import { ADD_PHOTO_INTENT, PHOTO_FIELD, SEND_INTENT_FIELD } from '../sendReadingModalUtils';

const FAILURE_MESSAGE = 'The photo could not be added. Please try again.';
const WITH_FILES = 'multipart/form-data';

// Adding a photo to a reading saved without one, from the send preview: shrunk on the device as soon as it is picked,
// as New reading's photo is, then sent to the preview's action with its own fetcher, apart from Send's, so a failed
// photo never reads as a failed send. A photo that cannot be shrunk says why, and nothing is sent.
export function useAddEmailPhoto() {
  const fetcher = useFetcher<JSONResponseUtil>();
  const failureMessage = useFetcherFailure(fetcher, FAILURE_MESSAGE);
  const [shrinkMessage, setShrinkMessage] = useState<string>();
  const [isShrinking, setIsShrinking] = useState(false);

  const isAddingPhoto = isShrinking || fetcher.state !== 'idle';

  const addPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0];

    if (!picked) return;

    setShrinkMessage(undefined);
    setIsShrinking(true);

    try {
      const photo = await shrinkPhoto(picked);
      const formData = createFormData({ [SEND_INTENT_FIELD]: ADD_PHOTO_INTENT, [PHOTO_FIELD]: photo });

      await fetcher.submit(formData, { method: HttpVerbsUtil.POST, encType: WITH_FILES });
    } catch (error) {
      if (!(error instanceof PhotoShrinkError)) throw error;

      setShrinkMessage(error.message);
    } finally {
      setIsShrinking(false);
    }
  };

  // Fire and forget from the input's change: the fetcher and the state above carry the outcome.
  const handlePhotoPicked = (event: ChangeEvent<HTMLInputElement>) => void addPhoto(event);

  return { addPhoto: handlePhotoPicked, isAddingPhoto, photoFailureMessage: shrinkMessage ?? failureMessage };
}
