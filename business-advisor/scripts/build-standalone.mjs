// Builds one self-contained HTML file of the app: dist/Business-Advisor.html
// Open it in Chrome (double-click). No server needed; add the API key with the key button.
//   npm run standalone
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const PUB = fileURLToPath(new URL('../public', import.meta.url));
const DIST = fileURLToPath(new URL('../dist', import.meta.url));

const patch = {
  name: 'standalone',
  setup(b) {
    b.onLoad({ filter: /public[\\/](live|sources)\.js$/ }, (args) => {
      let src = readFileSync(args.path, 'utf8');
      src = src.replace("new URL('./mic-worklet.js', import.meta.url)", 'window.BA_ASSETS.worklet');
      src = src.replace("new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href", 'window.BA_ASSETS.pdfWorker');
      src = src.replace('if (!mammothReady) {', 'if (!mammothReady && window.mammoth) mammothReady = Promise.resolve(window.mammoth);\n  if (!mammothReady) {');
      src = src.replace("new URL('./vendor/mammoth.browser.min.js', import.meta.url).href", "'vendor/mammoth.browser.min.js'");
      if (src.includes('import.meta.url')) throw new Error('unpatched import.meta.url in ' + args.path);
      return { contents: src, loader: 'js' };
    });
  },
};

const out = await build({
  entryPoints: [`${PUB}/app.js`],
  bundle: true, format: 'esm', platform: 'browser', minify: true, write: false,
  target: 'es2020', plugins: [patch], legalComments: 'none',
});
const appJs = out.outputFiles[0].text;
if (appJs.includes('</script')) throw new Error('script close tag inside bundle');

const b64 = (p) => readFileSync(p).toString('base64');
let css = readFileSync(`${PUB}/styles.css`, 'utf8').replace(/url\('fonts\/([^']+)'\)/g, (_, f) => `url(data:font/woff2;base64,${b64(`${PUB}/fonts/${f}`)})`);
let html = readFileSync(`${PUB}/index.html`, 'utf8');
html = html.replace(/\s*<link rel="(manifest|icon|apple-touch-icon|preload)"[^>]*>/g, '');
html = html.replace('<link rel="stylesheet" href="styles.css">', `<link rel="icon" href="data:image/svg+xml;base64,${b64(`${PUB}/icon.svg`)}">\n  <style>\n${css}\n  </style>`);

const worklet = JSON.stringify(readFileSync(`${PUB}/mic-worklet.js`, 'utf8'));
const pdfWorker = readFileSync(`${PUB}/vendor/pdf.worker.min.mjs`, 'utf8');
const mammoth = readFileSync(`${PUB}/vendor/mammoth.browser.min.js`, 'utf8');
for (const [n, t] of [['pdfWorker', pdfWorker], ['mammoth', mammoth]]) if (/<\/script/i.test(t)) throw new Error('close tag in ' + n);

const scripts = `
  <script id="pdf-worker-src" type="text/plain">${pdfWorker}</script>
  <script>
    window.BA_ASSETS = {
      worklet: URL.createObjectURL(new Blob([${worklet}], { type: 'text/javascript' })),
      pdfWorker: URL.createObjectURL(new Blob([document.getElementById('pdf-worker-src').textContent], { type: 'text/javascript' })),
    };
  </script>
  <script>${mammoth}</script>
  <script type="module">${appJs}</script>`;
html = html.replace('  <script type="module" src="app.js"></script>', () => scripts);
mkdirSync(DIST, { recursive: true });
writeFileSync(`${DIST}/Business-Advisor.html`, html);
console.log('written', (html.length / 1024 / 1024).toFixed(2), 'MB');
