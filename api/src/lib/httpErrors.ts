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
