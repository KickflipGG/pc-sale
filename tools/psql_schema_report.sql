-- =============================================================================
--  PC Sale — отчёт о физической структуре базы данных
--  Выполняется клиентом psql; результат включается в отчёт по заданию 61–63.
--
--  Запуск (из корня проекта, PowerShell):
--    $env:PGPASSWORD='admin'; $env:PGCLIENTENCODING='UTF8'; $env:LC_MESSAGES='C'
--    psql -q -U postgres -h localhost -d pc_sale -f tools/psql_schema_report.sql
--
--  Запросы намеренно формируют компактный вывод: ширина строки не превышает
--  ширину полосы набора отчёта в моноширинном шрифте.
-- =============================================================================

\pset pager off
\pset border 2

\echo '================================================================='
\echo ' PC Sale — структура базы данных pc_sale (PostgreSQL 18)'
\echo '================================================================='
\echo ''
\echo '--- Версия СУБД и текущая база данных ---'
SELECT left(version(), 52) AS "сервер", current_database() AS "база", current_user AS "владелец";

\echo ''
\echo '--- Перечень таблиц схемы public ---'
\dt

\echo ''
\echo '--- Состав столбцов всех таблиц ---'
SELECT
    c.relname                                        AS "таблица",
    a.attname                                        AS "столбец",
    replace(replace(replace(
        format_type(a.atttypid, a.atttypmod),
        'character varying', 'varchar'),
        'timestamp with time zone', 'timestamptz'),
        'double precision', 'float8')                AS "тип",
    CASE WHEN a.attnotnull THEN 'NOT NULL' ELSE '' END AS "обязат.",
    CASE
        WHEN d.adbin IS NULL THEN ''
        WHEN pg_get_expr(d.adbin, d.adrelid) LIKE 'nextval%' THEN 'nextval()'
        ELSE left(replace(pg_get_expr(d.adbin, d.adrelid), '::regclass', ''), 14)
    END                                              AS "по умолчанию"
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_attribute AS a ON a.attrelid = c.oid
LEFT JOIN pg_attrdef AS d ON d.adrelid = c.oid AND d.adnum = a.attnum
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attnum > 0
  AND NOT a.attisdropped
ORDER BY c.relname, a.attnum;

\echo ''
\echo '--- Первичные и уникальные ключи ---'
SELECT
    c.relname        AS "таблица",
    con.conname      AS "ограничение",
    CASE con.contype WHEN 'p' THEN 'PRIMARY KEY' ELSE 'UNIQUE' END AS "тип",
    left(pg_get_constraintdef(con.oid), 26) AS "столбцы"
FROM pg_constraint AS con
JOIN pg_class AS c ON c.oid = con.conrelid
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND con.contype IN ('p', 'u')
ORDER BY c.relname, con.contype DESC;

\echo ''
\echo '--- Внешние ключи и правила ссылочной целостности ---'
SELECT
    tc.table_name   AS "таблица",
    kcu.column_name AS "столбец",
    ccu.table_name  AS "ссылается на",
    rc.delete_rule  AS "ON DELETE"
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '--- Проверочные ограничения предметной области ---'
SELECT
    rel.relname                   AS "таблица",
    left(con.conname, 24)         AS "ограничение",
    left(pg_get_constraintdef(con.oid), 30) AS "определение"
FROM pg_constraint AS con
JOIN pg_class AS rel ON rel.oid = con.conrelid
JOIN pg_namespace AS ns ON ns.oid = rel.relnamespace
WHERE con.contype = 'c'
  AND ns.nspname = 'public'
ORDER BY rel.relname, con.conname;

\echo ''
\echo '--- Дополнительные индексы для ускорения поиска ---'
SELECT
    tablename AS "таблица",
    indexname AS "индекс",
    left(regexp_replace(indexdef, '^CREATE INDEX .* USING ', ''), 30) AS "определение"
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname NOT LIKE '%_pkey'
  AND indexname NOT LIKE '%_key'
ORDER BY tablename, indexname;

\echo ''
\echo '--- Комментарии к ключевым столбцам ---'
SELECT
    c.relname  AS "таблица",
    a.attname  AS "столбец",
    left(col_description(c.oid, a.attnum), 44) AS "комментарий"
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
JOIN pg_attribute AS a ON a.attrelid = c.oid
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND a.attnum > 0
  AND NOT a.attisdropped
  AND col_description(c.oid, a.attnum) IS NOT NULL
ORDER BY c.relname, a.attnum;

\echo ''
\echo '--- Количество записей в таблицах ---'
SELECT 'roles' AS "таблица", count(*) AS "записей" FROM roles
UNION ALL SELECT 'users', count(*) FROM users
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'products', count(*) FROM products
UNION ALL SELECT 'orders', count(*) FROM orders
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'trade_in_requests', count(*) FROM trade_in_requests
UNION ALL SELECT 'reviews', count(*) FROM reviews
ORDER BY 1;

\echo ''
\echo '--- Пример данных: первые пять товаров каталога ---'
SELECT
    p.product_id      AS "id",
    left(c.name, 20)  AS "категория",
    left(p.title, 36) AS "наименование",
    p.price_retail    AS "цена",
    p.stock_quantity  AS "склад"
FROM products AS p
JOIN categories AS c ON c.category_id = p.category_id
ORDER BY p.product_id
LIMIT 5;

\echo ''
\echo '================================================================='
\echo ' Конец отчёта о структуре базы данных'
\echo '================================================================='
