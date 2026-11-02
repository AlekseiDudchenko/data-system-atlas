import { test, expect } from "@playwright/test";
import { selectScene } from "./helpers/navigation";

test("both models are reachable at the top and indicate the active page", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/");
  const nav = page.getByRole("navigation", { name: "Модели переноса данных" });
  await expect(
    nav.getByRole("link", { name: /Читаем источник/ }),
  ).toHaveAttribute("aria-current", "page");
  await nav.getByRole("link", { name: /Источник отправляет/ }).click();
  await expect(page).toHaveURL(/\/push\/$/);
  await expect(
    nav.getByRole("link", { name: /Источник отправляет/ }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".scene-toc a")).toHaveCount(5);
});

test("direct links, reload and browser history select the matching experiment", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/#checkpoint");
  await expect(page.locator("#checkpoint")).toHaveClass(/active/);
  await expect(page.getByLabel("Checkpoint", { exact: true })).toBeVisible();
  await selectScene(page, "Несколько читателей.");
  await expect(page).toHaveURL(/#parallel$/);
  await expect(page.getByLabel("Читателей", { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/#checkpoint$/);
  await expect(page.getByLabel("Checkpoint", { exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByLabel("Читателей", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator("#parallel")).toHaveClass(/active/);
  await expect(page.getByLabel("Читателей", { exact: true })).toBeVisible();
});

test("legacy scene links and push fragments choose the correct situation", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/#scene-4");
  await expect(page).toHaveURL(/#batches$/);
  await expect(page.getByLabel("Размер пакета", { exact: true })).toBeVisible();
  await page.goto("/ru/data-transfers/push/#redelivery");
  await expect(page.getByLabel("Идемпотентная запись")).toBeVisible();
});

test("previous and next keep the selected scene and keyboard focus together", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/#cursor");
  await page
    .locator("#cursor")
    .getByRole("link", { name: "Далее →", exact: true })
    .click();
  await expect(page).toHaveURL(/#batches$/);
  await expect(
    page.getByRole("heading", { name: "Пишем пакетами.", exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel("Размер пакета", { exact: true })).toBeVisible();
  await page
    .locator("#batches")
    .getByRole("link", { name: "← Назад", exact: true })
    .click();
  await expect(page).toHaveURL(/#cursor$/);
});

test("scrolling follows the narrative on desktop; the selector works at narrow widths", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/");
  await expect(page.locator(".story-explorer")).toHaveClass(/is-interactive/);
  if ((page.viewportSize()?.width ?? 0) >= 900) {
    await page.locator("#batches").scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const element = document.getElementById("batches")!;
      window.scrollTo(
        0,
        element.getBoundingClientRect().top + window.scrollY - 140,
      );
    });
    await expect(page.locator('.scene-toc a[href="#batches"]')).toHaveAttribute(
      "aria-current",
      "step",
    );
    await expect(page).toHaveURL(/#batches$/);
  }
  await page.setViewportSize({ width: 360, height: 780 });
  await page.getByLabel("Ситуация", { exact: true }).selectOption("6");
  await expect(page.getByLabel("Checkpoint", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("outline links and sequential navigation work without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 360, height: 780 },
  });
  try {
    const page = await context.newPage();
    await page.goto(`${baseURL}/ru/data-transfers/`);
    await page.locator('.scene-toc a[href="#checkpoint"]').click();
    await expect(page).toHaveURL(/#checkpoint$/);
    await expect(
      page.getByRole("heading", {
        name: "Запомним, где остановились.",
        exact: true,
      }),
    ).toBeVisible();
    await page
      .locator("#checkpoint")
      .getByRole("link", { name: "Далее →", exact: true })
      .click();
    await expect(page).toHaveURL(/#parallel$/);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await context.close();
  }
});
