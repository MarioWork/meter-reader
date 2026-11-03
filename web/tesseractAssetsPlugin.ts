import type { Plugin } from 'vite';
import { appAssets } from './appAssetsPlugin';

// Where the app serves Tesseract's files, under its base path. digitsWorkerUtils.ts reads them from here.
const ASSETS_FOLDER = 'tesseract';

// The worker, one LSTM-only core build and the English LSTM data, gzipped (Tesseract unzips it itself). Only the
// SIMD core: every phone browser the app targets has WebAssembly SIMD (Safari 16.4+, Chrome 91+, Firefox 89+), and
// shipping Tesseract's plain and relaxed-SIMD builds as well would add about 7.8 MB to every install.
const ASSET_SOURCES: Record<string, string> = {
  'worker.min.js': 'tesseract.js/dist/worker.min.js',
  'tesseract-core-simd-lstm.wasm.js': 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
  'eng.traineddata.gz': '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
};

// Tesseract's own files, served by the app instead of Tesseract's default CDN, so OCR works offline.
export function tesseractAssets(): Plugin {
  return appAssets({ name: 'tesseract-assets', folder: ASSETS_FOLDER, sources: ASSET_SOURCES });
}
