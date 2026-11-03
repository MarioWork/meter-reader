import { TimeLimitError, withTimeLimit } from './timeLimitUtils';

const LIMIT_MS = 1000;

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('withTimeLimit', () => {
  it('hands back what the work gave, when it is done in time', async () => {
    await expect(withTimeLimit(Promise.resolve('done'), LIMIT_MS)).resolves.toBe('done');
  });

  it('passes on the work failing in time', async () => {
    const failure = new Error('broke');

    await expect(withTimeLimit(Promise.reject(failure), LIMIT_MS)).rejects.toBe(failure);
  });

  it('stops waiting with a TimeLimitError once the time is up', async () => {
    const neverDone = new Promise<string>(() => {});
    const result = expect(withTimeLimit(neverDone, LIMIT_MS)).rejects.toBeInstanceOf(TimeLimitError);

    await vi.advanceTimersByTimeAsync(LIMIT_MS);

    await result;
  });

  it('leaves no timer running once the work is done', async () => {
    await withTimeLimit(Promise.resolve('done'), LIMIT_MS);

    expect(vi.getTimerCount()).toBe(0);
  });
});
