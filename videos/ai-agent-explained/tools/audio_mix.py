"""Original score, sound design and final mix for "What Is an AI Agent?".

Everything is synthesized here (numpy + pedalboard, piano via FluidSynth
FluidR3_GM) and placed on the same clock as the visuals: the narration word
times in assets/audio/timeline.json. Output: assets/audio/mix.wav (48 kHz
stereo, -14 LUFS integrated, -1 dBTP) plus stems in assets/audio/stems/.
"""

import json
import re
import subprocess
import tempfile
from pathlib import Path

import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from pedalboard import (Chorus, Compressor, Delay, Gain, HighpassFilter, HighShelfFilter, LadderFilter,
                        Limiter, LowpassFilter, LowShelfFilter, PeakFilter, Pedalboard, Reverb)
from scipy.signal import butter, resample_poly, sosfilt

ROOT = Path(__file__).resolve().parent.parent
AUD = ROOT / "assets" / "audio"
SR = 48000
DUR = 60.0
N = int(SR * DUR)
RNG = np.random.default_rng(1234)

# ---------------------------------------------------------------- clock
TL = json.loads((AUD / "timeline.json").read_text())
WORDS = {}
for m in TL:
    n = m["id"][:2]
    for w in m["words"]:
        k = f'{n}:{re.sub(r"[^a-z0-9]", "", w["text"].lower().replace(chr(8217), "").replace(chr(39), ""))}'
        base, i = k, 2
        while k in WORDS:
            k = f"{base}#{i}"; i += 1
        WORDS[k] = w["t"]


def V(k):
    return WORDS[k]


BPM = 108.23
BEAT = 60 / BPM
BAR = 4 * BEAT
T0 = V("04:thats") - 0.08          # ignition / drop (bar 0)
T_BREAK = T0 + 20 * BAR            # drums stop as "A chatbot talks." begins


def bar(i, beat=0.0):
    return T0 + i * BAR + beat * BEAT


def hz(note):
    names = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6,
             "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}
    m = re.match(r"([A-G][b#]?)(-?\d)", note)
    midi = 12 * (int(m.group(2)) + 1) + names[m.group(1)]
    return 440.0 * 2 ** ((midi - 69) / 12), midi


# ---------------------------------------------------------------- dsp utils
def buf():
    return np.zeros((2, N), dtype=np.float64)


def place(dst, x, t, gain=1.0, pan=0.0):
    """Add mono or stereo x into stereo dst at time t (s)."""
    i = int(round(t * SR))
    if x.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        x = np.stack([x * l * 1.4142, x * r * 1.4142])
    if i < 0:
        x = x[:, -i:]; i = 0
    n = min(x.shape[1], N - i)
    if n > 0:
        dst[:, i:i + n] += gain * x[:, :n]


def env_adsr(n, a, d, s, r, sr=SR):
    a_n, d_n, r_n = int(a * sr), int(d * sr), int(r * sr)
    s_n = max(0, n - a_n - d_n - r_n)
    e = np.concatenate([np.linspace(0, 1, a_n, endpoint=False) ** 1.6 if a_n else [],
                        np.linspace(1, s, d_n, endpoint=False) if d_n else [],
                        np.full(s_n, s),
                        np.linspace(s, 0, r_n) ** 1.3 if r_n else []])
    return np.pad(e, (0, max(0, n - len(e))))[:n]


def saw_blep(f, n, ph0=0.0):
    dt = f / SR
    ph = (ph0 + dt * np.arange(n)) % 1.0
    y = 2 * ph - 1
    m = ph < dt
    t = ph[m] / dt
    y[m] -= t + t - t * t - 1
    m = ph > 1 - dt
    t = (ph[m] - 1) / dt
    y[m] -= t * t + t + t + 1
    return y


def sos_bp(lo, hi, order=2):
    return butter(order, [lo, hi], btype="band", fs=SR, output="sos")


def noise(n):
    return RNG.standard_normal(n)


def fx(x, board):
    x = np.atleast_2d(x).astype(np.float32)
    return board(x, SR).astype(np.float64)


def sweep_filter(x, cut_fn, res=0.15, mode=LadderFilter.Mode.LPF24, block=256):
    """Ladder filter with per-block cutoff automation. x: (ch, n)."""
    x = np.atleast_2d(x).astype(np.float32)
    lf = LadderFilter(mode=mode, cutoff_hz=1000, resonance=res, drive=1.0)
    out = np.zeros_like(x)
    for s in range(0, x.shape[1], block):
        lf.cutoff_hz = float(np.clip(cut_fn(s / SR), 20, 20000))
        out[:, s:s + block] = lf.process(x[:, s:s + block], SR, reset=(s == 0))
    return out.astype(np.float64)


