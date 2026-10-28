import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("write, stale read, disruption, catch-up, and reset", async ({ page }) => {
  await page.goto("/replication/stale-reads");
  await expect(page).toHaveTitle(
    "Replication and Stale Reads · Data Systems Atlas",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Replication and Stale Reads",
  );
  await page.getByRole("button", { name: "Write value" }).click();
  await page
    .getByRole("button", { name: "Read follower", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Stale read");
  await expect(page.getByRole("status")).toContainText("Hello");
  await page.getByLabel("Block follower B").check();
  await page.getByRole("button", { name: "Advance one step" }).click();
  await expect(page.getByRole("img")).toHaveAttribute(
    "aria-label",
    /Follower A version 0/,
  );
  await page.getByRole("button", { name: "Advance one step" }).click();
  await page
    .getByRole("button", { name: "Read follower", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Current read");
  await page.getByLabel("2 / Read a replica").selectOption("B");
  await page
    .getByRole("button", { name: "Read follower", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Stale read");
  await page.getByLabel("Block follower B").uncheck();
  await page.getByRole("button", { name: "Advance one step" }).click();
  await page
    .getByRole("button", { name: "Read follower", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Current read");
  await expect(page.getByRole("status")).toContainText("Goodbye");
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(page.getByRole("status")).toContainText("No read yet");
  await expect(page.getByRole("img")).toHaveAttribute(
    "aria-label",
    /Leader version 0/,
  );
  await expect(page.getByLabel("Block follower B")).not.toBeChecked();
});
test("keyboard entry, full values, responsive layout, and navigation", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByText("Skip to content")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main")).toBeFocused();
  await page
    .getByRole("link", { name: "Replication and Stale Reads", exact: true })
    .click();
  await expect(page.getByLabel("1 / Write to the leader")).toBeEnabled();
  await page.getByLabel("1 / Write to the leader").focus();
  await page.keyboard.type("Keyboard value");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Write value" })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Read follower", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Stale read");
  await page.getByLabel("1 / Write to the leader").fill("x".repeat(80));
  await page.getByRole("button", { name: "Write value" }).click();
  await expect(page.locator(".node-summary")).toContainText("x".repeat(80));
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await page.getByLabel("1 / Write to the leader").fill("Goodbye");
  await page.getByRole("button", { name: "Write value" }).click();
  await page
    .getByRole("button", { name: "Read follower", exact: true })
    .click();
  await page.getByRole("heading", { level: 1 }).click();
  await page.screenshot({
    path: `test-results/lesson-${test.info().project.name}.png`,
    fullPage: true,
  });
});
test("explanation remains available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/replication/stale-reads`);
  await expect(
    page.getByRole("heading", { name: "Model boundaries" }),
  ).toBeVisible();
  await expect(page.locator("noscript")).toBeVisible();
  await context.close();
});

test("accessible page structure and controls", async ({ page }) => {
  await page.goto("/replication/stale-reads");
  await page.getByRole("button", { name: "Write value" }).click();
  await page
    .getByRole("button", { name: "Read follower", exact: true })
    .click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
});
