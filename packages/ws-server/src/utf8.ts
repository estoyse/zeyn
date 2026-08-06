export class Utf8Validator {
  private pending = 0;
  private lowerBound = 0x80;
  private upperBound = 0xbf;

  push(bytes: Uint8Array): boolean {
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i]!;
      if (this.pending === 0) {
        if (byte <= 0x7f) continue;
        if (byte >= 0xc2 && byte <= 0xdf) {
          this.pending = 1;
          this.lowerBound = 0x80;
          this.upperBound = 0xbf;
        } else if (byte === 0xe0) {
          this.pending = 2;
          this.lowerBound = 0xa0;
          this.upperBound = 0xbf;
        } else if (byte >= 0xe1 && byte <= 0xec) {
          this.pending = 2;
          this.lowerBound = 0x80;
          this.upperBound = 0xbf;
        } else if (byte === 0xed) {
          this.pending = 2;
          this.lowerBound = 0x80;
          this.upperBound = 0x9f;
        } else if (byte === 0xee || byte === 0xef) {
          this.pending = 2;
          this.lowerBound = 0x80;
          this.upperBound = 0xbf;
        } else if (byte === 0xf0) {
          this.pending = 3;
          this.lowerBound = 0x90;
          this.upperBound = 0xbf;
        } else if (byte >= 0xf1 && byte <= 0xf3) {
          this.pending = 3;
          this.lowerBound = 0x80;
          this.upperBound = 0xbf;
        } else if (byte === 0xf4) {
          this.pending = 3;
          this.lowerBound = 0x80;
          this.upperBound = 0x8f;
        } else {
          return false;
        }
        continue;
      }
      if (byte < this.lowerBound || byte > this.upperBound) return false;
      this.lowerBound = 0x80;
      this.upperBound = 0xbf;
      this.pending -= 1;
    }
    return true;
  }

  get isComplete(): boolean {
    return this.pending === 0;
  }

  reset(): void {
    this.pending = 0;
    this.lowerBound = 0x80;
    this.upperBound = 0xbf;
  }
}

export function isValidUtf8(bytes: Uint8Array): boolean {
  const validator = new Utf8Validator();
  return validator.push(bytes) && validator.isComplete;
}

export function decodeUtf8(bytes: Uint8Array): string | null {
  if (!isValidUtf8(bytes)) return null;
  const units: number[] = [];
  const parts: string[] = [];
  let i = 0;
  while (i < bytes.length) {
    const byte = bytes[i]!;
    let codePoint: number;
    if (byte <= 0x7f) {
      codePoint = byte;
      i += 1;
    } else if (byte <= 0xdf) {
      codePoint = ((byte & 0x1f) << 6) | (bytes[i + 1]! & 0x3f);
      i += 2;
    } else if (byte <= 0xef) {
      codePoint = ((byte & 0x0f) << 12) | ((bytes[i + 1]! & 0x3f) << 6) | (bytes[i + 2]! & 0x3f);
      i += 3;
    } else {
      codePoint =
        ((byte & 0x07) << 18) |
        ((bytes[i + 1]! & 0x3f) << 12) |
        ((bytes[i + 2]! & 0x3f) << 6) |
        (bytes[i + 3]! & 0x3f);
      i += 4;
    }
    if (codePoint > 0xffff) {
      const adjusted = codePoint - 0x10000;
      units.push(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff));
    } else {
      units.push(codePoint);
    }
    if (units.length >= 4096) {
      parts.push(String.fromCharCode(...units));
      units.length = 0;
    }
  }
  if (units.length > 0) parts.push(String.fromCharCode(...units));
  return parts.join("");
}

export function encodeUtf8(text: string): Uint8Array {
  const out = new Uint8Array(utf8Length(text));
  let written = 0;
  for (let i = 0; i < text.length; i++) {
    let codePoint = text.charCodeAt(i);
    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      const next = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
      if (next >= 0xdc00 && next <= 0xdfff) {
        codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00);
        i += 1;
      } else {
        codePoint = 0xfffd;
      }
    } else if (codePoint >= 0xdc00 && codePoint <= 0xdfff) {
      codePoint = 0xfffd;
    }

    if (codePoint <= 0x7f) {
      out[written++] = codePoint;
    } else if (codePoint <= 0x7ff) {
      out[written++] = 0xc0 | (codePoint >> 6);
      out[written++] = 0x80 | (codePoint & 0x3f);
    } else if (codePoint <= 0xffff) {
      out[written++] = 0xe0 | (codePoint >> 12);
      out[written++] = 0x80 | ((codePoint >> 6) & 0x3f);
      out[written++] = 0x80 | (codePoint & 0x3f);
    } else {
      out[written++] = 0xf0 | (codePoint >> 18);
      out[written++] = 0x80 | ((codePoint >> 12) & 0x3f);
      out[written++] = 0x80 | ((codePoint >> 6) & 0x3f);
      out[written++] = 0x80 | (codePoint & 0x3f);
    }
  }
  return written === out.length ? out : out.subarray(0, written);
}

function utf8Length(text: string): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    const codeUnit = text.charCodeAt(i);
    if (codeUnit <= 0x7f) {
      total += 1;
    } else if (codeUnit <= 0x7ff) {
      total += 2;
    } else if (codeUnit >= 0xd800 && codeUnit <= 0xdbff) {
      const next = i + 1 < text.length ? text.charCodeAt(i + 1) : 0;
      if (next >= 0xdc00 && next <= 0xdfff) {
        total += 4;
        i += 1;
      } else {
        total += 3;
      }
    } else {
      total += 3;
    }
  }
  return total;
}
