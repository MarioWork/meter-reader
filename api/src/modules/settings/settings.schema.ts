import { z } from 'zod';

// The longest address an email can carry (RFC 5321's path limit, less its angle brackets).
const EMAIL_MAX_LENGTH = 254;

// What the user saves on the Settings page. Only the provider's address: "From" is whichever account
// yarn mail:connect signed in with, so it is never the app's to change.
export const UpdateSettingsSchema = z.strictObject({
  to: z.string().trim().max(EMAIL_MAX_LENGTH).pipe(z.email()),
});

export const SettingsResponseSchema = z
  .object({
    // The user's own address (MAIL_FROM), display only; null when it is not set.
    from: z.string().nullable(),
    // The provider's address; null until the user saves one.
    to: z.string().nullable(),
  })
  .meta({ id: 'Settings' });

export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;
export type SettingsResponse = z.infer<typeof SettingsResponseSchema>;
