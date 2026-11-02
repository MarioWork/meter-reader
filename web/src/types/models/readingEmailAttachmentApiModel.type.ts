import type { PhotoId } from './photoApiModel.type';

// The photo a reading's email can carry, under the file name the provider will see.
export interface ReadingEmailAttachmentApiModel {
  photoId: PhotoId;
  name: string;
}
