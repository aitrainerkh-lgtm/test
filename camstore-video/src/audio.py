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
# Soft, musical set tuned to the music's key (C major): marimba notes, airy swishes,
# a reversed-bell swell and a light chime. No harsh noise bursts or booms.
PENTA = [72, 74, 76, 79, 81, 84, 86, 88]  # C5 D5 E5 G5 A5 C6 D6 E6


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "low", fs=SR, output="sos"), x)


def marimba(note, dur=1.3):
    """Modal marimba bar: partials near 1 : 3.9 : 9.2 with faster decay for higher modes."""
    t = t_axis(dur)
    f = midi(note)
    s = np.zeros_like(t)
    for ratio, amp, dec in ((1.0, 1.0, 3.2), (3.93, 0.32, 11.0), (9.2, 0.09, 26.0)):
        if f * ratio < SR / 2.2:
            s += amp * np.sin(2 * np.pi * f * ratio * t) * np.exp(-t * dec)
    a = int(0.004 * SR)
    s[:a] *= np.linspace(0, 1, a)
    return s / np.abs(s).max()


def swish(dur=0.6, f0=500, f1=1900, f2=800, pan_from=-0.7, pan_to=0.7):
    """Airy stereo swish: soft band-passed noise that travels across the stereo field."""
    n = int(dur * SR)
    x = lowpass(rng.standard_normal(n + 2048), 4200, 4)
    win, hop = 1024, 256
    out = np.zeros(n + 2048)
    freqs = np.fft.rfftfreq(win, 1 / SR)
    w = np.hanning(win)
    for st in range(0, n, hop):
        p = st / n
        fc = f0 + (f1 - f0) * (p / 0.55) if p < 0.55 else f1 + (f2 - f1) * ((p - 0.55) / 0.45)
        resp = np.exp(-0.5 * (np.log(np.maximum(freqs, 1) / fc) * 1.6) ** 2)
        out[st:st + win] += np.fft.irfft(np.fft.rfft(x[st:st + win] * w) * resp) * w
    out = out[:n]
    t = np.arange(n) / n
    env = np.where(t < 0.55, (t / 0.55) ** 2, np.exp(-(t - 0.55) * 7))
    mono = out / (np.abs(out).max() + 1e-9) * env
    pan = pan_from + (pan_to - pan_from) * t
    left, right = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    return np.stack([mono * left, mono * right], 1) * 1.414


def felt_thump():
    """Very soft low 'landing' under a transition."""
    t = t_axis(0.35)
    f = 70 + 40 * np.exp(-t * 25)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 14)
    a = int(0.006 * SR)
    s[:a] *= np.linspace(0, 1, a)
    return s


def chime(notes=(84, 88, 91, 96), gap=0.07):
    out = np.zeros(int((len(notes) * gap + 1.6) * SR))
    for i, n in enumerate(notes):
        t = t_axis(1.5)
        s = (np.sin(2 * np.pi * midi(n) * t) + 0.18 * np.sin(2 * np.pi * midi(n) * 2.0 * t) * np.exp(-t * 6)) * np.exp(-t * 3.0)
        a = int(i * gap * SR)
        out[a:a + len(s)] += s * (1 - i * 0.12)
    return lowpass(out / np.abs(out).max(), 7000)


def reverse_swell(dur=1.4):
    """Bell chord with reverb, played backwards: a smooth swell that lands on its end."""
    t = t_axis(dur)
    s = np.zeros_like(t)
    for n in (60, 64, 67, 71, 74):
        s += np.sin(2 * np.pi * midi(n) * t) * np.exp(-t * 2.5)
    st = reverb(np.stack([s, s], 1), 1.8, 0.6)[::-1]
    fade = int(0.03 * SR)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    return st / np.abs(st).max()


def warm_chord():
    out = np.zeros(int(3.0 * SR))
    for i, n in enumerate((60, 67, 72, 76, 79)):
        m = marimba(n, 3.0)
        a = int(i * 0.045 * SR)
        out[a:] += m[: len(out) - a] * (1 - i * 0.1)
    return out / np.abs(out).max()


def sfx_track(total, events):
    """events: (kind, time, pan, arg[, gain multiplier]) — arg is a MIDI note for 'marimba'."""
    buf = np.zeros((int(total * SR), 2))
    fixed = {"swish": swish(), "swish_rl": swish(0.6, 500, 1900, 800, 0.7, -0.7), "swish_up": swish(0.6, 400, 2300, 1400, 0.0, 0.0), "thump": felt_thump(),
             "chime": chime(), "swell": reverse_swell(), "chord": warm_chord()}
    gains = {"swish": 0.13, "swish_rl": 0.13, "swish_up": 0.11, "thump": 0.10, "chime": 0.10, "swell": 0.14, "chord": 0.16,
             "marimba": 0.075}
    for kind, at, pan, arg, *mult in events:
        sig = marimba(arg) if kind == "marimba" else fixed[kind]
        if kind == "swell":
            at -= len(sig) / SR  # the swell ends on the given time
        add(buf, sig, max(at, 0.0), gains[kind] * (mult[0] if mult else 1.0), pan)
    return reverb(buf, 1.8, 0.22)


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
