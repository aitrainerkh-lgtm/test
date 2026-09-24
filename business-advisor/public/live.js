// Live voice session with Gemini: microphone in, advisor voice out.
import { GoogleGenAI, Modality } from './vendor/genai.mjs';
import { START_MESSAGE } from './prompt.js';

const CONNECT_TIMEOUT_MS = 15000;
const IDLE_STOP_MS = 3 * 60 * 1000; // stop after 3 minutes of silence to save cost
const MAX_RECONNECTS = 3;

export class LiveAdvisor extends EventTarget {
  constructor({ getSystemInstruction, getAccessCode }) {
    super();
    this.getSystemInstruction = getSystemInstruction;
    this.getAccessCode = getAccessCode;
    this.state = 'idle';
    this.gen = 0;
    this.sources = new Set();
  }

  setState(state) {
    if (this.state === state) return;
    this.state = state;
    this.dispatchEvent(new CustomEvent('state', { detail: state }));
  }

  fail(code, detail) {
    if (detail) console.warn('Business Advisor:', code, detail);
    this.dispatchEvent(new CustomEvent('failure', { detail: code }));
    this.stop();
  }

  // Must be called from a tap/click so the browser allows audio.
  async start() {
    if (this.state !== 'idle') return;
    this.stopping = false;
    this.handle = null;
    this.systemInstruction = this.getSystemInstruction();
    this.setState('connecting');

    this.ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    const resumed = this.ctx.resume();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      });
    } catch (err) {
      return this.fail('mic_denied', err);
    }
    if (this.stopping) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
      return;
    }

    try {
      await resumed;
      await this.ctx.audioWorklet.addModule(new URL('./mic-worklet.js', import.meta.url));
      this.buildAudioGraph();
    } catch (err) {
      return this.fail('audio_failed', err);
    }

    try {
      await this.connect();
    } catch (err) {
      if (!this.stopping) this.fail(err.code || 'connect_failed', err);
      return;
    }
    if (this.stopping) return;

    this.session.sendRealtimeInput({ text: START_MESSAGE });
    this.lastActivity = Date.now();
    this.idleTimer = setInterval(() => {
      if (Date.now() - this.lastActivity > IDLE_STOP_MS) {
        this.dispatchEvent(new CustomEvent('idle-stop'));
        this.stop();
      }
    }, 5000);
  }

  buildAudioGraph() {
    const ctx = this.ctx;
    this.micSource = ctx.createMediaStreamSource(this.stream);
    this.micAnalyser = ctx.createAnalyser();
    this.micAnalyser.fftSize = 512;
    this.micSource.connect(this.micAnalyser);

    this.worklet = new AudioWorkletNode(ctx, 'mic-processor');
    const mute = ctx.createGain();
    mute.gain.value = 0;
    this.micSource.connect(this.worklet).connect(mute).connect(ctx.destination);
    this.worklet.port.onmessage = (e) => this.sendMic(e.data);

    this.outGain = ctx.createGain();
    this.outAnalyser = ctx.createAnalyser();
    this.outAnalyser.fftSize = 512;
    this.outGain.connect(this.outAnalyser).connect(ctx.destination);
    this.playHead = 0;
    this.levelData = new Float32Array(512);
  }

  async fetchToken() {
    const headers = {};
    const code = this.getAccessCode();
    if (code) headers['x-access-code'] = code;
    let res;
    try {
      res = await fetch(new URL('api/token', document.baseURI), { method: 'POST', headers });
    } catch {
      throw Object.assign(new Error('offline'), { code: 'offline' });
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(body.error || 'token_failed'), { code: body.error || 'token_failed' });
    return body;
  }

  async connect() {
    const { token, model, voice } = await this.fetchToken();
    const ai = new GoogleGenAI({ apiKey: token, httpOptions: { apiVersion: 'v1alpha' } });

    const config = {
      responseModalities: [Modality.AUDIO],
      systemInstruction: { parts: [{ text: this.systemInstruction }] },
      contextWindowCompression: { slidingWindow: {} },
      sessionResumption: this.handle ? { handle: this.handle } : {},
    };
    if (voice) config.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } };

    const gen = ++this.gen;
    let rejectEarly;
    const early = new Promise((_, reject) => (rejectEarly = reject));
    let ready = false;

    const connecting = ai.live.connect({
      model,
      config,
      callbacks: {
        onmessage: (msg) => gen === this.gen && this.onMessage(msg),
        onerror: (e) => {
          if (gen !== this.gen) return;
          if (!ready) rejectEarly(Object.assign(new Error('socket_error'), { code: 'connect_failed' }));
        },
        onclose: (e) => {
          if (gen !== this.gen) return;
          if (!ready) {
            rejectEarly(Object.assign(new Error(`closed ${e?.code} ${e?.reason || ''}`), { code: 'connect_failed' }));
          } else {
            this.onDrop(e);
          }
        },
      },
    });
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'connect_failed' })), CONNECT_TIMEOUT_MS),
    );

    try {
      this.session = await Promise.race([connecting, early, timeout]);
    } catch (err) {
      this.gen++;
      connecting.then((s) => s.close()).catch(() => {});
      throw err;
    }
    ready = true;
    if (this.stopping) {
      this.gen++;
      this.session.close();
      throw Object.assign(new Error('stopped'), { code: 'stopped' });
    }
    this.live = true;
    this.setState(this.sources.size ? 'speaking' : 'listening');
  }

  sendMic(pcm) {
    if (!this.live || !this.session) return;
    let sum = 0;
    for (let i = 0; i < pcm.length; i += 4) sum += pcm[i] * pcm[i];
    if (Math.sqrt(sum / (pcm.length / 4)) > 1200) this.lastActivity = Date.now();
    try {
      this.session.sendRealtimeInput({ audio: { data: toBase64(new Uint8Array(pcm.buffer)), mimeType: 'audio/pcm;rate=16000' } });
    } catch {
      // Socket is closing; the drop handler will reconnect.
    }
  }

  onMessage(msg) {
    const upd = msg.sessionResumptionUpdate;
    if (upd?.resumable && upd.newHandle) this.handle = upd.newHandle;

    if (msg.goAway) this.reconnect();

    const content = msg.serverContent;
    if (!content) return;
    if (content.interrupted) this.flushPlayback();
    for (const part of content.modelTurn?.parts || []) {
      const data = part.inlineData;
      if (data?.data && (data.mimeType || '').startsWith('audio/')) this.play(data.data, data.mimeType);
    }
  }

  onDrop(e) {
    if (this.stopping) return;
    this.live = false;
    if (this.handle) this.reconnect();
    else this.fail('connection_lost', e && `${e.code} ${e.reason || ''}`);
  }

  async reconnect() {
    if (this.reconnecting || this.stopping) return;
    this.reconnecting = true;
    this.live = false;
    this.setState('reconnecting');
    const old = this.session;
    this.gen++; // ignore events from the old socket
    try {
      old?.close();
    } catch {}

    for (let attempt = 0; attempt < MAX_RECONNECTS && !this.stopping; attempt++) {
      try {
        if (attempt) await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        if (this.stopping) break;
        await this.connect();
        this.reconnecting = false;
        return;
      } catch (err) {
        console.warn('Reconnect failed:', err?.message);
      }
    }
    this.reconnecting = false;
    if (!this.stopping) this.fail('connection_lost');
  }

  play(b64, mimeType) {
    const ctx = this.ctx;
    if (!ctx || ctx.state === 'closed') return;
    const rate = Number(/rate=(\d+)/.exec(mimeType || '')?.[1]) || 24000;
    const bytes = fromBase64(b64);
    const pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
    if (!pcm.length) return;
    const buffer = ctx.createBuffer(1, pcm.length, rate);
    const ch = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.connect(this.outGain);
    const now = ctx.currentTime;
    if (this.playHead < now + 0.02) this.playHead = now + 0.08; // small buffer against network jitter
    src.start(this.playHead);
    this.playHead += buffer.duration;
    this.sources.add(src);
    src.onended = () => {
      this.sources.delete(src);
      if (!this.sources.size && this.live) this.setState('listening');
    };
    this.lastActivity = Date.now();
    if (this.live) this.setState('speaking');
  }

  flushPlayback() {
    for (const src of this.sources) {
      src.onended = null;
      try {
        src.stop();
      } catch {}
    }
    this.sources.clear();
    this.playHead = 0;
    if (this.live) this.setState('listening');
  }

  // 0..1 loudness of whoever is talking, for the orb animation.
  level() {
    const analyser = this.state === 'speaking' ? this.outAnalyser : this.micAnalyser;
    if (!analyser || !this.levelData) return 0;
    analyser.getFloatTimeDomainData(this.levelData);
    let sum = 0;
    for (let i = 0; i < this.levelData.length; i++) sum += this.levelData[i] ** 2;
    return Math.min(1, Math.sqrt(sum / this.levelData.length) * 4);
  }

  stop() {
    if (this.state === 'idle' && !this.ctx) return;
    this.stopping = true;
    this.live = false;
    this.gen++;
    clearInterval(this.idleTimer);
    try {
      this.session?.close();
    } catch {}
    this.session = null;
    this.flushPlayback();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.worklet) this.worklet.port.onmessage = null;
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.micAnalyser = this.outAnalyser = null;
    this.reconnecting = false;
    this.setState('idle');
  }
}

function toBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
