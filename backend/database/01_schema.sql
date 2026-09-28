-- =============================================================================
--  PC Sale — интернет-магазин компьютерной техники
--  Физическая модель базы данных (СУБД PostgreSQL 18)
--  Скрипт полного создания схемы: database/01_schema.sql
-- =============================================================================

DROP DATABASE IF EXISTS pc_sale;
CREATE DATABASE pc_sale
    WITH ENCODING = 'UTF8'
         TEMPLATE = template0;

\connect pc_sale

SET client_encoding = 'UTF8';
SET search_path TO public;

-- -----------------------------------------------------------------------------
-- 1. roles — справочник ролей доступа пользователей
-- -----------------------------------------------------------------------------
CREATE TABLE roles (
    role_id     SERIAL       PRIMARY KEY,
    name        VARCHAR(32)  NOT NULL,
    CONSTRAINT roles_name_key UNIQUE (name)
);

COMMENT ON TABLE  roles       IS 'Справочник ролей доступа к системе';
COMMENT ON COLUMN roles.name  IS 'Системное имя роли: guest, client, manager, admin';

-- -----------------------------------------------------------------------------
-- 2. users — учётные записи пользователей
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    user_id          SERIAL        PRIMARY KEY,
    role_id          INTEGER       NOT NULL DEFAULT 2,
    login            VARCHAR(64)   NOT NULL,
    email            VARCHAR(128)  NOT NULL,
    password_hash    VARCHAR(255)  NOT NULL,
    first_name       VARCHAR(128)  NOT NULL,
    phone_number     VARCHAR(20)   NOT NULL,
    delivery_address TEXT,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_blocked       BOOLEAN       NOT NULL DEFAULT FALSE,
    CONSTRAINT users_login_key UNIQUE (login),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id)
        REFERENCES roles (role_id)
);

COMMENT ON TABLE  users               IS 'Учётные записи покупателей и сотрудников';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля (PBKDF2-HMAC-SHA256, соль в составе строки)';
COMMENT ON COLUMN users.is_blocked    IS 'Признак блокировки учётной записи администратором';

-- -----------------------------------------------------------------------------
-- 3. categories — категории каталога (поддерживают вложенность)
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
    category_id SERIAL       PRIMARY KEY,
    parent_id   INTEGER,
    name        VARCHAR(128) NOT NULL,
    slug        VARCHAR(128) NOT NULL,
    description TEXT,
    sort_order  SMALLINT     NOT NULL DEFAULT 100,
    CONSTRAINT categories_slug_key UNIQUE (slug),
    CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id)
        REFERENCES categories (category_id) ON DELETE RESTRICT
);

COMMENT ON TABLE  categories            IS 'Дерево категорий каталога товаров';
COMMENT ON COLUMN categories.parent_id  IS 'Родительская категория; NULL — корневой раздел каталога';
COMMENT ON COLUMN categories.slug       IS 'ЧПУ-идентификатор категории для URL';

-- -----------------------------------------------------------------------------
-- 4. products — номенклатурные единицы каталога
-- -----------------------------------------------------------------------------
CREATE TABLE products (
    product_id      SERIAL         PRIMARY KEY,
    category_id     INTEGER        NOT NULL,
    title           VARCHAR(255)   NOT NULL,
    slug            VARCHAR(255)   NOT NULL,
    sku_code        VARCHAR(64)    NOT NULL,
    cpu_spec        VARCHAR(128),
    gpu_spec        VARCHAR(128),
    ram_capacity_gb SMALLINT,
    storage_spec    VARCHAR(255),
    price_retail    NUMERIC(10, 2) NOT NULL,
    stock_quantity  INTEGER        NOT NULL DEFAULT 0,
    image_url       VARCHAR(512),
    is_active       BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT products_slug_key     UNIQUE (slug),
    CONSTRAINT products_sku_code_key UNIQUE (sku_code),
    CONSTRAINT products_price_retail_check   CHECK (price_retail >= 0),
    CONSTRAINT products_stock_quantity_check CHECK (stock_quantity >= 0),
    CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id)
        REFERENCES categories (category_id) ON DELETE RESTRICT
);

COMMENT ON TABLE  products                 IS 'Товары интернет-магазина: готовые сборки и комплектующие';
COMMENT ON COLUMN products.price_retail    IS 'Розничная цена, руб.';
COMMENT ON COLUMN products.stock_quantity  IS 'Остаток на складе, шт.';

-- -----------------------------------------------------------------------------
-- 5. orders — журнал заказов
-- -----------------------------------------------------------------------------
CREATE TABLE orders (
    order_id         SERIAL         PRIMARY KEY,
    customer_id      INTEGER        NOT NULL,
    order_status     VARCHAR(32)    NOT NULL DEFAULT 'created',
    total_amount     NUMERIC(10, 2) NOT NULL,
    tradein_discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    final_payable    NUMERIC(10, 2) NOT NULL,
    delivery_type    VARCHAR(32)    NOT NULL,
    payment_method   VARCHAR(32)    NOT NULL,
    is_paid          BOOLEAN        NOT NULL DEFAULT FALSE,
    shipping_notes   TEXT,
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT orders_total_amount_check     CHECK (total_amount >= 0),
    CONSTRAINT orders_tradein_discount_check CHECK (tradein_discount >= 0),
    CONSTRAINT orders_final_payable_check    CHECK (final_payable >= 0),
    CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id)
        REFERENCES users (user_id) ON DELETE RESTRICT
);

