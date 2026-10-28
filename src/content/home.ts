import type { Locale } from "../i18n";
export const homeCopy: Record<
  Locale,
  {
    title: string;
    intro: string;
    index: string;
    migration: string;
    question: string;
    description: string;
    open: string;
    path: string;
    more: string;
    note: string;
  }
> = {
  en: {
    title: "How data systems work",
    intro:
      "How software architectures evolve when requirements change, workloads grow, and simple solutions reach their limits.",
    index: "01 / An exploration",
    migration: "Data migration",
    question: "How do you move a database that never stops changing?",
    description:
      "Start with a simple copy. Keep the application running. Follow the changes. Find the moment to switch.",
    open: "Explore migration",
    path: "A copy → live writes → a change stream → the switch",
    more: "Also in the atlas",
    note: "Ideas you can see, systems you can change.",
  },
  ru: {
    title: "Как работают системы данных",
    intro:
      "Исследуйте, как меняется архитектура программных систем, когда появляются новые требования, растёт нагрузка и простые решения достигают своих пределов.",
    index: "01 / Визуальный разбор",
    migration: "Миграция данных",
    question: "Как перенести базу, которая постоянно меняется?",
    description:
      "Начнём с простой копии. Оставим приложение работать. Проследим за изменениями. Найдём момент для переключения.",
    open: "Исследовать миграцию",
    path: "Копия → работающая система → поток изменений → переключение",
    more: "Ещё в атласе",
    note: "Идеи, которые можно увидеть. Системы, которые можно менять.",
  },
  de: {
    title: "Wie Datensysteme funktionieren",
    intro:
      "Erkunden Sie, wie sich Softwarearchitekturen entwickeln, wenn sich Anforderungen ändern, die Last wächst und einfache Lösungen an ihre Grenzen stoßen.",
    index: "01 / Eine Erkundung",
    migration: "Datenmigration",
    question: "Wie zieht eine Datenbank um, die sich ständig verändert?",
    description:
      "Mit einer einfachen Kopie beginnen. Die Anwendung weiterlaufen lassen. Änderungen verfolgen. Den Moment zum Umschalten finden.",
    open: "Migration erkunden",
    path: "Eine Kopie → laufende Schreibzugriffe → Änderungsstrom → Umschalten",
    more: "Außerdem im Atlas",
    note: "Ideen sichtbar machen. Systeme verändern.",
  },
};
