import addPhotoHandler from './addPhoto.mock.handler';
import getPhotoHandler from './getPhoto.mock.handler';

export const photoMockHandlers = (baseUrl: string) => [...addPhotoHandler(baseUrl), ...getPhotoHandler(baseUrl)];
