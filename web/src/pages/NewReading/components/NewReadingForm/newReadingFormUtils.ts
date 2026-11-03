import { object, string, type InferType } from 'yup';
import type { CreateReading } from '@services/readingService/readingService.type';
import type { NewReadingEmail } from '../../newReadingUtils';
import { todayAsIsoDate } from '@utils/dateUtils';
import { readingDateSchema, readingDigitsSchema } from '@utils/readingUtils';

const SUBJECT_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 5000;

// The email fields are optional: left empty, a send uses the API's own subject and message. Save ignores them.
export const newReadingFormSchema = object({
  digits: readingDigitsSchema,
  date: readingDateSchema,
  subject: string().trim().max(SUBJECT_MAX_LENGTH, 'Keep the subject under 200 characters.').default(''),
  body: string().trim().max(BODY_MAX_LENGTH, 'Keep the message under 5000 characters.').default(''),
});

export type NewReadingFormValues = InferType<typeof newReadingFormSchema>;

// The date starts on today; the user can pick another day. The subject starts as the API's.
export const getInitialValues = (subject: string): NewReadingFormValues => ({
  digits: '',
  date: todayAsIsoDate(),
  subject,
  body: '',
});

export const toEmail = (values: NewReadingFormValues): NewReadingEmail => ({
  subject: values.subject.trim(),
  body: values.body.trim(),
});

export const toPayload = (values: NewReadingFormValues): CreateReading => ({
  digits: values.digits.trim(),
  date: values.date,
});
