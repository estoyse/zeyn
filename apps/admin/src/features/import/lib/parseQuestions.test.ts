import { describe, it, expect } from "vitest";

import { parseQuestions, splitCsvLine } from "./parseQuestions";

describe("splitCsvLine", () => {
  it("splits plain fields", () => {
    expect(splitCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("keeps commas inside quotes", () => {
    expect(splitCsvLine('"Hello, world",b,10')).toEqual([
      "Hello, world",
      "b",
      "10",
    ]);
  });

  it("unescapes doubled quotes", () => {
    expect(splitCsvLine('"She said ""hi""",b,10')).toEqual([
      'She said "hi"',
      "b",
      "10",
    ]);
  });

  it("preserves empty trailing fields", () => {
    expect(splitCsvLine("a,,")).toEqual(["a", "", ""]);
  });
});

describe("parseQuestions csv", () => {
  it("accepts a header row and parses the body", () => {
    const rows = parseQuestions(
      "text,answer,points\nCapital of France?,Paris,10",
      "csv"
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ok).toBe(true);
    expect(rows[0]?.value).toEqual({
      text: "Capital of France?",
      answer: "Paris",
      points: 10,
    });
  });

  it("works without a header row", () => {
    const rows = parseQuestions("Capital of France?,Paris,10", "csv");
    expect(rows[0]?.ok).toBe(true);
    expect(rows[0]?.value?.answer).toBe("Paris");
  });

  it("respects header column order", () => {
    const rows = parseQuestions("points,answer,text\n30,Mars,Red planet?", "csv");
    expect(rows[0]?.value).toEqual({
      text: "Red planet?",
      answer: "Mars",
      points: 30,
    });
  });

  it("reports bad rows without discarding the good ones", () => {
    const rows = parseQuestions(
      ["text,answer,points", "Good?,Yes,10", "Bad?,No,zero", "Missing,Cols"].join(
        "\n"
      ),
      "csv"
    );
    expect(rows.map(row => row.ok)).toEqual([true, false, false]);
    expect(rows[1]?.error).toContain("points");
    expect(rows[2]?.error).toContain("3 columns");
  });

  it("rejects non-integer and out-of-range points", () => {
    const rows = parseQuestions(
      ["A?,a,10.5", "B?,b,0", "C?,c,5000"].join("\n"),
      "csv"
    );
    expect(rows.every(row => !row.ok)).toBe(true);
  });

  it("ignores blank lines", () => {
    const rows = parseQuestions("A?,a,10\n\n\nB?,b,20\n", "csv");
    expect(rows).toHaveLength(2);
  });

  it("flags in-batch duplicates case-insensitively but keeps them valid", () => {
    const rows = parseQuestions("Same?,a,10\nSAME?,b,20", "csv");
    expect(rows[0]?.duplicate).toBeUndefined();
    expect(rows[1]?.duplicate).toBe(true);
    expect(rows[1]?.ok).toBe(true);
  });
});

describe("parseQuestions json", () => {
  it("parses an array of objects", () => {
    const rows = parseQuestions(
      JSON.stringify([{ text: "A?", answer: "a", points: 10 }]),
      "json"
    );
    expect(rows[0]?.ok).toBe(true);
    expect(rows[0]?.value?.points).toBe(10);
  });

  it("coerces numeric strings for points", () => {
    const rows = parseQuestions(
      JSON.stringify([{ text: "A?", answer: "a", points: "20" }]),
      "json"
    );
    expect(rows[0]?.value?.points).toBe(20);
  });

  it("reports invalid JSON as a single failed row", () => {
    const rows = parseQuestions("{not json", "json");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ok).toBe(false);
    expect(rows[0]?.error).toContain("invalid JSON");
  });

  it("rejects a non-array payload", () => {
    const rows = parseQuestions('{"text":"A?"}', "json");
    expect(rows[0]?.error).toContain("array");
  });

  it("flags missing fields per row", () => {
    const rows = parseQuestions(
      JSON.stringify([
        { text: "A?", answer: "a", points: 10 },
        { text: "", answer: "b", points: 10 },
        { text: "C?", points: 10 },
      ]),
      "json"
    );
    expect(rows.map(row => row.ok)).toEqual([true, false, false]);
  });
});
