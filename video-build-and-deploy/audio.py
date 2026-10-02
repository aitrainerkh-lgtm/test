"""Synthesises the 60 s soundtrack: light music bed (104 BPM, mallet melody) + sound effects.
Pure Python (no numpy). Writes output/_audio.wav (44.1 kHz, 16-bit stereo)."""
import math, random, wave, struct, array, os

SR = 44100
DUR = 60.0
N = int(SR * DUR)
music = array.array('f', [0.0]) * N
sfx = array.array('f', [0.0]) * N
random.seed(7)
TAU = 2 * math.pi
BEAT = 60 / 104


def note(n):  # MIDI note -> Hz
    return 440.0 * 2 ** ((n - 69) / 12)


def add(buf, t0, samples):
    i0 = int(t0 * SR)
    for k, v in enumerate(samples):
        i = i0 + k
        if 0 <= i < N:
            buf[i] += v


def mallet(f, amp, dur=0.9):
    """Roneat-like mallet: bright attack, quick decay, a few inharmonic partials."""
    n = int(dur * SR)
    out = []
    for k in range(n):
        t = k / SR
        env = math.exp(-t * 5.5)
        v = (math.sin(TAU * f * t) * env
             + 0.35 * math.sin(TAU * f * 3.95 * t) * math.exp(-t * 16)
             + 0.12 * math.sin(TAU * f * 9.2 * t) * math.exp(-t * 30))
        a = min(1.0, t / 0.003)
        out.append(amp * a * v)
    return out


def pad(fs, t0, t1, amp):
    n = int((t1 - t0) * SR)
    out = []
    att, rel = 0.8, 1.0
    for k in range(n):
        t = k / SR
        env = min(1.0, t / att) * min(1.0, (t1 - t0 - t) / rel)
        v = 0.0
        for f in fs:
            v += math.sin(TAU * f * t) + 0.5 * math.sin(TAU * f * 1.003 * t + 1.0)
        out.append(amp * env * v / len(fs))
    return out


def kick(amp):
    n = int(0.25 * SR)
    out, ph = [], 0.0
    for k in range(n):
        t = k / SR
        f = 45 + 80 * math.exp(-t * 30)
        ph += TAU * f / SR
        out.append(amp * math.sin(ph) * math.exp(-t * 14))
    return out


def noise_burst(dur, amp, decay, lp=0.5, hp=False):
    n = int(dur * SR)
    out, y, prev = [], 0.0, 0.0
    for k in range(n):
        t = k / SR
        x = random.uniform(-1, 1)
        y = y + lp * (x - y)          # one-pole low-pass
        v = (y - prev) if hp else y   # crude high-pass when hp
        prev = y
        out.append(amp * v * math.exp(-t * decay) * min(1.0, t / 0.002))
    return out


def whoosh(dur, amp):
    n = int(dur * SR)
    out, y = [], 0.0
    for k in range(n):
        u = k / n
        c = 0.02 + 0.25 * math.sin(math.pi * u)
        y = y + c * (random.uniform(-1, 1) - y)
        out.append(amp * y * math.sin(math.pi * u) ** 1.5)
    return out


def tone(f, dur, amp, decay, f2=None):
    n = int(dur * SR)
    out, ph = [], 0.0
    for k in range(n):
        t = k / SR
        ff = f if f2 is None else f + (f2 - f) * (t / dur)
        ph += TAU * ff / SR
        out.append(amp * math.sin(ph) * math.exp(-t * decay) * min(1.0, t / 0.004))
    return out


def click(amp=0.25):
    return noise_burst(0.025, amp, 220, lp=0.9, hp=True)


# ---------------- music ----------------
# Pentatonic (C D E G A) melody, chords Am - F - C - G (each 2 bars)
CH = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]
bar = BEAT * 4
for i in range(int(DUR / (bar * 2)) + 1):
    t0 = i * bar * 2
    if t0 >= 56:
        break
    ch = CH[i % 4]
    lvl = 0.05 if t0 < 7 else 0.07
    add(music, t0, pad([note(n) for n in ch], t0, min(t0 + bar * 2 + 0.6, 57.0), lvl))

