import { describe, it, expect } from "vitest";
import {
  GAME_CODE_ALPHABET,
  generateGameCode,
  isGameCode,
  type RandomBytes,
} from "../src/game-code";
import {
  LOCAL_CODE_LENGTH,
  LOCAL_CODE_VERSION,
  LOCAL_PORT,
  encodeLocalCode,
  formatLocalCode,
  generateLocalNonce,
  isLocalCode,
  localGuestUrl,
  parseLocalCode,
  parseLocalGuestUrl,
} from "../src/local-code";

const MAX_NONCE = 16_777_215;

const IPS = [
  "192.168.1.42",
  "10.0.0.1",
  "172.20.10.3",
  "10.255.255.254",
  "0.0.0.0",
  "255.255.255.255",
];

const NONCES = [0, 1, 8_388_608, MAX_NONCE];

const MATRIX = IPS.flatMap((ip) => NONCES.map((nonce) => ({ ip, nonce })));

describe("encodeLocalCode / parseLocalCode round-trip", () => {
  for (const { ip, nonce } of MATRIX) {
    it(`round-trips ip ${ip} with nonce ${nonce} without losing a bit`, () => {
      const code = encodeLocalCode(ip, nonce);
      const address = parseLocalCode(code);

      expect(address).not.toBeNull();
      expect(address?.ip).toBe(ip);
      expect(address?.nonce).toBe(nonce);
      expect(address?.version).toBe(LOCAL_CODE_VERSION);
    });
  }

  it("round-trips every 4-bit version with the 60-bit extremes", () => {
    for (let version = 0; version <= 15; version++) {
      for (const ip of ["0.0.0.0", "255.255.255.255"]) {
        for (const nonce of [0, MAX_NONCE]) {
          const code = encodeLocalCode(ip, nonce, version);
          expect(code).toHaveLength(LOCAL_CODE_LENGTH);

          const parsed = parseLocalCode(code);
          if (version === LOCAL_CODE_VERSION) {
            expect(parsed).toEqual({ version, ip, nonce });
          } else {
            expect(parsed).toBeNull();
          }
        }
      }
    }
  });

  it("packs the all-ones 60-bit value as twelve Z characters", () => {
    expect(encodeLocalCode("255.255.255.255", MAX_NONCE, 15)).toBe("ZZZZZZZZZZZZ");
  });

  it("produces distinct codes for neighbouring nonces and ips", () => {
    const codes = new Set<string>();
    for (const { ip, nonce } of MATRIX) codes.add(encodeLocalCode(ip, nonce));
    expect(codes.size).toBe(MATRIX.length);
  });

  it("round-trips a wide sweep of ips and nonces across the whole 56-bit payload", () => {
    for (let step = 0; step < 256; step++) {
      const ip = `${step % 256}.${(step * 7 + 3) % 256}.${(step * 31 + 17) % 256}.${(step * 97 + 251) % 256}`;
      const nonce = (step * 65_657) % (MAX_NONCE + 1);

      const parsed = parseLocalCode(encodeLocalCode(ip, nonce));
      expect(parsed).toEqual({ version: LOCAL_CODE_VERSION, ip, nonce });
    }
  });
});

describe("encodeLocalCode output shape", () => {
  for (const { ip, nonce } of MATRIX) {
    it(`emits exactly 12 alphabet characters for ${ip} / ${nonce}`, () => {
      const code = encodeLocalCode(ip, nonce);

      expect(code).toHaveLength(LOCAL_CODE_LENGTH);
      expect(code).toHaveLength(12);
      for (const char of code) {
        expect(GAME_CODE_ALPHABET.includes(char)).toBe(true);
      }
    });
  }
});

