import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { selectScene } from "./helpers/navigation";

const run = (page: Page) =>
  page.getByRole("button", { name: /^Запустить (перенос|снова)$/ }).click();

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test.beforeEach(async ({ page }) => {
  // Finish each run instantly so assertions do not wait for the animation.
  await page.emulateMedia({ reducedMotion: "reduce" });
});

test("entry points lead to the Russian home and its only exploration", async ({
  page,
}) => {
  for (const entry of ["/ru/", "/de/"]) {
    await page.goto(entry);
    await expect(page).toHaveURL(/\/ru\/$/);
  }
  await expect(page.locator("html")).toHaveAttribute("lang", "ru");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Как работают системы данных",
  );
  await expect(page.locator(".language-switcher a")).toHaveCount(2);
  await page
    .getByRole("link", { name: "Исследовать перенос данных", exact: true })
    .filter({ hasNot: page.locator("svg") })
    .click();
  await expect(page).toHaveURL(/\/ru\/data-transfers\/?$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Из одной системы в другую.",
  );
  await noOverflow(page);
});

test("a sequential copy works, a million records run out of memory", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/");
  await run(page);
  await expect(page.getByRole("status")).toHaveText(
    /Готово: 1\s000 записей за 2,1\sс\./,
  );
  await selectScene(page, "Теперь — миллион.");
  await expect(page.getByLabel("Записей", { exact: true })).toHaveValue(
    "1000000",
  );
  await run(page);
  await expect(page.getByRole("status")).toContainText("Нехватка памяти");
  await expect(page.getByRole("status")).toContainText("Ничего не записано");
  const table = page.getByRole("table", { name: "До и после" });
  await expect(table).toContainText("не достигнуто");
  await page.getByLabel("Записей", { exact: true }).selectOption("100000");
  await expect(page.getByRole("table")).toHaveCount(0);
  await run(page);
  await expect(page.getByRole("status")).toHaveText(
    /Готово: 100\s000 записей за 3 мин 26 с\./,
  );
});

test("lazy reading completes; batches cut round trips", async ({ page }) => {
  await page.goto("/ru/data-transfers/");
  await selectScene(page, "Читаем лениво.");
  await run(page);
  await expect(page.getByRole("status")).toHaveText(
    /Готово: 1\s000\s000 записей за 34 мин 17 с\./,
  );
  await selectScene(page, "Пишем пакетами.");
  await expect(page.getByLabel("Размер пакета", { exact: true })).toHaveValue(
    "1000",
  );
  await run(page);
  await expect(page.getByRole("status")).toHaveText(/за 59 с\./);
  const table = page.getByRole("table", { name: "До и после" });
  await expect(
    table.getByRole("row", { name: /Обращений по сети/ }),
  ).toHaveText(/1\s001\s000.*2\s000/);
  await page.getByLabel("Размер пакета", { exact: true }).selectOption("1");
  await run(page);
  await expect(page.getByRole("status")).toHaveText(/34 мин 17 с/);
  await page.getByRole("button", { name: /Начать сцену заново/ }).click();
  await expect(page.getByLabel("Размер пакета", { exact: true })).toHaveValue(
    "1000",
  );
  await expect(page.getByRole("status")).toContainText("Готово к запуску");
});

test("retries finish the copy but a lost acknowledgement duplicates a batch", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/");
  await selectScene(page, "Сеть иногда рвётся.");
  await run(page);
  await expect(page.getByRole("status")).toHaveText(
    /Перенос прерван на пакете 121 .* Уникальных записей: 120\s000\./,
  );
  await page.getByLabel("Повторять при ошибке").check();
  await run(page);
  await expect(page.getByRole("status")).toHaveText(
    /Готово .* Уникальных записей: 1\s000\s000\. Дубликатов: 1\s000\./,
  );
  await expect(page.locator(".failure-log")).toContainText(
    "Пакет 371: записан, но подтверждение потеряно",
  );
});

