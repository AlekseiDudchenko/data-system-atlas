import de from "./de";
import ru from "./ru";

export const locales = ["en", "de", "ru"] as const;
export type Locale = (typeof locales)[number];
/** Languages with built pages. German returns after translation. */
export const publishedLocales: readonly Locale[] = ["en", "ru"];
type Key = keyof typeof de;
const dictionaries: Record<Exclude<Locale, "en">, Record<Key, string>> = {
  de,
  ru,
};
export const languageNames: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
  ru: "Русский",
};

export function localeFromPath(path: string): Locale {
  const prefix = path.split("/")[1];
  return prefix === "de" || prefix === "ru" ? prefix : "en";
}

/** Paths share the same slug in every language. English keeps existing URLs. */
export function localizedPath(locale: Locale, path = "/"): string {
  const unprefixed = path.replace(/^\/(de|ru)(?=\/|$)/, "") || "/";
  return locale === "en" ? unprefixed : `/${locale}${unprefixed}`;
}

export function translator(locale: Locale) {
  return (source: Key, ...values: (string | number)[]): string => {
    const text = locale === "en" ? source : dictionaries[locale][source];
    return text.replace(/\{(\d+)\}/g, (_, index: string) =>
      String(values[Number(index)] ?? ""),
    );
  };
}
