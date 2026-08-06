const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatDate(value: Date | number | string | null | undefined) {
  if (value === null || value === undefined) return "—";
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(
  value: Date | number | string | null | undefined
) {
  if (value === null || value === undefined) return "—";
  return dateTimeFormatter.format(new Date(value));
}

export function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return numberFormatter.format(value);
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 1000 * 60 * 60 * 24 * 365],
  ["month", 1000 * 60 * 60 * 24 * 30],
  ["day", 1000 * 60 * 60 * 24],
  ["hour", 1000 * 60 * 60],
  ["minute", 1000 * 60],
  ["second", 1000],
];

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

export function formatRelative(
  value: Date | number | string | null | undefined
) {
  if (value === null || value === undefined) return "—";
  const elapsed = new Date(value).getTime() - Date.now();
  const absolute = Math.abs(elapsed);

  for (const [unit, ms] of RELATIVE_UNITS) {
    if (absolute >= ms || unit === "second") {
      return relativeFormatter.format(Math.round(elapsed / ms), unit);
    }
  }
  return "—";
}
