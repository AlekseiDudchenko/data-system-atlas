import { test, expect } from "@playwright/test";

for (const scenario of [
  {
    path: "/replication/stale-reads",
    action: "Write value",
    result: "Stale read",
  },
  { path: "/replication/read-your-writes", action: "Write name", result: "v1" },
  {
    path: "/partitioning/hotspots",
    action: "Send 12 requests + step",
    result: "12 completed",
  },
]) {
  test(`controls wait for JavaScript on ${scenario.path}`, async ({ page }) => {
    let release!: () => void;
    const scriptsReady = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/_astro/*.js", async (route) => {
      await scriptsReady;
      await route.continue();
    });
    try {
      await page.goto(scenario.path, { waitUntil: "domcontentloaded" });
      const action = page.getByRole("button", {
        name: scenario.action,
        exact: true,
      });
      await expect(action).toBeDisabled();
      release();
      await expect(action).toBeEnabled();
      await action.click();
      if (scenario.path === "/replication/stale-reads") {
        await page
          .getByRole("button", { name: "Read follower", exact: true })
          .click();
      }
      const result =
        scenario.path === "/replication/read-your-writes"
          ? page.locator(".session-summary")
          : page.getByRole("status");
      await expect(result).toContainText(scenario.result);
    } finally {
      release();
    }
  });
}
