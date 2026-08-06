import { describe, it, expect } from "vitest";
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";
import { subjects } from "@zeyn/db/schema";

import {
  D1_MAX_PARAMS_PER_QUERY,
  chunk,
  isReferencedByConfig,
  likeTerm,
  rowsPerStatement,
  searchLike,
} from "../src/routers/admin/_shared";

describe("rowsPerStatement", () => {
  it("keeps columns * rows within D1's bound-parameter ceiling", () => {
    for (const columns of [2, 3, 5, 9, 12]) {
      const rows = rowsPerStatement(columns);
      expect(rows * columns).toBeLessThanOrEqual(D1_MAX_PARAMS_PER_QUERY);
      expect(rows).toBeGreaterThanOrEqual(1);
    }
  });

  it("returns 5 columns -> 19 rows, matching the game repositories", () => {
    expect(rowsPerStatement(5)).toBe(19);
  });

  it("never returns zero even for absurdly wide tables", () => {
    expect(rowsPerStatement(500)).toBe(1);
  });
});

describe("chunk", () => {
  it("splits a 500-row import into statements that fit D1's limit", () => {
    const rows = Array.from({ length: 500 }, (_, i) => i);
    const chunks = chunk(rows, rowsPerStatement(5));
    expect(chunks).toHaveLength(27);
    expect(chunks.flat()).toEqual(rows);
    for (const part of chunks) {
      expect(part.length * 5).toBeLessThanOrEqual(D1_MAX_PARAMS_PER_QUERY);
    }
  });

  it("returns no chunks for an empty list", () => {
    expect(chunk([], 10)).toEqual([]);
  });
});

describe("isReferencedByConfig", () => {
  const id = "6f0b6e42-1f2f-4f5e-9a11-1a2b3c4d5e6f";

  it("finds an id inside a subjectIds array", () => {
    const config = JSON.stringify({ subjectIds: ["other", id] });
    expect(isReferencedByConfig(config, id)).toBe(true);
  });

  it("finds an id inside a nested structure", () => {
    const config = JSON.stringify({ rounds: [{ artistIds: [id] }] });
    expect(isReferencedByConfig(config, id)).toBe(true);
  });

  it("does not match an id that is only a substring of another value", () => {
    const config = JSON.stringify({ subjectIds: [`${id}-extra`] });
    expect(isReferencedByConfig(config, id)).toBe(false);
  });

  it("does not match when the id appears only as an object key", () => {
    const config = JSON.stringify({ [id]: true });
    expect(isReferencedByConfig(config, id)).toBe(false);
  });

  it("returns false for malformed or empty config", () => {
    expect(isReferencedByConfig("not json", id)).toBe(false);
    expect(isReferencedByConfig("", id)).toBe(false);
    expect(isReferencedByConfig(JSON.stringify({}), "")).toBe(false);
  });
});

describe("likeTerm", () => {
  it("wraps the term in wildcards", () => {
    expect(likeTerm("ada")).toBe("%ada%");
  });

  it("escapes LIKE wildcards so a search for _ is literal", () => {
    expect(likeTerm("a_b")).toBe("%a\\_b%");
    expect(likeTerm("50%")).toBe("%50\\%%");
  });

  it("escapes the escape character itself", () => {
    expect(likeTerm("a\\b")).toBe("%a\\\\b%");
  });
});

describe("searchLike", () => {
  const dialect = new SQLiteSyncDialect();

  it("emits ESCAPE with a literal backslash, not an empty escape char", () => {
    const { sql, params } = dialect.sqlToQuery(
      searchLike(subjects.name, "a_b")
    );
    expect(sql).toContain("LIKE ?");
    expect(sql).toContain("ESCAPE '\\'");
    expect(sql).not.toContain("ESCAPE ''");
    expect(params).toEqual(["%a\\_b%"]);
  });

  it("passes an ordinary term through as a plain wildcard match", () => {
    const { params } = dialect.sqlToQuery(searchLike(subjects.name, "ada"));
    expect(params).toEqual(["%ada%"]);
  });
});
