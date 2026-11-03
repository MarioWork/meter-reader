import { boolean, number, object, string, type InferType } from 'yup';
import { costCentsSchema } from '@utils/costUtils';
import {
  BODY_TOO_LONG_MESSAGE,
  EMAIL_BODY_MAX_LENGTH,
  EMAIL_SUBJECT_MAX_LENGTH,
  SUBJECT_TOO_LONG_MESSAGE,
} from '@utils/emailUtils';
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

// The API's limits on an edited subject and body.
const emailSubjectSchema = string()
  .trim()
  .required('Write a subject.')
  .max(EMAIL_SUBJECT_MAX_LENGTH, SUBJECT_TOO_LONG_MESSAGE);
const emailBodySchema = string().trim().required('Write a message.').max(EMAIL_BODY_MAX_LENGTH, BODY_TOO_LONG_MESSAGE);

// The subject and body as the user left them in the preview. Shared by the preview's form and the send action.
export const EmailTextSchema = object({
  subject: emailSubjectSchema,
  body: emailBodySchema,
});

export type EmailText = InferType<typeof EmailTextSchema>;

// Whether the reading's photo goes with its email, always said, never assumed. The subject and body are optional:
// left out, the API uses its own (a send straight from New reading).
export const SendReadingSchema = object({
  attachPhoto: boolean().required(),
  subject: emailSubjectSchema.optional(),
  body: emailBodySchema.optional(),
});

export type SendReading = InferType<typeof SendReadingSchema>;

// What can change on a saved reading: its cost, in euro cents, or null to remove it. Always said, never left out.
export const UpdateReadingSchema = object({
  costCents: costCentsSchema.nullable().defined(),
});

export type UpdateReading = InferType<typeof UpdateReadingSchema>;
