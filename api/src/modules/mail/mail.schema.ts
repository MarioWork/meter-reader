import { z } from 'zod';

// `notConnected`: yarn mail:connect never ran, or Microsoft refused the token (revoked, or unused for too long).
export const MAIL_STATES = ['connected', 'notConnected'] as const;

export const MailStatusResponseSchema = z.object({ state: z.enum(MAIL_STATES) }).meta({ id: 'MailStatus' });

export type MailState = (typeof MAIL_STATES)[number];
export type MailStatusResponse = z.infer<typeof MailStatusResponseSchema>;
