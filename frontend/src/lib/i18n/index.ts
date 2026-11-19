import type { Route } from "next";

export const LOCALES = ["no", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "no";
export const LOCALE_COOKIE_NAME = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && LOCALES.includes(value as Locale);
}

const NORWEGIAN_LANGUAGE_TAGS = new Set(["no", "nb", "nn"]);

function toLocale(languageTag: string): Locale | undefined {
  const primary = languageTag.trim().toLowerCase().split("-")[0];
  if (NORWEGIAN_LANGUAGE_TAGS.has(primary)) return "no";
  if (primary === "en") return "en";
  return undefined;
}

/** Picks the best supported locale from an Accept-Language header value. */
export function matchAcceptLanguage(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE;
  const candidates = header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number(qParam.trim().slice(2)) : 1;
      return { tag, q: Number.isNaN(q) ? 0 : q, index };
    })
    .filter((c) => c.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  for (const { tag } of candidates) {
    const locale = toLocale(tag);
    if (locale) return locale;
  }
  return DEFAULT_LOCALE;
}

/** Replaces (or adds) the locale segment of a pathname without basePath. */
export function withLocale(pathname: string, locale: Locale): string {
  const segments = pathname.split("/");
  if (isLocale(segments[1])) {
    segments[1] = locale;
    return segments.join("/");
  }
  return `/${locale}${pathname === "/" ? "" : pathname}`;
}

/** Prefixes an app-internal path (without basePath) with the locale. */
export function localizedPath(locale: Locale, path: string): Route {
  return (path === "/" ? `/${locale}` : `/${locale}${path}`) as Route;
}
