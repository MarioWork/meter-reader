// The mock history: one list shared by the reading handlers, so a reading saved in the demo shows up on Home.
import type { ReadingApiModel } from '@app-types/models';
import { createReadingMockModelList, READING_MOCK_COUNT } from './models/readingMockModel.mock';

let readings: ReadingApiModel[] = createReadingMockModelList(READING_MOCK_COUNT);

// A sort comparator: the newer reading comes first.
function byNewestFirst(reading: ReadingApiModel, other: ReadingApiModel): number {
  if (reading.date !== other.date) return other.date.localeCompare(reading.date);

  return other.id - reading.id;
}

// Newest first, as the API orders the history: by date, then the one saved last. A sorted copy, never in place.
export function getMockReadings(): ReadingApiModel[] {
  return [...readings].sort(byNewestFirst);
}

export function addMockReading(reading: Omit<ReadingApiModel, 'id'>): ReadingApiModel {
  const saved = { ...reading, id: readings.length + 1 };

  readings = [...readings, saved];

  return saved;
}

// Between tests: back to the fixed history.
export function resetMockReadings(): void {
  readings = createReadingMockModelList(READING_MOCK_COUNT);
}
