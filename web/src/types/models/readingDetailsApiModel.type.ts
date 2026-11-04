import type { ReadingApiModel } from './readingApiModel.type';
import type { ReadingNeighbourApiModel } from './readingNeighbourApiModel.type';

// One reading for its own page, with the readings beside it in the same answer: `previous` is the one just before it
// by date (null for the first reading ever), `next` the one just after (null for the newest).
export interface ReadingDetailsApiModel extends ReadingApiModel {
  previous: ReadingNeighbourApiModel | null;
  next: ReadingNeighbourApiModel | null;
}
