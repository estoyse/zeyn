import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 22050;
const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "assets",
  "sfx"
);

function encodeWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

function square(phase) {
  return Math.sin(phase) >= 0 ? 1 : -1;
}

function voice(phase, blend) {
  return Math.sin(phase) * (1 - blend) + square(phase) * blend;
}

function envelope(t, duration, attack, curve) {
  if (t < attack) return t / attack;
  const decayed = (t - attack) / (duration - attack);
  return Math.pow(1 - decayed, curve);
}

function tone({ duration, from, to = from, blend = 0.5, curve = 2.6, attack = 0.004, detune = 0, gain = 0.5 }) {
  const count = Math.floor(RATE * duration);
  const samples = new Float32Array(count);
  let phase = 0;
  let phaseDetuned = 0;

  for (let i = 0; i < count; i++) {
    const t = i / RATE;
    const progress = t / duration;
    const freq = from + (to - from) * progress;

    phase += (2 * Math.PI * freq) / RATE;
    let sample = voice(phase, blend);

    if (detune > 0) {
      phaseDetuned += (2 * Math.PI * (freq + detune)) / RATE;
      sample = (sample + voice(phaseDetuned, blend)) * 0.5;
    }

    samples[i] = sample * envelope(t, duration, attack, curve) * gain;
  }

  return samples;
}

function sequence(steps) {
  const parts = steps.map(step => tone(step));
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

const SOUNDS = {
  tick: () => tone({ duration: 0.035, from: 1180, blend: 0.7, curve: 3.4, gain: 0.32 }),

  countdownTick: () =>
    tone({ duration: 0.11, from: 480, blend: 0.6, curve: 3, gain: 0.5 }),

  countdownGo: () =>
    sequence([
      { duration: 0.09, from: 660, blend: 0.6, curve: 1.6, gain: 0.5 },
      { duration: 0.26, from: 990, to: 1320, blend: 0.5, curve: 2.2, gain: 0.55 },
    ]),

  questionStart: () =>
    sequence([
      { duration: 0.07, from: 523, blend: 0.45, curve: 2, gain: 0.4 },
      { duration: 0.13, from: 784, blend: 0.45, curve: 2.6, gain: 0.42 },
    ]),

  buzz: () =>
    tone({
      duration: 0.2,
      from: 520,
      to: 170,
      blend: 0.95,
      curve: 1.7,
      detune: 6,
      gain: 0.6,
    }),

  correct: () =>
    sequence([
      { duration: 0.075, from: 659, blend: 0.4, curve: 1.8, gain: 0.42 },
      { duration: 0.075, from: 784, blend: 0.4, curve: 1.8, gain: 0.44 },
      { duration: 0.19, from: 1047, blend: 0.35, curve: 2.4, gain: 0.46 },
    ]),

  wrong: () =>
    tone({
      duration: 0.34,
      from: 392,
      to: 185,
      blend: 0.85,
      curve: 2,
      detune: 9,
      gain: 0.5,
    }),

  win: () =>
    sequence([
      { duration: 0.1, from: 523, blend: 0.4, curve: 1.5, gain: 0.42 },
      { duration: 0.1, from: 659, blend: 0.4, curve: 1.5, gain: 0.44 },
      { duration: 0.1, from: 784, blend: 0.4, curve: 1.5, gain: 0.46 },
      { duration: 0.34, from: 1047, to: 1319, blend: 0.35, curve: 2.2, gain: 0.5 },
    ]),
};

fs.mkdirSync(OUT, { recursive: true });

let total = 0;
for (const [name, build] of Object.entries(SOUNDS)) {
  const buffer = encodeWav(build());
  const file = path.join(OUT, `${name}.wav`);
  fs.writeFileSync(file, buffer);
  total += buffer.length;
  console.log(`${name.padEnd(16)} ${(buffer.length / 1024).toFixed(1)} KB`);
}

console.log(`\ntotal ${(total / 1024).toFixed(1)} KB across ${Object.keys(SOUNDS).length} files`);
