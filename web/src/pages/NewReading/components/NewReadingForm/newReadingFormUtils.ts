import { object, string, type InferType } from 'yup';
import type { CreateReading } from '@services/readingService/readingService.type';
import type { EmailDefaultsApiModel } from '@app-types/models';
import type { NewReadingEmail } from '../../newReadingUtils';
import { formatEmailDate, todayAsIsoDate } from '@utils/dateUtils';
import {
  BODY_TOO_LONG_MESSAGE,
  EMAIL_BODY_MAX_LENGTH,
  EMAIL_SUBJECT_MAX_LENGTH,
  SUBJECT_TOO_LONG_MESSAGE,
} from '@utils/emailUtils';
import { fillMessageTemplate } from '@utils/messageTemplateUtils';
import { readingDigitsSchema } from '@utils/readingUtils';

// A reading is always today's: the form has no date to pick. The email fields are optional: left empty, a send uses
// the API's own subject and message. Save ignores them.
export const newReadingFormSchema = object({
  digits: readingDigitsSchema,
  subject: string().trim().max(EMAIL_SUBJECT_MAX_LENGTH, SUBJECT_TOO_LONG_MESSAGE).default(''),
  body: string().trim().max(EMAIL_BODY_MAX_LENGTH, BODY_TOO_LONG_MESSAGE).default(''),
});

export type NewReadingFormValues = InferType<typeof newReadingFormSchema>;

// The subject and message as the templates in Settings make them, with today and the digits put in: exactly the email
// a send would go out with.
export function fillEmail(emailDefaults: EmailDefaultsApiModel, digits: string): NewReadingEmail {
  const values = { reading: digits.trim(), date: formatEmailDate(todayAsIsoDate()) };

  return {
    subject: fillMessageTemplate(emailDefaults.subjectTemplate, values),
    body: fillMessageTemplate(emailDefaults.bodyTemplate, values),
  };
}

export const getInitialValues = (emailDefaults: EmailDefaultsApiModel): NewReadingFormValues => ({
  digits: '',
  ...fillEmail(emailDefaults, ''),
});

export const toEmail = (values: NewReadingFormValues): NewReadingEmail => ({
  subject: values.subject.trim(),
  body: values.body.trim(),
});

export const toPayload = (values: NewReadingFormValues): CreateReading => ({
  digits: values.digits.trim(),
  date: todayAsIsoDate(),
});
