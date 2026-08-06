export class ByteQueue {
  private chunks: Uint8Array[] = [];
  private head = 0;
  private offset = 0;
  private total = 0;

  push(chunk: Uint8Array): void {
    if (chunk.length === 0) return;
    this.chunks.push(chunk);
    this.total += chunk.length;
  }

  get length(): number {
    return this.total;
  }

  byteAt(index: number): number {
    let remaining = index + this.offset;
    for (let i = this.head; i < this.chunks.length; i++) {
      const chunk = this.chunks[i]!;
      if (remaining < chunk.length) return chunk[remaining]!;
      remaining -= chunk.length;
    }
    throw new RangeError("ByteQueue read out of range");
  }

  read(count: number): Uint8Array {
    if (count > this.total) throw new RangeError("ByteQueue read out of range");
    const out = new Uint8Array(count);
    let written = 0;
    while (written < count) {
      const chunk = this.chunks[this.head]!;
      const available = chunk.length - this.offset;
      const take = available < count - written ? available : count - written;
      out.set(chunk.subarray(this.offset, this.offset + take), written);
      written += take;
      this.offset += take;
      if (this.offset === chunk.length) {
        this.head += 1;
        this.offset = 0;
      }
    }
    this.total -= count;
    this.compact();
    return out;
  }

  discard(count: number): void {
    this.read(count);
  }

  clear(): void {
    this.chunks = [];
    this.head = 0;
    this.offset = 0;
    this.total = 0;
  }

  private compact(): void {
    if (this.head === this.chunks.length) {
      this.chunks = [];
      this.head = 0;
      this.offset = 0;
      return;
    }
    if (this.head > 64) {
      this.chunks = this.chunks.slice(this.head);
      this.head = 0;
    }
  }
}

export function concatBytes(parts: readonly Uint8Array[], totalLength: number): Uint8Array {
  const out = new Uint8Array(totalLength);
  let written = 0;
  for (const part of parts) {
    out.set(part, written);
    written += part.length;
  }
  return out;
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function latin1Decode(bytes: Uint8Array): string {
  let out = "";
  const step = 4096;
  for (let start = 0; start < bytes.length; start += step) {
    const slice = bytes.subarray(start, Math.min(start + step, bytes.length));
    out += String.fromCharCode(...slice);
  }
  return out;
}

export function latin1Encode(text: string): Uint8Array {
  const out = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    out[i] = text.charCodeAt(i) & 0xff;
  }
  return out;
}