COMMENT ON TABLE  orders                  IS 'Оформленные заказы покупателей';
COMMENT ON COLUMN orders.order_status     IS 'created / paid / assembled / delivered / cancelled';
COMMENT ON COLUMN orders.tradein_discount IS 'Скидка по программе Trade-In, руб.';
COMMENT ON COLUMN orders.final_payable    IS 'Итог к оплате: total_amount - tradein_discount';

-- -----------------------------------------------------------------------------
-- 6. order_items — спецификация позиций заказа
-- -----------------------------------------------------------------------------
CREATE TABLE order_items (
    item_id          SERIAL         PRIMARY KEY,
    order_id         INTEGER        NOT NULL,
    product_id       INTEGER        NOT NULL,
    fixed_unit_price NUMERIC(10, 2) NOT NULL,
    quantity         SMALLINT       NOT NULL DEFAULT 1,
    subtotal_amount  NUMERIC(10, 2) NOT NULL,
    CONSTRAINT order_items_fixed_unit_price_check CHECK (fixed_unit_price >= 0),
    CONSTRAINT order_items_quantity_check         CHECK (quantity > 0),
    CONSTRAINT order_items_subtotal_amount_check  CHECK (subtotal_amount >= 0),
    CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id)
        REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id)
        REFERENCES products (product_id) ON DELETE RESTRICT
);

COMMENT ON TABLE  order_items                  IS 'Позиции заказа с зафиксированной на момент покупки ценой';
COMMENT ON COLUMN order_items.fixed_unit_price IS 'Цена единицы товара на момент оформления заказа';

-- -----------------------------------------------------------------------------
-- 7. trade_in_requests — обращения по программе Trade-In
-- -----------------------------------------------------------------------------
CREATE TABLE trade_in_requests (
    tradein_id        SERIAL         PRIMARY KEY,
    user_id           INTEGER,
    contact_name      VARCHAR(128)   NOT NULL,
    contact_phone     VARCHAR(20)    NOT NULL,
    device_category   VARCHAR(64)    NOT NULL,
    item_description  TEXT           NOT NULL,
    known_defects     TEXT,
    photo_urls        TEXT,
    preliminary_price NUMERIC(10, 2),
    approved_price    NUMERIC(10, 2),
    request_status    VARCHAR(32)    NOT NULL DEFAULT 'pending',
    manager_notes     TEXT,
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT trade_in_requests_preliminary_price_check CHECK (preliminary_price >= 0),
    CONSTRAINT trade_in_requests_approved_price_check    CHECK (approved_price >= 0),
    CONSTRAINT trade_in_requests_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES users (user_id) ON DELETE SET NULL
);

COMMENT ON TABLE  trade_in_requests               IS 'Заявки на обмен старой техники со скидкой';
COMMENT ON COLUMN trade_in_requests.photo_urls    IS 'Список ссылок на фото, разделитель — запятая';
COMMENT ON COLUMN trade_in_requests.request_status IS 'pending / approved / rejected / completed';

-- -----------------------------------------------------------------------------
-- 8. reviews — отзывы покупателей о товарах
-- -----------------------------------------------------------------------------
CREATE TABLE reviews (
    review_id         SERIAL      PRIMARY KEY,
    author_id         INTEGER     NOT NULL,
    product_id        INTEGER     NOT NULL,
    rating_score      SMALLINT    NOT NULL,
    comment_text      TEXT        NOT NULL,
    moderation_status VARCHAR(32) NOT NULL DEFAULT 'on_moderation',
    created_at        TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_score_check CHECK (rating_score BETWEEN 1 AND 5),
    CONSTRAINT reviews_author_id_fkey FOREIGN KEY (author_id)
        REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id)
        REFERENCES products (product_id) ON DELETE CASCADE
);

COMMENT ON TABLE  reviews                   IS 'Отзывы и оценки товаров покупателями';
COMMENT ON COLUMN reviews.moderation_status IS 'on_moderation / published / rejected';

-- -----------------------------------------------------------------------------
-- Индексы по внешним ключам и полям поиска
-- -----------------------------------------------------------------------------
CREATE INDEX idx_users_role_id             ON users (role_id);
CREATE INDEX idx_categories_slug           ON categories (slug);
CREATE INDEX idx_categories_parent_id      ON categories (parent_id);
CREATE INDEX idx_products_category_id      ON products (category_id);
CREATE INDEX idx_products_title_lower      ON products (LOWER(title));
CREATE INDEX idx_products_active           ON products (is_active) WHERE is_active;
CREATE INDEX idx_orders_customer_id        ON orders (customer_id);
CREATE INDEX idx_orders_status_created     ON orders (order_status, created_at DESC);
CREATE INDEX idx_order_items_order_id      ON order_items (order_id);
CREATE INDEX idx_order_items_product_id    ON order_items (product_id);
CREATE INDEX idx_tradein_status            ON trade_in_requests (request_status);
CREATE INDEX idx_tradein_user_id           ON trade_in_requests (user_id);
CREATE INDEX idx_reviews_product_id        ON reviews (product_id);
CREATE INDEX idx_reviews_status            ON reviews (moderation_status);

-- =============================================================================
--  Конец скрипта создания схемы
-- =============================================================================