describe("parseLocalCode tolerance", () => {
  const canonical = encodeLocalCode("192.168.1.42", 8_388_608);
  const expected = { version: LOCAL_CODE_VERSION, ip: "192.168.1.42", nonce: 8_388_608 };

  it("parses the canonical code", () => {
    expect(parseLocalCode(canonical)).toEqual(expected);
  });

  it("parses lowercase input", () => {
    expect(parseLocalCode(canonical.toLowerCase())).toEqual(expected);
  });

  it("parses input with dashes", () => {
    expect(parseLocalCode(formatLocalCode(canonical))).toEqual(expected);
  });

  it("parses input with spaces and surrounding whitespace", () => {
    const spaced = `  ${canonical.slice(0, 4)} ${canonical.slice(4, 8)} ${canonical.slice(8)}  `;
    expect(parseLocalCode(spaced)).toEqual(expected);
  });

  it("applies the I/L -> 1 and O -> 0 substitutions", () => {
    const zeroed = encodeLocalCode("0.0.0.0", 0);
    expect(zeroed).toBe("200000000000");

    expect(parseLocalCode("2OOOOOOOOOOO")).toEqual({
      version: LOCAL_CODE_VERSION,
      ip: "0.0.0.0",
      nonce: 0,
    });
    expect(parseLocalCode("2ooooooooooo")).toEqual({
      version: LOCAL_CODE_VERSION,
      ip: "0.0.0.0",
      nonce: 0,
    });
  });

  it("treats I, L and O look-alikes inside a real code the same as 1, 1 and 0", () => {
    for (const { ip, nonce } of MATRIX) {
      const code = encodeLocalCode(ip, nonce);
      const ambiguous = code.replace(/0/g, "O").replace(/1/g, "I");
      const ambiguousL = code.replace(/1/g, "l").toLowerCase();

      expect(parseLocalCode(ambiguous)).toEqual({ version: LOCAL_CODE_VERSION, ip, nonce });
      expect(parseLocalCode(ambiguousL)).toEqual({ version: LOCAL_CODE_VERSION, ip, nonce });
    }
  });

  it("isLocalCode agrees with parseLocalCode on every tolerated form", () => {
    const forms = [
      canonical,
      canonical.toLowerCase(),
      formatLocalCode(canonical),
      canonical.replace(/0/g, "O"),
      "not a code",
      "",
    ];

    for (const form of forms) {
      expect(isLocalCode(form)).toBe(parseLocalCode(form) !== null);
    }
  });
});

describe("parseLocalCode rejection", () => {
  const invalid = [
    "",
    "   ",
    "garbage",
    "!!!!!!!!!!!!",
    "ZZZZZZZZZZZ",
    "ZZZZZZZZZZZZZ",
    "20000000000",
    "2000000000000",
    "2000000000U0",
    "2000000000!0",
    "192.168.1.42",
  ];

  for (const value of invalid) {
    it(`returns null (never throws) for ${JSON.stringify(value)}`, () => {
      expect(() => parseLocalCode(value)).not.toThrow();
      expect(parseLocalCode(value)).toBeNull();
      expect(isLocalCode(value)).toBe(false);
    });
  }

  it("rejects a structurally valid code carrying an unknown version", () => {
    for (const version of [0, 2, 7, 15]) {
      const code = encodeLocalCode("192.168.1.42", 42, version);

      expect(code).toHaveLength(LOCAL_CODE_LENGTH);
      expect(parseLocalCode(code)).toBeNull();
      expect(isLocalCode(code)).toBe(false);
    }
  });

  it("rejects codes containing characters outside the alphabet", () => {
    for (const char of ["U", "u", "-", "@"]) {
      const code = `2000000000${char}0`;
      expect(parseLocalCode(code)).toBeNull();
    }
  });
});

describe("cloud and local codes never collide", () => {
  it("rejects a valid 8-char cloud code", () => {
    const fixedBytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
    const randomBytes: RandomBytes = (length) => fixedBytes.slice(0, length);
    const cloudCode = generateGameCode(randomBytes);

    expect(cloudCode).toBe("01234567");
    expect(isGameCode(cloudCode)).toBe(true);
    expect(parseLocalCode(cloudCode)).toBeNull();
    expect(isLocalCode(cloudCode)).toBe(false);
  });

  it("rejects many randomly generated cloud codes", () => {
    for (let i = 0; i < 200; i++) {
      const cloudCode = generateGameCode();
      expect(isGameCode(cloudCode)).toBe(true);
      expect(parseLocalCode(cloudCode)).toBeNull();
    }
  });

  it("a valid local code is never a valid cloud code", () => {
    for (const { ip, nonce } of MATRIX) {
      const code = encodeLocalCode(ip, nonce);

      expect(isLocalCode(code)).toBe(true);
      expect(isGameCode(code)).toBe(false);
      expect(isGameCode(formatLocalCode(code))).toBe(false);
    }
  });
});

