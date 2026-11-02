import { number, object, type InferType } from 'yup';
import { readingDateSchema, readingDigitsSchema } from '@utils/readingUtils';

export const CreateReadingSchema = object({
  digits: readingDigitsSchema,
  date: readingDateSchema,
  // Set by the action once the photo is uploaded; a reading can be saved without one.
  photoId: number().integer().positive().optional(),
});

export type CreateReading = InferType<typeof CreateReadingSchema>;

// The reading a delete names, as it arrives in the url: text, cast to the API's whole-number id.
export const DeleteReadingParamsSchema = object({
  readingId: number().integer().positive().required(),
});
