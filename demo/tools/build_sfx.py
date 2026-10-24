#!/usr/bin/env python3
"""Synthesise the film's sound effects.

Everything here is generated from scratch - sine partials, shaped noise and
short decays - so the soundtrack is original and deterministic, with no
licensing to clear and no network. Run `python tools/build_sfx.py`.

Each cue is written 48 kHz, 16-bit, mono, to assets/sfx/, with a tiny fade at
both edges so no cue ever starts or ends on a click.
"""

import os
import wave

import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(HERE, "..", "assets", "sfx"))
os.makedirs(OUT, exist_ok=True)

rng = np.random.default_rng(20261024)


def t(dur):
    return np.arange(int(SR * dur)) / SR


def noise(dur):
    return rng.standard_normal(int(SR * dur))


def env_exp(n, tau, attack=0.002):
    """Fast attack, exponential decay."""
    a = int(SR * attack)
    e = np.exp(-np.arange(n) / (SR * tau))
    if a > 1:
        e[:a] *= np.linspace(0, 1, a)
    return e


def band(x, lo, hi):
    """Crude but stable band-pass: FFT mask with soft skirts."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    mask = np.ones_like(f)
    mask[f < lo] = np.clip((f[f < lo] / max(lo, 1)) ** 2, 0, 1)
    mask[f > hi] = np.clip((hi / np.maximum(f[f > hi], 1)) ** 2, 0, 1)
    return np.fft.irfft(X * mask, len(x))


def sweep_band(x, f0, f1, width=1.4):
    """A band-pass whose centre glides f0 -> f1 across the buffer."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    out = np.zeros(len(x))
    segs = 8
    step = len(x) // segs
    for i in range(segs):
        c = f0 * (f1 / f0) ** (i / (segs - 1))
        mask = np.exp(-0.5 * ((np.log(np.maximum(f, 1) / c)) / width) ** 2)
        y = np.fft.irfft(X * mask, len(x))
        w = np.zeros(len(x))
        s, e = i * step, min(len(x), (i + 1) * step)
        w[s:e] = np.hanning(e - s + 2)[1:-1]
        out += y * w
    return out


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1.0
    return x / m * peak


def save(name, x):
    x = np.asarray(x, np.float64)
    f = int(min(len(x), SR * 0.004))
    if f > 1:
        x[:f] *= np.linspace(0, 1, f)
        x[-f:] *= np.linspace(1, 0, f)
    x = norm(x, 0.9)
    pcm = (x * 32767).astype("<i2")
    path = os.path.join(OUT, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print("wrote %-16s %.2fs" % (name, len(x) / SR))


# ---------------------------------------------------------------- shutter
def shutter():
    """The two-stage mechanical click of a phone camera."""
    out = np.zeros(int(SR * 0.22))

    for at, gain, hi in ((0.0, 1.0, 5200), (0.045, 0.8, 3600)):
        n = int(SR * 0.05)
        b = band(noise(0.05), 1400, hi) * env_exp(n, 0.006) * gain
        i = int(SR * at)
        out[i:i + n] += b

    # the body of the mechanism, a low knock under each click
    for at, gain in ((0.0, 0.6), (0.045, 0.4)):
        n = int(SR * 0.09)
        f = 190 * np.exp(-t(0.09) * 12)
        b = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.02) * gain
        i = int(SR * at)
        out[i:i + n] += b

    return out


# ---------------------------------------------------------------- pop
def pop():
    d = 0.16
    x = t(d)
    f = 520 * np.exp(-x * 22) + 150
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(x), 0.032)
    click = band(noise(d), 900, 6000) * env_exp(len(x), 0.008) * 0.35
    return body + click


# ---------------------------------------------------------------- tick
def tick():
    d = 0.055
    x = t(d)
    s = np.sin(2 * np.pi * 2900 * x) * env_exp(len(x), 0.006)
    s += np.sin(2 * np.pi * 4300 * x) * env_exp(len(x), 0.004) * 0.4
    s += band(noise(d), 2000, 9000) * env_exp(len(x), 0.004) * 0.2
    return s


# ---------------------------------------------------------------- press
def press():
    d = 0.09
    x = t(d)
    s = band(noise(d), 300, 2200) * env_exp(len(x), 0.010)
    s += np.sin(2 * np.pi * 320 * x) * env_exp(len(x), 0.018) * 0.5
    return s


# ---------------------------------------------------------------- whoosh
def whoosh(d=0.62, f0=380, f1=2600, tail=True):
    x = noise(d)
    s = sweep_band(x, f0, f1, width=1.1)
    n = len(s)
    e = np.hanning(n) ** 1.4
    if tail:
        e[-int(n * 0.35):] *= np.linspace(1, 0, int(n * 0.35)) ** 1.6
    return s * e


# ---------------------------------------------------------------- rise
def rise():
    d = 0.9
    x = t(d)
    f = 260 * (2.9 ** (x / d))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * (x / d) ** 1.5
    s += np.sin(2 * np.pi * np.cumsum(f * 1.5) / SR) * (x / d) ** 2 * 0.4
    s += sweep_band(noise(d), 800, 5200, width=1.0) * (x / d) ** 2 * 0.25
    return s * np.hanning(len(x)) ** 0.5


# ---------------------------------------------------------------- chime
def chime():
    d = 1.1
    x = t(d)
    s = np.zeros(len(x))
    for f, g, at in ((659.25, 1.0, 0.0), (987.77, 0.7, 0.085), (1318.5, 0.35, 0.17)):
        i = int(SR * at)
        n = len(x) - i
        e = env_exp(n, 0.22, attack=0.004)
        s[i:] += np.sin(2 * np.pi * f * x[:n]) * e * g
        s[i:] += np.sin(2 * np.pi * f * 2.01 * x[:n]) * e * g * 0.12
    return s


# ---------------------------------------------------------------- sparkle
def sparkle():
    d = 0.8
    x = t(d)
    s = np.zeros(len(x))
    for k, f in enumerate((1568, 2093, 2637, 3136)):
        at = 0.03 * k
        i = int(SR * at)
        n = len(x) - i
        e = env_exp(n, 0.10, attack=0.002)
        s[i:] += np.sin(2 * np.pi * f * x[:n]) * e * (0.65 - 0.1 * k)
    return s


# ---------------------------------------------------------------- thunk
def thunk():
    """The low body hit that lands a big cut."""
    d = 0.55
    x = t(d)
    f = 110 * np.exp(-x * 6) + 48
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(x), 0.13)
    s += band(noise(d), 60, 700) * env_exp(len(x), 0.05) * 0.4
    return s


def main():
    save("shutter.wav", shutter())
    save("pop.wav", pop())
    save("tick.wav", tick())
    save("press.wav", press())
    save("whoosh-short.wav", whoosh(0.42, 420, 2400))
    save("whoosh.wav", whoosh(0.62, 360, 2800))
    save("whoosh-long.wav", whoosh(1.0, 280, 3200))
    save("rise.wav", rise())
    save("chime.wav", chime())
    save("sparkle.wav", sparkle())
    save("thunk.wav", thunk())


if __name__ == "__main__":
    main()
