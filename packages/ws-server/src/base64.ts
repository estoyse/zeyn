const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const REVERSE: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
  REVERSE[ALPHABET[i]!] = i;
}

export function base64Encode(bytes: Uint8Array): string {
  let out = "";
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const triple = (bytes[i]! << 16) | (bytes[i + 1]! << 8) | bytes[i + 2]!;
    out +=
      ALPHABET[(triple >> 18) & 0x3f]! +
      ALPHABET[(triple >> 12) & 0x3f]! +
      ALPHABET[(triple >> 6) & 0x3f]! +
      ALPHABET[triple & 0x3f]!;
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const triple = bytes[i]! << 16;
    out += ALPHABET[(triple >> 18) & 0x3f]! + ALPHABET[(triple >> 12) & 0x3f]! + "==";
  } else if (remaining === 2) {
    const triple = (bytes[i]! << 16) | (bytes[i + 1]! << 8);
    out +=
      ALPHABET[(triple >> 18) & 0x3f]! +
      ALPHABET[(triple >> 12) & 0x3f]! +
      ALPHABET[(triple >> 6) & 0x3f]! +
      "=";
  }
  return out;
}

export function base64Decode(text: string): Uint8Array | null {
  let body = text;
  while (body.length > 0 && body[body.length - 1] === "=") {
    body = body.slice(0, -1);
  }
  const remainder = body.length % 4;
  if (remainder === 1) return null;
  const byteLength = Math.floor((body.length * 3) / 4);
  const out = new Uint8Array(byteLength);
  let accumulator = 0;
  let bits = 0;
  let written = 0;
  for (let i = 0; i < body.length; i++) {
    const value = REVERSE[body[i]!];
    if (value === undefined) return null;
    accumulator = (accumulator << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[written] = (accumulator >> bits) & 0xff;
      written += 1;
    }
  }
  return out;
}
