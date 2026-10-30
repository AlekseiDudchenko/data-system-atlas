import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

async function step(page: Page, id: string) {
  await expect(page.locator(".story-explorer")).toHaveClass(/is-interactive/);
  const picker = page.getByLabel("Situation", { exact: true });
  if (await picker.isVisible()) {
    const value = await page
      .locator(`section#${id}`)
      .getAttribute("data-scene");
    await picker.selectOption(value!);
  } else {
    await page.locator(`.scene-toc a[href="#${id}"]`).click();
  }
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("English routes, metadata and static content are complete", async ({
  page,
}) => {
  for (const route of ["/", "/data-transfers/", "/data-transfers/push/"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("main")).not.toContainText(/[А-Яа-яЁё]/);
    await expect(
      page.locator('link[rel="alternate"][hreflang="en"]'),
    ).toHaveCount(1);
    await expect(
      page.locator('link[rel="alternate"][hreflang="ru"]'),
    ).toHaveCount(1);
    await expect(
      page
        .getByRole("navigation", { name: "Language", exact: true })
        .getByRole("link", { name: "English", exact: true }),
    ).toHaveAttribute("aria-current", "page");
  }
});

test("pull controls, results, diagrams and event logs use English", async ({
  page,
}) => {
  await page.goto("/data-transfers/");
  await page.getByRole("button", { name: "Run transfer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "1,000 records in 2.1 s",
  );
  await step(page, "batches");
  await page.getByRole("button", { name: "Run transfer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "1,000,000 records in 59 s",
  );
  await expect(
    page.getByRole("table", { name: "Before and after" }),
  ).toContainText("Network round trips");
  await step(page, "checkpoint");
  await page.getByRole("button", { name: "Run transfer", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Unique records: 1,000,000.",
  );
  await expect(page.locator(".failure-log")).toContainText(
    "Transfer completed",
  );
  await page
    .getByLabel("Checkpoint", { exact: true })
    .selectOption("before-write");
  await page.getByRole("button", { name: "Run again", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Missing records: 1,000.",
  );
  await step(page, "parallel");
  await page.getByLabel("Readers", { exact: true }).selectOption("16");
  await page.getByRole("button", { name: "Run transfer", exact: true }).click();
  await expect(page.locator("main")).not.toContainText(/[А-Яа-яЁё]/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("push terminology and simulation feedback are localized", async ({
  page,
}) => {
  await page.goto("/data-transfers/push/");
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Lost: 14,000.");
  await step(page, "queue");
  await expect(
    page.getByLabel("Consumer throughput", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Consumer lag returned to normal 29.7 s",
  );
  await step(page, "poison");
  await page
    .getByLabel("Dead-letter after 3 attempts", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Dead-lettered: 1.");
  await step(page, "redelivery");
  await page.getByLabel("Idempotent writes", { exact: true }).check();
  await page
    .getByRole("button", { name: "Run simulation", exact: true })
    .click();
  await expect(page.getByRole("status")).not.toContainText("Duplicates");
  await expect(page.locator("main")).not.toContainText(/[А-Яа-яЁё]/);
});

test("switching languages preserves the model and selected fragment", async ({
  page,
}) => {
  await page.goto("/data-transfers/#checkpoint");
  await expect(page.getByLabel("Checkpoint", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Language", exact: true })
    .getByRole("link", { name: "Русский", exact: true })
    .click();
  await expect(page).toHaveURL(/\/ru\/data-transfers\/#checkpoint$/);
  await expect(page.getByLabel("Checkpoint", { exact: true })).toBeVisible();
  await page
    .getByRole("navigation", { name: "Язык", exact: true })
    .getByRole("link", { name: "English", exact: true })
    .click();
  await expect(page).toHaveURL(/\/data-transfers\/#checkpoint$/);
  await step(page, "parallel");
  await expect(
    page
      .getByRole("navigation", { name: "Language", exact: true })
      .getByRole("link", { name: "Русский", exact: true }),
  ).toHaveAttribute("href", "/ru/data-transfers/#parallel");
  await page.goto("/ru/data-transfers/push/#redelivery");
  await expect(page.getByLabel("Идемпотентная запись")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Язык", exact: true })
    .getByRole("link", { name: "English", exact: true })
    .click();
  await expect(page).toHaveURL(/\/data-transfers\/push\/#redelivery$/);
  await expect(page.getByLabel("Idempotent writes")).toBeVisible();
});

test("English layouts are accessible in both themes and at phone width", async ({
  page,
}) => {
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const route of [
      "/",
      "/data-transfers/#checkpoint",
      "/data-transfers/push/#consumers",
    ]) {
      await page.goto(route);
      if (route !== "/")
        await expect(page.locator(".story-explorer")).toHaveClass(
          /is-interactive/,
        );
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
  }
});

test("English prose and navigation work without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 360, height: 780 },
  });
  try {
    const page = await context.newPage();
    for (const route of ["/", "/data-transfers/", "/data-transfers/push/"]) {
      await page.goto(`${baseURL}${route}`);
      await expect(page.locator("main")).not.toContainText(/[А-Яа-яЁё]/);
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
    }
    await page.locator('.scene-toc a[href="#redelivery"]').click();
    await expect(page).toHaveURL(/#redelivery$/);
    await expect(
      page.getByRole("heading", {
        name: "The message will arrive again.",
        exact: true,
      }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
