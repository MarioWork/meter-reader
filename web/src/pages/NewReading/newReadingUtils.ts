import type { CreateReading } from '@services/readingService/readingService.type';

// The photo is already shrunk to a JPEG; it is left out when the reading has none.
export type NewReadingFormData = { reading: CreateReading; photo?: File };

export const SAVE_FAILED_MESSAGE = 'The reading was not saved. Please try again.';
