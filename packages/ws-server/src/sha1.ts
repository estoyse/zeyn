function rotateLeft(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) | 0;
}

export function sha1(message: Uint8Array): Uint8Array {
  const bitLength = message.length * 8;
  const paddedLength = (((message.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89 | 0;
  let h2 = 0x98badcfe | 0;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0 | 0;

  const schedule = new Int32Array(80);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let i = 0; i < 16; i++) {
      schedule[i] = view.getInt32(offset + i * 4, false);
    }
    for (let i = 16; i < 80; i++) {
      schedule[i] = rotateLeft(
        schedule[i - 3]! ^ schedule[i - 8]! ^ schedule[i - 14]! ^ schedule[i - 16]!,
        1,
      );
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i++) {
      let f: number;
      let k: number;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc | 0;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6 | 0;
      }
      const temp = (rotateLeft(a, 5) + f + e + k + schedule[i]!) | 0;
      e = d;
      d = c;
      c = rotateLeft(b, 30);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  const digest = new Uint8Array(20);
  const digestView = new DataView(digest.buffer);
  digestView.setInt32(0, h0, false);
  digestView.setInt32(4, h1, false);
  digestView.setInt32(8, h2, false);
  digestView.setInt32(12, h3, false);
  digestView.setInt32(16, h4, false);
  return digest;
}
