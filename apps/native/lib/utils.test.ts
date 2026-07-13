import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
  it("keeps the text colour when a custom type-scale class is applied", () => {
    for (const size of [
      "text-display",
      "text-title-1",
      "text-title-2",
      "text-title-3",
      "text-body",
      "text-callout",
      "text-footnote",
      "text-caption",
    ]) {
      const result = cn("text-foreground", `text-center ${size}`);
      expect(result, `${size} must not strip the colour`).toContain(
        "text-foreground"
      );
      expect(result).toContain(size);
    }
  });

  it("still lets an explicit colour override the default", () => {
    expect(cn("text-foreground", "text-caption text-muted-foreground")).toBe(
      "text-caption text-muted-foreground"
    );
  });

  it("still dedupes a genuine size conflict", () => {
    expect(cn("text-title-2", "text-caption")).toBe("text-caption");
  });

  it("keeps custom radii from conflicting with a side-specific radius", () => {
    expect(cn("rounded-card", "rounded-b-none")).toContain("rounded-card");
    expect(cn("rounded-card", "rounded-b-none")).toContain("rounded-b-none");
  });
});
