import axios from 'axios';
import type { PhotoId } from '@app-types/models';
import { BASE_PHOTOS_URL } from '@services/photoService/photoService';

// Where an <img> loads a saved photo from: the API's own origin, so the session cookie goes with it. Built from the
// service's path and a numeric id only, never from text the API sent.
export function getPhotoUrl(photoId: PhotoId): string {
  return `${axios.defaults.baseURL ?? ''}${BASE_PHOTOS_URL}/${photoId}`;
}
