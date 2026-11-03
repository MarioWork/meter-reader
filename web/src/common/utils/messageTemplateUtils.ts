import { string } from 'yup';
import { formatEmailDate, todayAsIsoDate } from '@utils/dateUtils';

// The subject and body templates (docs/GLOSSARY.md: Template, Placeholder), with the same rules as the API's
// (api/src/modules/settings/settings.template.ts). Only {reading} and {date} exist, in the subject and in the body.
export const MESSAGE_PLACEHOLDERS = { reading: '{reading}', date: '{date}' } as const;

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
  return `${placeholder} is not a placeholder. Use ${MESSAGE_PLACEHOLDERS.reading} or ${MESSAGE_PLACEHOLDERS.date}.`;
}

// What goes in place of each placeholder: the reading as read, and the day already spelled out.
export type MessageValues = { reading: string; date: string };

// Every {reading} and every {date}, filled in, in one pass. Anything else in braces stays as it is.
export function fillMessageTemplate(template: string, { reading, date }: MessageValues): string {
  const valueByPlaceholder: Record<string, string> = {
    [MESSAGE_PLACEHOLDERS.reading]: reading,
    [MESSAGE_PLACEHOLDERS.date]: date,
  };

  return template.replace(PLACEHOLDER_PATTERN, (placeholder) => valueByPlaceholder[placeholder] ?? placeholder);
}

// The two templates an email starts from, as Settings saves them.
export type MessageTemplates = { subjectTemplate: string; bodyTemplate: string };

// A subject and a body, filled in.
export type FilledEmail = { subject: string; body: string };

// The subject and body the templates make for a reading taken today, with {date} spelled as the API spells it:
// exactly the email a send would go out with.
export function fillTodaysEmail({ subjectTemplate, bodyTemplate }: MessageTemplates, reading: string): FilledEmail {
  const values = { reading: reading.trim(), date: formatEmailDate(todayAsIsoDate()) };

  return {
    subject: fillMessageTemplate(subjectTemplate, values),
    body: fillMessageTemplate(bodyTemplate, values),
  };
}

// The first placeholder that is not {reading} or {date} (a typo like {readng}); undefined when there is none.
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
