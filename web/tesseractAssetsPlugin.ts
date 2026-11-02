import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

// Where the app serves Tesseract's files, under its base path. photoDigitsUtils.ts reads them from here.
const ASSETS_FOLDER = 'tesseract';
const NODE_MODULES = path.resolve(import.meta.dirname, 'node_modules');

// The worker, one LSTM-only core build and the English LSTM data, gzipped (Tesseract unzips it itself). Only the
// SIMD core: every phone browser the app targets has WebAssembly SIMD (Safari 16.4+, Chrome 91+, Firefox 89+), and
// shipping Tesseract's plain and relaxed-SIMD builds as well would add about 7.8 MB to every install.
const ASSET_SOURCES: Record<string, string> = {
  'worker.min.js': 'tesseract.js/dist/worker.min.js',
  'tesseract-core-simd-lstm.wasm.js': 'tesseract.js-core/tesseract-core-simd-lstm.wasm.js',
  'eng.traineddata.gz': '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz',
};

const LEADING_SLASH = /^\//;
const QUERY_START = '?';

const CONTENT_TYPES: Record<string, string> = {
  '.js': 'text/javascript',
  '.gz': 'application/gzip',
};

// The file asked for, from a request url already stripped of the assets folder: '/worker.min.js?v=1'.
function requestedFileName(requestUrl = ''): string {
  const [pathOnly] = requestUrl.split(QUERY_START);

  return pathOnly.replace(LEADING_SLASH, '');
}

function sourcePath(fileName: string): string {
  return path.join(NODE_MODULES, ASSET_SOURCES[fileName]);
}

// Tesseract's own files, served by the app instead of Tesseract's default CDN, so OCR works offline: the dev
// server answers them from node_modules, and the build copies them to dist/tesseract/, where the PWA precaches them.
export function tesseractAssets(): Plugin {
  let assetsUrl = `/${ASSETS_FOLDER}/`;

  return {
    name: 'tesseract-assets',
    configResolved(config) {
      assetsUrl = `${config.base}${ASSETS_FOLDER}/`;
    },
    configureServer(server) {
      server.middlewares.use(assetsUrl, (request, response, next) => {
        const fileName = requestedFileName(request.url);
        const isTesseractFile = Object.hasOwn(ASSET_SOURCES, fileName);

        if (!isTesseractFile) return next();

        response.setHeader('Content-Type', CONTENT_TYPES[path.extname(fileName)]);
        fs.createReadStream(sourcePath(fileName)).pipe(response);
      });
    },
    generateBundle() {
      for (const fileName of Object.keys(ASSET_SOURCES)) {
        this.emitFile({
          type: 'asset',
          fileName: `${ASSETS_FOLDER}/${fileName}`,
          source: fs.readFileSync(sourcePath(fileName)),
        });
      }
    },
  };
}
