/** Teaching fragments, Java 17 + PostgreSQL JDBC; helpers build on earlier scenes. */
export const transferJava = [
  {
    title: "Загрузить всё, записать по одной",
    note: "source и target — отдельные JDBC Connection с autoCommit=true; таблица records содержит id bigint и payload text. Импорты: java.sql.*, java.util.*, java.util.concurrent.* и javax.sql.DataSource. Методы ниже — фрагменты одного класса; соединениями владеет вызывающий код.",
    code: `record Row(long id, String payload) {}

List<Row> readAll(Connection source) throws SQLException {
    var rows = new ArrayList<Row>();
    try (var query = source.createStatement();
         var rs = query.executeQuery(
             "SELECT id, payload FROM records ORDER BY id")) {
        while (rs.next()) {
            rows.add(new Row(rs.getLong(1), rs.getString(2)));
        }
    }
    return rows;
}

void insertOne(Connection target, Row row) throws SQLException {
    try (var insert = target.prepareStatement(
            "INSERT INTO records(id, payload) VALUES (?, ?)")) {
        insert.setLong(1, row.id());
        insert.setString(2, row.payload());
        insert.executeUpdate();
    }
}

void copyAll(Connection source, Connection target)
        throws SQLException {
    for (var row : readAll(source)) {
        insertOne(target, row);
    }
}`,
  },
  {
    title: "Тот же код, больше данных",
    note: "Не меняем алгоритм: readAll из предыдущего шага удерживает весь список до первой вставки. Даже обход ResultSet без списка у pgJDBC по умолчанию может буферизовать весь результат. Размер Java-объектов и момент OutOfMemoryError зависят от JVM и данных; 512 МБ в симуляции — условие модели.",
    code: `// В records теперь 1 000 000 строк.
// readAll сначала создаёт List<Row> для ВСЕЙ таблицы.
// insertOne ещё не вызван, а память уже расходуется.
copyAll(source, target);`,
  },
  {
    title: "Курсор вместо списка",
    note: "Для pgJDBC нужны autoCommit=false, TYPE_FORWARD_ONLY и положительный fetchSize. Используйте отдельное соединение источника: транзакция и курсор живут до окончания чтения. target здесь остаётся в autoCommit=true. При выходе владелец должен закрыть source или откатить транзакцию после ошибки.",
    code: `void copyCursor(Connection source, Connection target)
        throws SQLException {
    source.setAutoCommit(false);
    try (var query = source.prepareStatement(
            "SELECT id, payload FROM records ORDER BY id",
            ResultSet.TYPE_FORWARD_ONLY,
            ResultSet.CONCUR_READ_ONLY)) {
        query.setFetchSize(1_000);
        try (var rs = query.executeQuery()) {
            while (rs.next()) {
                insertOne(target,
                    new Row(rs.getLong(1), rs.getString(2)));
            }
        }
    }
    source.commit();
}`,
  },
  {
    title: "Один буфер — одна транзакция записи",
    note: "В цикле курсора собираем максимум 1 000 Row, вызываем writeBatch и очищаем буфер; остаток тоже записываем. Метод использует отдельное соединение приёмника и фиксирует весь пакет атомарно. executeBatch сам по себе не гарантирует одно сетевое обращение: у pgJDBC можно включить reWriteBatchedInserts=true, а реальное число запросов зависит от драйвера.",
    code: `void writeBatch(DataSource target, List<Row> rows, String sql)
        throws SQLException {
    try (var connection = target.getConnection()) {
        connection.setAutoCommit(false);
        try (var insert = connection.prepareStatement(sql)) {
            for (var row : rows) {
                insert.setLong(1, row.id());
                insert.setString(2, row.payload());
                insert.addBatch();
            }
            insert.executeBatch();
            connection.commit();
        } catch (SQLException failure) {
            try { connection.rollback(); }
            catch (SQLException rollback) {
                failure.addSuppressed(rollback);
            }
            throw failure;
        }
    }
}`,
  },
  {
    title: "Ограниченный повтор с задержкой",
    note: "Передавайте тот же неизменный пакет во все попытки. Каждая попытка writeBatch получает новое соединение. Повторяем только ошибки соединения (SQLSTATE 08) и отката транзакции (40); ошибки SQL и ограничений сразу пробрасываем. После потери ответа на commit результат неизвестен: INSERT без уникального ключа создаст дубли, а с уникальным ключом повтор может завершиться ошибкой.",
    code: `void writeWithRetry(DataSource target, List<Row> rows, String sql)
        throws SQLException, InterruptedException {
    for (int attempt = 0; ; attempt++) {
        try {
            writeBatch(target, rows, sql);
            return;
        } catch (SQLException failure) {
            String state = failure.getSQLState();
            boolean retryable = state != null &&
                (state.startsWith("08") || state.startsWith("40"));
            if (!retryable || attempt == 4) throw failure;
            long delay = 100L << attempt;
            Thread.sleep(delay +
                ThreadLocalRandom.current().nextLong(delay / 2 + 1));
        }
    }
}`,
  },
  {
    title: "UPSERT делает повтор записи идемпотентным",
    note: "В приёмнике нужен PRIMARY KEY(id) или UNIQUE(id). ON CONFLICT — синтаксис PostgreSQL. Повтор безопасен для одинакового payload без побочных эффектов: триггеры, счётчики и конкурирующие обновления требуют отдельной защиты. В отличие от симуляции, обычный INSERT с таким ключом не создаёт дубль, а возвращает ошибку конфликта.",
    code: `String upsertSql = """
    INSERT INTO records(id, payload) VALUES (?, ?)
    ON CONFLICT (id) DO UPDATE
    SET payload = EXCLUDED.payload
    """;

// rows — текущий пакет, сохранённый до подтверждения записи.
writeWithRetry(targetDataSource, rows, upsertSql);`,
  },
  {
    title: "Checkpoint после подтверждённого пакета",
    note: "checkpointStore — ваш долговечный репозиторий с load(jobId) и save(jobId, lastId); это не переменная в памяти. readPage читает WHERE id > ? ORDER BY id LIMIT ? через PreparedStatement. Сохраняем последний ключ, а не номер страницы. Требуются положительные уникальные неизменные id, неизменяемый источник и один исполнитель на jobId. Иначе нужен согласованный snapshot или CDC. После сбоя между записью и save пакет повторится; UPSERT это допускает.",
    code: `long lastId = checkpointStore.load(jobId); // 0 для нового задания
while (true) {
    List<Row> rows = readPage(source, lastId, 1_000);
    if (rows.isEmpty()) break;

    writeWithRetry(targetDataSource, rows, upsertSql);
    long nextId = rows.get(rows.size() - 1).id();
    checkpointStore.save(jobId, nextId); // только ПОСЛЕ commit
    lastId = nextId;
}
// save ДО write может навсегда пропустить пакет.
// Альтернатива: UPSERT данных и UPDATE checkpoint
// на одном connection, в одной транзакции приёмника.`,
  },
  {
    title: "Ограничить параллелизм и разделить ключи",
    note: "Range — непересекающийся диапазон (fromExclusive, toInclusive]. copyRange применяет предыдущий цикл с дополнительным id <= ? и собственным checkpoint по паре jobId/rangeId. Каждый читатель берёт собственные соединения из DataSource; JDBC Connection между потоками не разделяем. Это контракт вспомогательного метода, а не его полная реализация. Пул ограничивает число соединений, а очередь заданий и скорость приёмника всё равно требуют контроля.",
    code: `int workers = 4;
var executor = Executors.newFixedThreadPool(workers);
var futures = new ArrayList<Future<Void>>();
try {
    // ranges заранее делят весь нужный диапазон без дыр и пересечений.
    for (var range : ranges) {
        futures.add(executor.submit(() -> {
            copyRange(sourceDataSource, targetDataSource, range);
            return null;
        }));
    }
    for (var future : futures) future.get(); // не теряем ошибки
} finally {
    for (var future : futures) future.cancel(true);
    executor.shutdownNow();
    // JDBC может не прервать запрос по interrupt:
    // задайте queryTimeout и сетевые таймауты драйвера.
}`,
  },
] as const;
