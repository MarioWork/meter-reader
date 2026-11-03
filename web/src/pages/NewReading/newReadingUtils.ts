import type { CreateReading } from '@services/readingService/readingService.type';

// Which button the user pressed: save the reading only, or save it and send it straight away.
export const NewReadingIntent = {
  SAVE: 'save',
  SEND: 'send',
} as const;
export type NewReadingIntent = (typeof NewReadingIntent)[keyof typeof NewReadingIntent];

// The subject and message for a send straight away. Empty means the API's own.
export type NewReadingEmail = { subject: string; body: string };

// The photo is already shrunk to a JPEG; it is left out when the reading has none. The email only goes with a send.
export type NewReadingFormData = {
  intent: NewReadingIntent;
  reading: CreateReading;
  photo?: File;
  email?: NewReadingEmail;
};

export const SAVE_FAILED_MESSAGE = 'The reading was not saved. Please try again.';
