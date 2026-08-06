import { questionFormSchema } from "@/features/content/lib/schemas";

export interface ParsedRow {
  index: number;
  raw: string;
  ok: boolean;
  error?: string;
  value?: { text: string; answer: string; points: number };
  duplicate?: boolean;
}

export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields.map(field => field.trim());
}

function validate(
  index: number,
  raw: string,
  candidate: { text: unknown; answer: unknown; points: unknown }
): ParsedRow {
  const points =
    typeof candidate.points === "string"
      ? Number(candidate.points)
      : candidate.points;

  const result = questionFormSchema.safeParse({
    text: typeof candidate.text === "string" ? candidate.text : "",
    answer: typeof candidate.answer === "string" ? candidate.answer : "",
    points: typeof points === "number" ? points : Number.NaN,
  });

  if (!result.success) {
    return {
      index,
      raw,
      ok: false,
      error: result.error.issues
        .map(issue => `${issue.path.join(".")}: ${issue.message}`)
        .join("; "),
    };
  }

  return { index, raw, ok: true, value: result.data };
}

export function parseCsv(input: string): ParsedRow[] {
  const lines = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length === 0) return [];

  const first = splitCsvLine(lines[0]!).map(field => field.toLowerCase());
  const hasHeader =
    first.includes("text") && first.includes("answer") && first.includes("points");

  const textIndex = hasHeader ? first.indexOf("text") : 0;
  const answerIndex = hasHeader ? first.indexOf("answer") : 1;
  const pointsIndex = hasHeader ? first.indexOf("points") : 2;

  const body = hasHeader ? lines.slice(1) : lines;

  return body.map((line, index) => {
    const fields = splitCsvLine(line);
    if (fields.length < 3) {
      return {
        index,
        raw: line,
        ok: false,
        error: `expected 3 columns (text, answer, points), got ${fields.length}`,
      };
    }
    return validate(index, line, {
      text: fields[textIndex],
      answer: fields[answerIndex],
      points: fields[pointsIndex],
    });
  });
}

export function parseJson(input: string): ParsedRow[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch (error) {
    return [
      {
        index: 0,
        raw: input.slice(0, 80),
        ok: false,
        error: `invalid JSON: ${(error as Error).message}`,
      },
    ];
  }

  if (!Array.isArray(parsed)) {
    return [
      {
        index: 0,
        raw: input.slice(0, 80),
        ok: false,
        error: "expected a JSON array of objects",
      },
    ];
  }

  return parsed.map((item, index) => {
    const raw = JSON.stringify(item);
    if (typeof item !== "object" || item === null) {
      return { index, raw, ok: false, error: "expected an object" };
    }
    const record = item as Record<string, unknown>;
    return validate(index, raw, {
      text: record.text,
      answer: record.answer,
      points: record.points,
    });
  });
}

export function markDuplicates(rows: ParsedRow[]): ParsedRow[] {
  const seen = new Set<string>();
  return rows.map(row => {
    if (!row.ok || !row.value) return row;
    const key = row.value.text.trim().toLowerCase();
    if (seen.has(key)) return { ...row, duplicate: true };
    seen.add(key);
    return row;
  });
}

export function parseQuestions(
  input: string,
  format: "csv" | "json"
): ParsedRow[] {
  const rows = format === "csv" ? parseCsv(input) : parseJson(input);
  return markDuplicates(rows);
}