test("upserts remove duplicates; checkpoint order decides between replay and loss", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/");
  await selectScene(page, "Повтор не должен дублировать.");
  await run(page);
  await expect(page.getByRole("status")).toHaveText(/Дубликатов: 642\s000\.$/);
  await page
    .getByLabel("Способ записи", { exact: true })
    .selectOption("upsert");
  await run(page);
  await expect(page.getByRole("status")).not.toContainText("Дубликатов");
  await expect(page.getByRole("status")).toContainText("Переписано повторно");

  await selectScene(page, "Запомним, где остановились.");
  await run(page);
  await expect(page.getByRole("status")).toHaveText(
    /Уникальных записей: 1\s000\s000\. Переписано повторно: 2\s000\.$/,
  );
  await page
    .getByLabel("Checkpoint", { exact: true })
    .selectOption("before-write");
  await run(page);
  await expect(page.getByRole("status")).toContainText("Пропущено: 1");
  await expect(page.locator(".failure-log")).toContainText(
    "Перезапуск с пакета 642",
  );
});

test("more readers help until the target saturates or one range dominates", async ({
  page,
}) => {
  await page.goto("/ru/data-transfers/");
  await selectScene(page, "Несколько читателей.");
  const workers = page.getByLabel("Читателей", { exact: true });
  await expect(workers).toHaveValue("4");
  await run(page);
  await expect(page.getByRole("status")).toContainText("Ускорение ×4");
  await workers.selectOption("8");
  await run(page);
  await expect(page.getByRole("status")).toContainText("Ускорение ×4,3");
  await workers.selectOption("16");
  await page.getByLabel("Неравномерные данные").check();
  await run(page);
  await expect(page.getByRole("status")).toContainText("Ускорение ×1,7");
  await expect(page.locator(".parallel-lanes li")).toHaveCount(16);
});

test("the animation shows a run in progress before it finishes", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/ru/data-transfers/");
  await selectScene(page, "Пишем пакетами.");
  await page.getByRole("button", { name: "Запустить перенос" }).click();
  await expect(page.getByRole("status")).toHaveText("Запись в приёмник…");
  await expect(
    page.getByRole("button", { name: "Запустить перенос" }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("Готово", {
    timeout: 6_000,
  });
});

test("pages are accessible in both themes and reflow", async ({ page }) => {
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    for (const route of ["/ru/", "/ru/data-transfers/"]) {
      await page.goto(route);
      if (route !== "/ru/") {
        for (const scene of [
          "Теперь — миллион.",
          "Запомним, где остановились.",
          "Несколько читателей.",
        ]) {
          await selectScene(page, scene);
          await run(page);
          expect(
            (
              await new AxeBuilder({ page })
                .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
                .analyze()
            ).violations,
          ).toEqual([]);
          await noOverflow(page);
        }
      }
      expect(
        (
          await new AxeBuilder({ page })
            .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
            .analyze()
        ).violations,
      ).toEqual([]);
      await noOverflow(page);
      await page.screenshot({
        path: `test-results/${route === "/ru/" ? "home" : "transfers"}-${theme}-${test.info().project.name}.png`,
        fullPage: route === "/ru/",
      });
    }
  }
});

test("scenes and model boundaries remain readable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/ru/data-transfers/`);
  await expect(page.locator("noscript")).toBeVisible();
  for (const heading of [
    "Начнём с самого простого копирования.",
    "Теперь — миллион.",
    "Читаем лениво.",
    "Пишем пакетами.",
    "Сеть иногда рвётся.",
    "Повтор не должен дублировать.",
    "Запомним, где остановились.",
    "Несколько читателей.",
  ]) {
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page
    .getByText("Что осталось за пределами модели", { exact: true })
    .click();
  await expect(
    page.getByText("Один последовательный скрипт переноса", { exact: false }),
  ).toBeVisible();
  await context.close();
});
