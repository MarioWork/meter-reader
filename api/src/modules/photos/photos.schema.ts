import { z } from 'zod';

// The phone shrinks every photo before it sends it (docs/adr/0001: Graph takes at most 3 MB of attachments).
export const PHOTO_MAX_BYTES = 3_000_000;
export const PHOTO_MAX_SIDE_PX = 2000;
export const PHOTO_CONTENT_TYPE = 'image/jpeg';

export const PhotoParamsSchema = z.object({ id: z.coerce.number().int().positive() });

// The request body is the JPEG itself, not JSON: the content-type parser in photos.route.ts hands it over as bytes.
export const AddPhotoBodySchema = z.instanceof(Buffer).meta({ description: 'The photo, a JPEG' });

export const PhotoResponseSchema = z
  .object({
    id: z.number().int(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'Photo' });

export type PhotoParams = z.infer<typeof PhotoParamsSchema>;
export type PhotoResponse = z.infer<typeof PhotoResponseSchema>;
