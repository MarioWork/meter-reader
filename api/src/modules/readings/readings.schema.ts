import { z } from 'zod';
import { PaginationQuerySchema, paginatedResponseSchema } from '../../lib/pagination.ts';

// Long enough for any household meter's digit window, red digits included.
export const READING_DIGITS_MAX_LENGTH = 15;
const DIGITS_ONLY = /^\d+$/;

// `notSent` until the reading's email goes out; then `sent`, or `failed` (docs/GLOSSARY.md).
export const READING_STATUSES = ['notSent', 'sent', 'failed'] as const;

export const CreateReadingSchema = z.strictObject({
  // Text, never a number: "00123" stays "00123".
  digits: z.string().regex(DIGITS_ONLY, 'Use digits only').max(READING_DIGITS_MAX_LENGTH),
  // A calendar day (YYYY-MM-DD), the day the meter showed these digits.
  date: z.iso.date(),
  // The photo it was read from, uploaded first (POST /photos). Optional: a reading can be saved without one.
  photoId: z.number().int().positive().optional(),
});

export const ListReadingsQuerySchema = PaginationQuerySchema;

export const ReadingParamsSchema = z.object({ id: z.coerce.number().int().positive() });

export const ReadingResponseSchema = z
  .object({
    id: z.number().int(),
    digits: z.string(),
    date: z.iso.date(),
    status: z.enum(READING_STATUSES),
    createdAt: z.iso.datetime(),
    // GET /photos/:id serves it; null when the reading was saved without a photo.
    photoId: z.number().int().nullable(),
  })
  .meta({ id: 'Reading' });

export const ReadingListResponseSchema = paginatedResponseSchema(ReadingResponseSchema);

export type CreateReading = z.infer<typeof CreateReadingSchema>;
export type ListReadingsQuery = z.infer<typeof ListReadingsQuerySchema>;
export type ReadingParams = z.infer<typeof ReadingParamsSchema>;
export type ReadingStatus = (typeof READING_STATUSES)[number];
export type ReadingResponse = z.infer<typeof ReadingResponseSchema>;
export type ReadingListResponse = z.infer<typeof ReadingListResponseSchema>;
