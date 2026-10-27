import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const languages = [
  {
    locale: "de",
    title: "Replikation und veraltete Lesewerte",
    write: "Wert schreiben",
    read: "Replikat lesen",
    stale: "Veralteter Lesewert",
    step: "Einen Schritt weiter",
    current: "Aktueller Lesewert",
    writeName: "Namen schreiben",
    readOwn: "Eigene Schreibversion lesen",
    waiting: "Kein Wert zurückgegeben",
    returned: "Sitzungslesen",
    block: "Replikat blockieren B",
    workload: "1 / Lastprofil wählen",
    batch: "12 Anfragen senden + Schritt",
    queued: "6 in der Warteschlange",
    boundary: "Grenzen des Modells",
    skip: "Zum Inhalt springen",
  },
  {
    locale: "ru",
    title: "Репликация и устаревшие чтения",
    write: "Записать значение",
    read: "Прочитать реплику",
    stale: "Устаревшее чтение",
    step: "Следующий шаг",
    current: "Актуальное чтение",
    writeName: "Записать имя",
    readOwn: "Прочитать свою запись",
    waiting: "Значение не возвращено",
    returned: "Чтение с гарантией сессии",
    block: "Заблокировать реплику B",
    workload: "1 / Выбор нагрузки",
    batch: "12 запросов + шаг",
    queued: "в очереди 6",
    boundary: "Границы модели",
    skip: "Перейти к содержимому",
  },
] as const;

for (const language of languages) {
  const prefix = `/${language.locale}`;
  test(`${language.locale}: localized routes, metadata and same-lesson language switching`, async ({
    page,
  }) => {
    for (const path of [
      "/",
      "/replication/stale-reads",
      "/replication/read-your-writes",
      "/partitioning/hotspots",
    ]) {
      await page.goto(prefix + path);
      await expect(page.locator("html")).toHaveAttribute(
        "lang",
        language.locale,
      );
      await expect(
        page.locator('.language-switcher [aria-current="page"]'),
      ).toHaveAttribute("lang", language.locale);
      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute(
        "href",
        new RegExp(
          `https://data-systems-atlas\\.dudchenko\\.org${prefix}${path.replaceAll("/", "\\/")}/?$`,
        ),
      );
      for (const locale of ["en", "de", "ru"]) {
        const link = page.locator(
          `link[rel="alternate"][hreflang="${locale}"]`,
        );
        const href = await link.getAttribute("href");
        const response = await page.request.get(new URL(href!).pathname);
        expect(response.status()).toBe(200);
      }
      // Every content link stays in this language and resolves to a built page.
      for (const href of await page
        .locator('main a[href^="/"]')
        .evaluateAll((links) =>
          links.map((link) => link.getAttribute("href")!),
        )) {
        expect(href.startsWith(`${prefix}/`)).toBe(true);
        expect((await page.request.get(href)).status()).toBe(200);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
    await page.goto(`${prefix}/replication/stale-reads`);
    await expect(page).toHaveTitle(`${language.title} · Data Systems Atlas`);
    await page.getByRole("link", { name: "English", exact: true }).click();
    await expect(page).toHaveURL(/\/replication\/stale-reads\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await page.getByRole("link", { name: "Deutsch", exact: true }).click();
    await expect(page).toHaveURL(/\/de\/replication\/stale-reads\/?$/);
    await page.getByRole("link", { name: "Русский", exact: true }).click();
    await expect(page).toHaveURL(/\/ru\/replication\/stale-reads\/?$/);
  });

  test(`${language.locale}: translated simulation results, event log, waiting and hot key`, async ({
    page,
  }) => {
    await page.goto(`${prefix}/replication/stale-reads`);
    await page
      .getByRole("button", { name: language.write, exact: true })
      .click();
    await page
      .getByRole("button", { name: language.read, exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(language.stale);
    await expect(page.locator(".event-log")).toContainText(language.stale);
    for (let i = 0; i < 2; i++)
      await page
        .getByRole("button", { name: language.step, exact: true })
        .click();
    await page
      .getByRole("button", { name: language.read, exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(language.current);
    await expect(page.getByRole("status")).toContainText("Goodbye");
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);

    await page.goto(`${prefix}/replication/read-your-writes`);
    await page.getByLabel(language.block).check();
    await page
      .getByRole("button", { name: language.writeName, exact: true })
      .click();
    await page
      .getByRole("button", { name: language.readOwn, exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(language.waiting);
    await page.getByLabel(language.block).uncheck();
    for (let i = 0; i < 2; i++)
      await page
        .getByRole("button", { name: language.step, exact: true })
        .click();
    await expect(page.getByRole("status")).toContainText(language.returned);
    await expect(page.getByRole("status")).toContainText("New name");

    await page.goto(`${prefix}/partitioning/hotspots`);
    await page.getByLabel(language.workload).selectOption("hot");
    await page
      .getByRole("button", { name: language.batch, exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(language.queued);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/i18n-${language.locale}-${test.info().project.name}.png`,
      fullPage: true,
    });
  });

  test(`${language.locale}: navigation and lessons work without JavaScript`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseURL}${prefix}/replication/read-your-writes`);
    await expect(page.locator("noscript")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: language.boundary, exact: true }),
    ).toBeVisible();
    await page.getByRole("link", { name: "English", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(
      page.getByRole("heading", { name: "Model boundaries", exact: true }),
    ).toBeVisible();
    await context.close();
  });
}
