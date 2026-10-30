import { describe, expect, it } from "vitest";
import {
  getHomeCopy,
  getNavigationCopy,
  getPushCopy,
  getTransferCopy,
} from "./localized";
import { formatNumber, plural } from "../i18n/format";

function checkTranslations(english: unknown, russian: unknown, path = "copy") {
  if (typeof english === "string" && typeof russian === "string") {
    if (russian.trim()) expect(english.trim(), path).not.toBe("");
    expect(english, path).not.toMatch(/[А-Яа-яЁё]/);
    const placeholders = (text: string) => text.match(/\{\d+\}/g)?.sort() ?? [];
    expect(placeholders(english), path).toEqual(placeholders(russian));
  } else if (Array.isArray(english) && Array.isArray(russian)) {
    expect(english.length, path).toBe(russian.length);
    english.forEach((value, i) =>
      checkTranslations(value, russian[i], `${path}[${i}]`),
    );
  } else if (
    english &&
    russian &&
    typeof english === "object" &&
    typeof russian === "object"
  ) {
    expect(Object.keys(english).sort(), path).toEqual(
      Object.keys(russian).sort(),
    );
    for (const key of Object.keys(english)) {
      checkTranslations(
        (english as Record<string, unknown>)[key],
        (russian as Record<string, unknown>)[key],
        `${path}.${key}`,
      );
    }
  } else {
    throw new Error(`Translation shape mismatch: ${path}`);
  }
}

describe("published English content", () => {
  it("covers the complete Russian content and preserves interpolation contracts", () => {
    for (const copy of [
      getHomeCopy,
      getNavigationCopy,
      getTransferCopy,
      getPushCopy,
    ]) {
      checkTranslations(copy("en"), copy("ru"));
    }
  });
  it("shares scene IDs so a language change preserves the situation", () => {
    for (const copy of [getTransferCopy, getPushCopy]) {
      expect(copy("en").scenes.map((scene) => scene.id)).toEqual(
        copy("ru").scenes.map((scene) => scene.id),
      );
    }
  });
  it("uses English plurals and grouping without changing Russian forms", () => {
    const words = getTransferCopy("en").words.record;
    expect(plural(1, words, "en")).toBe("record");
    expect(plural(21, words, "en")).toBe("records");
    expect(plural(0, words, "en")).toBe("records");
    expect(formatNumber("en", 1000000)).toBe("1,000,000");
    expect(plural(21, getTransferCopy("ru").words.record, "ru")).toBe("запись");
  });
});
