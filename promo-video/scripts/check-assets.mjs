// Scans public/ for the files you provide (logo, photo, QR, audio, fonts, icons)
// and writes src/generated/assets.json so the video uses them when present
// and clean built-in fallbacks when they are missing.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import QRCode from 'qrcode';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const pub = path.join(root, 'public');
const genDir = path.join(root, 'src', 'generated');
fs.mkdirSync(genDir, {recursive: true});
fs.mkdirSync(path.join(pub, 'generated'), {recursive: true});

const exists = (rel) => fs.existsSync(path.join(pub, rel));
const firstExisting = (names) => names.find((n) => exists(n)) ?? null;

const audioDuration = (rel) => {
  try {
    const out = execFileSync('ffprobe', [
      '-v', 'error', '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1', path.join(pub, rel),
    ]).toString().trim();
    return Number(out) || null;
  } catch {
    return null;
  }
};

const fontFiles = fs.existsSync(path.join(pub, 'fonts'))
  ? fs.readdirSync(path.join(pub, 'fonts')).filter((f) => /\.(ttf|otf)$/i.test(f))
  : [];
const findFont = (re) => {
  const f = fontFiles.find((name) => re.test(name.replace(/[\s_-]/g, '')));
  return f ? `fonts/${f}` : null;
};

const icon = (id) => firstExisting([`icons/${id}.png`, `icons/${id}.svg`, `icons/${id}.webp`]);

const voiceover = firstExisting(['voiceover.mp3', 'voiceover.wav', 'voiceover.m4a']);
const music = firstExisting(['music.mp3', 'music.wav', 'music.m4a']);

// Read the Telegram link for the fallback QR straight from config.ts.
const configSrc = fs.readFileSync(path.join(root, 'src', 'config.ts'), 'utf8');
const qrUrl = (configSrc.match(/fallbackQrUrl:\s*'([^']+)'/) ?? [])[1] ?? 'https://t.me/';
const qr = firstExisting(['qr.png', 'qr.jpg', 'qr.svg']);
if (!qr) {
  const svg = await QRCode.toString(qrUrl, {
    type: 'svg', margin: 0, errorCorrectionLevel: 'M',
    color: {dark: '#14246B', light: '#FFFFFF'},
  });
  fs.writeFileSync(path.join(pub, 'generated', 'fallback-qr.svg'), svg);
}

const manifest = {
  logo: firstExisting(['logo.png', 'logo.svg', 'logo.webp']),
  hook: firstExisting(['hook.jpg', 'hook.jpeg', 'hook.png', 'hook.webp']),
  qr: qr ?? 'generated/fallback-qr.svg',
  qrIsFallback: !qr,
  voiceover,
  voiceoverDuration: voiceover ? audioDuration(voiceover) : null,
  music,
  musicDuration: music ? audioDuration(music) : null,
  fonts: {
    khmerHeading: findFont(/muol/i),
    khmerBody: findFont(/battambang/i),
  },
  icons: {
    chatgpt: icon('chatgpt'),
    claude: icon('claude'),
    gemini: icon('gemini'),
    copilot: icon('copilot'),
  },
};

fs.writeFileSync(path.join(genDir, 'assets.json'), JSON.stringify(manifest, null, 2) + '\n');

// Voice timing is only valid for the voiceover it was made from.
const timingPath = path.join(genDir, 'voice-timing.json');
if (!fs.existsSync(timingPath) || !voiceover) {
  fs.writeFileSync(timingPath, JSON.stringify({segments: []}, null, 2) + '\n');
}

const mark = (v) => (v ? 'found   ' : 'missing ');
console.log('Assets in public/:');
console.log(`  ${mark(manifest.logo)} logo.png`);
console.log(`  ${mark(manifest.hook)} hook.jpg`);
console.log(`  ${mark(qr)} qr.png${qr ? '' : `  (using a generated QR for ${qrUrl})`}`);
console.log(`  ${mark(voiceover)} voiceover.mp3${manifest.voiceoverDuration ? `  (${manifest.voiceoverDuration.toFixed(2)} s)` : ''}`);
console.log(`  ${mark(music)} music.mp3`);
console.log(`  ${mark(manifest.fonts.khmerHeading)} fonts/Khmer OS Muol Light (.ttf)  ${manifest.fonts.khmerHeading ? '' : '(using Moul)'}`);
console.log(`  ${mark(manifest.fonts.khmerBody)} fonts/Khmer OS Battambang (.ttf)  ${manifest.fonts.khmerBody ? '' : '(using Battambang)'}`);
if (voiceover) {
  const t = JSON.parse(fs.readFileSync(timingPath, 'utf8'));
  if (!t.segments?.length) {
    console.log('\n  Voiceover found but not synced yet. Run: npm run sync');
  }
}
