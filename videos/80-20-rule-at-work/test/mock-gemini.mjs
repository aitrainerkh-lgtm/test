// Test only: a local stand-in for the Gemini REST API, to dry-run the pipeline
// without a key. Speech is silence whose length follows the text length.
// Run: node test/mock-gemini.mjs & then
//   GOOGLE_GEMINI_BASE_URL=http://127.0.0.1:8787 GEMINI_API_KEY=mock npm run script
import http from 'node:http';
import fs from 'node:fs';
import { khmerLength } from '../gemini/plan.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('./fixture/script.json', import.meta.url)));
fixture.problem.narration.rule = 'ច្បាប់ 80/20 ' + fixture.problem.narration.rule;
let calls = 0;
let tts = 0;

http.createServer((req, res) => {
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const send = (obj) => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(obj)); };
    if (req.method === 'GET' && req.url.includes('/models')) {
      return send({ models: ['gemini-3.8-flash-tts', 'gemini-3.5-pro', 'gemini-3.8-pro-preview', 'gemini-3.8-flash'].map((n) => ({ name: `models/${n}` })) });
    }
    const b = JSON.parse(body || '{}');
    const text = b.contents?.[0]?.parts?.[0]?.text || '';
    const cfg = b.generationConfig || {};
    const reply = (t) => send({ candidates: [{ content: { role: 'model', parts: [t] } }] });
    calls++;
    if ((cfg.responseModalities || []).includes('AUDIO')) {
      console.log(`TTS call ${++tts}`);
      const spoken = text.split('\n').slice(1).join('\n') || text;
      // Tone for each paragraph (slower than the fixture assumed), 0.5 s of silence between paragraphs.
      const pcm = Buffer.concat(spoken.split('\n\n').flatMap((para, k) => {
        const tone = Buffer.alloc(Math.round((khmerLength(para) / 11.5) * 24000) * 2);
        for (let i = 0; i < tone.length / 2; i++) tone.writeInt16LE(Math.round(6000 * Math.sin(i / 10)), i * 2);
        return k ? [Buffer.alloc(24000), tone] : [tone];
      }));
      return reply({ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: pcm.toString('base64') } });
    }
    if (cfg.responseMimeType === 'application/json') {
      if (/This is the "/.test(text)) {
        // Refit: cut each segment to the requested character count.
        const out = {};
        for (const m of text.matchAll(/- (\w+): now .*?about (\d+) chars\n  current text: (.*)/g)) {
          const words = m[3].split(' ');
          let t = '';
          for (const w of words) if (khmerLength(t + w) <= Number(m[2])) t = t ? `${t} ${w}` : w;
          out[m[1]] = t || words[0];
        }
        return reply({ text: JSON.stringify(out) });
      }
      return reply({ text: JSON.stringify(fixture) });
    }
    return reply({ text: 'ការងារ ប្រចាំថ្ងៃ សំខាន់។ អតិថិជន ផលិតផល ការលក់។ ពេលវេលា បុគ្គលិក លទ្ធផល។' });
  });
}).listen(8787, '127.0.0.1', () => console.log('mock Gemini on :8787'));
process.on('SIGTERM', () => { console.log(`mock served ${calls} calls`); process.exit(0); });
