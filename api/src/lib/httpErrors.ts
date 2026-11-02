import { AppError } from './errors.ts';

// What a specific HttpError subclass takes: its status is fixed by the subclass.
type HttpErrorSubclassOptions = { code: string; cause?: unknown };

type HttpErrorOptions = HttpErrorSubclassOptions & { statusCode: number };

// An AppError the HTTP error handler can answer directly: its status and `{ code, message }` go to the client.
export class HttpError extends AppError {
  readonly statusCode: number;

  constructor(message: string, options: HttpErrorOptions) {
    super(message, { code: options.code, cause: options.cause });
    this.statusCode = options.statusCode;
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string, options: HttpErrorSubclassOptions) {
    super(message, { code: options.code, statusCode: 503, cause: options.cause });
  }
}

// Not signed in, or a sign-in or setup attempt that failed. `code` tells the web app which one.
export class UnauthorizedError extends HttpError {
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message, { code, statusCode: 401 });
  }
}

// This request is not allowed whoever sends it (a write from another site).
export class ForbiddenError extends HttpError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(message, { code, statusCode: 403 });
  }
}

// The request clashes with the state of the app (setting up an app that is already set up).
export class ConflictError extends HttpError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, { code, statusCode: 409 });
  }
}

// The thing the request names does not exist (a reading already deleted).
export class NotFoundError extends HttpError {
  constructor(entity: string, id: string | number) {
    super(`${entity} ${id} not found`, { code: 'NOT_FOUND', statusCode: 404 });
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string, code = 'BAD_REQUEST') {
    super(message, { code, statusCode: 400 });
  }
}

// A service the app relies on (Microsoft) did not do what was asked. The message says why, in the user's words.
export class BadGatewayError extends HttpError {
  constructor(message: string, code = 'BAD_GATEWAY') {
    super(message, { code, statusCode: 502 });
  }
}

// What the request asks to send is too big for where it goes (a photo over Microsoft's limit).
export class ContentTooLargeError extends HttpError {
  constructor(message: string, code = 'CONTENT_TOO_LARGE') {
    super(message, { code, statusCode: 413 });
  }
}
