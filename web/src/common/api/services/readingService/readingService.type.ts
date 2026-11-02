import { object, type InferType } from 'yup';
import { readingDateSchema, readingDigitsSchema } from '@utils/readingUtils';

export const CreateReadingSchema = object({
  digits: readingDigitsSchema,
  date: readingDateSchema,
});

export type CreateReading = InferType<typeof CreateReadingSchema>;
