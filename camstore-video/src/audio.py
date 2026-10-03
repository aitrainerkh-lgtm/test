"""Soundtrack: synthesized background music, sound effects and voiceover mix."""
import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

SR = 48000
rng = np.random.default_rng(7)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a, r, sustain=1.0):
    e = np.full(n, sustain)
    na, nr = int(a * SR), int(r * SR)
    na, nr = min(na, n), min(nr, n)
    e[:na] = np.linspace(0, sustain, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def add(buf, sig, at, gain=1.0, pan=0.0):
    """Mix mono or stereo sig into stereo buf at time `at`."""
    i = int(at * SR)
    if i >= len(buf):
        return
    if sig.ndim == 1:
        lg, rg = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * lg * 1.414, sig * rg * 1.414], 1)
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def reverb(x, seconds=2.2, wet=0.25):
    n = int(seconds * SR)
    t = np.arange(n) / SR
    out = np.empty_like(x)
    for c in range(2):
        ir = rng.standard_normal(n) * np.exp(-t * 6.0 / seconds)
        ir = sosfilt(butter(2, 5000, "low", fs=SR, output="sos"), ir)
        ir /= np.sqrt(np.sum(ir ** 2))
        out[:, c] = fftconvolve(x[:, c], ir)[: len(x)]
    return x * (1 - wet) + out * wet


# ---------------------------------------------------------------- music
CHORDS = [  # Cadd9, G6, Am7, Fmaj7  (I - V - vi - IV)
    [48, 55, 64, 67, 74],
    [43, 50, 59, 62, 64],
    [45, 52, 60, 64, 67],
    [41, 48, 57, 60, 64],
]
BPM = 96
BEAT = 60 / BPM
BAR = 4 * BEAT


def pad_note(f, dur):
    t = t_axis(dur)
    s = np.zeros_like(t)
    for det in (-0.0018, 0.0, 0.0021):
        ff = f * (1 + det)
        s += np.sin(2 * np.pi * ff * t) + 0.25 * np.sin(4 * np.pi * ff * t) + 0.08 * np.sin(6 * np.pi * ff * t)
    return s / 3 * env_adsr(len(t), 0.9, 1.4)


def pluck(f, dur=0.9):
    t = t_axis(dur)
    s = sum((1 / k ** 1.3) * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (3 + 4 * k)) for k in range(1, 7))
    a = int(0.003 * SR)
    s[:a] *= np.linspace(0, 1, a)
    return s


def kick():
    t = t_axis(0.35)
    f = 48 + 75 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def hat():
    t = t_axis(0.06)
    n = sosfilt(butter(4, 7500, "high", fs=SR, output="sos"), rng.standard_normal(len(t)))
    return n * np.exp(-t * 70)


