import type { ReadingEmailAttachmentApiModel } from './readingEmailAttachmentApiModel.type';

// Exactly what sending a reading emails: the provider's address, the subject and the body, all from the server.
// `attachment` is the photo that goes with it when the user asks, null when the reading has none.
export interface ReadingEmailApiModel {
  // The user's own address, display only; null when the server has none set.
  from: string | null;
  to: string;
  subject: string;
  body: string;
  attachment: ReadingEmailAttachmentApiModel | null;
}
