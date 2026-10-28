/** Russian plural forms: one, few, many. */
export type Forms = readonly [string, string, string];
type Scene = { title: string; body: string; insight: string };
type Copy = {
  category: string;
  title: string;
  intro: string;
  back: string;
  scroll: string;
  scenes: readonly [Scene, Scene, Scene, Scene];
  scenesLabel: string;
  controls: string;
  source: string;
  target: string;
  process: string;
  memory: string;
  limit: string;
  outOfMemory: string;
  words: Record<"record" | "page" | "insert" | "batch", Forms>;
  writtenOf: string;
  records: string;
  batchSize: string;
  perRecord: string;
  run: string;
  runAgain: string;
  reset: string;
  readAll: string;
  elapsed: string;
  written: string;
  duration: string;
  throughput: string;
  perSecond: string;
  roundTrips: string;
  peakMemory: string;
  cursorOpen: string;
  notReached: string;
  compare: string;
  metric: string;
  before: string;
  after: string;
  eagerSingle: string;
  lazySingle: string;
  lazyBatch: string;
  smallerTable: string;
  idle: string;
  reading: string;
  writing: string;
  done: string;
  failed: string;
  estimateNote: string;
  boundaries: string;
  limits: string;
  sources: string;
  sourcesIntro: string;
  notes: string;
  noJs: string;
  diagramLabel: string;
};

/** Russian only for now; other languages return with the next translation pass. */
export const transferCopy: Copy = {
  category: "Масштабирование переноса данных",
  title: "Миллион записей. Простой скрипт.",
  intro:
    "Нужно скопировать таблицу из одной базы в другую. Первый скрипт работает. Потом таблица растёт, и каждое исправление переносит проблему в другое место.",
  back: "Все исследования",
  scroll: "Прокрутка меняет ситуацию. Управление позволяет её запустить.",
  scenes: [
    {
      title: "Начнём с самого простого копирования.",
      body: "Прочитаем все строки одним запросом и вставим их по одной. Тысяча записей переносится примерно за две секунды, а весь скрипт помещается на экран.",
      insight:
        "Запустите и посмотрите на число обращений: один запрос на чтение, затем по одному обращению на каждую запись. Каждое ждёт ответа по сети.",
    },
    {
      title: "Теперь — миллион.",
      body: "Тот же скрипт, в тысячу раз больше данных. Единственный запрос должен держать весь результат в памяти до первой вставки, а у процесса 512 МБ.",
      insight:
        "Запустите миллион записей: копирование падает, ничего не записав. Попробуйте 100 000: в память помещается, но вставки по одной уже занимают минуты.",
    },
    {
      title: "Читаем лениво.",
      body: "Будем читать потоком. Курсор отдаёт страницу из 1 000 строк, скрипт записывает их и просит следующую. Сколько бы ни выросла таблица, память не растёт.",
      insight:
        "Снова запустите миллион. Перенос завершается — примерно за полчаса. И всё это время курсор в исходной базе и его соединение остаются открытыми.",
    },
    {
      title: "Пишем пакетами.",
      body: "Большая часть этого получаса — ожидание: миллион обращений ради вставок. Отправляйте по тысяче строк за раз, и обращений станет в тысячу раз меньше.",
      insight:
        "Меняйте размер пакета. Крупные пакеты экономят время, пока не начинает преобладать работа целевой базы над каждой записью, а память под буфер растёт. И появляется новый вопрос: если пакет упал на середине, что успело записаться?",
    },
  ],
  scenesLabel: "Ситуации при переносе",
  controls: "Управление переносом",
  source: "Источник",
  target: "Приёмник",
  process: "Скрипт переноса",
  memory: "Память",
  limit: "предел {0}",
  outOfMemory: "Нехватка памяти",
  words: {
    record: ["запись", "записи", "записей"],
    page: ["страница", "страницы", "страниц"],
    insert: ["вставка", "вставки", "вставок"],
    batch: ["пакет", "пакета", "пакетов"],
  },
  writtenOf: "записано {0}",
  records: "Записей",
  batchSize: "Размер пакета",
  perRecord: "1 (по одной)",
  run: "Запустить перенос",
  runAgain: "Запустить снова",
  reset: "Начать сцену заново",
  readAll: "запрос на все строки",
  elapsed: "Прошло",
  written: "Записано",
  duration: "Длительность",
  throughput: "Пропускная способность",
  perSecond: "{0} записей/с",
  roundTrips: "Обращений по сети",
  peakMemory: "Пиковая память",
  cursorOpen: "Курсор источника открыт",
  notReached: "не достигнуто",
  compare: "До и после",
  metric: "Оценка",
  before: "До",
  after: "Сейчас",
  eagerSingle: "Загрузить всё, вставлять по одной",
  lazySingle: "Читать страницами, вставлять по одной",
  lazyBatch: "Читать страницами, вставлять по {0}",
  smallerTable: "Тот же скрипт, {0} записей",
  idle: "Готово к запуску. Запустите перенос и посмотрите, как он идёт.",
  reading: "Чтение источника…",
  writing: "Запись в приёмник…",
  done: "Готово: {0} за {1}.",
  failed:
    "Нехватка памяти через {0}. Запросу нужно {1}, у процесса {2}. Ничего не записано.",
  estimateNote:
    "Все числа — оценки модели. Анимация сжимает расчётную длительность до нескольких секунд.",
  boundaries: "Что осталось за пределами модели",
  limits:
    "Один последовательный скрипт переноса, один источник и один приёмник. Каждый запрос или оператор вставки стоит одного сетевого обращения в 2 мс. Работа базы — 0,005 мс на чтение записи и 0,05 мс на запись. Запись занимает 1 КБ памяти, страница содержит 1 000 записей, скрипт может держать в буфере 512 МБ. Чтение и запись не перекрываются. Длительность вычисляется из этих констант, ничего не измеряется. Не моделируются: индексы, блокировки и конкуренция, разброс сетевых задержек, установка соединений, ограничения на размер транзакций, накладные расходы драйвера и протокола, повторы и любые сбои, кроме нехватки памяти. Модель помогает сравнивать решения, а не предсказывать длительность вашей миграции.",
  sources: "Глубже в механизм",
  sourcesIntro: "Как реальные системы читают лениво и пишут пакетами:",
  notes: "Заметки, на которых основано исследование",
  noJs: "Сцены можно прочитать без JavaScript. Включите его, чтобы запускать перенос.",
  diagramLabel: "{0} → {1} → {2}. Записано {3} из {4}. Память {5} из {6}.",
};

export function fill(template: string, ...values: (string | number)[]) {
  return template.replace(/\{(\d+)\}/g, (_, index: string) =>
    String(values[Number(index)] ?? ""),
  );
}
