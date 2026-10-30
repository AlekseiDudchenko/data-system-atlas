import { test, expect } from "@playwright/test";

test("Java examples open with the keyboard and keep long lines inside the page", async ({ page }) => {
  await page.goto("/ru/data-transfers/");
  const example = page.locator(".java-example").first();
  await example.locator("summary").focus();
  await page.keyboard.press("Enter");
  await expect(example).toHaveAttribute("open", "");
  await expect(example.locator("pre")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(example.locator("pre")).toBeFocused();
  expect(await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth,
  )).toBe(true);
});

test("all Java fragments remain available without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto("http://127.0.0.1:4321/ru/data-transfers/");
    const examples = page.locator(".java-example");
    await expect(examples).toHaveCount(8);
    for (const example of await examples.all()) {
      await example.locator("summary").click();
      await expect(example.locator("pre")).toBeVisible();
    }
  } finally {
    await context.close();
  }
});
