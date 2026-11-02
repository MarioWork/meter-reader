import { axiosActions } from '@api/axiosActions';
import type { PhotoApiModel } from '@app-types/models';
import { HttpVerbsUtil, type JSONResponseUtil } from '@app-types/utility';
import { PHOTO_CONTENT_TYPE } from '@utils/photoUtils';
import type { AddPhoto } from './photoService.type';

// Also the path an <img> loads a saved photo from (getPhotoUrl, next to the history).
export const BASE_PHOTOS_URL = '/photos';

export default {
  // The body is the JPEG itself, not JSON or a form.
  addPhoto: async (photo: AddPhoto): Promise<JSONResponseUtil<PhotoApiModel>> =>
    axiosActions<PhotoApiModel>({
      url: BASE_PHOTOS_URL,
      method: HttpVerbsUtil.POST,
      data: photo,
      headers: { 'Content-Type': PHOTO_CONTENT_TYPE },
    }),
};
