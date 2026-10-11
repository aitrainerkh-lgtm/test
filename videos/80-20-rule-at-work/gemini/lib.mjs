// Shared Gemini helpers: client, model resolution, retries, file paths.
import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const p = (...parts) => path.join(PROJECT_DIR, ...parts);

export const VOICE = process.env.GEMINI_VOICE || 'Kore';
// Requested narration model: "Gemini 3.8 Flash TTS".
const TTS_MODEL_PATTERN = /^gemini-3\.8-flash.*tts/;

export function client() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set. Add it to the environment, then run again.');
    process.exit(2);
  }
  return new GoogleGenAI({ apiKey });
}

export async function listModels(ai) {
  const names = [];
  const pager = await ai.models.list({ config: { pageSize: 200 } });
  for await (const m of pager) names.push(m.name.replace(/^models\//, ''));
  return names;
}

// Narration model. Never falls back silently to a different TTS model.
export async function resolveTtsModel(ai) {
  if (process.env.GEMINI_TTS_MODEL) return process.env.GEMINI_TTS_MODEL;
  const names = await listModels(ai);
  const hits = names.filter((n) => TTS_MODEL_PATTERN.test(n));
  if (!hits.length) {
    const tts = names.filter((n) => /tts/.test(n));
    console.error('Gemini 3.8 Flash TTS was not found for this API key.');
    console.error('TTS models available: ' + (tts.join(', ') || 'none'));
    console.error('Set GEMINI_TTS_MODEL to choose one explicitly.');
    process.exit(3);
  }
  // Prefer a stable name over preview names when both exist.
  return hits.find((n) => !/preview|exp/.test(n)) || hits[0];
}

// Script model: newest Gemini Pro text model, unless set explicitly.
export async function resolveTextModel(ai) {
  if (process.env.GEMINI_TEXT_MODEL) return process.env.GEMINI_TEXT_MODEL;
  const names = await listModels(ai);
  const pro = names
    .filter((n) => /^gemini-\d+(\.\d+)?-pro($|-)/.test(n) && !/tts|image|audio|live|embedding|vision/.test(n))
    .map((n) => ({ n, v: parseFloat(n.match(/^gemini-(\d+(?:\.\d+)?)/)[1]), stable: !/preview|exp/.test(n) }))
    .sort((a, b) => b.v - a.v || b.stable - a.stable);
  if (!pro.length) {
    console.error('No Gemini Pro text model found. Set GEMINI_TEXT_MODEL.');
    process.exit(3);
  }
  return pro[0].n;
}

// Retries rate limits and server errors. Waits as long as the API asks (free-tier
// per-minute limits), but stops at once when a daily quota is used up.
export async function withRetry(label, fn, tries = 8) {
  let wait = 2000;
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const status = e?.status || e?.code;
      const retryable = !status || status === 429 || status >= 500;
      if (i >= tries || !retryable) throw e;
      const asked = Number(/"retryDelay":"(\d+)s"/.exec(e?.message || '')?.[1] || 0) * 1000;
      if (asked > 5 * 60 * 1000) {
        console.error(`${label}: daily quota used up (retry in ${Math.round(asked / 3600000)} h). Try again later or use a paid key.`);
        throw e;
      }
      const delay = Math.max(wait, asked + 1000);
      console.warn(`${label}: attempt ${i} failed (${status || e.message.slice(0, 80)}); retrying in ${Math.round(delay / 1000)}s`);
      await new Promise((r) => setTimeout(r, delay));
      wait = Math.min(wait * 2, 60000);
    }
  }
}

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function writeJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
}

// Khmer digits ០-៩ to ASCII, so numbers in narration can be checked against chart data.
export function asciiDigits(s) {
  return s.replace(/[០-៩]/g, (d) => String(d.charCodeAt(0) - 0x17e0));
}
