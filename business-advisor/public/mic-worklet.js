// Converts microphone audio to 16 kHz, 16-bit PCM chunks of 100 ms for Gemini.
class MicProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / 16000;
    this.chunk = new Int16Array(1600);
    this.length = 0;
    this.sum = 0;
    this.count = 0;
    this.step = 0;
  }

  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      // Average the input samples that fall into one output sample (simple low-pass + resample).
      this.sum += channel[i];
      this.count++;
      this.step++;
      if (this.step >= this.ratio) {
        this.step -= this.ratio;
        const v = Math.max(-1, Math.min(1, this.sum / this.count));
        this.chunk[this.length++] = v < 0 ? v * 0x8000 : v * 0x7fff;
        this.sum = 0;
        this.count = 0;
        if (this.length === this.chunk.length) {
          const out = this.chunk;
          this.port.postMessage(out, [out.buffer]);
          this.chunk = new Int16Array(1600);
          this.length = 0;
        }
      }
    }
    return true;
  }
}

registerProcessor('mic-processor', MicProcessor);
