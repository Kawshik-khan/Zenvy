"""Builds the soundtrack for the Zenvy intro: a synthesized lo-fi bed,
sound effects at the cue times exported from scene.html, and the voiceover,
mixed with the music ducked under the voice.

usage: python3 make_audio.py cues.json assets/voiceover.mp3 out.wav [duration]
"""
import json
import subprocess
import sys
import wave

import numpy as np
from scipy.signal import butter, sosfilt

SR = 44100
rng = np.random.default_rng(7)


def t_axis(d):
    return np.arange(int(d * SR)) / SR


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, "low", fs=SR, output="sos"), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, "high", fs=SR, output="sos"), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], "band", fs=SR, output="sos"), x)


def env(d, a=0.002, decay=0.1):
    t = t_axis(d)
    return np.minimum(1, t / a) * np.exp(-t / decay)


def noise(d):
    return rng.standard_normal(int(d * SR))


def note_hz(n):  # MIDI note -> Hz
    return 440 * 2 ** ((n - 69) / 12)


# ---------- instruments ----------
def kick(d=0.45, f0=125, f1=42):
    t = t_axis(d)
    f = f1 + (f0 - f1) * np.exp(-t / 0.045)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(d, 0.001, 0.16)


def snare(d=0.25):
    return 0.6 * bp(noise(d), 1200, 6000) * env(d, 0.001, 0.07) + 0.35 * np.sin(2 * np.pi * 190 * t_axis(d)) * env(d, 0.001, 0.05)


def hat(d=0.06):
    return hp(noise(d), 7000) * env(d, 0.0005, 0.018)


def epiano(n, d):
    t = t_axis(d)
    f = note_hz(n)
    wobble = 1 + 0.003 * np.sin(2 * np.pi * 0.6 * t)  # tape wow
    tone = np.sin(2 * np.pi * f * np.cumsum(wobble) / SR) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.3)
    return tone * env(d, 0.01, 1.4)


def sub(n, d):
    t = t_axis(d)
    return np.sin(2 * np.pi * note_hz(n) * t) * np.minimum(1, t / 0.01) * np.exp(-t / 0.5)


# ---------- sound effects ----------
def sfx(kind):
    if kind == "tick":
        return 0.25 * hp(noise(0.02), 3000) * env(0.02, 0.0005, 0.004) + 0.2 * np.sin(2 * np.pi * 3200 * t_axis(0.02)) * env(0.02, 0.0005, 0.004)
    if kind == "type":
        return 0.3 * bp(noise(0.03), 2000, 5000) * env(0.03, 0.0005, 0.006)
    if kind == "thock":
        t = t_axis(0.12)
        return 0.55 * np.sin(2 * np.pi * (260 - 600 * t) * t) * env(0.12, 0.001, 0.035) + 0.15 * lp(noise(0.12), 1500) * env(0.12, 0.001, 0.01)
    if kind == "clack":
        t = t_axis(0.15)
        return 0.7 * np.sin(2 * np.pi * (420 - 900 * t) * t) * env(0.15, 0.001, 0.04) + 0.3 * bp(noise(0.15), 800, 4000) * env(0.15, 0.001, 0.012)
    if kind == "pop":
        t = t_axis(0.1)
        f = 380 + 900 * t / 0.1
        return 0.4 * np.sin(2 * np.pi * np.cumsum(f) / SR) * env(0.1, 0.001, 0.03)
    if kind == "click":
        return 0.5 * np.sin(2 * np.pi * 1800 * t_axis(0.04)) * env(0.04, 0.0005, 0.008) + 0.3 * hp(noise(0.04), 2000) * env(0.04, 0.0005, 0.005)
    if kind == "ding":
        t = t_axis(1.6)
        return 0.35 * sum(a * np.sin(2 * np.pi * f * t) for f, a in ((1318.5, 1), (2637, 0.35), (1975.5, 0.4))) * env(1.6, 0.002, 0.5)
    if kind == "chime":
        a = 0.3 * np.sin(2 * np.pi * 880 * t_axis(0.8)) * env(0.8, 0.003, 0.25)
        b = 0.3 * np.sin(2 * np.pi * 1318.5 * t_axis(0.8)) * env(0.8, 0.003, 0.3)
        out = np.zeros(int(1.0 * SR))
        out[: len(a)] += a
        out[int(0.12 * SR): int(0.12 * SR) + len(b)] += b
        return out
    if kind == "sparkle":
        out = np.zeros(int(0.9 * SR))
        for i, f in enumerate((2093, 2637, 3136, 4186)):
            s = 0.12 * np.sin(2 * np.pi * f * t_axis(0.5)) * env(0.5, 0.002, 0.12)
            o = int(i * 0.06 * SR)
            out[o: o + len(s)] += s
        return out
    if kind in ("whoosh", "fall", "draw"):
        d = {"whoosh": 0.5, "fall": 0.6, "draw": 0.6}[kind]
        t = t_axis(d)
        shape = np.sin(np.pi * t / d) ** 2
        lo, hi = {"whoosh": (500, 3500), "fall": (300, 1800), "draw": (2500, 7000)}[kind]
        g = {"whoosh": 0.45, "fall": 0.35, "draw": 0.12}[kind]
        return g * bp(noise(d), lo, hi) * shape
    if kind == "flicker":
        return 0.2 * bp(noise(0.25), 3000, 9000) * (np.sin(2 * np.pi * 30 * t_axis(0.25)) > 0) * env(0.25, 0.001, 0.1)
    if kind == "stamp":
        return 0.9 * kick(0.35, 160, 55) + 0.35 * lp(noise(0.35), 2500) * env(0.35, 0.001, 0.03)
    if kind == "riser":
        d = 1.6
        t = t_axis(d)
        x = bp(noise(d), 800, 6000) * (t / d) ** 2.5
        tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / d) ** 2) / SR) * (t / d) ** 3
        return 0.35 * x + 0.12 * tone
    if kind == "hit":
        d = 2.2
        boom = 1.2 * kick(d, 110, 38) * np.exp(-t_axis(d) / 0.6)
        crash = 0.45 * hp(noise(d), 4000) * env(d, 0.001, 0.55)
        return boom + crash
    raise ValueError(kind)


