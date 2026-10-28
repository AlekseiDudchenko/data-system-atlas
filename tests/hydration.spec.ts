import { test, expect } from "@playwright/test";

test("controls wait for JavaScript before running a transfer", async ({
  page,
}) => {
  let release!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/_astro/*.js", async (route) => {
    await scriptsReady;
    await route.continue();
  });
  try {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/ru/data-transfers/", { waitUntil: "domcontentloaded" });
    const action = page.getByRole("button", {
      name: "Запустить перенос",
      exact: true,
    });
    await expect(action).toBeDisabled();
    release();
    await expect(action).toBeEnabled();
    await action.click();
    await expect(page.getByRole("status")).toContainText("Готово");
  } finally {
    release();
  }
});
