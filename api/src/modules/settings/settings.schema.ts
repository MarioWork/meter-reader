import { z } from 'zod';
import { findUnknownPlaceholder, toUnknownPlaceholderMessage } from './settings.template.ts';
import { MESSAGE_DATE_FORMATS } from './settings.type.ts';

// The longest address an email can carry (RFC 5321's path limit, less its angle brackets).
const EMAIL_MAX_LENGTH = 254;
// Under the limits of an edited subject and body on a send (200 and 5000, readings.schema.ts), with room for the
// placeholders to grow once filled in, so a filled-in email still passes them.
const SUBJECT_TEMPLATE_MAX_LENGTH = 150;
const BODY_TEMPLATE_MAX_LENGTH = 4500;
// The web app shows these under the field as they are.
const EMPTY_SUBJECT_TEMPLATE_MESSAGE = 'Write a subject template.';
const EMPTY_BODY_TEMPLATE_MESSAGE = 'Write a body template.';

// A template is never empty, and every placeholder in it is {reading} or {date}: a typo blocks the save.
function templateSchema(emptyMessage: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, emptyMessage)
    .max(maxLength)
    .superRefine((template, context) => {
      const unknownPlaceholder = findUnknownPlaceholder(template);

      if (!unknownPlaceholder) return;

      context.addIssue({ code: 'custom', message: toUnknownPlaceholderMessage(unknownPlaceholder) });
    });
}

// How {date} is written: one of the four formats, nothing else.
const MessageDateFormatSchema = z
  .enum(MESSAGE_DATE_FORMATS)
  .meta({ description: 'How {date} is written in every email', example: MESSAGE_DATE_FORMATS.LONG_MONTH });

// What the user saves on the Settings page, all of it at once. "From" is not in it: it is whichever account
// yarn mail:connect signed in with, so it is never the app's to change.
export const UpdateSettingsSchema = z.strictObject({
  to: z.string().trim().max(EMAIL_MAX_LENGTH).pipe(z.email()),
  subjectTemplate: templateSchema(EMPTY_SUBJECT_TEMPLATE_MESSAGE, SUBJECT_TEMPLATE_MAX_LENGTH),
  bodyTemplate: templateSchema(EMPTY_BODY_TEMPLATE_MESSAGE, BODY_TEMPLATE_MAX_LENGTH),
  dateFormat: MessageDateFormatSchema,
});

export const SettingsResponseSchema = z
  .object({
    // The user's own address (MAIL_FROM), display only; null when it is not set.
    from: z.string().nullable(),
    // The provider's address; null until the user saves one.
    to: z.string().nullable(),
    // Every email's subject and body, with {reading} and {date} to fill in. A fresh install's until the user saves.
    subjectTemplate: z.string(),
    bodyTemplate: z.string(),
    // A fresh install's ("31 October 2026") until the user saves.
    dateFormat: MessageDateFormatSchema,
  })
  .meta({ id: 'Settings' });

export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
