import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("theme follows the system and keeps a keyboard override across pages and reloads", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/ru/data-transfers/");
  const toggle = page.getByRole("button", { name: "Тёмная тема", exact: true });
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("link", { name: "Data Systems Atlas" }).click();
  await expect(page).toHaveURL(/\/ru\/$/);
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.emulateMedia({ colorScheme: "light" });
  await toggle.click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("dark pages and simulation feedback retain contrast and mobile reflow", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  for (const path of ["/ru/", "/ru/data-transfers/"]) {
    await page.goto(path);
    if (path !== "/ru/") {
      await page
        .getByRole("button", { name: "Пишем пакетами.", exact: true })
        .click();
      await page.getByRole("button", { name: "Запустить перенос" }).click();
      await expect(page.getByRole("status")).toContainText("Готово");
    }
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: `test-results/theme-${test.info().project.name}.png`,
    fullPage: true,
  });
});

test("system dark theme works without JavaScript and with unavailable storage", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    colorScheme: "dark",
  });
  const page = await context.newPage();
  await page.goto(`${baseURL}/ru/data-transfers/`);
  await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
  await expect(page.locator(".theme-toggle")).toBeHidden();
  await context.close();
  const restricted = await browser.newContext({ colorScheme: "dark" });
  await restricted.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage unavailable");
      },
    });
  });
  const restrictedPage = await restricted.newPage();
  await restrictedPage.goto(`${baseURL}/ru/`);
  await restrictedPage.getByRole("button", { name: "Тёмная тема" }).click();
  await expect(restrictedPage.locator("html")).toHaveAttribute(
    "data-theme",
    "light",
  );
  await restricted.close();
});
