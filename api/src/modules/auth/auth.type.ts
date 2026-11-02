// What other modules may import from auth (node-ts-api §3): the session the auth plugin hands every route.

// What the rest of the API knows about a signed-in request. There is one account, so there is no "who".
export type AuthSession = {
  tokenHash: string;
  signedInAt: Date;
};
