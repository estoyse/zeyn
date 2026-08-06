import { describe, it, expect } from "vitest";
import {
  generateGameCode,
  GAME_CODE_ALPHABET,
  GAME_CODE_LENGTH,
  isGameCode,
  type RandomBytes,
} from "../src/game-code";

describe("generateGameCode", () => {
  it("with the default RNG produces a valid code from the alphabet", () => {
    for (let i = 0; i < 200; i++) {
      const code = generateGameCode();
      expect(isGameCode(code)).toBe(true);
      for (const char of code) {
        expect(GAME_CODE_ALPHABET.includes(char)).toBe(true);
      }
    }
  });

  it("with an injected RandomBytes produces the exact deterministic output", () => {
    const fixedBytes = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);
    const randomBytes: RandomBytes = () => fixedBytes;

    const code = generateGameCode(randomBytes);

    expect(code).toBe("01234567");
  });

  it("calls the injected RandomBytes with length === GAME_CODE_LENGTH", () => {
    let receivedLength: number | undefined;
    const randomBytes: RandomBytes = (length) => {
      receivedLength = length;
      return new Uint8Array(length);
    };

    generateGameCode(randomBytes);

    expect(receivedLength).toBe(GAME_CODE_LENGTH);
    expect(receivedLength).toBe(8);
  });
});
