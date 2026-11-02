// What a failed request tells the app. `code` and `message` come from the API's `{ code, message }` envelope when it
// sent one: `code` is stable and pages branch on it; `message` is written for the user and shown as is.
export type ApiError = {
  statusCode?: number;
  code?: string;
  message?: string;
};
