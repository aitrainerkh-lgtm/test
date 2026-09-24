// POST /api/token
// Creates a short-lived, single-use Gemini Live token for the browser.
// The real GEMINI_API_KEY stays on the server and is never sent to the phone.
import { GoogleGenAI } from '@google/genai';

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-live';
const VOICE = process.env.GEMINI_VOICE || '';
const ACCESS_CODE = process.env.ACCESS_CODE || '';

// Simple per-instance rate limit: max 20 tokens per IP per 10 minutes.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 20;
const hits = new Map();

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(ip, list);
  return list.length > MAX_PER_WINDOW;
}

function send(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' });

  if (!process.env.GEMINI_API_KEY) return send(res, 500, { error: 'missing_api_key' });

  if (ACCESS_CODE && req.headers['x-access-code'] !== ACCESS_CODE) {
    return send(res, 401, { error: 'access_code_required' });
  }

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  if (tooMany(ip)) return send(res, 429, { error: 'rate_limited' });

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const now = Date.now();
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        // The session may run up to 30 minutes; it must start within 2 minutes.
        expireTime: new Date(now + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(now + 2 * 60 * 1000).toISOString(),
        // The token only works for this Live model.
        liveConnectConstraints: { model: MODEL },
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });
    return send(res, 200, { token: token.name, model: MODEL, voice: VOICE });
  } catch (err) {
    console.error('Token error:', err?.message || err);
    return send(res, 502, { error: 'token_failed' });
  }
}
