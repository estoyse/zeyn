import { resources, defaultLocale, type Locale } from "./index";

export type { Locale };

function resolvePath(obj: unknown, path: string[]): unknown {
  let current: unknown = obj;
  for (const segment of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

export function t(
  locale: Locale,
  ns: string,
  key: string,
  vars?: Record<string, string | number>
): string {
  const path = key.split(".");
  const allResources = resources as Record<string, Record<string, unknown>>;

  const localeResources = allResources[locale];
  const value = localeResources ? resolvePath(localeResources[ns], path) : undefined;

  const fallbackResources = allResources[defaultLocale];
  const fallbackValue = fallbackResources ? resolvePath(fallbackResources[ns], path) : undefined;

  const resolved =
    typeof value === "string"
      ? value
      : typeof fallbackValue === "string"
        ? fallbackValue
        : key;

  if (!vars) return resolved;

  return resolved.replace(/\{\{(\w+)\}\}/g, (match, varName: string) => {
    return Object.prototype.hasOwnProperty.call(vars, varName)
      ? String(vars[varName])
      : match;
  });
}
