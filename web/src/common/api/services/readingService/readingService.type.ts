import { number, object, type InferType } from 'yup';
import { readingDateSchema, readingDigitsSchema } from '@utils/readingUtils';

export const CreateReadingSchema = object({
  digits: readingDigitsSchema,
  date: readingDateSchema,
});

export type CreateReading = InferType<typeof CreateReadingSchema>;

// The reading a delete names, as it arrives in the url: text, cast to the API's whole-number id.
export const DeleteReadingParamsSchema = object({
  readingId: number().integer().positive().required(),
});
