import { object, type InferType } from 'yup';
import type { CreateReading } from '@services/readingService/readingService.type';
import { todayAsIsoDate } from '@utils/dateUtils';
import { readingDateSchema, readingDigitsSchema } from '@utils/readingUtils';

export const newReadingFormSchema = object({
  digits: readingDigitsSchema,
  date: readingDateSchema,
});

export type NewReadingFormValues = InferType<typeof newReadingFormSchema>;

// The date starts on today; the user can pick another day.
export const getInitialValues = (): NewReadingFormValues => ({ digits: '', date: todayAsIsoDate() });

export const toPayload = (values: NewReadingFormValues): CreateReading => ({
  digits: values.digits.trim(),
  date: values.date,
});
