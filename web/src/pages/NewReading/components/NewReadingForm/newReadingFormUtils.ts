import { object, string, type InferType } from 'yup';
import type { CreateReading } from '@services/readingService/readingService.type';
import type { NewReadingEmail } from '../../newReadingUtils';
import { todayAsIsoDate } from '@utils/dateUtils';
import { readingDigitsSchema } from '@utils/readingUtils';

const SUBJECT_MAX_LENGTH = 200;
const BODY_MAX_LENGTH = 5000;
const DATE_PLACEHOLDER = '{date}';
const READING_PLACEHOLDER = '{reading}';
// As the API spells the day in its emails: "3 November 2026", read as the calendar day it is.
const EMAIL_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

// A reading is always today's: the form has no date to pick. The email fields are optional: left empty, a send uses
// the API's own subject and message. Save ignores them.
export const newReadingFormSchema = object({
  digits: readingDigitsSchema,
  subject: string().trim().max(SUBJECT_MAX_LENGTH, 'Keep the subject under 200 characters.').default(''),
  body: string().trim().max(BODY_MAX_LENGTH, 'Keep the message under 5000 characters.').default(''),
});

export type NewReadingFormValues = InferType<typeof newReadingFormSchema>;

// The API's body template with today and the digits put in: exactly the message a send would go out with.
export function fillEmailBody(bodyTemplate: string, digits: string): string {
  const today = EMAIL_DATE_FORMAT.format(new Date(todayAsIsoDate()));

  return bodyTemplate.replace(DATE_PLACEHOLDER, today).replace(READING_PLACEHOLDER, digits.trim());
}

// The subject starts as the API's, and the message as the one it would send.
export const getInitialValues = (subject: string, bodyTemplate: string): NewReadingFormValues => ({
  digits: '',
  subject,
  body: fillEmailBody(bodyTemplate, ''),
});

export const toEmail = (values: NewReadingFormValues): NewReadingEmail => ({
  subject: values.subject.trim(),
  body: values.body.trim(),
});

export const toPayload = (values: NewReadingFormValues): CreateReading => ({
  digits: values.digits.trim(),
  date: todayAsIsoDate(),
});
