import readingService from '@services/readingService/readingService';
import { DEFAULT_FIRST_PAGE } from '@app-types/utility';

// Only the newest reading is needed: a new one lower than it gets a warning.
const LAST_READING_PAGE_SIZE = '1';

export async function loader() {
  const fields = { pagination: { page: DEFAULT_FIRST_PAGE, size: LAST_READING_PAGE_SIZE } };

  const readingsResponse = await readingService.getReadings(fields);

  return { lastReading: readingsResponse.data[0] };
}
