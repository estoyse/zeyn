import { describe, expect, it } from "vitest";
import {
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
  canonicalizeGameId,
  formatGameCode,
  generateGameCode,
  isGameCode,
  isGameUuid,
  normalizeGameCode,
} from "@zeyn/api/game-code";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("generateGameCode", () => {
  it("only ever emits characters from the alphabet", () => {
    for (let i = 0; i < 10_000; i++) {
      const code = generateGameCode();
      expect(code).toHaveLength(GAME_CODE_LENGTH);
      expect(isGameCode(code)).toBe(true);
      for (const char of code) expect(GAME_CODE_ALPHABET).toContain(char);
    }
  });

  it("never emits the ambiguous characters I, L, O or U", () => {
    for (let i = 0; i < 10_000; i++) {
      expect(generateGameCode()).not.toMatch(/[ILOU]/);
    }
  });

  it("reaches every symbol in the alphabet", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 10_000; i++) {
      for (const char of generateGameCode()) seen.add(char);
    }
    expect(seen.size).toBe(GAME_CODE_ALPHABET.length);
  });
});

describe("normalizeGameCode", () => {
  it("applies Crockford decode mappings", () => {
    expect(normalizeGameCode("illo")).toBe("1110");
    expect(normalizeGameCode("ILLO")).toBe("1110");
  });

  it("uppercases before remapping so lowercase i/l/o are caught", () => {
    expect(normalizeGameCode("k7i2xl4o")).toBe("K712X140");
  });

  it("strips separators", () => {
    expect(normalizeGameCode("K7M2 XQ4B")).toBe("K7M2XQ4B");
    expect(normalizeGameCode("K7M2-XQ4B")).toBe("K7M2XQ4B");
  });

  it("does not remap U", () => {
    expect(normalizeGameCode("K7M2XQ4U")).toBe("K7M2XQ4U");
    expect(isGameCode(normalizeGameCode("K7M2XQ4U"))).toBe(false);
  });

  it("handles empty input", () => {
    expect(normalizeGameCode("")).toBe("");
  });
});

describe("isGameCode", () => {
  it("accepts a canonical code", () => {
    expect(isGameCode("K7M2XQ4B")).toBe(true);
  });

  it("accepts an all-hex code without mistaking it for a UUID", () => {
    expect(isGameCode("0A2F4B6D")).toBe(true);
    expect(isGameUuid("0A2F4B6D")).toBe(false);
  });

  it("rejects I, L, O and U", () => {
    for (const char of ["I", "L", "O", "U"]) {
      expect(isGameCode(`K7M2XQ4${char}`)).toBe(false);
    }
  });

  it("rejects wrong lengths and lowercase", () => {
    expect(isGameCode("K7M2XQ4")).toBe(false);
    expect(isGameCode("K7M2XQ4BB")).toBe(false);
    expect(isGameCode("k7m2xq4b")).toBe(false);
    expect(isGameCode("")).toBe(false);
  });
});

describe("canonicalizeGameId", () => {
  it("passes a canonical code through", () => {
    expect(canonicalizeGameId("K7M2XQ4B")).toBe("K7M2XQ4B");
  });

  it("normalizes case, spacing and confusable characters", () => {
    expect(canonicalizeGameId("k7m2xq4b")).toBe("K7M2XQ4B");
    expect(canonicalizeGameId(" K7M2 XQ4B ")).toBe("K7M2XQ4B");
    expect(canonicalizeGameId("K7M2-XQ4B")).toBe("K7M2XQ4B");
  });

  it("folds a misread O onto 0 and I or L onto 1", () => {
    expect(canonicalizeGameId("K7M2XQ4O")).toBe("K7M2XQ40");
    expect(canonicalizeGameId("K7M2XQ4I")).toBe("K7M2XQ41");
    expect(canonicalizeGameId("k7m2xq4l")).toBe("K7M2XQ41");
  });

  it("extracts the code from a pasted URL", () => {
    expect(canonicalizeGameId("https://zeyn.uz/game/K7M2XQ4B")).toBe("K7M2XQ4B");
    expect(canonicalizeGameId("https://zeyn.uz/game/k7m2xq4b?x=1#f")).toBe(
      "K7M2XQ4B"
    );
    expect(canonicalizeGameId("/game/K7M2XQ4B")).toBe("K7M2XQ4B");
  });

  it("passes historical UUIDs through byte for byte", () => {
    expect(canonicalizeGameId(UUID)).toBe(UUID);
    expect(canonicalizeGameId(UUID.toUpperCase())).toBe(UUID.toUpperCase());
    expect(canonicalizeGameId(`https://zeyn.uz/game/${UUID}`)).toBe(UUID);
  });

  it("leaves unrecognized input untouched", () => {
    expect(canonicalizeGameId("not-a-real-room")).toBe("not-a-real-room");
    expect(canonicalizeGameId("K7M2XQ4U")).toBe("K7M2XQ4U");
    expect(canonicalizeGameId("")).toBe("");
  });

  it("is idempotent for every input shape", () => {
    const fixtures = [
      "K7M2XQ4B",
      "k7m2xq4b",
      " K7M2 XQ4B ",
      "K7M2-XQ4B",
      "https://zeyn.uz/game/k7m2xq4b",
      "/game/K7M2XQ4B",
      UUID,
      UUID.toUpperCase(),
      "not-a-real-room",
      "K7M2XQ4U",
      "",
      "0A2F4B6D",
    ];

    for (const input of fixtures) {
      const once = canonicalizeGameId(input);
      const twice = canonicalizeGameId(once);
      expect(twice).toBe(once);
    }
  });

  it("is idempotent for generated codes", () => {
    for (let i = 0; i < 1_000; i++) {
      const code = generateGameCode();
      expect(canonicalizeGameId(code)).toBe(code);
      expect(canonicalizeGameId(code.toLowerCase())).toBe(code);
    }
  });
});

describe("formatGameCode", () => {
  it("groups a code into two halves", () => {
    expect(formatGameCode("K7M2XQ4B")).toBe("K7M2 XQ4B");
  });

  it("leaves non-codes alone", () => {
    expect(formatGameCode(UUID)).toBe(UUID);
    expect(formatGameCode("")).toBe("");
  });
});