def music(total, groove_start, end_chord_at):
    buf = np.zeros((int(total * SR), 2))
    chord_len = 2 * BAR
    n_ch = int(np.ceil(end_chord_at / chord_len))
    for k in range(n_ch):
        at = k * chord_len
        ch = CHORDS[k % 4]
        for i, n in enumerate(ch):
            add(buf, pad_note(midi(n), chord_len + 1.2), at, 0.055, pan=-0.5 + i * 0.25)
    # final ringing chord
    for i, n in enumerate(CHORDS[0] + [79]):
        add(buf, pad_note(midi(n), total - end_chord_at + 0.5), end_chord_at, 0.06, pan=-0.5 + i * 0.2)
    # groove: bass, arpeggio, light drums
    pattern = [0, 2, 3, 4, 3, 2, 1, 2]
    t = groove_start
    step = BEAT / 2
    k = 0
    while t < end_chord_at - 0.05:
        ch = CHORDS[int(t // chord_len) % 4]
        if k % 4 == 0:
            add(buf, pluck(midi(ch[0] - 12), 1.1) * 0.9, t, 0.16)
        add(buf, pluck(midi(ch[pattern[k % 8] % len(ch)] + 12), 0.8), t, 0.045, pan=0.45 if k % 2 else -0.45)
        if k % 8 in (0, 4) and t > groove_start + 2 * BAR:
            add(buf, kick(), t, 0.22)
        if k % 2 == 1 and t > groove_start + BAR:
            add(buf, hat(), t, 0.05, pan=0.3)
        t += step
        k += 1
    buf = reverb(buf, 2.4, 0.28)
    # fades
    fi = int(1.5 * SR)
    buf[:fi] *= np.linspace(0, 1, fi)[:, None]
    fo = int(1.8 * SR)
    buf[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 1.5
    return buf


# ---------------------------------------------------------------- sound effects
def sweep_noise(dur, f0, f1, f2, q=1.4):
    """Noise through a band-pass whose centre moves f0 -> f1 -> f2 (overlap-add STFT filter)."""
    n = int(dur * SR)
    x = rng.standard_normal(n + 2048)
    win, hop = 1024, 256
    out = np.zeros(n + 2048)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    w = np.hanning(win)
    for s in range(0, n, hop):
        p = s / n
        fc = f0 + (f1 - f0) * (p / 0.5) if p < 0.5 else f1 + (f2 - f1) * ((p - 0.5) / 0.5)
        resp = np.exp(-0.5 * (np.log(np.maximum(freqs, 1) / fc) * q * 2) ** 2)
        seg = np.fft.irfft(np.fft.rfft(x[s:s + win] * w) * resp)
        out[s:s + win] += seg * w
    out = out[:n]
    return out / (np.abs(out).max() + 1e-9)


def whoosh(dur=0.75):
    s = sweep_noise(dur, 350, 2600, 700)
    t = t_axis(dur)
    e = np.sin(np.pi * np.clip(t / dur, 0, 1)) ** 1.6
    return s * e


def tick():
    t = t_axis(0.12)
    f = 1500 * np.exp(-t * 18) + 650
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 38)
    return s


def sparkle():
    out = np.zeros(int(1.6 * SR))
    for i, n in enumerate([84, 88, 91, 96, 100]):
        t = t_axis(1.2)
        s = (np.sin(2 * np.pi * midi(n) * t) + 0.3 * np.sin(2 * np.pi * midi(n) * 2.01 * t)) * np.exp(-t * 4.5)
        a = int(i * 0.055 * SR)
        out[a:a + len(s)] += s * (0.9 - i * 0.1)
    return out / np.abs(out).max()


def riser(dur=1.1):
    t = t_axis(dur)
    s = sweep_noise(dur, 200, 900, 4000, q=0.9) * (t / dur) ** 2
    f = 180 + 520 * (t / dur) ** 2
    s += 0.5 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (t / dur) ** 2
    return s / np.abs(s).max()


def impact():
    t = t_axis(1.4)
    f = 38 + 50 * np.exp(-t * 12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    noise = sosfilt(butter(2, 900, "low", fs=SR, output="sos"), rng.standard_normal(len(t))) * np.exp(-t * 14)
    s = boom + 0.6 * noise / np.abs(noise).max()
    return s / np.abs(s).max()


def bell_chord():
    out = np.zeros(int(2.5 * SR))
    for n in [72, 76, 79, 84]:
        t = t_axis(2.5)
        out += (np.sin(2 * np.pi * midi(n) * t) + 0.4 * np.sin(2 * np.pi * midi(n) * 3.0 * t) * np.exp(-t * 3)) * np.exp(-t * 1.6)
    return out / np.abs(out).max()


def sfx_track(total, events):
    buf = np.zeros((int(total * SR), 2))
    made = {"whoosh": whoosh(), "tick": tick(), "sparkle": sparkle(), "riser": riser(),
            "impact": impact(), "bell": bell_chord()}
    gains = {"whoosh": 0.30, "tick": 0.10, "sparkle": 0.16, "riser": 0.22, "impact": 0.40, "bell": 0.20}
    for kind, at, pan in events:
        add(buf, made[kind], at, gains[kind], pan)
    return reverb(buf, 1.6, 0.18)


# ---------------------------------------------------------------- final mix
def mix(total, music_buf, sfx_buf, voice_clips):
    """voice_clips: list of (start_time, mono float array @ SR)."""
    voice = np.zeros((int(total * SR), 2))
    active = np.zeros(int(total * SR))
    for at, clip in voice_clips:
        add(voice, clip, at, 1.0)
        i = int(at * SR)
        active[i:i + len(clip)] = 1
    if voice_clips:
        # ducking envelope: fast attack, slow release
        k = int(0.35 * SR)
        smooth = np.convolve(active, np.ones(k) / k, mode="same")
        duck = 0.85 - 0.5 * np.clip(smooth * 1.6, 0, 1)
    else:
        duck = np.full(len(active), 0.85)
    out = music_buf * duck[:, None] + sfx_buf + voice * 0.95
    peak = np.abs(out).max()
    return out / peak * 0.89 if peak > 0.89 else out
