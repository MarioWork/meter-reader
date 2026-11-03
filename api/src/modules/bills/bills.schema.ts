import { z } from 'zod';
import { BILL_CONTENT_TYPES } from './bills.type.ts';

// A Bill (docs/GLOSSARY.md) is at most 10 MB: a scanned bill fits, and it is never mailed, so Graph's limit does not
// apply. The web app says the same number: change both together.
export const BILL_MAX_BYTES = 10_000_000;

export const BillParamsSchema = z.object({ id: z.coerce.number().int().positive() });

// `download=true` asks the browser to save the file; left out, it opens in the browser (a PDF in its own viewer).
export const BillFileQuerySchema = z.object({
  download: z.stringbool().optional(),
});

// The request body is the file itself, not JSON: the content-type parser in bills.route.ts hands it over as bytes,
// whatever type the client says it is.
export const AddBillBodySchema = z.instanceof(Buffer).meta({ description: 'The bill: a PDF, JPEG or PNG' });

// GET /bills/:id answers the file's bytes as a stream, which has no JSON shape to check: the schema only documents it.
export const BillFileSchema = z.any().meta({ description: 'The bill: a PDF, JPEG or PNG' });

export const BillResponseSchema = z
  .object({
    id: z.number().int(),
    contentType: z.enum(BILL_CONTENT_TYPES),
    sizeBytes: z.number().int(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Bill' });

export type BillParams = z.infer<typeof BillParamsSchema>;
export type BillFileQuery = z.infer<typeof BillFileQuerySchema>;
export type BillResponse = z.infer<typeof BillResponseSchema>;
