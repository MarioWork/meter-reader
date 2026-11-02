import { mixed, type InferType } from 'yup';
import { PHOTO_CONTENT_TYPE, PHOTO_MAX_BYTES } from '@utils/photoUtils';

// What the API keeps: a JPEG the phone already shrank, under 3 MB.
export const AddPhotoSchema = mixed<Blob>()
  .required()
  .test('is-jpeg', 'The photo must be a JPEG', (photo) => photo.type === PHOTO_CONTENT_TYPE)
  .test('fits-in-a-mail', 'The photo must be under 3 MB', (photo) => photo.size <= PHOTO_MAX_BYTES);

export type AddPhoto = InferType<typeof AddPhotoSchema>;
