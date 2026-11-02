import { boolean, number, object, type InferType } from 'yup';
import { readingDateSchema, readingDigitsSchema } from '@utils/readingUtils';

export const CreateReadingSchema = object({
  digits: readingDigitsSchema,
  date: readingDateSchema,
  // Set by the action once the photo is uploaded; a reading can be saved without one.
  photoId: number().integer().positive().optional(),
});

export type CreateReading = InferType<typeof CreateReadingSchema>;

// The reading a delete or a send names, as it arrives in the url: text, cast to the API's whole-number id.
export const ReadingParamsSchema = object({
  readingId: number().integer().positive().required(),
});

// Whether the reading's photo goes with its email. Always said, never assumed.
export const SendReadingSchema = object({
  attachPhoto: boolean().required(),
});

export type SendReading = InferType<typeof SendReadingSchema>;
