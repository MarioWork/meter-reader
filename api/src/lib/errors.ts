type AppErrorOptions = {
  code: string;
  isOperational?: boolean;
  cause?: unknown;
};

// The base of every error the app throws on purpose. `code` is stable for callers; `message` is for humans.
export class AppError extends Error {
  readonly code: string;
  readonly isOperational: boolean;

  constructor(message: string, options: AppErrorOptions) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.code = options.code;
    this.isOperational = options.isOperational ?? true;
  }
}

// A bug: something the code promised itself did not hold. Never shown to the client (the handler answers 500).
export class InternalError extends AppError {
  constructor(message: string) {
    super(message, { code: 'INTERNAL_ERROR', isOperational: false });
  }
}
