import type { Locale } from "../i18n";
import { homeCopy } from "./home";
import { transferCopy } from "./transfers";
import { pushCopy } from "./push";
import { homeEnglish } from "./en/home";
import { transferEnglish } from "./en/transfers";
import { pushEnglish } from "./en/push";

export const getHomeCopy = (locale: Locale) =>
  locale === "en" ? homeEnglish : homeCopy;
export const getTransferCopy = (locale: Locale) =>
  locale === "en" ? transferEnglish : transferCopy;
export const getPushCopy = (locale: Locale) =>
  locale === "en" ? pushEnglish : pushCopy;
export const getNavigationCopy = (locale: Locale) =>
  locale === "en"
    ? {
        breadcrumb: "Breadcrumb",
        atlas: "Atlas",
        category: "Data transfers",
        title: "From one system to another.",
        intro: "Two transfer models. Decisions, limits and consequences.",
        models: "Data transfer models",
        pull: "Read from the source",
        pullSub: "Pull · consumer-initiated requests",
        push: "The source sends events",
        pushSub: "Push · event delivery",
        outline: "In this exploration",
        situation: "Situation",
        previous: "← Previous",
        next: "Next →",
        transitions: "Navigation",
        permalink: "Direct link",
        cursorSource: "PostgreSQL — DECLARE and cursors",
        jdbcSource: "PostgreSQL JDBC — cursor-based reads",
        bulkSource: "PostgreSQL — bulk data loading",
        offsetSource: "Apache Kafka — consumer position and offsets",
        deliverySource: "Apache Kafka — delivery semantics",
        notes: "Original notes behind this exploration",
      }
    : {
        breadcrumb: "Хлебные крошки",
        atlas: "Атлас",
        category: "Перенос данных",
        title: "Из одной системы в другую.",
        intro: "Два способа переноса. Решения, их пределы и последствия.",
        models: "Модели переноса данных",
        pull: "Читаем источник",
        pullSub: "Pull · запросы по инициативе приёмника",
        push: "Источник отправляет",
        pushSub: "Push · доставка событий",
        outline: "По ходу исследования",
        situation: "Ситуация",
        previous: "← Назад",
        next: "Далее →",
        transitions: "Переходы",
        permalink: "Прямая ссылка",
        cursorSource: "PostgreSQL — DECLARE, курсоры",
        jdbcSource: "PostgreSQL JDBC — чтение через курсор",
        bulkSource: "PostgreSQL — массовая загрузка данных",
        offsetSource: "Apache Kafka — позиция потребителя и offset",
        deliverySource: "Apache Kafka — гарантии доставки",
        notes: "Заметки, на которых основано исследование",
      };
