import type { ReadingApiModel } from './readingApiModel.type';

// A reading beside another one in the history (by date, then the one saved last): its id for the link to it, and its
// digits and day for the water used between them.
export type ReadingNeighbourApiModel = Pick<ReadingApiModel, 'id' | 'digits' | 'date'>;
