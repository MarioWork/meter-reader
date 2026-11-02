// The API's limits (docs/adr/0001: Graph takes at most 3 MB of attachments in one mail). The api checks the same
// numbers in api/src/modules/photos/photos.schema.ts: change both together.
export const PHOTO_MAX_SIDE_PX = 2000;
export const PHOTO_MAX_BYTES = 3_000_000;
export const PHOTO_MAX_MEGABYTES = 3;
export const PHOTO_CONTENT_TYPE = 'image/jpeg';
