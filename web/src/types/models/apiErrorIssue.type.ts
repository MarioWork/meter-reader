// One field the API refused, and why, written for the user. `path` is a JSON pointer to it ("/subjectTemplate").
export type ApiErrorIssue = { path: string; message: string };
