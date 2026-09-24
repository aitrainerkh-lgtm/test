// Rebuilds the browser libraries in public/vendor from node_modules.
// Run after `npm install` when you want to update a library version:
//   npm run vendor
import { build } from 'esbuild';
import { copyFileSync, mkdirSync } from 'node:fs';

const out = new URL('../public/vendor/', import.meta.url);
mkdirSync(out, { recursive: true });

// Gemini SDK (browser build) bundled into one ES module.
await build({
  stdin: { contents: "export { GoogleGenAI, Modality } from '@google/genai';", resolveDir: process.cwd() },
  bundle: true,
  format: 'esm',
  platform: 'browser',
  mainFields: ['browser', 'module', 'main'],
  conditions: ['browser'],
  minify: true,
  target: 'es2020',
  outfile: new URL('genai.mjs', out).pathname,
  legalComments: 'eof',
});

// PDF reader.
copyFileSync('node_modules/pdfjs-dist/build/pdf.min.mjs', new URL('pdf.min.mjs', out));
copyFileSync('node_modules/pdfjs-dist/build/pdf.worker.min.mjs', new URL('pdf.worker.min.mjs', out));

// Word (.docx) reader.
copyFileSync('node_modules/mammoth/mammoth.browser.min.js', new URL('mammoth.browser.min.js', out));

// Fonts (self-hosted so the app does not depend on Google Fonts).
const fonts = new URL('../public/fonts/', import.meta.url);
mkdirSync(fonts, { recursive: true });
for (const [pkg, file] of [
  ['battambang', 'battambang-khmer-400-normal.woff2'],
  ['battambang', 'battambang-khmer-700-normal.woff2'],
  ['moul', 'moul-khmer-400-normal.woff2'],
  ['inter', 'inter-latin-500-normal.woff2'],
  ['inter', 'inter-latin-700-normal.woff2'],
  ['inter', 'inter-latin-800-normal.woff2'],
]) {
  copyFileSync(`node_modules/@fontsource/${pkg}/files/${file}`, new URL(file, fonts));
}

console.log('Vendor files written to public/vendor and public/fonts');