MEL = [76, 74, 72, 69, 72, 74, 76, 79, 81, 79, 76, 74, 72, 74, 69, 72]
step = 0
t = 0.0
while t < 55.5:
    dens = 2 if t < 7 else 1 if t < 22 else 0.5 if t < 52 else 2
    if t >= 0.24:
        n = MEL[step % len(MEL)]
        amp = 0.10 if t < 22 else 0.12
        add(music, t, mallet(note(n), amp))
        if 41 <= t < 52 and step % 2 == 0:
            add(music, t, mallet(note(n - 12), amp * 0.6))
        step += 1
    t += BEAT * dens

# beat from 7 s, fuller from 22 s, drop out at 52 s
b = 0
t = 7.0
while t < 52.0:
    if b % 2 == 0:
        add(music, t, kick(0.32 if t >= 22 else 0.22))
    if t >= 22:
        add(music, t + BEAT / 2, noise_burst(0.06, 0.05, 60, lp=0.95, hp=True))
    add(music, t, noise_burst(0.04, 0.03, 90, lp=0.95, hp=True))
    t += BEAT
    b += 1

# closing: rising mallets per word, final chord, hard stop at 60
for i, n in enumerate([72, 74, 76, 79]):
    add(music, 56.15 + i * 0.24, mallet(note(n), 0.14))
for n in [60, 64, 67, 72, 76]:
    add(music, 58.0, mallet(note(n), 0.09, dur=1.9))
add(music, 58.0, pad([note(48), note(55), note(64)], 58.0, 60.0, 0.08))

# ---------------- sound effects ----------------
add(sfx, 0.24, kick(0.9)); add(sfx, 0.24, noise_burst(0.2, 0.35, 25, lp=0.2))           # book thud
for i in range(14):
    add(sfx, 0.55 + i * 0.065, noise_burst(0.05, 0.14, 70, lp=0.6))                       # page flutter
for a, b in [(3.5, 4.8), (4.95, 6.2)]:                                                     # pen scratch
    t = a
    while t < b:
        add(sfx, t, noise_burst(0.03, 0.05, 80, lp=0.8, hp=True)); t += 0.045
for tt in [3.85, 4.55, 5.25]:
    add(sfx, tt, tone(1568, 0.25, 0.10, 18)); add(sfx, tt + 0.05, tone(2093, 0.25, 0.08, 18))  # chat ping
for tt in [3.6, 3.95, 4.3, 4.55, 4.8, 5.15, 5.6, 5.95, 6.2, 6.45]:
    add(sfx, tt, click(0.22))                                                              # calculator
add(sfx, 6.70, whoosh(0.6, 0.35))                                                          # whip pan
for i in range(4):
    add(sfx, 7.3 + i * 0.5, kick(0.35)); add(sfx, 7.3 + i * 0.5, noise_burst(0.1, 0.12, 40, lp=0.3))
add(sfx, 10.4, whoosh(0.6, 0.18))
add(sfx, 11.45, tone(2300, 0.6, 0.025, 2, f2=2600))                                         # marker squeak
for i, n in enumerate([84, 88, 91, 96]):
    add(sfx, 12.3 + i * 0.09, mallet(note(n), 0.05, 0.5))                                   # lift shimmer
add(sfx, 14.2, whoosh(0.8, 0.22))
for i in range(20):
    add(sfx, 15.6 + i * 0.24, click(0.18))                                                  # typing
add(sfx, 21.3, tone(820, 0.15, 0.22, 40))                                                  # send tock
add(sfx, 21.45, whoosh(0.6, 0.3))
for i in range(5):
    ts = 22.6 + i * 0.35
    add(sfx, ts, noise_burst(0.2, 0.10, 12, lp=0.5))                                        # paper peel
    add(sfx, ts + 0.85, tone(1200, 0.08, 0.14, 60)); add(sfx, ts + 0.85, click(0.15))      # snap
