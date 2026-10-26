import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("compare even and hot arrivals, queue growth, draining and resetting", async ({
  page,
}) => {
  await page.goto("/partitioning/hotspots");
  await expect(page).toHaveTitle(
    "Partitioning and Hotspots · Data Systems Atlas",
  );
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Partitioning and Hotspots",
  );
  await page
    .getByRole("button", { name: "Send 12 requests + step", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "12 requests received, 12 completed, 0 queued",
  );
  await page.getByLabel("1 / Choose a workload").selectOption("hot");
  await expect(page.getByRole("status")).toContainText("No requests yet");
  await page
    .getByRole("button", { name: "Send 12 requests + step", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "12 requests received, 6 completed, 6 queued",
  );
  const p0 = page
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: "P0", exact: false }) });
  await expect(p0.getByRole("cell")).toHaveText(["10", "10", "4", "6"]);
  await expect(page.getByRole("img")).toHaveAttribute(
    "aria-label",
    /P0: 10 received, 4 completed, 6 queued/,
  );
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page
    .getByRole("button", { name: "Send 12 requests + step", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "24 requests received, 12 completed, 12 queued",
  );
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Drain one step" }).click();
  await expect(page.getByRole("status")).toContainText(
    "24 requests received, 24 completed, 0 queued",
  );
  await page.getByLabel("2 / Choose the hot key").selectOption("11");
  await page
    .getByRole("button", { name: "Send 12 requests + step", exact: true })
    .click();
  await expect(page.getByRole("img")).toHaveAttribute(
    "aria-label",
    /P2: 10 received, 4 completed, 6 queued/,
  );
  await page.getByRole("button", { name: "Reset run" }).click();
  await expect(page.getByRole("status")).toContainText("No requests yet");
  await expect(page.getByLabel("2 / Choose the hot key")).toHaveValue("11");
});

test("home navigation, keyboard workload controls and responsive counters", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Partitioning and Hotspots", exact: false })
    .click();
  await page.getByLabel("1 / Choose a workload").focus();
  await page.keyboard.press("h");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("2 / Choose the hot key")).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Send 12 requests + step", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("6 queued");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Drain one step" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("2 queued");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("heading", { level: 1 }).click();
  await page.screenshot({
    path: `test-results/partitioning-${test.info().project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Atlas / Partitioning" }).click();
  await expect(page).toHaveURL(/\/#atlas$/);
});

test("partitioning explanation and exact worked distribution without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/partitioning/hotspots`);
  await expect(page.locator("noscript")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Model boundaries" }),
  ).toBeVisible();
  await expect(page.getByText("10 / 1 / 1", { exact: false })).toBeVisible();
  await context.close();
});
