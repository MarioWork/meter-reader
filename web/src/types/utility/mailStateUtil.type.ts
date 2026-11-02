// Whether the server can send mail from the user's Hotmail, as GET /mail/status says. Not connected: yarn
// mail:connect never ran, or Microsoft refused the token (revoked or expired).
export const MailStateUtil = {
  CONNECTED: 'connected',
  NOT_CONNECTED: 'notConnected',
} as const;

export type MailStateUtil = (typeof MailStateUtil)[keyof typeof MailStateUtil];