# ---------------------------------------------------------------- instruments
def supersaw(f, dur, a=0.9, r=1.6, voices=7, spread=14):
    n = int((dur + r) * SR)
    out = np.zeros((2, n))
    cents = np.linspace(-spread, spread, voices)
    for i, c in enumerate(cents):
        v = saw_blep(f * 2 ** (c / 1200), n, RNG.random())
        pan = (i / (voices - 1)) * 2 - 1
        out[0] += v * np.cos((pan * 0.8 + 1) * np.pi / 4)
        out[1] += v * np.sin((pan * 0.8 + 1) * np.pi / 4)
    out /= voices ** 0.5
    return out * env_adsr(n, a, 0.4, 0.85, r)


def pluck(f, dur=0.5, bright=1.0, decay=7.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    kmax = int(min(28, 15000 / f))
    for k in range(1, kmax + 1):
        y += (1 / k) * np.sin(2 * np.pi * k * f * t + 0.3 * k) * np.exp(-t * (decay + bright * 2.2 * k))
    y *= np.minimum(1, t / 0.002)
    return y * 0.5


def bell(f, dur=1.6, decay=3.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    parts = [(1, 1.0, 1.0), (2.0, 0.35, 1.6), (2.76, 0.4, 2.2), (5.4, 0.18, 3.5), (8.93, 0.08, 5)]
    y = sum(a * np.sin(2 * np.pi * f * m * t) * np.exp(-t * decay * d) for m, a, d in parts)
    return y * np.minimum(1, t / 0.0015) * 0.35


def sub_note(f, dur, a=0.01, r=0.12):
    n = int((dur + r) * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    return np.tanh(1.3 * y * env_adsr(n, a, 0.08, 0.8, r)) * 0.8


def kick():
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t * 32)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * np.exp(-t * 6.5)
    click = sosfilt(butter(2, 2500, "hp", fs=SR, output="sos"), noise(n)) * np.exp(-t * 400) * 0.35
    return np.tanh(1.6 * (body + click)) * 0.9


def clap():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    nz = sosfilt(sos_bp(900, 3200), noise(n))
    e = np.zeros(n)
    for d in (0, 0.011, 0.022):
        e += np.where(t >= d, np.exp(-(t - d) * 160), 0)
    e += np.where(t >= 0.03, np.exp(-(t - 0.03) * 16), 0) * 0.45
    y = nz * e
    return y / (np.abs(y).max() + 1e-9) * 0.75


def hat(open_=False):
    n = int((0.35 if open_ else 0.08) * SR)
    t = np.arange(n) / SR
    nz = sosfilt(butter(4, 7500, "hp", fs=SR, output="sos"), noise(n))
    metal = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in (3140, 4410, 5860, 7230)) * 0.08
    return (nz + metal) * np.exp(-t * (9 if open_ else 55)) * 0.28


def crash(dur=2.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    nz = sosfilt(butter(2, 4200, "hp", fs=SR, output="sos"), noise(n))
    return nz * np.exp(-t * 1.6) * np.minimum(1, t / 0.004) * 0.3


# ---------------------------------------------------------------- harmony
PROG = [  # (pad voicing, bass root, arp tones) — D minor: Dm9 | Bbmaj7 | Fadd9 | Csus2
    (["D3", "A3", "C4", "E4", "F4"], "D2", ["D4", "F4", "A4", "E5"]),
    (["Bb2", "F3", "A3", "D4"], "Bb1", ["Bb3", "D4", "F4", "A4"]),
    (["F3", "A3", "C4", "G4"], "F2", ["F4", "A4", "C5", "G5"]),
    (["C3", "G3", "D4", "E4"], "C2", ["C4", "E4", "G4", "D5"]),
]
ARP_PAT = [0, 1, 2, 3, 1, 2, 3, 2, 0, 2, 1, 3, 2, 1, 3, 1]


def render_music():
    pad, arp, bass, drums, lead, fxm = buf(), buf(), buf(), buf(), buf(), buf()

    # ---- pad: intro (bars -4..-1), drop sections (0..19), outro hold
    for b in range(-4, 20):
        voic = PROG[b % 4][0]
        for nn in voic:
            f, _ = hz(nn)
            g = 0.10 if b < 0 else 0.13
            place(pad, supersaw(f, BAR * 1.02, a=0.6 if b != -4 else 2.5, r=1.2), bar(b), g)
    # pad brightness automation (ladder LPF): dark intro, opens at drop, widest in loop
    def pad_cut(t):
        if t < T0:
            return 500 + 900 * max(0, (t - (T0 - 3 * BAR)) / (3 * BAR))
        if t < bar(4):
            return 1800
        if t < bar(16):
            return 1800 + 1700 * (t - bar(4)) / (12 * BAR)
        return 3000
    pad = sweep_filter(pad, pad_cut, res=0.1)

    # ---- outro: Fmaj9 bloom for the final line, then sustain to the end
    T_DOT = V("14:works") + 0.42
    for nn in ["Bb2", "F3", "A3", "D4"]:                      # under "A chatbot talks."
        place(pad, sweep_filter(supersaw(hz(nn)[0], T_DOT - T_BREAK, a=0.5, r=0.6), lambda t: 900), T_BREAK, 0.10)
    for nn in ["F2", "C3", "A3", "E4", "G4", "C5"]:            # final chord
        place(pad, sweep_filter(supersaw(hz(nn)[0], DUR - T_DOT, a=0.05, r=0.1),
                                lambda t: 3800 * np.exp(-t * 0.5) + 900), T_DOT, 0.12)

    # ---- arp: 16ths, enters quietly at bar -2, full from drop; pattern accents
    for b in range(-2, 20):
        tones = PROG[b % 4][2]
        for s in range(16):
            t = bar(b, s / 4)
            f, _ = hz(tones[ARP_PAT[s]])
            if b >= 16 and s % 8 == 7:
                f *= 2
            acc = 1.0 if s % 4 == 0 else 0.7
            g = 0.045 if b < 0 else 0.07
            place(arp, pluck(f, 0.45, bright=0.6 if b < 4 else 0.45), t, g * acc, pan=0.35 if s % 2 else -0.35)
    def arp_cut(t):
        if t < T0:
            return 1100
        if t < bar(4):
            return 2200
        return 2400 + 3400 * min(1, (t - bar(4)) / (12 * BAR))
    arp = sweep_filter(arp, arp_cut, res=0.2)
    arp = fx(arp, Pedalboard([Delay(delay_seconds=BEAT * 0.75, feedback=0.32, mix=0.28), Reverb(room_size=0.6, damping=0.5, wet_level=0.22, dry_level=0.85, width=1.0)]))

    # ---- sub bass: long notes in definition, 8th pulses in loop/example
    for b in range(0, 20):
        f, _ = hz(PROG[b % 4][1])
        if b < 4:
            place(bass, sub_note(f, BAR * 0.95, a=0.02, r=0.3), bar(b), 0.32)
        else:
            for e in range(8):
                place(bass, sub_note(f * (2 if e in (3, 7) else 1), BEAT * 0.42), bar(b, e / 2), 0.30 if e % 2 == 0 else 0.22)
    bass = fx(bass, Pedalboard([LowpassFilter(cutoff_frequency_hz=420)]))

    # ---- drums
    K, CL, H, HO = kick(), clap(), hat(), hat(True)
    for b in range(0, 20):
        for q in range(4):
            t = bar(b, q)
            if b < 4:
                if q in (0, 2):
                    place(drums, K, t, 0.55)
                place(drums, H, bar(b, q + 0.5), 0.35, pan=0.2)
            else:
                place(drums, K, t, 0.62)
                if b >= 5 and q in (1, 3):
                    place(drums, CL, t, 0.45, pan=-0.05)
                for s16 in range(4):
                    if s16 == 2:
                        place(drums, HO, bar(b, q + 0.5), 0.22, pan=0.25)
                    else:
                        place(drums, H, bar(b, q + s16 / 4), 0.22 if s16 else 0.3, pan=0.25)
    # fill into bar 16 (example section) and pre-break lift
    for s in range(8):
        place(drums, CL, bar(15, 2 + s / 4), 0.16 + 0.04 * s, pan=-0.1)
    drums = fx(drums, Pedalboard([Compressor(threshold_db=-14, ratio=3, attack_ms=8, release_ms=120), Reverb(room_size=0.25, wet_level=0.08, dry_level=1.0)]))

    # ---- example section lead (bells): short motif, answers each chord
    motifs = [  # diatonic answer phrase per chord (Dm9 | Bbmaj7 | Fadd9 | Csus2)
        [("D5", 0), ("F5", 0.5), ("A5", 1.0), ("G5", 2.0), ("F5", 2.5), ("E5", 3.0)],
        [("D5", 0), ("F5", 0.5), ("A5", 1.0), ("F5", 2.0), ("D5", 2.5), ("C5", 3.0)],
        [("C5", 0), ("F5", 0.5), ("A5", 1.0), ("G5", 2.0), ("F5", 2.5), ("C5", 3.0)],
        [("E5", 0), ("G5", 0.5), ("C6", 1.0), ("D6", 2.0), ("C6", 2.5), ("G5", 3.0)],
    ]
    for b in range(16, 20):
        for nn, beat in motifs[b % 4]:
            place(lead, bell(hz(nn)[0], 1.2, 3.2), bar(b, beat), 0.10, pan=0.15)
    lead = fx(lead, Pedalboard([Delay(delay_seconds=BEAT * 0.75, feedback=0.3, mix=0.3), Reverb(room_size=0.75, wet_level=0.3, dry_level=0.8)]))

    # ---- sidechain pump on pad/arp/bass from the kick grid (loop + example)
    pump = np.ones(N)
    for b in range(0, 20):
        for q in range(4):
            if b < 4 and q in (1, 3):
                continue
            i = int(bar(b, q) * SR)
            L = int(BEAT * SR)
            seg = 1 - 0.45 * np.exp(-np.arange(L) / (0.07 * SR))
            pump[i:i + L] = np.minimum(pump[i:i + L], seg[: len(pump[i:i + L])])
    for x in (pad, arp, bass):
        x *= pump

    # ---- intro texture: soft piano + low drone
    piano = render_piano()
    drone = buf()
    for nn in ["D2", "A2"]:
        place(drone, sweep_filter(supersaw(hz(nn)[0], T0 + 0.3, a=3.0, r=1.0, spread=8), lambda t: 380), 0.0, 0.09)

    # ---- hard stop at the break: short fade on rhythmic parts (tails stay in reverb parts)
    def gate(x, t, fade=0.18):
        i = int(t * SR); f = int(fade * SR)
        x[:, i:i + f] *= np.linspace(1, 0, f)
        x[:, i + f:] = 0
    for x in (arp, bass, drums, lead):
        gate(x, T_BREAK)

    music = pad + arp + bass + drums + lead + piano + drone + fxm
    stems = dict(pad=pad, arp=arp, bass=bass, drums=drums, lead=lead, piano=piano, drone=drone)
    return music, stems


def render_piano():
    """Piano part via FluidSynth: intro arpeggios + outro voicing."""
    mid = mido.MidiFile(ticks_per_beat=480)
    tr = mido.MidiTrack(); mid.tracks.append(tr)
    tempo = mido.bpm2tempo(120)  # 1 beat = 0.5 s → we place events in absolute seconds
    tr.append(mido.MetaMessage("set_tempo", tempo=tempo))
    tr.append(mido.Message("program_change", program=0, time=0))
    tr.append(mido.Message("control_change", control=64, value=0, time=0))
    events = []  # (time_s, note, vel, dur_s)
    intro = [["D4", "A4", "F5"], ["Bb3", "F4", "D5"], ["F4", "C5", "A5"], ["C4", "G4", "E5"]]
    for i, ch in enumerate(intro):
        t = bar(-4 + i)
        for j, nn in enumerate(ch):
            events.append((t + j * BEAT * 0.5, hz(nn)[1], 54 - j * 4, BAR * 0.95))
        events.append((t, hz(["D3", "Bb2", "F3", "C3"][i])[1], 44, BAR))
    T_DOT = V("14:works") + 0.42
    for j, nn in enumerate(["D5", "A4", "F4"]):              # under "A chatbot talks."
        events.append((T_BREAK + 0.05 + j * 0.42, hz(nn)[1], 46, 2.0))
    for j, nn in enumerate(["F2", "C3", "A3", "E4", "G4", "C5", "A5"]):  # final chord, rolled
        events.append((T_DOT + j * 0.035, hz(nn)[1], 74 - j * 3, DUR - T_DOT))
    msgs = []
    for t, n, v, d in events:
        msgs.append((t, mido.Message("note_on", note=n, velocity=v)))
        msgs.append((min(DUR - 0.05, t + d), mido.Message("note_off", note=n, velocity=0)))
    msgs.sort(key=lambda m: m[0])
    last = 0
    for t, m in msgs:
        dt = int(round((t - last) / 0.5 * 480))
        tr.append(m.copy(time=max(0, dt)))
        last = t
    with tempfile.TemporaryDirectory() as d:
        mp, wp = Path(d) / "p.mid", Path(d) / "p.wav"
        mid.save(mp)
        subprocess.run(["fluidsynth", "-ni", "-g", "0.6", "-r", str(SR), "-F", str(wp),
                        "/usr/share/sounds/sf2/FluidR3_GM.sf2", str(mp)], check=True, capture_output=True)
        x, sr = sf.read(wp, always_2d=True)
    x = x.T
    out = buf()
    out[:, : min(N, x.shape[1])] = x[:, :N]
    out = fx(out, Pedalboard([HighpassFilter(cutoff_frequency_hz=90), LowShelfFilter(cutoff_frequency_hz=250, gain_db=-3),
                              HighShelfFilter(cutoff_frequency_hz=6000, gain_db=-2), Reverb(room_size=0.82, damping=0.45, wet_level=0.32, dry_level=0.75, width=1.0)]))
    return out * 0.9


# ---------------------------------------------------------------- sound design
def whoosh(dur=0.7, lo=300, hi=3500, peak=0.55):
    n = int(dur * SR)
    p = np.arange(n) / n
    shape = np.where(p < peak, np.sin(np.pi / 2 * p / peak), np.cos(np.pi / 2 * (p - peak) / (1 - peak)) * 0.7 + 0.3)
    y = sweep_filter(noise(n)[None, :], lambda s: lo * (hi / lo) ** float(np.interp(s / dur, p, shape)),
                     res=0.3, mode=LadderFilter.Mode.BPF12)[0]
    amp = np.where(p < peak, (p / peak) ** 2, ((1 - p) / (1 - peak)) ** 1.5)
    y = y * amp
    y /= np.abs(y).max() + 1e-9
    return np.stack([y * (1 - 0.5 * p), y * (0.5 + 0.5 * p)]) * 0.8


def riser(dur, lo=200, hi=7000):
    n = int(dur * SR)
    t = np.arange(n) / SR
    p = t / dur
    nz = sweep_filter(noise(n)[None, :], lambda s: lo * (hi / lo) ** (s / dur), res=0.4, mode=LadderFilter.Mode.BPF12)[0]
    f = 110 * 2 ** (2 * p)
    ph = 2 * np.pi * np.cumsum(f) / SR
    pitched = np.sin(ph) * 0.25 + np.sin(2 * ph) * 0.12
    nz /= np.abs(nz).max() + 1e-9
    y = (nz * 0.7 + pitched) * p ** 2.2
    y /= np.abs(y).max() + 1e-9
    return np.stack([y, np.roll(y, 240)]) * 0.8


def impact(big=1.0):
    n = int(3.5 * SR)
    t = np.arange(n) / SR
    f = 30 + 55 * np.exp(-t * 3.5)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.4)
    crack = sosfilt(butter(2, 1800, "lp", fs=SR, output="sos"), noise(n)) * np.exp(-t * 18) * 0.6
    y = np.tanh(1.8 * (boom + crack)) * big
    y = fx(np.stack([y, y]), Pedalboard([Reverb(room_size=0.9, damping=0.6, wet_level=0.3, dry_level=0.9, width=1.0)]))
    return y / (np.abs(y).max() + 1e-9) * 0.9


def reverse_swell(dur=0.65, chord=("D4", "A4", "F5")):
    tail = buf()[:, : int(3 * SR)]
    for nn in chord:
        tail[:, : int(0.4 * SR)] += bell(hz(nn)[0], 0.4, 2)[None, :] * 0.6
    tail += np.stack([sosfilt(butter(2, 3000, "hp", fs=SR, output="sos"), noise(tail.shape[1])) * np.exp(-np.arange(tail.shape[1]) / SR * 2) * 0.15] * 2)
    wet = fx(tail, Pedalboard([Reverb(room_size=0.95, damping=0.3, wet_level=1.0, dry_level=0.0, width=1.0)]))
    rev = wet[:, ::-1][:, -int(dur * SR):]
    return rev / (np.abs(rev).max() + 1e-9) * 0.6


def click(f=2200, dur=0.03, g=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 260) + sosfilt(sos_bp(2000, 6000), noise(n)) * np.exp(-t * 900) * 0.6
    return y * g * 0.5


def key_tap():
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    f = 1500 + RNG.random() * 900
    y = sosfilt(sos_bp(f, f * 2.2), noise(n)) * np.exp(-t * 520) + np.sin(2 * np.pi * (180 + RNG.random() * 40) * t) * np.exp(-t * 300) * 0.4
    return y * (0.6 + 0.4 * RNG.random()) * 0.5


def pop(f0=900, f1=420, dur=0.12):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 40)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * np.minimum(1, t / 0.001) * 0.6


