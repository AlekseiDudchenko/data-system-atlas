import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const run = (page: Page) =>
  page.getByRole("button", { name: /^Запустить( снова)?$/ }).click();
const scene = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true }).click();
const status = (page: Page) => page.getByRole("status");

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("the pull exploration leads to the push model and back", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/");
  await page
    .getByRole("link", { name: "Когда данные приходят сами", exact: true })
    .click();
  await expect(page).toHaveURL(/\/ru\/data-transfers\/push\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Когда данные приходят сами.",
  );
  await page.getByRole("link", { name: /Pull: миллион записей/ }).click();
  await expect(page).toHaveURL(/\/ru\/data-transfers\/?$/);
  await page.goto("/data-transfers/push/");
  await expect(page).toHaveURL(/\/ru\/data-transfers\/push\/$/);
});

test("a queue absorbs the outage that a direct push loses", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/push/");
  await run(page);
  await expect(status(page)).toContainText("Потеряно: 14 000.");
  await scene(page, "Очередь между ними.");
  await run(page);
  await expect(status(page)).toContainText("через 29,7 с после сбоя");
  await expect(status(page)).not.toContainText("Потеряно");
  await expect(
    page.getByRole("table", { name: "До и после" }).getByRole("row", {
      name: /Потеряно/,
    }),
  ).toHaveText(/14\s000.*0/);
  await page.getByLabel("Сбой приёмника", { exact: true }).selectOption("30");
  await run(page);
  await expect(status(page)).toContainText("Потеряно: 10 000.");
});

test("a poison message stalls its partition until it is dead-lettered", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/push/");
  await scene(page, "Одно плохое сообщение.");
  await run(page);
  await expect(status(page)).toContainText("Лаг так и не вернулся к норме.");
  await page.getByLabel("Откладывать в DLQ после 3 попыток").check();
  await run(page);
  await expect(status(page)).toContainText("В DLQ: 1.");
  await expect(status(page)).toContainText("лаг в конце 0");
});

test("redelivery duplicates events unless the consumer is idempotent", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/push/");
  await scene(page, "Сообщение придёт ещё раз.");
  await run(page);
  await expect(status(page)).toContainText("Дубликатов: 1 700.");
  await page
    .getByLabel("Сохранять offset каждые", { exact: true })
    .selectOption("0.5");
  await run(page);
  await expect(status(page)).toContainText("Дубликатов: 200.");
  await page.getByLabel("Идемпотентная запись").check();
  await run(page);
  await expect(status(page)).not.toContainText("Дубликатов");
});

test("consumers keep up until a hot partition overloads one of them", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/push/");
  await scene(page, "Потребители не успевают.");
  const consumers = page.getByLabel("Потребителей", { exact: true });
  await consumers.selectOption("8");
  await run(page);
  await expect(status(page)).toContainText("лаг в конце 0");
  await page.getByLabel("Горячая партиция").check();
  await run(page);
  await expect(status(page)).toContainText("Потеряно");
  await consumers.selectOption("12");
  await run(page);
  await expect(page.locator(".push-consumers li")).toHaveCount(12);
  await expect(page.locator(".push-consumers")).toContainText("простаивает");
});

test("the push page is accessible in both themes and reflows", async ({
  page,
}) => {
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.goto("/ru/data-transfers/push/");
    for (const name of ["Очередь между ними.", "Потребители не успевают."]) {
      await scene(page, name);
      await run(page);
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

test("push scenes and the pull-or-push table read without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/ru/data-transfers/push/`);
  for (const heading of [
    "Без посредника.",
    "Очередь между ними.",
    "Одно плохое сообщение.",
    "Сообщение придёт ещё раз.",
    "Потребители не успевают.",
    "Pull или push",
  ])
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  await context.close();
});
