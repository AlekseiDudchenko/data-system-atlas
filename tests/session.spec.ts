import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("compare policies, wait through disruption and recover the same read", async ({
  page,
}) => {
  await page.goto("/replication/read-your-writes");
  await expect(page).toHaveTitle("Read Your Writes · Data Systems Atlas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Read Your Writes",
  );
  await page.getByLabel("Block follower B").check();
  await page.getByRole("button", { name: "Write name", exact: true }).click();
  await expect(page.locator(".session-summary")).toContainText("v1");
  await page
    .getByRole("button", { name: "Read immediately", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("returned “Hello” (v0)");
  await page
    .getByRole("button", { name: "Read my writes", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Waiting on follower B for at least v1",
  );
  await expect(page.getByRole("status")).toContainText("No value returned");
  await expect(
    page.getByRole("button", { name: "Write name", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("2 / Choose a follower")).toBeDisabled();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Advance one step" }).click();
  await expect(page.getByRole("status")).toContainText("Waiting on follower B");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByLabel("Block follower B").uncheck();
  await expect(page.getByRole("status")).toContainText("No value returned");
  await page.getByRole("button", { name: "Advance one step" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Session read: follower B returned “New name” (v1)",
  );
  await page.getByRole("button", { name: "Reset experiment" }).click();
  await expect(page.getByRole("status")).toContainText("No read yet");
  await expect(page.locator(".session-summary")).toContainText("v0");
});

test("keyboard cancellation and rerouting, long values, navigation and mobile reflow", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Read Your Writes", exact: false })
    .click();
  await page.getByLabel("Block follower B").check();
  await page.getByLabel("1 / Update your profile name").fill("x".repeat(80));
  await page.getByLabel("1 / Update your profile name").focus();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Write name", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("2 / Choose a follower")).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Read my writes", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  // Advance only with the keyboard, then cancel without accepting an old value.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Advance one step" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Cancel waiting read" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("No read yet");
  await expect(page.locator(".session-summary")).toContainText("v1");
  await page.getByLabel("2 / Choose a follower").selectOption("A");
  await page
    .getByRole("button", { name: "Read my writes", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    `returned “${"x".repeat(80)}” (v1)`,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("heading", { level: 1 }).click();
  await page.screenshot({
    path: `test-results/session-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Replication and Stale Reads", exact: true })
    .click();
  await expect(page).toHaveURL(/\/replication\/stale-reads\/?$/);
});

test("session explanation and worked sequence remain available without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/replication/read-your-writes`);
  await expect(page.locator("noscript")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Model boundaries" }),
  ).toBeVisible();
  await expect(
    page.getByText("Waiting cannot repair a blocked link.", { exact: false }),
  ).toBeVisible();
  await context.close();
});
