import { z } from 'zod';

// `setup`: nobody has set the app up yet (open the setup link). `signedOut`: set up, this browser is not signed in.
export const AUTH_STATES = ['setup', 'signedOut', 'signedIn'] as const;

export const AuthStatusResponseSchema = z.object({ state: z.enum(AUTH_STATES) }).meta({ id: 'AuthStatus' });

export type AuthState = (typeof AUTH_STATES)[number];
export type AuthStatusResponse = z.infer<typeof AuthStatusResponseSchema>;
