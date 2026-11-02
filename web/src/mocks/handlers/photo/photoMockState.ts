// The photos uploaded in the demo, kept so the history can show them once their reading is saved.
import { createPhotoMockModel } from './models/photoMockModel.mock';
import type { PhotoApiModel } from '@app-types/models';

// Uploaded ids start well above the mock history's, so the two never meet.
const FIRST_UPLOADED_ID = 1000;

let photos = new Map<number, Blob>();

export function addMockPhoto(photo: Blob): PhotoApiModel {
  const id = FIRST_UPLOADED_ID + photos.size;

  photos = new Map(photos).set(id, photo);

  return createPhotoMockModel({ id });
}

export function getMockPhoto(id: number): Blob | undefined {
  return photos.get(id);
}

// Between tests: no uploaded photos.
export function resetMockPhotos(): void {
  photos = new Map();
}
