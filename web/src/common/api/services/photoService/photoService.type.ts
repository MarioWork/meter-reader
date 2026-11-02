import { mixed, type InferType } from 'yup';
import { PHOTO_CONTENT_TYPE, PHOTO_MAX_BYTES, PHOTO_MAX_MEGABYTES } from '@utils/photoUtils';

// What the API keeps: a JPEG the phone already shrank, under 3 MB.
export const AddPhotoSchema = mixed<Blob>()
  .required()
  .test('is-jpeg', 'The photo must be a JPEG', (photo) => photo.type === PHOTO_CONTENT_TYPE)
  .test(
    'fits-in-a-mail',
    `The photo must be under ${PHOTO_MAX_MEGABYTES} MB`,
    (photo) => photo.size <= PHOTO_MAX_BYTES,
  );

export type AddPhoto = InferType<typeof AddPhotoSchema>;
