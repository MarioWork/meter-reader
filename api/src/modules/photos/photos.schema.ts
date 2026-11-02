import { z } from 'zod';

// The phone shrinks every photo before it sends it. 2.5 MB grows to about 3.3 MB once base64-encoded for the mail,
// which leaves room under Graph's 4 MB request limit (docs/adr/0001).
export const PHOTO_MAX_BYTES = 2_500_000;
export const PHOTO_MAX_SIDE_PX = 2000;
export const PHOTO_CONTENT_TYPE = 'image/jpeg';

export const PhotoParamsSchema = z.object({ id: z.coerce.number().int().positive() });

// The request body is the JPEG itself, not JSON: the content-type parser in photos.route.ts hands it over as bytes.
export const AddPhotoBodySchema = z.instanceof(Buffer).meta({ description: 'The photo, a JPEG' });

// GET /photos/:id answers the JPEG's bytes as a stream, which has no JSON shape to check: the schema only documents it.
export const PhotoFileSchema = z.any().meta({ description: 'The photo, a JPEG' });

export const PhotoResponseSchema = z
  .object({
    id: z.number().int(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Photo' });

export type PhotoParams = z.infer<typeof PhotoParamsSchema>;
export type PhotoResponse = z.infer<typeof PhotoResponseSchema>;