def chime(notes, gap=0.07, dur=1.4, g=1.0):
    total = int((dur + gap * len(notes)) * SR)
    y = np.zeros(total)
    for i, nn in enumerate(notes):
        b = bell(hz(nn)[0], dur, 3.0)
        s = int(i * gap * SR)
        y[s:s + len(b)] += b
    return y * g


def sparkle(n_blips=6, span=0.5, seed=0):
    r = np.random.default_rng(seed)
    y = np.zeros(int((span + 0.1) * SR))
    for i in range(n_blips):
        f = 2400 + r.random() * 3200
        b = bell(f, 0.08, 30)
        s = int((i / n_blips) * span * SR + r.random() * 0.02 * SR)
        y[s:s + len(b)] += b * (0.5 + 0.5 * r.random())
    return y


def glitch(dur=0.6, seed=3):
    r = np.random.default_rng(seed)
    y = np.zeros(int(dur * SR))
    for i in range(int(dur * 40)):
        s = int(r.random() * (len(y) - 2000))
        L = int((0.004 + r.random() * 0.02) * SR)
        f = 600 + r.random() * 4000
        tt = np.arange(L) / SR
        y[s:s + L] += np.sign(np.sin(2 * np.pi * f * tt)) * np.exp(-tt * 120) * 0.15 * r.random()
    return sosfilt(sos_bp(500, 9000), y)


