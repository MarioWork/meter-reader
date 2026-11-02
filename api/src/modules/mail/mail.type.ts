// What other modules hand the mail module to send (ADR 0001).

// A file sent with the mail (a reading's photo).
export type MailAttachment = { name: string; contentType: string; contents: Buffer };

// One mail: plain text, one recipient, at most one attachment.
export type OutgoingMail = { to: string; subject: string; body: string; attachment?: MailAttachment };
