import type { CreateReading } from '@services/readingService/readingService.type';

export type NewReadingFormData = { reading: CreateReading };

export const SAVE_FAILED_MESSAGE = 'The reading was not saved. Please try again.';
