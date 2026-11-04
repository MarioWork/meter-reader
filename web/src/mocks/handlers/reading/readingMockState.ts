// The mock history: one list shared by the reading handlers, so a reading saved in the demo shows up on Home.
import type { ReadingApiModel, ReadingDetailsApiModel, ReadingId, ReadingNeighbourApiModel } from '@app-types/models';
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

// One past the highest id, as the database's sequence would: ids are never reused, even after a delete.
function nextMockReadingId(): number {
  return Math.max(0, ...readings.map((reading) => reading.id)) + 1;
}

export function addMockReading(reading: Omit<ReadingApiModel, 'id'>): ReadingApiModel {
  const saved = { ...reading, id: nextMockReadingId() };

  readings = [...readings, saved];

  return saved;
}

export function findMockReading(id: ReadingId): ReadingApiModel | undefined {
  return readings.find((reading) => reading.id === id);
}

function toNeighbour(reading: ReadingApiModel | undefined): ReadingNeighbourApiModel | null {
  if (!reading) return null;

  return { id: reading.id, digits: reading.digits, date: reading.date };
}

// The reading for its page, with the ones just before and after it in the history, as the API answers it.
export function findMockReadingDetails(id: ReadingId): ReadingDetailsApiModel | undefined {
  const newestFirst = getMockReadings();
  const index = newestFirst.findIndex((reading) => reading.id === id);

  if (index === -1) return undefined;

  const reading = newestFirst[index];

  return { ...reading, previous: toNeighbour(newestFirst[index + 1]), next: toNeighbour(newestFirst[index - 1]) };
}

// The reading with the changes made, or undefined when there was no such reading.
export function updateMockReading(id: ReadingId, changes: Partial<ReadingApiModel>): ReadingApiModel | undefined {
  const reading = findMockReading(id);

  if (!reading) return undefined;

  const updated = { ...reading, ...changes };

  readings = readings.map((current) => (current.id === id ? updated : current));

  return updated;
}

// False when there was no such reading.
export function deleteMockReading(id: ReadingId): boolean {
  const remaining = readings.filter((reading) => reading.id !== id);
  const wasDeleted = remaining.length < readings.length;

  readings = remaining;

  return wasDeleted;
}

// Between tests: back to the fixed history.
export function resetMockReadings(): void {
  readings = createReadingMockModelList(READING_MOCK_COUNT);
}
