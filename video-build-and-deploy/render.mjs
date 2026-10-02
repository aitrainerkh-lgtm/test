// Renders the animation frame by frame with headless Chromium and encodes it with ffmpeg.
// Usage:
//   node render.mjs stills 0.5 2 5.5 ...   -> output/stills/t_<time>.png
//   node render.mjs video                  -> output/frames piped into two MP4s (with / without captions)
import { createRequire } from 'module';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const dir = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(dir, 'output');
const FPS = 25, DUR = 60;

const types = { '.html': 'text/html', '.js': 'text/javascript', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(dir) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' }).catch(() => chromium.launch());
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', e => console.error('PAGE ERROR', e.message));
await page.goto(`http://localhost:${port}/index.html?render=1`);
await page.evaluate(() => window.fontsReady);

const grab = async (t, captions) => {
  const b64 = await page.evaluate(([t, captions]) => {
    window.render(t, { captions });
    return document.getElementById('c').toDataURL('image/png').split(',')[1];
  }, [t, captions]);
  return Buffer.from(b64, 'base64');
};

const mode = process.argv[2];
if (mode === 'stills') {
  fs.mkdirSync(path.join(out, 'stills'), { recursive: true });
  for (const s of process.argv.slice(3)) {
    fs.writeFileSync(path.join(out, 'stills', `t_${s}.png`), await grab(parseFloat(s), true));
  }
} else if (mode === 'video') {
  const enc = name => {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', path.join(out, name)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise(r => ff.on('close', r));
    return { ff, done };
  };
  const a = enc('_video_captions.mp4'), b = enc('_video_clean.mp4');
  const write = (s, buf) => new Promise(r => (s.write(buf) ? r() : s.once('drain', r)));
  const N = FPS * DUR;
  for (let f = 0; f < N; f++) {
    const t = f / FPS;
    const imgs = await page.evaluate(t => {
      window.render(t, { captions: false });
      const cv = document.getElementById('c');
      const clean = cv.toDataURL('image/png').split(',')[1];
      window.drawCaptionsOnly(t);
      return [cv.toDataURL('image/png').split(',')[1], clean];
    }, t);
    await write(a.ff.stdin, Buffer.from(imgs[0], 'base64'));
    await write(b.ff.stdin, Buffer.from(imgs[1], 'base64'));
    if (f % 125 === 0) console.log(`frame ${f}/${N}`);
  }
  a.ff.stdin.end(); b.ff.stdin.end();
  await Promise.all([a.done, b.done]);
  console.log('done');
}
await browser.close();
server.close();
