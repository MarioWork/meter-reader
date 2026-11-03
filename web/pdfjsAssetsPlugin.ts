import type { Plugin } from 'vite';
import { appAssets } from './appAssetsPlugin';

// Where the app serves pdf.js's files, under its base path. The bill viewer's pdfDocumentUtils.ts reads them from here.
const ASSETS_FOLDER = 'pdfjs';

// The worker (renamed .js, so every server sends it as JavaScript, which a module worker needs, and the PWA's js glob
// precaches it), the image decoders a scanned bill may need (JPEG 2000, JBIG2, ICC colour), and the two standard fonts
// pdf.js still loads when the browser's own fonts stand in for the rest (Symbol, Dingbats). Not the decoders' no-WASM
// fallbacks (every browser the app targets has WebAssembly), the CJK character maps, or the scripting engine (off).
const ASSET_SOURCES: Record<string, string> = {
  'pdf.worker.min.js': 'pdfjs-dist/build/pdf.worker.min.mjs',
  'wasm/openjpeg.wasm': 'pdfjs-dist/wasm/openjpeg.wasm',
  'wasm/jbig2.wasm': 'pdfjs-dist/wasm/jbig2.wasm',
  'wasm/qcms_bg.wasm': 'pdfjs-dist/wasm/qcms_bg.wasm',
  'standard_fonts/FoxitSymbol.pfb': 'pdfjs-dist/standard_fonts/FoxitSymbol.pfb',
  'standard_fonts/FoxitDingbats.pfb': 'pdfjs-dist/standard_fonts/FoxitDingbats.pfb',
};

// pdf.js's own files, served by the app instead of a CDN, so a bill opens offline and under the app's CSP.
export function pdfjsAssets(): Plugin {
  return appAssets({ name: 'pdfjs-assets', folder: ASSETS_FOLDER, sources: ASSET_SOURCES });
}
