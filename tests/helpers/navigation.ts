import { expect, type Page } from "@playwright/test";

const ids: Record<string, string> = {
  "Начнём с самого простого копирования.": "simple",
  "Теперь — миллион.": "volume",
  "Читаем лениво.": "cursor",
  "Пишем пакетами.": "batches",
  "Сеть иногда рвётся.": "retries",
  "Повтор не должен дублировать.": "idempotency",
  "Запомним, где остановились.": "checkpoint",
  "Несколько читателей.": "parallel",
  "Без посредника.": "direct",
  "Очередь между ними.": "queue",
  "Одно плохое сообщение.": "poison",
  "Сообщение придёт ещё раз.": "redelivery",
  "Потребители не успевают.": "consumers",
};
export async function selectScene(page: Page, title: string) {
  await expect(page.locator(".story-explorer")).toHaveClass(/is-interactive/);
  const id = ids[title];
  if (!id) throw new Error(`Unknown scene: ${title}`);
  if (await page.getByLabel("Ситуация", { exact: true }).isVisible()) {
    const index = await page
      .locator(`section#${id}`)
      .getAttribute("data-scene");
    await page.getByLabel("Ситуация", { exact: true }).selectOption(index!);
  } else {
    await page.locator(`.scene-toc a[href="#${id}"]`).click();
  }
}