describe("localGuestUrl / parseLocalGuestUrl", () => {
  it("builds the fixed-port guest url", () => {
    const url = localGuestUrl({ version: LOCAL_CODE_VERSION, ip: "192.168.1.42", nonce: 0 });

    expect(url).toBe(`http://192.168.1.42:${LOCAL_PORT}/?r=00000`);
    expect(LOCAL_PORT).toBe(47801);
  });

  for (const { ip, nonce } of MATRIX) {
    it(`round-trips the guest url for ${ip} / ${nonce}`, () => {
      const address = { version: LOCAL_CODE_VERSION, ip, nonce };
      const url = localGuestUrl(address);

      expect(url.startsWith(`http://${ip}:${LOCAL_PORT}/?r=`)).toBe(true);
      expect(parseLocalGuestUrl(url)).toEqual(address);
    });
  }

  it("encodes the nonce url-safely with no escaping needed", () => {
    for (const { ip, nonce } of MATRIX) {
      const url = localGuestUrl({ version: LOCAL_CODE_VERSION, ip, nonce });
      expect(encodeURI(url)).toBe(url);

      const room = new URL(url).searchParams.get("r") ?? "";
      expect(room).toHaveLength(5);
      for (const char of room) expect(GAME_CODE_ALPHABET.includes(char)).toBe(true);
    }
  });

  it("returns null (never throws) for malformed urls", () => {
    const invalid = [
      "",
      "not a url",
      "http://",
      `http://192.168.1.42:${LOCAL_PORT}/`,
      `http://192.168.1.42:${LOCAL_PORT}/?x=00000`,
      `http://example.com:${LOCAL_PORT}/?r=00000`,
      `http://999.1.1.1:${LOCAL_PORT}/?r=00000`,
      `http://192.168.1.42:${LOCAL_PORT}/?r=`,
      `http://192.168.1.42:${LOCAL_PORT}/?r=000`,
      `http://192.168.1.42:${LOCAL_PORT}/?r=0000000`,
      `http://192.168.1.42:${LOCAL_PORT}/?r=ZZZZZ`,
      `http://192.168.1.42:${LOCAL_PORT}/?r=000U0`,
    ];

    for (const url of invalid) {
      expect(() => parseLocalGuestUrl(url)).not.toThrow();
      expect(parseLocalGuestUrl(url)).toBeNull();
    }
  });

  it("accepts the maximum in-range nonce but rejects an over-range one", () => {
    const max = localGuestUrl({ version: LOCAL_CODE_VERSION, ip: "10.0.0.1", nonce: MAX_NONCE });

    expect(parseLocalGuestUrl(max)).toEqual({
      version: LOCAL_CODE_VERSION,
      ip: "10.0.0.1",
      nonce: MAX_NONCE,
    });
    expect(parseLocalGuestUrl(`http://10.0.0.1:${LOCAL_PORT}/?r=ZZZZZ`)).toBeNull();
  });
});

describe("generateLocalNonce", () => {
  const injected = (bytes: number[]): RandomBytes => {
    return () => new Uint8Array(bytes);
  };

  it("maps all-zero bytes to 0", () => {
    expect(generateLocalNonce(injected([0, 0, 0]))).toBe(0);
  });

  it("maps all-0xFF bytes to the 24-bit maximum", () => {
    expect(generateLocalNonce(injected([0xff, 0xff, 0xff]))).toBe(MAX_NONCE);
    expect(generateLocalNonce(injected([0xff, 0xff, 0xff]))).toBe(16_777_215);
  });

  it("requests exactly three bytes", () => {
    let requested: number | undefined;
    generateLocalNonce((length) => {
      requested = length;
      return new Uint8Array(length);
    });

    expect(requested).toBe(3);
  });

  it("combines the three bytes big-endian without bias", () => {
    expect(generateLocalNonce(injected([0x00, 0x00, 0x01]))).toBe(1);
    expect(generateLocalNonce(injected([0x00, 0x01, 0x00]))).toBe(256);
    expect(generateLocalNonce(injected([0x01, 0x00, 0x00]))).toBe(65_536);
    expect(generateLocalNonce(injected([0x12, 0x34, 0x56]))).toBe(0x123456);
    expect(generateLocalNonce(injected([0x80, 0x00, 0x00]))).toBe(8_388_608);
  });

  it("always yields an integer inside the 24-bit range with the default rng", () => {
    for (let i = 0; i < 500; i++) {
      const nonce = generateLocalNonce();

      expect(Number.isInteger(nonce)).toBe(true);
      expect(nonce).toBeGreaterThanOrEqual(0);
      expect(nonce).toBeLessThanOrEqual(MAX_NONCE);
      expect(parseLocalCode(encodeLocalCode("192.168.1.42", nonce))?.nonce).toBe(nonce);
    }
  });
});

