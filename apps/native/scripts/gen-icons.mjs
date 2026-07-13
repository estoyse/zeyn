import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "assets",
  "images"
);

const Z = "M20 16 H80 V33 L47 62 H80 V84 H20 V67 L53 38 H20 Z";

const BASE = "#2A2F6B";
const LAPIS = "#5B6BF5";
const VIOLET = "#8E5BF5";
const AMBER = "#F4B93C";

function mesh(id) {
  return `
    <defs>
      <radialGradient id="${id}a" cx="18%" cy="8%" r="78%">
        <stop offset="0" stop-color="${LAPIS}" stop-opacity="1"/>
        <stop offset="1" stop-color="${LAPIS}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}b" cx="92%" cy="20%" r="66%">
        <stop offset="0" stop-color="${VIOLET}" stop-opacity="0.85"/>
        <stop offset="1" stop-color="${VIOLET}" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id}c" cx="66%" cy="104%" r="82%">
        <stop offset="0" stop-color="#171A45" stop-opacity="0.95"/>
        <stop offset="1" stop-color="#171A45" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="1024" fill="${BASE}"/>
    <rect width="1024" height="1024" fill="url(#${id}a)"/>
    <rect width="1024" height="1024" fill="url(#${id}b)"/>
    <rect width="1024" height="1024" fill="url(#${id}c)"/>`;
}

function zMark({ scale, cx = 512, cy = 512, fill = "#FFFFFF", dot = false }) {
  const size = 1024 * scale;
  const offset = -size / 2;
  const dotMarkup = dot
    ? `<circle cx="${cx + size * 0.42}" cy="${cy + size * 0.42}" r="${size * 0.075}" fill="${AMBER}"/>`
    : "";

  return `
    <g transform="translate(${cx + offset} ${cy + offset}) scale(${size / 100})">
      <path d="${Z}" fill="${fill}"/>
    </g>
    ${dotMarkup}`;
}

const ICONS = {
  "icon.png": {
    size: 1024,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      ${mesh("i")}
      ${zMark({ scale: 0.5, dot: true })}
    </svg>`,
  },

  "android-icon-background.png": {
    size: 1024,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      ${mesh("b")}
    </svg>`,
  },

  "android-icon-foreground.png": {
    size: 1024,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      ${zMark({ scale: 0.36, dot: true })}
    </svg>`,
  },

  "android-icon-monochrome.png": {
    size: 1024,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      ${zMark({ scale: 0.36, fill: "#FFFFFF" })}
    </svg>`,
  },

  "splash-icon.png": {
    size: 512,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      ${zMark({ scale: 0.62, fill: LAPIS, dot: true })}
    </svg>`,
  },

  "splash-icon-dark.png": {
    size: 512,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      ${zMark({ scale: 0.62, fill: "#7C8AF0", dot: true })}
    </svg>`,
  },

  "favicon.png": {
    size: 64,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
      ${mesh("f")}
      ${zMark({ scale: 0.56 })}
    </svg>`,
  },
};

fs.mkdirSync(OUT, { recursive: true });

for (const [name, { size, svg }] of Object.entries(ICONS)) {
  const tmp = path.join(OUT, `.${name}.svg`);
  const target = path.join(OUT, name);

  fs.writeFileSync(tmp, svg);
  execFileSync("rsvg-convert", [
    tmp,
    "-w",
    String(size),
    "-h",
    String(size),
    "-o",
    target,
  ]);
  fs.unlinkSync(tmp);

  const bytes = fs.statSync(target).size;
  console.log(`${name.padEnd(30)} ${size}x${size}  ${(bytes / 1024).toFixed(1)} KB`);
}
