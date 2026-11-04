import { string } from 'yup';
import type { SettingsApiModel } from '@app-types/models';
import { todayAsIsoDate } from '@utils/dateUtils';
import { formatMessageDate } from '@utils/messageDateFormatUtils';

// The subject and body templates (docs/GLOSSARY.md: Template, Placeholder), with the same rules as the API's
// (api/src/modules/settings/settings.template.ts). Only {reading}, {date} and {client} exist, in the subject and in
// the body.
export const MESSAGE_PLACEHOLDERS = { reading: '{reading}', date: '{date}', client: '{client}' } as const;

// The API's limits: under those of an edited subject and body on a send, with room for the placeholders to grow.
const SUBJECT_TEMPLATE_MAX_LENGTH = 150;
const BODY_TEMPLATE_MAX_LENGTH = 4500;

// Anything in braces, with no brace inside.
const PLACEHOLDER_PATTERN = /\{[^{}]*\}/g;
const KNOWN_PLACEHOLDERS: readonly string[] = Object.values(MESSAGE_PLACEHOLDERS);
const UNKNOWN_PLACEHOLDER_TEST = 'known-placeholders';
const EMPTY_SUBJECT_TEMPLATE_MESSAGE = 'Write a subject template.';
const EMPTY_BODY_TEMPLATE_MESSAGE = 'Write a body template.';
const SUBJECT_TEMPLATE_TOO_LONG_MESSAGE = `Keep the subject template to ${SUBJECT_TEMPLATE_MAX_LENGTH} characters or fewer.`;
const BODY_TEMPLATE_TOO_LONG_MESSAGE = `Keep the body template to ${BODY_TEMPLATE_MAX_LENGTH} characters or fewer.`;

// The same wording as the API's, so the error reads the same whichever side caught it.
function toUnknownPlaceholderMessage(placeholder: string): string {
  return `${placeholder} is not a placeholder. Use ${MESSAGE_PLACEHOLDERS.reading}, ${MESSAGE_PLACEHOLDERS.date} or ${MESSAGE_PLACEHOLDERS.client}.`;
}

// What goes in place of each placeholder: the reading as read, the day already spelled out, and the client number
// (null when none is saved).
export type MessageValues = { reading: string; date: string; client: string | null };

// Every {reading}, {date} and {client}, filled in, in one pass. No client number fills {client} with nothing, as the
// API does. Anything else in braces stays as it is.
export function fillMessageTemplate(template: string, { reading, date, client }: MessageValues): string {
  const valueByPlaceholder: Record<string, string> = {
    [MESSAGE_PLACEHOLDERS.reading]: reading,
    [MESSAGE_PLACEHOLDERS.date]: date,
    [MESSAGE_PLACEHOLDERS.client]: client ?? '',
  };

  return template.replace(PLACEHOLDER_PATTERN, (placeholder) => valueByPlaceholder[placeholder] ?? placeholder);
}

// What an email is filled in from, as Settings saves it: the two templates, how {date} is written in them, and the
// client number for {client}.
export type MessageSettings = Pick<
  SettingsApiModel,
  'subjectTemplate' | 'bodyTemplate' | 'dateFormat' | 'dateLanguage' | 'clientNumber'
>;

// A subject and a body, filled in.
export type FilledEmail = { subject: string; body: string };

// The subject and body the templates make for a reading taken today, with {date} written in the chosen format as the
// API writes it: exactly the email a send would go out with.
export function fillTodaysEmail(
  { subjectTemplate, bodyTemplate, dateFormat, dateLanguage, clientNumber }: MessageSettings,
  reading: string,
): FilledEmail {
  const values = {
    reading: reading.trim(),
    date: formatMessageDate(todayAsIsoDate(), dateFormat, dateLanguage),
    client: clientNumber,
  };

  return {
    subject: fillMessageTemplate(subjectTemplate, values),
    body: fillMessageTemplate(bodyTemplate, values),
  };
}

// The first placeholder that is not a known one (a typo like {readng}); undefined when there is none.
export function findUnknownPlaceholder(template: string): string | undefined {
  const placeholders = template.match(PLACEHOLDER_PATTERN) ?? [];

  return placeholders.find((placeholder) => !KNOWN_PLACEHOLDERS.includes(placeholder));
}

function templateSchema(requiredMessage: string, maxLength: number, tooLongMessage: string) {
  return string()
    .trim()
    .required(requiredMessage)
    .max(maxLength, tooLongMessage)
    .test(UNKNOWN_PLACEHOLDER_TEST, (template, context) => {
      const unknownPlaceholder = findUnknownPlaceholder(template);

      if (!unknownPlaceholder) return true;

      return context.createError({ message: toUnknownPlaceholderMessage(unknownPlaceholder) });
    });
}

// The templates as the Settings form and the save action both check them.
export const subjectTemplateSchema = templateSchema(
  EMPTY_SUBJECT_TEMPLATE_MESSAGE,
  SUBJECT_TEMPLATE_MAX_LENGTH,
  SUBJECT_TEMPLATE_TOO_LONG_MESSAGE,
);

export const bodyTemplateSchema = templateSchema(
  EMPTY_BODY_TEMPLATE_MESSAGE,
  BODY_TEMPLATE_MAX_LENGTH,
  BODY_TEMPLATE_TOO_LONG_MESSAGE,
);
