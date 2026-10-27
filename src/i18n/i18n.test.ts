import { describe, it, expect } from "vitest";
import de from "./de";
import ru from "./ru";
import { locales, localeFromPath, localizedPath, translator } from "./index";
import { formatLog } from "./log";
import { initialState, transition } from "../simulation/replication";

describe("localization", () => {
  it("keeps routes in the selected language without stacking prefixes", () => {
    for (const locale of locales) {
      const path = localizedPath(locale, "/ru/replication/stale-reads");
      expect(localeFromPath(path)).toBe(locale);
      expect(path).toBe(
        `${locale === "en" ? "" : `/${locale}`}/replication/stale-reads`,
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
  });

  it("translates event data without changing user values or reinterpreting placeholders", () => {
    const value = "Follower {0} <script> $& Привет";
    const state = transition(initialState(), { type: "write", value });
    const event = state.log.at(-1)!;
    expect(formatLog(event, "en")).toContain(`Leader accepted v1: “${value}”`);
    expect(formatLog(event, "de")).toContain(
      `Leader bestätigte v1: „${value}“`,
    );
    expect(formatLog(event, "ru")).toContain(`Лидер принял v1: «${value}»`);
    expect(translator("ru")("Due at step {0}", 2)).toBe("Доставка на шаге 2");
  });
});
