// The subject and body templates (docs/GLOSSARY.md: Template, Placeholder). A placeholder is a name in braces; only
// {reading}, {date} and {client} exist, and all work in the subject and in the body.
import type { MessageValues } from './settings.type.ts';

export const MESSAGE_PLACEHOLDERS = { reading: '{reading}', date: '{date}', client: '{client}' } as const;

// A fresh install's templates. The database columns carry the same defaults (prisma/schema.prisma).
export const DEFAULT_SUBJECT_TEMPLATE = 'Leitura {date}';
export const DEFAULT_BODY_TEMPLATE = 'Leitura - {reading} - {date} - {client}';

// Anything in braces, with no brace inside: linear, so a long template cannot stall the process.
const PLACEHOLDER_PATTERN = /\{[^{}]*\}/g;

const KNOWN_PLACEHOLDERS: readonly string[] = Object.values(MESSAGE_PLACEHOLDERS);

// The first placeholder that is not a known one (a typo like {readng}); undefined when there is none.
export function findUnknownPlaceholder(template: string): string | undefined {
  const placeholders = template.match(PLACEHOLDER_PATTERN) ?? [];

  return placeholders.find((placeholder) => !KNOWN_PLACEHOLDERS.includes(placeholder));
}

export function toUnknownPlaceholderMessage(placeholder: string): string {
  return `${placeholder} is not a placeholder. Use ${MESSAGE_PLACEHOLDERS.reading}, ${MESSAGE_PLACEHOLDERS.date} or ${MESSAGE_PLACEHOLDERS.client}.`;
}

// Every {reading}, {date} and {client}, filled in, in one pass: a value is never read again as a placeholder. No
// client number saved fills {client} with nothing. Anything else in braces stays as it is.
export function fillMessageTemplate(template: string, { reading, date, client }: MessageValues): string {
  const valueByPlaceholder: Record<string, string> = {
    [MESSAGE_PLACEHOLDERS.reading]: reading,
    [MESSAGE_PLACEHOLDERS.date]: date,
    [MESSAGE_PLACEHOLDERS.client]: client ?? '',
  };

  return template.replace(PLACEHOLDER_PATTERN, (placeholder) => valueByPlaceholder[placeholder] ?? placeholder);
}