def place(buf, sig, at, gain=1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    n = min(len(sig), len(buf) - i)
    buf[i: i + n] += gain * sig[:n]


def build_music(dur):
    m = np.zeros(int(dur * SR))
    drums = np.zeros_like(m)
    beat = 60 / 86
    # the beat drops exactly on "Zenvy finds..." (8.98s)
    drop = 8.98
    chords = [(53, 57, 60, 64), (52, 55, 59, 62), (50, 53, 57, 60), (48, 52, 55, 59)]  # Fmaj7 Em7 Dm7 Cmaj7
    bar = 4 * beat
    start = drop - 3 * bar
    k = 0
    while start + k * bar < dur:
        t0 = start + k * bar
        ch = chords[k % 4]
        for j, n in enumerate(ch):
            place(m, epiano(n + 12, bar + 0.6), t0 + j * 0.012, 0.11)
        place(m, sub(ch[0] - 12, bar), t0, 0.35)
        place(m, sub(ch[0] - 12, bar / 2), t0 + 2.5 * beat, 0.25)
        k += 1
    t = drop
    i = 0
    while t < dur:
        in_break = 20.15 <= t < 21.12
        if not in_break:
            light = t >= 21.12
            if i % 4 == 0 or (i % 4 == 2 and i % 8 != 6):
                place(drums, kick(), t, 0.7 if not light else 0.45)
            if i % 2 == 1 and (not light or t > 21.6):
                place(drums, snare(), t + 0.012, 0.35 if not light else 0.2)
            for h in (0, 0.5):
                swing = 0.06 * beat if h else 0
                place(drums, hat(), t + h * beat + swing, 0.22 if h else 0.3)
        t += beat
        i += 1
    # before the drop the keys are muffled (late night, alone); they open up on the drop
    t = t_axis(dur)
    pre = lp(m, 650, 2)
    xf = np.clip((t - drop + 0.05) / 0.1, 0, 1)
    mix = pre * (1 - xf) + m * xf
    # vinyl crackle
    crackle = np.zeros_like(m)
    idx = rng.integers(0, len(m), int(dur * 18))
    crackle[idx] = rng.uniform(-0.5, 0.5, len(idx))
    crackle = hp(crackle, 1500) * 0.25
    return mix + drums + crackle + 0.004 * lp(noise(dur), 4000)


def load_vo(path, dur):
    raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    vo = np.frombuffer(raw, np.float32).astype(np.float64)
    out = np.zeros(int(dur * SR))
    out[: min(len(vo), len(out))] = vo[: len(out)]
    return out


def main():
    cues_path, vo_path, out_path = sys.argv[1:4]
    dur = float(sys.argv[4]) if len(sys.argv) > 4 else 26.0
    cues = json.load(open(cues_path))
    vo = load_vo(vo_path, dur)
    music = build_music(dur)
    fx = np.zeros_like(vo)
    for at, kind in cues:
        place(fx, sfx(kind), at)
    # duck music ~7 dB while the voice is talking
    win = int(0.05 * SR)
    venv = np.sqrt(np.convolve(vo ** 2, np.ones(win) / win, "same"))
    talking = lp((venv > 0.02).astype(float), 4, 1)
    duck = 1 - 0.55 * np.clip(talking, 0, 1)
    t = t_axis(dur)
    fade = np.clip((dur - t) / 1.2, 0, 1) * np.clip(t / 0.3, 0, 1)
    mix = vo * 1.0 + music * 0.5 * duck * fade + fx * 0.4
    mix = np.tanh(mix * 1.1) / np.tanh(1.1)  # gentle soft clip
    print(f"voice rms {20*np.log10(np.sqrt(np.mean(vo[np.abs(vo) > 0.01] ** 2))):.1f} dB, "
          f"music rms {20*np.log10(np.sqrt(np.mean((music * 0.5 * duck) ** 2))):.1f} dB, "
          f"fx rms {20*np.log10(np.sqrt(np.mean((fx * 0.4)[np.abs(fx) > 0.01] ** 2))):.1f} dB")
    mix *= 0.85  # headroom for the AAC encoder
    stereo = np.stack([mix, mix], 1)
    pcm = (np.clip(stereo, -1, 1) * 32767).astype(np.int16)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


if __name__ == "__main__":
    main()
