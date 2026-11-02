import { TEST_BASE_API_URL } from '@mocks/server';
import { getPhotoUrl } from './readingPhotoUtils';

it("points at the photo on the API's base URL", () => {
  expect(getPhotoUrl(7)).toBe(`${TEST_BASE_API_URL}/photos/7`);
});
