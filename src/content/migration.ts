import type { Locale } from "../i18n";

type Scene = { title: string; body: string; insight: string };
type Copy = {
  title: string;
  intro: string;
  back: string;
  scroll: string;
  scenes: readonly Scene[];
  source: string;
  target: string;
  app: string;
  snapshot: string;
  stream: string;
  copy: string;
  write: string;
  apply: string;
  pause: string;
  resume: string;
  switch: string;
  reset: string;
  copied: string;
  pending: string;
  paused: string;
  live: string;
  complete: string;
  missing: string;
  matching: string;
  behind: string;
  empty: string;
  sourceVersion: string;
  targetVersion: string;
  controls: string;
  scenesLabel: string;
  boundaries: string;
  limits: string;
  sources: string;
  sourcesIntro: string;
  noJs: string;
  cutoverHint: string;
  snapshotHint: string;
};
export const migrationCopy: Record<Locale, Copy> = {
  en: {
    title: "Moving data. Keeping it correct.",
    intro:
      "Your application has outgrown its database. Moving the records is easy. What happens to the writes that arrive along the way?",
    back: "All explorations",
    scroll: "Scroll to change the situation. Use the controls to explore it.",
    scenes: [
      {
        title: "First, stop the world.",
        body: "One application. One database. Six records to move. Pause writes, take a snapshot, and copy it to a new home. Nothing changes underneath you.",
        insight:
          "Copy all six records. They match—but the application cannot accept writes for the entire transfer.",
      },
      {
        title: "But the application keeps running.",
        body: "Now keep writes open. Half the snapshot has been copied when record 01 changes from v1 to v2 in the source. The snapshot still holds v1.",
        insight:
          "Finish the copy. All six records are there, but record 01 is already out of date. A complete copy is not necessarily a current copy.",
      },
      {
        title: "Keep the changes, too.",
        body: "Start again, this time retaining every change after the snapshot boundary. Copy the snapshot, then replay those changes in order. This is the idea behind change data capture, or CDC.",
        insight:
          "Update record 01 during the copy. Finish copying, then apply changes. The target catches up without a second full copy.",
      },
      {
        title: "Catching up is not switching over.",
        body: "The snapshot is copied, with two changes still waiting. Even if the target catches up, the next write can put it behind again. Briefly pause source writes, drain the stream, compare the records, then move traffic.",
        insight:
          "Try catching up while writes are open. Then pause writes and apply the remaining changes. Switching is allowed only at that stable boundary.",
      },
    ],
    source: "Source",
    target: "Destination",
    app: "Application",
    snapshot: "Snapshot",
    stream: "Change stream",
    copy: "Copy one record",
    write: "Update record 01",
    apply: "Apply one change",
    pause: "Pause writes",
    resume: "Resume writes",
    switch: "Switch traffic",
    reset: "Reset this scene",
    copied: "Records copied",
    pending: "Changes waiting",
    paused: "Writes paused",
    live: "Writes open",
    complete:
      "Traffic now goes to the destination. The source stays fenced off in this model.",
    missing: "The destination is incomplete.",
    matching: "All six records match.",
    behind: "Record 01 differs between the two databases.",
    empty: "empty",
    sourceVersion: "Source record 01",
    targetVersion: "Destination record 01",
    controls: "Migration controls",
    scenesLabel: "Migration situations",
    boundaries: "What this model leaves out",
    limits:
      "Six records, one sequential writer, one consistent snapshot and an ordered, lossless change stream captured from the same boundary. Each action is one logical step; no action advances automatically. Only record 01 changes. Replay starts after snapshot copying finishes, avoiding old snapshot rows overwriting newer changes. Cutover assumes all writers can be fenced and all traffic can be moved atomically; it ends the simulation. Real migrations also need transaction boundaries, deletes, schema compatibility, retries, validation at scale and a rollback plan. Scene changes start a fresh scenario; reset and reload discard state. This is a visibility model, not a durability or performance claim.",
    sources: "Under the surface",
    sourcesIntro:
      "For concrete implementations of snapshots and change streams:",
    noJs: "The visual explanations remain available without JavaScript. Enable it to manipulate the system.",
    cutoverHint:
      "To switch: pause writes, drain changes, and confirm that every record matches.",
    snapshotHint: "Copy the entire snapshot before replaying changes.",
  },
  ru: {
    title: "Перенести данные. Не потерять изменения.",
    intro:
      "Приложение выросло из своей базы. Скопировать записи несложно. Но что делать с изменениями, которые приходят во время переноса?",
    back: "Все разборы",
    scroll: "Прокрутка меняет ситуацию. Управление позволяет исследовать её.",
    scenes: [
      {
        title: "Сначала остановим мир.",
        body: "Одно приложение. Одна база. Шесть записей, которые нужно перенести. Остановим запись, сделаем снимок и скопируем его в новое хранилище. Во время переноса ничего не меняется.",
        insight:
          "Скопируйте все шесть записей. Данные совпадут, но приложение не сможет принимать записи всё время переноса.",
      },
      {
        title: "Но приложение продолжает работать.",
        body: "Теперь оставим запись доступной. Половина снимка уже скопирована, когда запись 01 в исходной базе меняется с v1 на v2. В снимке по-прежнему v1.",
        insight:
          "Завершите копирование. Все шесть записей на месте, но запись 01 уже устарела. Полная копия ещё не означает актуальную.",
      },
      {
        title: "Сохраним и сами изменения.",
        body: "Начнём заново и сохраним каждое изменение после границы снимка. Сначала перенесём снимок, затем применим изменения по порядку. На этой идее основан захват изменений — Change Data Capture, или CDC.",
        insight:
          "Обновите запись 01 во время копирования. Завершите перенос и примените изменения. Новая база догонит исходную без повторного полного копирования.",
      },
      {
        title: "Догнать — ещё не переключиться.",
        body: "Снимок перенесён, два изменения ещё ждут доставки. Даже если базы сравняются, следующая запись снова создаст отставание. Ненадолго остановим запись в исходную базу, применим остаток изменений, сверим данные и переключим трафик.",
        insight:
          "Попробуйте догнать исходную базу при доступной записи. Затем приостановите запись и примените оставшиеся изменения. Переключение возможно только на этой стабильной границе.",
      },
    ],
    source: "Исходная база",
    target: "Новая база",
    app: "Приложение",
    snapshot: "Снимок",
    stream: "Поток изменений",
    copy: "Скопировать запись",
    write: "Обновить запись 01",
    apply: "Применить изменение",
    pause: "Приостановить запись",
    resume: "Возобновить запись",
    switch: "Переключить трафик",
    reset: "Начать сцену заново",
    copied: "Скопировано записей",
    pending: "Изменений в очереди",
    paused: "Запись приостановлена",
    live: "Запись доступна",
    complete:
      "Трафик направлен в новую базу. Запись в исходную базу остаётся заблокированной в этой модели.",
    missing: "Новая база ещё не заполнена.",
    matching: "Все шесть записей совпадают.",
    behind: "Запись 01 в двух базах отличается.",
    empty: "пусто",
    sourceVersion: "Запись 01 в исходной базе",
    targetVersion: "Запись 01 в новой базе",
    controls: "Управление миграцией",
    scenesLabel: "Ситуации при миграции",
    boundaries: "Что осталось за пределами модели",
    limits:
      "Шесть записей, один последовательный клиент, согласованный снимок и упорядоченный поток изменений без потерь с той же границы. Каждое действие — логический шаг; автоматического продвижения времени нет. Меняется только запись 01. Изменения применяются после полного копирования снимка, чтобы старые строки снимка не затёрли новые версии. При переключении предполагается, что можно заблокировать всех писателей и атомарно перенаправить весь трафик; на этом симуляция заканчивается. Реальная миграция также требует учёта транзакций, удалений, совместимости схем, повторных доставок, проверки больших объёмов и плана отката. Смена сцены запускает новый сценарий; сброс и перезагрузка удаляют состояние. Это модель видимости данных, а не гарантия надёжного хранения и не тест производительности.",
    sources: "Глубже в механизм",
    sourcesIntro: "Конкретные реализации снимков и потоков изменений:",
    noJs: "Объяснения доступны без JavaScript. Включите его, чтобы управлять системой.",
    cutoverHint:
      "Для переключения: приостановите запись, примените очередь изменений и убедитесь, что все записи совпадают.",
    snapshotHint: "Сначала скопируйте весь снимок, затем применяйте изменения.",
  },
  de: {
    title: "Daten bewegen. Änderungen bewahren.",
    intro:
      "Ihre Anwendung ist ihrer Datenbank entwachsen. Datensätze zu kopieren ist einfach. Aber was passiert mit den Änderungen während des Umzugs?",
    back: "Alle Erkundungen",
    scroll:
      "Scrollen verändert die Situation. Mit den Reglern können Sie sie erkunden.",
    scenes: [
      {
        title: "Zuerst halten wir die Welt an.",
        body: "Eine Anwendung. Eine Datenbank. Sechs Datensätze müssen umziehen. Schreibzugriffe pausieren, einen Snapshot erstellen und in die neue Datenbank kopieren. Dabei ändert sich nichts.",
        insight:
          "Kopieren Sie alle sechs Datensätze. Sie stimmen überein—aber während des gesamten Transfers sind keine Schreibzugriffe möglich.",
      },
      {
        title: "Aber die Anwendung läuft weiter.",
        body: "Jetzt bleiben Schreibzugriffe offen. Der Snapshot ist zur Hälfte kopiert, als Datensatz 01 in der Quelle von v1 auf v2 wechselt. Im Snapshot steht weiterhin v1.",
        insight:
          "Beenden Sie die Kopie. Alle sechs Datensätze sind da, aber Datensatz 01 ist veraltet. Eine vollständige Kopie ist nicht unbedingt aktuell.",
      },
      {
        title: "Auch Änderungen müssen mit.",
        body: "Wir beginnen neu und bewahren jede Änderung nach der Snapshot-Grenze auf. Erst den Snapshot kopieren, dann Änderungen der Reihe nach anwenden. Das ist die Idee hinter Change Data Capture, kurz CDC.",
        insight:
          "Ändern Sie Datensatz 01 während des Kopierens. Beenden Sie die Kopie und wenden Sie Änderungen an. Das Ziel holt ohne erneute vollständige Kopie auf.",
      },
      {
        title: "Aufholen ist noch kein Umschalten.",
        body: "Der Snapshot ist kopiert, zwei Änderungen warten noch. Selbst wenn das Ziel aufholt, kann der nächste Schreibzugriff neuen Rückstand erzeugen. Schreibzugriffe kurz pausieren, Änderungen abarbeiten, Daten vergleichen und den Verkehr umleiten.",
        insight:
          "Versuchen Sie aufzuholen, während Schreiben erlaubt ist. Pausieren Sie dann Schreibzugriffe und arbeiten Sie den Rest ab. Erst an dieser stabilen Grenze ist Umschalten möglich.",
      },
    ],
    source: "Quelle",
    target: "Zieldatenbank",
    app: "Anwendung",
    snapshot: "Snapshot",
    stream: "Änderungsstrom",
    copy: "Datensatz kopieren",
    write: "Datensatz 01 ändern",
    apply: "Änderung anwenden",
    pause: "Schreiben pausieren",
    resume: "Schreiben fortsetzen",
    switch: "Verkehr umschalten",
    reset: "Szene zurücksetzen",
    copied: "Datensätze kopiert",
    pending: "Änderungen ausstehend",
    paused: "Schreiben pausiert",
    live: "Schreiben erlaubt",
    complete:
      "Der Verkehr geht jetzt zur Zieldatenbank. Schreibzugriffe auf die Quelle bleiben in diesem Modell gesperrt.",
    missing: "Die Zieldatenbank ist unvollständig.",
    matching: "Alle sechs Datensätze stimmen überein.",
    behind: "Datensatz 01 unterscheidet sich zwischen den Datenbanken.",
    empty: "leer",
    sourceVersion: "Quelldatensatz 01",
    targetVersion: "Zieldatensatz 01",
    controls: "Migrationssteuerung",
    scenesLabel: "Migrationssituationen",
    boundaries: "Grenzen dieses Modells",
    limits:
      "Sechs Datensätze, ein sequenzieller Schreiber, ein konsistenter Snapshot und ein geordneter, verlustfreier Änderungsstrom ab derselben Grenze. Jede Aktion ist ein logischer Schritt; nichts läuft automatisch weiter. Nur Datensatz 01 ändert sich. Änderungen werden erst nach dem vollständigen Snapshot angewendet, damit alte Snapshot-Daten keine neueren Werte überschreiben. Umschalten setzt voraus, dass alle Schreiber gesperrt und der gesamte Verkehr atomar umgeleitet werden können; dort endet die Simulation. Reale Migrationen benötigen außerdem Transaktionsgrenzen, Löschungen, Schemakompatibilität, Wiederholungen, Validierung großer Datenmengen und einen Rückfallplan. Szenenwechsel starten ein neues Szenario; Zurücksetzen und Neuladen verwerfen den Zustand. Dies ist ein Sichtbarkeitsmodell, kein Haltbarkeits- oder Leistungsversprechen.",
    sources: "Unter der Oberfläche",
    sourcesIntro:
      "Konkrete Implementierungen von Snapshots und Änderungsströmen:",
    noJs: "Die Erklärungen sind ohne JavaScript verfügbar. Aktivieren Sie es, um das System zu verändern.",
    cutoverHint:
      "Zum Umschalten: Schreiben pausieren, Änderungen abarbeiten und alle Datensätze vergleichen.",
    snapshotHint:
      "Erst den gesamten Snapshot kopieren, dann Änderungen anwenden.",
  },
};
