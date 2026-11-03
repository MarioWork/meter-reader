import type { ApiErrorIssue } from './apiErrorIssue.type';

// What a failed request tells the app. `code` and `message` come from the API's `{ code, message }` envelope when it
// sent one: `code` is stable and pages branch on it; `message` is written for the user and shown as is.
// `issues` comes with a VALIDATION_ERROR: one per refused field, its `path` a JSON pointer to it ("/subjectTemplate").
export type ApiError = {
  statusCode?: number;
  code?: string;
  message?: string;
  issues?: ApiErrorIssue[];
};
