import { describe, it, expect } from "vitest";
import de from "./de";
import ru from "./ru";
import { locales, localeFromPath, localizedPath, translator } from "./index";

describe("localization", () => {
  it("keeps routes in the selected language without stacking prefixes", () => {
    for (const locale of locales) {
      const path = localizedPath(locale, "/ru/data-transfers/");
      expect(localeFromPath(path)).toBe(locale);
      expect(path).toBe(
        `${locale === "en" ? "" : `/${locale}`}/data-transfers/`,
      );
      expect(localizedPath(locale, "/de/")).toBe(
        locale === "en" ? "/" : `/${locale}/`,
      );
    }
    expect(localizedPath("ru", "/debug")).toBe("/ru/debug");
  });

  it("provides every translation with the same interpolation parameters", () => {
    expect(Object.keys(ru).sort()).toEqual(Object.keys(de).sort());
    const placeholders = (value: string) =>
      value.match(/\{\d+\}/g)?.sort() ?? [];
    for (const key of Object.keys(de) as (keyof typeof de)[]) {
      expect(de[key].length).toBeGreaterThan(0);
      expect(ru[key].length).toBeGreaterThan(0);
      expect(placeholders(de[key])).toEqual(placeholders(key));
      expect(placeholders(ru[key])).toEqual(placeholders(key));
    }
    expect(translator("ru")("Language")).toBe("Язык");
  });
});
