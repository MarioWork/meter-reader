// The API's limits (docs/adr/0001: a 2.5 MB photo still fits Graph's 4 MB request once base64-encoded). The api checks the same
// numbers in api/src/modules/photos/photos.schema.ts: change both together.
export const PHOTO_MAX_SIDE_PX = 2000;
export const PHOTO_MAX_BYTES = 2_500_000;
export const PHOTO_MAX_MEGABYTES = 2.5;
export const PHOTO_CONTENT_TYPE = 'image/jpeg';
