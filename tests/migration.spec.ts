import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("minimal home opens the migration exploration in every language", async ({
  page,
}) => {
  for (const [prefix, name, title] of [
    ["", "Explore migration", "Moving data. Keeping it correct."],
    ["/ru", "Исследовать миграцию", "Перенести данные. Не потерять изменения."],
    ["/de", "Migration erkunden", "Daten bewegen. Änderungen bewahren."],
  ] as const) {
    await page.goto(`${prefix}/`);
    await page
      .getByRole("link", { name, exact: true })
      .filter({ hasNot: page.locator("svg") })
      .click();
    await expect(page).toHaveURL(new RegExp(`${prefix}/migration/?$`));
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("snapshot misses a live write; CDC catches up; cutover fences writers", async ({
  page,
}) => {
  await page.goto("/migration/");
  await page
    .getByRole("button", {
      name: "But the application keeps running.",
      exact: true,
    })
    .click();
  for (let i = 0; i < 3; i++)
    await page
      .getByRole("button", { name: "Copy one record", exact: true })
      .click();
  await expect(page.getByRole("status")).toContainText("Record 01 differs");
  await page
    .getByRole("button", { name: "Keep the changes, too.", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Update record 01", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Apply one change", exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < 6; i++)
    await page
      .getByRole("button", { name: "Copy one record", exact: true })
      .click();
  await page
    .getByRole("button", { name: "Apply one change", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("All six records match");
  await page
    .getByRole("button", {
      name: "Catching up is not switching over.",
      exact: true,
    })
    .click();
  const cutover = page.getByRole("button", {
    name: "Switch traffic",
    exact: true,
  });
  await expect(cutover).toBeDisabled();
  await page.getByRole("button", { name: "Pause writes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Update record 01", exact: true }),
  ).toBeDisabled();
  for (let i = 0; i < 2; i++)
    await page
      .getByRole("button", { name: "Apply one change", exact: true })
      .click();
  await expect(cutover).toBeEnabled();
  await cutover.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText(
    "Traffic now goes to the destination",
  );
  await expect(
    page.getByRole("button", { name: "Resume writes", exact: true }),
  ).toBeDisabled();
  await page
    .getByRole("button", { name: "Reset this scene", exact: false })
    .click();
  await expect(
    page.getByRole("button", { name: "Update record 01", exact: true }),
  ).toBeEnabled();
});

test("editorial pages are accessible in both themes and reflow", async ({
  page,
}) => {
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const route of ["/ru/", "/migration/"]) {
      await page.goto(route);
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
      await page.screenshot({
        path: `test-results/${route === "/ru/" ? "home" : "migration"}-${theme}-${test.info().project.name}.png`,
        fullPage: route === "/ru/",
      });
    }
  }
});

test("migration prose and model boundaries remain readable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/migration/`);
  await expect(page.locator("noscript")).toBeVisible();
  // With no script every scene should remain available, including on mobile.
  for (const heading of [
    "First, stop the world.",
    "But the application keeps running.",
    "Keep the changes, too.",
    "Catching up is not switching over.",
  ]) {
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page.getByText("What this model leaves out", { exact: true }).click();
  await expect(
    page.getByText("Six records, one sequential writer", { exact: false }),
  ).toBeVisible();
  await context.close();
});
