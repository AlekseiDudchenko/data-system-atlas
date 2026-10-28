export default {
  "Dark theme": "Тёмная тема",
  "LIVE EXPERIMENT / 01": "ИНТЕРАКТИВНЫЙ ЭКСПЕРИМЕНТ / 01",
  "One write. Three perspectives.": "Одна запись. Три точки зрения.",
  Step: "Шаг",
  "Write → read a follower → advance twice → read again. A write queues two messages; only advancing time delivers them.":
    "Запишите → прочитайте реплику → выполните два шага → прочитайте снова. Запись создаёт два сообщения; только шаг времени доставляет их.",
  "Experiment controls": "Управление экспериментом",
  "1 / Write to the leader": "1 / Запись на лидере",
  "Write value": "Записать значение",
  "Accepted immediately. Replication takes two steps.":
    "Подтверждается сразу. Репликация занимает два шага.",
  "2 / Read a replica": "2 / Чтение реплики",
  "Follower A": "Реплика A",
  "Follower B": "Реплика B",
  "Read follower": "Прочитать реплику",
  "A read does not advance time or deliver updates.":
    "Чтение не продвигает время и не доставляет обновления.",
  "3 / Disrupt the network": "3 / Разрыв связи",
  "Block follower": "Заблокировать реплику",
  "Advance one step": "Следующий шаг",
  "Reset experiment": "Сбросить эксперимент",
  "Last read: Follower {0} returned “{1}” (v{2}). {3} — leader was v{4} at read time.":
    "Последнее чтение: реплика {0} вернула «{1}» (v{2}). {3} — на момент чтения у лидера была v{4}.",
  "Stale read": "Устаревшее чтение",
  "Current read": "Актуальное чтение",
  "No read yet. Predict the result, then read a follower.":
    "Чтений пока нет. Предскажите результат и прочитайте реплику.",
  "In transit": "В пути",
  "FIFO per follower · delivery after two steps":
    "FIFO для каждой реплики · доставка через два шага",
  "Leader →": "Лидер →",
  "” · v": "» · v",
  "Blocked · retained": "Заблокировано · сохранено",
  "Ready next step": "Готово к следующему шагу",
  "Due at step {0}": "Доставка на шаге {0}",
  "No pending messages.": "Нет сообщений в очереди.",
  "Event log": "Журнал событий",
  "Most recent first · last 100 events":
    "Сначала новые · последние 100 событий",
  "New name": "New name",
  "LIVE EXPERIMENT / 02": "ИНТЕРАКТИВНЫЙ ЭКСПЕРИМЕНТ / 02",
  "Your write. Your next read.": "Ваша запись. Ваше следующее чтение.",
  "Write → try an ordinary read → require your write → advance twice.":
    "Запишите → прочитайте сразу → потребуйте свою версию → выполните два шага.",
  "Client:": "Клиент:",
  You: "Вы",
  "· Session minimum:": "· Минимум сессии:",
  v: "v",
  "1 / Update your profile name": "1 / Обновление имени профиля",
  "Write name": "Записать имя",
  "Each acknowledged write raises your session minimum. One client, one operation at a time.":
    "Каждая подтверждённая запись повышает минимум сессии. Один клиент, одна операция за раз.",
  "2 / Choose a follower": "2 / Выбор реплики",
  "Read immediately": "Прочитать сразу",
  "Read my writes": "Прочитать свою запись",
  "Immediate reads may be old. Session reads wait for at least your last acknowledged write.":
    "Мгновенное чтение может вернуть старые данные. Чтение с гарантией сессии ждёт как минимум последнюю подтверждённую запись.",
  "3 / Disrupt replication": "3 / Разрыв репликации",
  "Waiting on follower {0} for at least v{1}; it has v{2}. No value returned. Restore replication and advance time, or cancel this read.":
    "Ожидание реплики {0}: требуется минимум v{1}, на ней v{2}. Значение не возвращено. Восстановите репликацию и выполните шаг либо отмените чтение.",
  "Session read": "Чтение с гарантией сессии",
  "Immediate read": "Мгновенное чтение",
  "Older than the leader": "Старее данных лидера",
  "Current at completion": "Актуально на момент завершения",
  "No read yet. Predict which policy can return an old name.":
    "Чтений пока нет. Какая политика может вернуть старое имя?",
  "Cancel waiting read": "Отменить ожидающее чтение",
  "replication messages pending. Blocking a link retains its messages; restoring it delivers nothing until the next step. A waiting read stays on its chosen follower.":
    "сообщений репликации в очереди. При блокировке связи сообщения сохраняются; после восстановления они доставляются только на следующем шаге. Чтение продолжает ждать выбранную реплику.",
  "No requests yet. Predict the distribution, then send a batch.":
    "Запросов пока нет. Предскажите распределение и отправьте пакет.",
  "Step {0}: {1} requests received, {2} completed, {3} queued. Busiest partition received {4}% of requests so far.":
    "Шаг {0}: получено {1} запросов, выполнено {2}, в очереди {3}. Самая загруженная партиция получила {4}% всех запросов.",
  "LIVE EXPERIMENT / 03": "ИНТЕРАКТИВНЫЙ ЭКСПЕРИМЕНТ / 03",
  "Same keys. Different pressure.": "Те же ключи. Другая нагрузка.",
  "12 keys → 3 partitions. Routing: key modulo 3. Each partition completes up to":
    "12 ключей → 3 партиции. Маршрут: остаток от деления ключа на 3. Каждая партиция выполняет до",
  "equal-cost requests per step.": "запросов одинаковой стоимости за шаг.",
  "1 / Choose a workload": "1 / Выбор нагрузки",
  "Even keys — one request per key": "Равномерно — один запрос на ключ",
  "Hot key — nine requests to one key":
    "Горячий ключ — девять запросов на один ключ",
  "Changing workload or hot key starts a fresh run. The routing stays fixed.":
    "Смена нагрузки или горячего ключа начинает новый запуск. Маршрутизация остаётся прежней.",
  "2 / Choose the hot key": "2 / Выбор горячего ключа",
  Key: "Ключ",
  "→ P": "→ P",
  "Each batch: 9 × key {0}, plus keys {1}, {2}, {3} once each.":
    "В пакете: 9 × ключ {0}, а также ключи {1}, {2}, {3} по одному разу.",
  "Each batch: keys 0 through 11, once each.":
    "В пакете: ключи от 0 до 11 по одному разу.",
  "Send 12 requests + step": "12 запросов + шаг",
  "Drain one step": "Шаг без новых запросов",
  "Reset run": "Сбросить запуск",
  "A batch arrives first, then every partition serves its own queue. Drain adds no requests. Reset clears counters and keeps your choices.":
    "Сначала поступает пакет, затем каждая партиция обрабатывает свою очередь. Шаг без новых запросов только разгружает очередь. Сброс очищает счётчики, сохраняя настройки.",
  "Share of all requests received · fixed 0–100% scale":
    "Доля всех полученных запросов · шкала 0–100%",
  queued: "в очереди",
  "Exact counters and fixed key ownership":
    "Точные счётчики и владельцы ключей",
  "Partition / keys": "Партиция / ключи",
  "Last step arrivals": "Поступило за шаг",
  "Received total": "Всего получено",
  "Completed total": "Всего выполнено",
  "Queued now": "Сейчас в очереди",
  Keys: "Ключи",
  "The keys stay evenly placed: four per partition. Traffic can still be skewed. Queued work stays on its owner; spare capacity elsewhere is not borrowed.":
    "Ключи по-прежнему распределены поровну: по четыре на партицию. Трафик может быть неравномерным. Работа остаётся у своего владельца; свободная мощность других партиций не используется.",
  "Leader version {0}. Follower A version {1}, {2}. Follower B version {3}, {4}.":
    "Лидер: версия {0}. Реплика A: версия {1}, {2}. Реплика B: версия {3}, {4}.",
  "× blocked": "× заблокировано",
  blocked: "заблокирована",
  connected: "подключена",
  "LEADER · v": "ЛИДЕР · v",
  FOLLOWER: "РЕПЛИКА",
  "· v": "· v",
  "Full node values": "Полные значения узлов",
  "Leader:": "Лидер:",
  Follower: "Реплика",
  behind: "отстаёт",
  "caught up": "синхронизирована",
  "{0}: follower {1} returned “{2}” (v{3}). Required at least v{4}. {5} (leader v{6}). This result is historical.":
    "{0}: реплика {1} вернула «{2}» (v{3}). Требовалось минимум v{4}. {5} (лидер v{6}). Это исторический результат.",
  "P{0}: {1} received, {2} completed, {3} queued":
    "P{0}: получено {1}, выполнено {2}, в очереди {3}",
  "Skip to content": "Перейти к содержимому",
  Main: "Основная навигация",
  Language: "Язык",
  "Explore the atlas": "Открыть атлас",
  "Explore. Break. Understand.": "Исследуй. Ломай. Понимай.",
  "An independent, open-source learning project.":
    "Независимый образовательный проект с открытым кодом.",
  "A FIELD GUIDE TO DATA SYSTEMS": "ПУТЕВОДИТЕЛЬ ПО СИСТЕМАМ ДАННЫХ",
  "Understand the system.": "Пойми систему.",
  "By changing it.": "Изменяя её.",
  "Make a write. Cut a connection. Read an old value. Explore the trade-offs behind the systems you build, one experiment at a time.":
    "Запишите значение. Разорвите связь. Прочитайте старые данные. Исследуйте компромиссы в устройстве систем — эксперимент за экспериментом.",
  "Start with replication": "Начать с репликации",
  "03 interactive lessons · Built for curious engineers":
    "03 интерактивных урока · Для любознательных инженеров",
  "Your map of data systems": "Ваша карта систем данных",
  "Eight territories. One connected view.": "Восемь областей. Единая картина.",
  Foundations: "Основы",
  "Storage Engines": "Движки хранения",
  Replication: "Репликация",
  Partitioning: "Партиционирование",
  "Transactions & Consistency": "Транзакции и согласованность",
  "Distributed Coordination": "Распределённая координация",
  "Event-Driven Systems": "Событийные системы",
  "Architecture Patterns": "Архитектурные паттерны",
  "EXPLORE NOW": "ИССЛЕДОВАТЬ",
  "ON THE HORIZON": "В ПЛАНАХ",
  "When a successful write and an old read can both be correct.":
    "Когда успешная запись и старые данные при чтении могут быть корректными.",
  "Replication and Stale Reads": "Репликация и устаревшие чтения",
  "Read Your Writes": "Чтение собственных записей",
  "Evenly placed keys can still produce uneven traffic.":
    "Равномерное распределение ключей не гарантирует равномерный трафик.",
  "Partitioning and Hotspots": "Партиционирование и горячие точки",
  "Planned territory": "Запланированная область",
  Atlas: "Атлас",
  "EXPERIMENT {0} · ABOUT 10 MINUTES": "ЭКСПЕРИМЕНТ {0} · ОКОЛО 10 МИНУТ",
  "This experiment needs JavaScript. The explanation and worked scenario below are available without it.":
    "Для эксперимента нужен JavaScript. Объяснение и разбор сценария ниже доступны без него.",
  "Explore, break, and understand data systems through original interactive experiments.":
    "Исследуйте, ломайте и изучайте системы данных с помощью авторских интерактивных экспериментов.",
  "Step {0} · {1}": "Шаг {0} · {1}",
  "All replicas begin at v0: “{0}”.": "Все реплики начинают с v0: «{0}».",
  "Leader accepted v{0}: “{1}”. Two updates queued.":
    "Лидер принял v{0}: «{1}». Два обновления в очереди.",
  "Read follower {0}: “{1}” (v{2}) — {3} at read time.":
    "Чтение реплики {0}: «{1}» (v{2}) — {3} на момент чтения.",
  "Replication to {0} {1}. Queued updates are retained.":
    "Репликация на {0}: {1}. Обновления в очереди сохранены.",
  restored: "восстановлена",
  "Delivered {0} update(s), in write order per follower.":
    "Доставлено обновлений: {0}, в порядке записи для каждой реплики.",
  "No updates delivered. Links may be blocked or messages are not due yet.":
    "Обновления не доставлены. Связи заблокированы или срок доставки ещё не наступил.",
} as const;