describe("formatLocalCode", () => {
  it("groups a valid code into three groups of four", () => {
    const code = encodeLocalCode("192.168.1.42", 8_388_608);
    const formatted = formatLocalCode(code);

    expect(formatted).toBe(`${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`);
    expect(formatted).toHaveLength(14);
    expect(formatted.split("-")).toHaveLength(3);
    for (const group of formatted.split("-")) expect(group).toHaveLength(4);
  });

  it("returns invalid input unchanged", () => {
    for (const value of ["", "nope", "01234567", "ZZZZZZZZZZZZ", "2000000000U0"]) {
      expect(formatLocalCode(value)).toBe(value);
    }
  });
});

describe("encodeLocalCode validation", () => {
  it("throws on malformed ip addresses", () => {
    const malformed = [
      "999.1.1.1",
      "1.2.3",
      "1.2.3.4.5",
      "abc.def.gha.bcd",
      "",
      "192.168.01.1",
      " 192.168.1.1",
      "192.168.1.1 ",
      "::1",
      "fe80::1",
      "192.168.1.256",
      "-1.0.0.0",
    ];

    for (const ip of malformed) {
      expect(() => encodeLocalCode(ip, 0)).toThrow();
    }
  });

  it("throws on out-of-range nonces", () => {
    for (const nonce of [-1, 1.5, MAX_NONCE + 1, Number.NaN, Number.POSITIVE_INFINITY, 2 ** 32]) {
      expect(() => encodeLocalCode("192.168.1.42", nonce)).toThrow();
    }
  });

  it("throws on out-of-range versions", () => {
    for (const version of [-1, 16, 1.5, Number.NaN]) {
      expect(() => encodeLocalCode("192.168.1.42", 0, version)).toThrow();
    }
  });

  it("accepts the boundary values", () => {
    expect(() => encodeLocalCode("0.0.0.0", 0, 0)).not.toThrow();
    expect(() => encodeLocalCode("255.255.255.255", MAX_NONCE, 15)).not.toThrow();
  });
});

describe("parseLocalGuestUrl does not depend on a WHATWG URL implementation", () => {
  it("parses without constructing a URL, so it works under Hermes", () => {
    const globals = globalThis as Record<string, unknown>;
    const original = globals["URL"];
    delete globals["URL"];
    try {
      const address = { version: 1, ip: "192.168.1.42", nonce: 12345 };
      const url = localGuestUrl(address);
      expect(parseLocalGuestUrl(url)).toEqual(address);
    } finally {
      globals["URL"] = original;
    }
  });

  it("rejects an octal-looking octet rather than reinterpreting it", () => {
    expect(parseLocalGuestUrl("http://192.168.01.1:47801/?r=00009")).toBeNull();
  });

  it("rejects a host that is not a dotted-quad IPv4", () => {
    expect(parseLocalGuestUrl("http://evil.example.com:47801/?r=00009")).toBeNull();
    expect(parseLocalGuestUrl("http://192.168.1.999:47801/?r=00009")).toBeNull();
  });

  it("rejects a url pointing at a port that is not the local port", () => {
    expect(parseLocalGuestUrl("http://192.168.1.42:8080/?r=00009")).toBeNull();
  });

  it("tolerates extra query parameters before the room nonce", () => {
    const address = { version: 1, ip: "10.0.0.1", nonce: 7 };
    const room = localGuestUrl(address).split("r=")[1];
    expect(parseLocalGuestUrl(`http://10.0.0.1:47801/?utm=x&r=${room}`)).toEqual(address);
  });
});
