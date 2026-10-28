import type { Locale } from "./index";

const units: Record<
  Locale,
  {
    ms: string;
    s: string;
    min: string;
    h: string;
    kb: string;
    mb: string;
    gb: string;
  }
> = {
  en: { ms: "ms", s: "s", min: "min", h: "h", kb: "KB", mb: "MB", gb: "GB" },
  de: { ms: "ms", s: "s", min: "min", h: "Std.", kb: "KB", mb: "MB", gb: "GB" },
  ru: { ms: "мс", s: "с", min: "мин", h: "ч", kb: "КБ", mb: "МБ", gb: "ГБ" },
};

export function formatNumber(
  locale: Locale,
  value: number,
  fractionDigits = 0,
): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Durations read like a stopwatch: the two largest useful units. */
export function formatDuration(locale: Locale, ms: number): string {
  const u = units[locale];
  if (ms < 1_000) return `${formatNumber(locale, ms, ms < 10 ? 1 : 0)} ${u.ms}`;
  if (ms < 60_000) return `${formatNumber(locale, ms / 1_000, 1)} ${u.s}`;
  const totalSeconds = Math.round(ms / 1_000);
  if (totalSeconds < 3_600) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return seconds
      ? `${minutes} ${u.min} ${seconds} ${u.s}`
      : `${minutes} ${u.min}`;
  }
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours} ${u.h} ${minutes} ${u.min}` : `${hours} ${u.h}`;
}

/** Decimal units, matching the model's 1 KB records and 512 MB limit. */
export function formatBytes(locale: Locale, bytes: number): string {
  const u = units[locale];
  if (bytes < 1_000_000)
    return `${formatNumber(locale, bytes / 1_000, 1)} ${u.kb}`;
  if (bytes < 1_000_000_000)
    return `${formatNumber(locale, bytes / 1_000_000, 1)} ${u.mb}`;
  return `${formatNumber(locale, bytes / 1_000_000_000, 1)} ${u.gb}`;
}

const russianPlurals = new Intl.PluralRules("ru");

/** Picks the Russian form for a count: 1 запись, 3 записи, 5 записей. */
export function plural(
  count: number,
  forms: readonly [one: string, few: string, many: string],
): string {
  const category = russianPlurals.select(count);
  return category === "one"
    ? forms[0]
    : category === "few"
      ? forms[1]
      : forms[2];
}