for i in range(4):
    add(sfx, 25.0 + i * 0.12, tone(900 + i * 120, 0.08, 0.08, 50))
for i in range(5):
    add(sfx, 27.1 + i * 0.12, tone(500 + i * 90, 0.3, 0.07, 10, f2=700 + i * 90))           # bars grow
add(sfx, 28.4, mallet(note(96), 0.05, 0.6))
add(sfx, 29.6, whoosh(0.8, 0.2))
for t0 in [30.8, 31.9]:
    for i in range(10):
        add(sfx, t0 + i * 0.07, click(0.13))
for i in range(18):
    add(sfx, 32.9 + i * 0.05, tone(1800, 0.02, 0.05, 100))                                  # counter roll
for tt in [34.1, 34.4, 34.7, 34.9, 35.1, 35.4]:
    add(sfx, tt, click(0.28))
add(sfx, 35.6, tone(1760, 1.0, 0.16, 5)); add(sfx, 35.6, tone(2637, 0.8, 0.10, 6))         # ding
add(sfx, 36.6, whoosh(0.4, 0.15))
add(sfx, 37.5, tone(660, 0.2, 0.08, 20, f2=880))                                            # "?" pop
for i in range(16):
    add(sfx, 38.2 + i * 0.062, click(0.13))
add(sfx, 39.4, tone(300, 0.35, 0.16, 6, f2=900))                                            # slide whoop
add(sfx, 40.0, tone(1320, 0.3, 0.12, 12)); add(sfx, 40.06, tone(1760, 0.3, 0.10, 12))       # check
add(sfx, 40.4, noise_burst(0.15, 0.14, 25, lp=0.45)); add(sfx, 40.7, noise_burst(0.15, 0.14, 25, lp=0.45))
add(sfx, 42.2, click(0.3)); add(sfx, 42.2, tone(1000, 0.1, 0.1, 40))                       # tap
add(sfx, 42.45, noise_burst(0.25, 0.14, 15, lp=0.45))                                       # fold
add(sfx, 42.9, whoosh(2.7, 0.28))                                                           # plane flight
add(sfx, 45.6, tone(1319, 0.5, 0.12, 8)); add(sfx, 45.75, tone(1760, 0.6, 0.12, 8))         # landing chime
add(sfx, 46.6, whoosh(0.4, 0.15))
for tap, ping, fill in [(47.8, 48.6, 49.5), (50.2, 50.7, 51.2)]:
    add(sfx, tap, click(0.3)); add(sfx, tap, tone(1000, 0.1, 0.1, 40))
    add(sfx, ping, tone(1568, 0.3, 0.10, 14))
    add(sfx, fill, tone(600, 0.3, 0.08, 8, f2=1000))
add(sfx, 52.25, noise_burst(0.7, 0.07, 4, lp=0.35))                                         # notebook slide
add(sfx, 53.05, kick(0.25))
add(sfx, 53.7, tone(1047, 0.8, 0.08, 4)); add(sfx, 53.8, tone(1568, 0.8, 0.06, 4))         # phone glow
add(sfx, 55.3, whoosh(0.7, 0.3))

# ---------------- mix ----------------
out = array.array('h', [0]) * (N * 2)
peak = max(max(abs(m * 0.9 + s) for m, s in zip(music[i:i + 4410], sfx[i:i + 4410])) for i in range(0, N, 4410))
g = 0.85 / peak
fade = int(0.05 * SR)
for i in range(N):
    m, s = music[i] * 0.9, sfx[i]
    k = min(1.0, (N - i) / fade)
    l = (m * 1.0 + s) * g * k
    r = (m * 0.92 + s) * g * k
    out[2 * i] = int(max(-1, min(1, l)) * 32767)
    out[2 * i + 1] = int(max(-1, min(1, r)) * 32767)
os.makedirs('output', exist_ok=True)
with wave.open('output/_audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes(out.tobytes())
print('peak', peak, 'written')
