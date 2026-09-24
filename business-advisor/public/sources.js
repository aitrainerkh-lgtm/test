// Sources: read files into plain text and keep them on this device.

const KEY = 'ba.sources.v1';
export const MAX_TOTAL_CHARS = 100000;

export function loadSources() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveSources(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

export function totalChars(list) {
  return list.reduce((n, s) => n + s.text.length, 0);
}

function clean(text) {
  return text
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

let pdfjs;
async function readPdf(file) {
  if (!pdfjs) {
    pdfjs = await import('./vendor/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
  }
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    pages.push(content.items.map((it) => it.str + (it.hasEOL ? '\n' : '')).join(''));
  }
  await doc.destroy();
  return pages.join('\n\n');
}

let mammothReady;
function loadMammoth() {
  if (!mammothReady) {
    mammothReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = new URL('./vendor/mammoth.browser.min.js', import.meta.url).href;
      s.onload = () => resolve(window.mammoth);
      s.onerror = () => reject(new Error('mammoth_load_failed'));
      document.head.appendChild(s);
    });
  }
  return mammothReady;
}

async function readDocx(file) {
  const mammoth = await loadMammoth();
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

// Returns clean text, or throws Error('unsupported' | 'empty').
export async function readFileAsText(file) {
  const name = file.name.toLowerCase();
  let text;
  if (name.endsWith('.pdf') || file.type === 'application/pdf') text = await readPdf(file);
  else if (name.endsWith('.docx')) text = await readDocx(file);
  else if (/\.(txt|md|csv|tsv|json)$/.test(name) || file.type.startsWith('text/')) text = await file.text();
  else throw new Error('unsupported');

  text = clean(text);
  if (text.replace(/\s/g, '').length < 20) throw new Error('empty');
  return text;
}

export function makeSource(name, text) {
  return {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || 'Source',
    text,
    added: Date.now(),
  };
}
