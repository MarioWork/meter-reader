const TIME_UP_MESSAGE = 'Ran out of time';

// The work took longer than it was given. The work itself may still be going: only the wait stopped.
export class TimeLimitError extends Error {}

// Waits for `work` at most `limitMs`, so a step that hangs (a photo that never decodes, OCR that never ends) does not
// leave the user waiting forever. Rejects with TimeLimitError once the time is up.
export function withTimeLimit<Result>(work: Promise<Result>, limitMs: number): Promise<Result> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const timeUp = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new TimeLimitError(TIME_UP_MESSAGE)), limitMs);
  });

  return Promise.race([work, timeUp]).finally(() => clearTimeout(timer));
}