def thump(f=70, dur=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ff = f + 50 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * np.exp(-t * 9) * 0.8


def render_sfx():
    s = buf()
    # S1 — typing, send, answer
    t0, t1 = V("01:you") + 0.05, V("01:question") + 0.35
    for i in range(31):
        place(s, key_tap(), t0 + i * (t1 - t0) / 31, 0.30, pan=0.05)
    T_SEND = t1 + 0.18
    place(s, click(1600, 0.05), T_SEND, 0.55)
    place(s, pop(700, 380), T_SEND + 0.02, 0.35, pan=0.2)
    place(s, pop(500, 300, 0.1), T_SEND + 0.32, 0.18, pan=-0.2)
    place(s, chime(["A5", "E6"], 0.06, 0.9), V("01:gives") - 0.05, 0.22, pan=-0.15)
    # the shift
    place(s, whoosh(1.1, 200, 1800, 0.5), V("02:but") - 0.25, 0.30)
    place(s, thump(60, 0.6), V("02:more") - 0.04, 0.38)
    place(s, whoosh(0.6, 400, 4000, 0.6), V("03:what") - 0.5, 0.18)
    place(s, thump(55, 0.6), V("03:get") - 0.04, 0.30)
    place(s, whoosh(0.45, 1200, 6000, 0.3), V("03:done") + 0.22, 0.14, pan=0.3)
    # implosion → ignition
    T_IGN = T0
    place(s, reverse_swell(T_IGN - 9.45), 9.45, 0.55)
    place(s, riser(T_IGN - 8.2, 150, 6000), 8.2, 0.22)
    place(s, impact(1.0), T_IGN, 0.42)
    place(s, crash(3.0), T_IGN, 0.30, pan=0.0)
    place(s, chime(["D6", "A6", "F6"], 0.05, 2.2), T_IGN + 0.02, 0.10)
    # S2
    T_B = V("05:an") - 0.2
    place(s, whoosh(1.0, 250, 2500, 0.55), T_B, 0.22)
    for i, k in enumerate(["05:understands", "05:makes", "05:takes"]):
        place(s, whoosh(0.35, 800, 5000, 0.4), V(k) - 0.3, 0.10, pan=0.4)
        place(s, pop(1100 + i * 180, 600 + i * 90, 0.1), V(k), 0.28, pan=0.35)
        place(s, chime([["A5"], ["C6"], ["E6"]][i], 0.0, 0.8), V(k) + 0.05, 0.12, pan=0.35)
    place(s, sparkle(8, 0.5, 2), V("05:own"), 0.10, pan=0.3)
    T_S2OUT = V("06:heres") - 0.15
    place(s, whoosh(0.9, 300, 3000, 0.5), T_S2OUT, 0.24)
    # S3 ring + nodes
    T_RING = V("06:it")
    place(s, riser(1.4, 400, 5000), T_RING, 0.10)
    for i in range(4):
        place(s, pop(1300 + 120 * i, 900, 0.07), T_RING + 0.2 + i * 0.35, 0.18, pan=[0, 0.4, 0, -0.4][i])
    place(s, thump(65, 0.5), V("06:loop") - 0.04, 0.25)
    stages = [("07:perceive", "07:first"), ("08:reason", "08:next"), ("09:act", "09:then"), ("10:learn", "10:finally")]
    for i, (k, lead) in enumerate(stages):
        tl_ = V(lead)
        if i > 0:
            place(s, whoosh(0.95, 300, 3200, 0.5), tl_ - 0.15, 0.20, pan=[0, 0.5, 0, -0.5][i])
        ta = tl_ if i == 0 else tl_ + 0.75
        place(s, chime([["D6"], ["F6"], ["A6"], ["C7"]][i], 0, 1.2), ta, 0.16)
        place(s, thump(62, 0.5), V(k) - 0.04, 0.24)
    place(s, whoosh(0.5, 500, 4500, 0.5), V("07:first") - 0.4, 0.12)
    for k in ["07:reads"]:
        pass
    tq0, tq1 = V("07:reads"), V("07:request") + 0.55
    for i in range(27):
        place(s, key_tap(), tq0 + i * (tq1 - tq0) / 27, 0.16, pan=0.4)
    for i, k in enumerate(["07:files", "07:emails", "07:apps"]):
        place(s, pop(900 + i * 150, 500, 0.1), V(k) - 0.05, 0.22, pan=0.5)
        place(s, sparkle(7, 0.8, 10 + i), V(k) + 0.15, 0.12, pan=0.2 - 0.3 * i)
        place(s, thump(80, 0.25), V(k) + 1.0, 0.12)
    place(s, pop(700, 420, 0.12), V("08:large") - 0.1, 0.22, pan=0.5)
    place(s, glitch(0.9), V("08:agents"), 0.22)
    place(s, chime(["D6", "F6", "A6", "C7"], 0.04, 1.0), V("08:agents") + 0.05, 0.08)
    for k in ["08:into", "08:clear", "08:steps"]:
        place(s, click(2400, 0.03), V(k), 0.25, pan=0.5)
    for i, k in enumerate(["09:search", "09:update", "09:send"]):
        t = V(k)
        place(s, click(1800, 0.04), t - 0.08, 0.35, pan=0.5)
        place(s, whoosh(0.8, 120, 900, 0.2), t, 0.16)
        place(s, chime(["E6", "A6"], 0.06, 0.8), t + 0.82, 0.13, pan=0.55)
    place(s, chime(["E6", "A6"], 0.06, 0.8), V("10:result"), 0.14, pan=0.5)
    T_MEM = V("10:remembers")
    for i in range(6):
        place(s, pop(1200 + 90 * i, 1000 + 90 * i, 0.05), T_MEM + 0.25 + i * 0.12, 0.13, pan=0.5)
    T_SPIN = V("10:repeats") - 0.05
    T_DONE = V("10:done")
    place(s, riser(T_DONE - T_SPIN, 300, 8000), T_SPIN, 0.22)
    place(s, whoosh(T_DONE - T_SPIN, 200, 2500, 0.5), T_SPIN, 0.18)
    place(s, chime(["F6", "A6", "C7", "E7"], 0.05, 2.0), T_DONE, 0.26)
    place(s, crash(2.2), T_DONE, 0.16)
    place(s, thump(55, 0.7), T_DONE, 0.35)
    # S4
    T_S3OUT = V("11:ask") - 0.45
    place(s, reverse_swell(0.6, ("A4", "E5", "C6")), T_S3OUT - 0.35, 0.25)
    place(s, whoosh(0.9, 300, 2800, 0.6), T_S3OUT, 0.24)
    p0, p1 = V("11:ask") + 0.05, V("11:report") + 0.45
    for i in range(31):
        place(s, key_tap(), p0 + i * (p1 - p0) / 31, 0.30)
    T_GO = p1 + 0.2
    place(s, click(1500, 0.06), T_GO, 0.6)
    place(s, whoosh(0.8, 250, 3000, 0.35), T_GO + 0.05, 0.25)
    place(s, thump(70, 0.4), T_GO + 0.05, 0.25)
    for i, k in enumerate(["12:collects", "12:builds", "12:writes", "12:emails"]):
        t = V(k)
        pan = [-0.6, -0.2, 0.2, 0.6][i]
        place(s, whoosh(0.5, 600, 4500, 0.5), t - 0.35, 0.14, pan=pan)
        place(s, pop(1000 + 120 * i, 600, 0.1), t, 0.2, pan=pan)
        place(s, chime([["D6", "A6"], ["F6", "C7"], ["A6", "E7"], ["C7", "G7"]][i], 0.06, 0.9), t + 0.87, 0.14, pan=pan)
    place(s, whoosh(0.7, 900, 7000, 0.3), V("12:emails") + 0.2, 0.15, pan=0.7)
    place(s, chime(["F6", "A6", "C7"], 0.05, 1.6), V("12:team") + 0.15, 0.18)
    # S5
    place(s, whoosh(0.8, 200, 1500, 0.7), V("13:a") - 0.5, 0.18)
    T_DOT = V("14:works") + 0.42
    place(s, impact(0.8), T_DOT, 0.36)
    place(s, chime(["F6", "C7", "A6"], 0.05, 3.0), T_DOT + 0.02, 0.14)
    place(s, sparkle(10, 0.9, 7), 58.25, 0.08)
    return s


# ---------------------------------------------------------------- voice
def render_voice():
    v = buf()
    for m in TL:
        x, sr = sf.read(AUD / "vo" / f'{m["id"]}.wav')
        x = resample_poly(x, SR // 8000, sr // 8000)
        place(v, x, m["start"], 1.0)
    v = deess(v, pct=30, ratio=8.0)
    v = fx(v, Pedalboard([
        HighpassFilter(cutoff_frequency_hz=85),
        LowShelfFilter(cutoff_frequency_hz=180, gain_db=1.5),
        PeakFilter(cutoff_frequency_hz=320, gain_db=-1.5, q=1.0),
        PeakFilter(cutoff_frequency_hz=3000, gain_db=1.5, q=1.2),
        PeakFilter(cutoff_frequency_hz=7200, gain_db=-2.5, q=0.9),
        Compressor(threshold_db=-20, ratio=2.5, attack_ms=6, release_ms=90),
    ]))
    room = fx(v, Pedalboard([Reverb(room_size=0.18, damping=0.7, wet_level=1.0, dry_level=0.0, width=0.6)]))
    return v + room * 0.06


def deess(x, lo=4500, hi=12000, pct=60, ratio=5.0):
    """Split-band de-esser on a zero-phase band split (clean complement)."""
    from scipy.signal import sosfiltfilt
    sos = butter(3, [lo, hi], btype="band", fs=SR, output="sos")
    band = sosfiltfilt(sos, x, axis=1)
    env = follower(band, att=0.002, rel=0.05)
    lvl = 20 * np.log10(env + 1e-9)
    thresh = np.percentile(lvl[lvl > lvl.max() - 40], pct)
    over = np.maximum(0, lvl - thresh)
    g = 10 ** (-(over * (1 - 1 / ratio)) / 20)
    g = np.convolve(g, np.ones(96) / 96, mode="same")
    return x - band + band * g


def follower(x, att=0.015, rel=0.32):
    e = np.abs(x).max(axis=0)
    a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    out = np.zeros_like(e)
    lvl = 0.0
    # block-wise for speed
    blk = 48
    for i in range(0, len(e), blk):
        pk = e[i:i + blk].max()
        lvl = a * lvl + (1 - a) * pk if pk > lvl else r * lvl + (1 - r) * pk
        out[i:i + blk] = lvl
    return out


def limit(x, ceiling_db=-1.5, look=0.004, release=0.12):
    """Look-ahead peak limiter (no make-up gain). Gain never exceeds what keeps |x| <= ceiling."""
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    ceil = 10 ** (ceiling_db / 20)
    # 4x oversampled peak estimate catches inter-sample overs
    up = resample_poly(x, 4, 1, axis=1)
    pk = np.abs(up).max(axis=0).reshape(-1, 4).max(axis=1)[: x.shape[1]]
    need = np.minimum(1.0, ceil / np.maximum(pk, 1e-9))
    W = int(look * SR)
    g = minimum_filter1d(need, size=2 * W + 1, origin=-W)   # look ahead
    # release: let gain recover exponentially, never above the required gain
    r = np.exp(-1 / (release * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i0 in range(0, len(g), 64):
        seg = g[i0:i0 + 64]
        m = seg.min()
        cur = m if m < cur else 1 - (1 - cur) * r ** 64
        cur = min(cur, 1.0)
        out[i0:i0 + 64] = np.minimum(cur, 1.0)
    out = np.minimum(out, g)
    out = uniform_filter1d(minimum_filter1d(out, size=2 * W), size=W)
    return x * out


def main():
    music, stems = render_music()
    sfx = render_sfx()
    voice = render_voice()

    meter = pyln.Meter(SR)
    def lufs(x):
        return meter.integrated_loudness(x.T)

    # level the buses before ducking
    voice *= 10 ** ((-17.0 - lufs(voice)) / 20)
    music *= 10 ** ((-21.0 - lufs(music)) / 20)

    # lift the sparse intro a little
    ramp = np.ones(N); i0 = int((T0 - 0.4) * SR)
    ramp[:i0] = 10 ** (3 / 20); ramp[i0:int(T0 * SR)] = np.linspace(10 ** (3 / 20), 1, int(T0 * SR) - i0)
    music *= ramp
    # duck music under the voice (smooth, ~-7 dB) + gentle carve where speech lives
    env = follower(voice)
    env = env / (env.max() + 1e-9)
    duck_db = -7.5 * np.clip(env * 4, 0, 1)
    music *= 10 ** (duck_db / 20)
    music = fx(music, Pedalboard([PeakFilter(cutoff_frequency_hz=2800, gain_db=-2.5, q=0.7)]))
    sfx_bus = fx(sfx, Pedalboard([HighpassFilter(cutoff_frequency_hz=30), Reverb(room_size=0.35, wet_level=0.12, dry_level=1.0)]))
    sfx_bus *= 10 ** ((-24.5 - lufs(sfx_bus)) / 20)

    mix = voice + music + sfx_bus
    # fades
    fi = int(0.5 * SR)
    mix[:, :fi] *= np.linspace(0, 1, fi) ** 2
    fo0 = int(59.25 * SR)
    mix[:, fo0:] *= np.linspace(1, 0, N - fo0) ** 1.5

    master = fx(mix, Pedalboard([
        LowShelfFilter(cutoff_frequency_hz=60, gain_db=0.5),
        Compressor(threshold_db=-16, ratio=1.8, attack_ms=25, release_ms=200),
    ]))
    print("pre-master LUFS %.2f peak %.2f" % (lufs(master), 20 * np.log10(np.abs(master).max())))
    for _ in range(3):
        master *= 10 ** ((-14.0 - lufs(master)) / 20)
        master = limit(master, -1.5)

    sf.write(AUD / "mix.wav", master.T.astype(np.float32), SR, subtype="PCM_24")
    sd = AUD / "stems"; sd.mkdir(exist_ok=True)
    for name, x in [("voice", voice), ("music", music), ("sfx", sfx_bus)]:
        sf.write(sd / f"{name}.wav", x.T.astype(np.float32), SR, subtype="PCM_24")
    print("LUFS master %.2f  peak %.2f dBFS" % (lufs(master), 20 * np.log10(np.abs(master).max())))
    print("voice %.1f  music(ducked) %.1f  sfx %.1f LUFS" % (lufs(voice), lufs(music), lufs(sfx_bus)))
    print("break at %.2f, drop at %.2f, bar %.3f" % (T_BREAK, T0, BAR))


if __name__ == "__main__":
    main()
