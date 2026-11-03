import type { Worker } from 'tesseract.js';

// Served by the app itself (tesseractAssetsPlugin.ts in the web root) and precached by the service worker, so OCR
// works offline and the photo never leaves the phone. Never a CDN, which is Tesseract's default.
const TESSERACT_ASSETS_PATH = `${import.meta.env.BASE_URL}tesseract`;
const WORKER_FILE = 'worker.min.js';
// The one core build the app ships (see tesseractAssetsPlugin.ts): LSTM only, WebAssembly SIMD.
const CORE_FILE = 'tesseract-core-simd-lstm.wasm.js';
const LANGUAGE = 'eng';
const DIGITS = '0123456789';
// Tesseract keeps its language data in IndexedDB unless told not to. The service worker already keeps it.
const NO_EXTRA_CACHE = 'none';

let digitsWorker: Promise<Worker> | undefined;

async function createDigitsWorker(): Promise<Worker> {
  // Loaded on the first photo only: Tesseract stays out of the main bundle.
  const { createWorker, OEM } = await import('tesseract.js');

  const worker = await createWorker(LANGUAGE, OEM.LSTM_ONLY, {
    workerPath: `${TESSERACT_ASSETS_PATH}/${WORKER_FILE}`,
    corePath: `${TESSERACT_ASSETS_PATH}/${CORE_FILE}`,
    langPath: TESSERACT_ASSETS_PATH,
    // A real worker file, not a blob: the CSP allows workers from the app's own origin.
    workerBlobURL: false,
    cacheMethod: NO_EXTRA_CACHE,
  });

  await worker.setParameters({ tessedit_char_whitelist: DIGITS });

  return worker;
}

// The Tesseract worker that reads digits only. One for the whole visit: loading the language data is the slow
// part, so the next photo reads faster. A worker that failed to load is not kept, so the next photo tries again.
export function getDigitsWorker(): Promise<Worker> {
  digitsWorker ??= createDigitsWorker().catch((error: unknown) => {
    digitsWorker = undefined;
    throw error;
  });

  return digitsWorker;
}

// Stops the worker mid-read, when reading took too long: Tesseract stops using the phone's processor, and the next
// photo starts a fresh worker. Nothing to do when no worker was started.
export async function stopDigitsWorker(): Promise<void> {
  const stopping = digitsWorker;

  digitsWorker = undefined;

  const worker = await stopping?.catch(() => undefined);

  await worker?.terminate();
}
