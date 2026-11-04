import { z } from 'zod';
import { findUnknownPlaceholder, toUnknownPlaceholderMessage } from './settings.template.ts';
import { MESSAGE_DATE_FORMATS, MESSAGE_DATE_LANGUAGES } from './settings.type.ts';

// The longest address an email can carry (RFC 5321's path limit, less its angle brackets).
const EMAIL_MAX_LENGTH = 254;
// Room for any provider's account or contract number.
const CLIENT_NUMBER_MAX_LENGTH = 50;
// Under the limits of an edited subject and body on a send (200 and 5000, readings.schema.ts), with room for the
// placeholders to grow once filled in, so a filled-in email still passes them.
const SUBJECT_TEMPLATE_MAX_LENGTH = 150;
const BODY_TEMPLATE_MAX_LENGTH = 4500;
// The web app shows these under the field as they are.
const EMPTY_SUBJECT_TEMPLATE_MESSAGE = 'Write a subject template.';
const EMPTY_BODY_TEMPLATE_MESSAGE = 'Write a body template.';

// A template is never empty, and every placeholder in it is a known one: a typo blocks the save.
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

// The language a month's name is written in, in {date}: one of the two, nothing else.
const MessageDateLanguageSchema = z
  .enum(MESSAGE_DATE_LANGUAGES)
  .meta({ description: 'The language {date} is written in', example: MESSAGE_DATE_LANGUAGES.ENGLISH });

// What the user saves on the Settings page, all of it at once. "From" is not in it: it is whichever account
// yarn mail:connect signed in with, so it is never the app's to change.
export const UpdateSettingsSchema = z.strictObject({
  to: z.string().trim().max(EMAIL_MAX_LENGTH).pipe(z.email()),
  // Left out or empty when the provider asks for none: it is then not set.
  clientNumber: z.string().trim().max(CLIENT_NUMBER_MAX_LENGTH).optional(),
  subjectTemplate: templateSchema(EMPTY_SUBJECT_TEMPLATE_MESSAGE, SUBJECT_TEMPLATE_MAX_LENGTH),
  bodyTemplate: templateSchema(EMPTY_BODY_TEMPLATE_MESSAGE, BODY_TEMPLATE_MAX_LENGTH),
  dateFormat: MessageDateFormatSchema,
  // Left out, a fresh install's: English.
  dateLanguage: MessageDateLanguageSchema.optional(),
});

export const SettingsResponseSchema = z
  .object({
    // The user's own address (MAIL_FROM), display only; null when it is not set.
    from: z.string().nullable(),
    // The provider's address; null until the user saves one.
    to: z.string().nullable(),
    // The user's client number with the provider, for {client}; null until the user saves one.
    clientNumber: z.string().nullable(),
    // Every email's subject and body, with {reading}, {date} and {client} to fill in. A fresh install's until the user saves.
    subjectTemplate: z.string(),
    bodyTemplate: z.string(),
    // A fresh install's ("31 October 2026") until the user saves.
    dateFormat: MessageDateFormatSchema,
    // English until the user saves another.
    dateLanguage: MessageDateLanguageSchema,
  })
  .meta({ id: 'Settings' });

export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
