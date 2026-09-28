-- =============================================================================
--  PC Sale — наполнение базы данных демонстрационными данными
--  Скрипт: database/02_seed.sql
--  Запуск:  psql -U postgres -d pc_sale -f database/02_seed.sql
-- =============================================================================

SET client_encoding = 'UTF8';
SET search_path TO public;

TRUNCATE TABLE reviews, trade_in_requests, order_items, orders, products, categories, users, roles
    RESTART IDENTITY CASCADE;

-- -----------------------------------------------------------------------------
-- 1. Роли доступа
-- -----------------------------------------------------------------------------
INSERT INTO roles (role_id, name) VALUES
    (1, 'guest'),
    (2, 'client'),
    (3, 'manager'),
    (4, 'admin');

-- -----------------------------------------------------------------------------
-- 2. Пользователи
--    Пароли: admin123 / manager123 / client123 (PBKDF2-HMAC-SHA256)
-- -----------------------------------------------------------------------------
INSERT INTO users (user_id, role_id, login, email, password_hash, first_name, phone_number, delivery_address, is_blocked) VALUES
    (1, 4, 'admin',    'admin@pc-sale.ru',    'pbkdf2_sha256$120000$8072ededa1ce4d56d132bdd0523b7927$23a09bdf5dc25ed74f6e0a5e6043b08696d794c5f6d59e82f09f96412649d6f3', 'Администратор',  '+7 383 200-10-10', NULL, FALSE),
    (2, 3, 'manager',  'manager@pc-sale.ru',  'pbkdf2_sha256$120000$8208d5a4772f7bd9ccd848d8e1ffa4a6$2082ef804d078e31b577ff865b0b61567123b994f2379ad37808fc6b8b9da123', 'Зиберева Алина', '+7 383 200-10-11', NULL, FALSE),
    (3, 2, 'danil',    'marenich@mail.ru',    'pbkdf2_sha256$120000$fa5523bf8facfe148ce6c8a21ac83dc4$d648be7123ab4d9e972b19b9b3e0a97379a7a8bd26496e152210cca8c966a26b', 'Данил Маренич',  '+7 999 123-45-67', 'г. Новосибирск, ул. Галущака, 52, кв. 47', FALSE),
    (4, 2, 'client2',  'client2@mail.ru',    'pbkdf2_sha256$120000$fa5523bf8facfe148ce6c8a21ac83dc4$d648be7123ab4d9e972b19b9b3e0a97379a7a8bd26496e152210cca8c966a26b', 'Егор Соколов',   '+7 913 555-77-21', 'г. Новосибирск, ул. Кирова, 113, кв. 8', FALSE);

-- -----------------------------------------------------------------------------
-- 3. Дерево категорий каталога
-- -----------------------------------------------------------------------------
INSERT INTO categories (category_id, parent_id, name, slug, description, sort_order) VALUES
    (1,  NULL, 'Готовые компьютеры',            'ready-pc',      'Проверенные сборки под конкретные задачи: от офиса до 4K-гейминга', 10),
    (2,  1,    'Офисные ПК',                    'office',        'Надёжные компьютеры для документов, учёта и повседневной работы',   11),
    (3,  1,    'ПК для дома и учёбы',           'home-study',    'Универсальные сбалансированные сборки начального игрового уровня',   12),
    (4,  1,    'Мощные игровые ПК',             'gaming',        'Флагманские решения для гейминга в 2K/4K и работы с графикой',       13),
    (5,  NULL, 'Комплектующие',                 'components',    'Процессоры, видеокарты, память, накопители и охлаждение',            20),
    (6,  5,    'Процессоры',                    'cpu',           'CPU для платформ Intel LGA1700/LGA1851 и AMD AM5',                  21),
    (7,  5,    'Видеокарты',                    'gpu',           'Дискретная графика NVIDIA GeForce и AMD Radeon',                    22),
    (8,  5,    'Материнские платы',             'motherboards',  'Системные платы форматов ATX и micro-ATX',                          23),
    (9,  5,    'Оперативная память',            'ram',           'Модули DDR4 и DDR5 для настольных платформ',                        24),
    (10, 5,    'Накопители',                    'storage',       'SSD NVMe, SATA и жёсткие диски',                                    25),
    (11, 5,    'Блоки питания',                 'psu',           'Блоки питания с сертификацией 80 PLUS',                             26),
    (12, 5,    'Корпуса',                       'cases',         'Корпуса с продуманной продуваемостью и кабель-менеджментом',        27),
    (13, 5,    'Кулеры для процессора',         'cpu-coolers',   'Воздушные башенные кулеры',                                         28),
    (14, 5,    'Системы жидкостного охлаждения','liquid-cooling','Необслуживаемые СЖО (AIO) 240/360 мм',                              29),
    (15, NULL, 'Периферия',                     'peripherals',   'Мониторы, мыши, клавиатуры и гарнитуры',                            30),
    (16, 15,   'Клавиатуры',                    'keyboards',     'Механические и мембранные клавиатуры',                              31),
    (17, 15,   'Компьютерные мыши',             'mice',          'Игровые и офисные мыши',                                            32),
    (18, 15,   'Мониторы',                      'monitors',      'Мониторы для работы и игр',                                         33),
    (19, 15,   'Наушники',                      'headphones',    'Игровые гарнитуры и наушники',                                      34);

-- -----------------------------------------------------------------------------
-- 4. Товары
-- -----------------------------------------------------------------------------
INSERT INTO products (product_id, category_id, title, slug, sku_code, cpu_spec, gpu_spec, ram_capacity_gb, storage_spec, price_retail, stock_quantity, image_url, is_active) VALUES
    (1,  2,  'Офисный ПК (Intel Core i7-3770/Intel HD Graphics/16 ГБ DDR3/256 ГБ SSD)', 'office-pc-i7-3770', 'PC-OFF-001',
        'Intel Core i7-3770, 4 ядра', 'Intel HD Graphics 4000', 16, 'SSD 256 ГБ', 14000.00, 12, '/images/products/office-pc-i7-3770.png', TRUE),
    (2,  2,  'Офисный ПК (AMD Ryzen 5 5600G/Radeon Graphics/16 ГБ DDR4/256 ГБ SSD)', 'office-pc-r5-5600g', 'PC-OFF-002',
        'AMD Ryzen 5 5600G, 6 ядер', 'Radeon Graphics', 16, 'SSD 256 ГБ', 22000.00, 8, '/images/products/office-pc-r5-5600g.png', TRUE),
    (3,  3,  'Средне-бюджетный ПК (Intel Core i5-12400F/GeForce RTX 3060 12 ГБ/16 ГБ DDR4/1 ТБ SSD/Win 11)', 'home-pc-i5-12400f-rtx3060', 'PC-HOM-001',
        'Intel Core i5-12400F, 6 ядер', 'GeForce RTX 3060, 12 ГБ', 16, 'SSD 1 ТБ', 55000.00, 6, '/images/products/home-pc-i5-12400f-rtx3060.png', TRUE),
    (4,  3,  'Средне-бюджетный ПК (AMD Ryzen 5 7500F/GeForce RTX 5060 Ti 16 ГБ/16 ГБ DDR5/1 ТБ SSD/Win 11)', 'home-pc-r5-7500f-rtx5060ti', 'PC-HOM-002',
        'AMD Ryzen 5 7500F, 6 ядер', 'GeForce RTX 5060 Ti, 16 ГБ', 16, 'SSD 1 ТБ', 75000.00, 5, '/images/products/home-pc-r5-7500f-rtx5060ti.png', TRUE),
    (5,  4,  'Игровой ПК (AMD Ryzen 7 9800X3D/64 ГБ DDR5/GeForce RTX 5080 32 ГБ/2 ТБ SSD/Win 11)', 'gaming-pc-r7-9800x3d-rtx5080', 'PC-GAM-001',
        'AMD Ryzen 7 9800X3D, 8 ядер', 'GeForce RTX 5080, 32 ГБ', 64, 'SSD 2 ТБ', 210000.00, 3, '/images/products/gaming-pc-r7-9800x3d-rtx5080.png', TRUE),
    (6,  4,  'Игровой ПК (Intel Core Ultra 7 265KF/64 ГБ DDR5/GeForce RTX 5090 32 ГБ/2 ТБ SSD/Win 11)', 'gaming-pc-ultra7-265kf-rtx5090', 'PC-GAM-002',
        'Intel Core Ultra 7 265KF, 20 ядер', 'GeForce RTX 5090, 32 ГБ', 64, 'SSD 2 ТБ', 350000.00, 2, '/images/products/gaming-pc-ultra7-265kf-rtx5090.png', TRUE),
    (7,  6,  'Процессор Intel Core i5-14400F, 10 ядер, 4.7 ГГц, LGA1700', 'cpu-intel-i5-14400f', 'CMP-CPU-001',
        'Intel Core i5-14400F, 10 ядер', NULL, NULL, NULL, 18990.00, 25, '/images/tiles/cpu.png', TRUE),
    (8,  6,  'Процессор AMD Ryzen 7 7800X3D, 8 ядер, 5.0 ГГц, AM5', 'cpu-amd-r7-7800x3d', 'CMP-CPU-002',
        'AMD Ryzen 7 7800X3D, 8 ядер', NULL, NULL, NULL, 44990.00, 14, '/images/tiles/cpu.png', TRUE),
    (9,  7,  'Видеокарта Palit GeForce RTX 5070 Ti GamingPro, 16 ГБ GDDR7', 'gpu-rtx5070ti-16g', 'CMP-GPU-001',
        NULL, 'GeForce RTX 5070 Ti, 16 ГБ', NULL, NULL, 89990.00, 9, '/images/tiles/gpu.png', TRUE),
    (10, 7,  'Видеокарта Sapphire Radeon RX 9070 XT Pulse, 16 ГБ GDDR6', 'gpu-rx9070xt-16g', 'CMP-GPU-002',
        NULL, 'Radeon RX 9070 XT, 16 ГБ', NULL, NULL, 79990.00, 7, '/images/tiles/gpu.png', TRUE),
    (11, 8,  'Материнская плата MSI B650M Gaming Plus WiFi, Socket AM5', 'mb-msi-b650m-gaming-plus', 'CMP-MB-001',
        NULL, NULL, NULL, NULL, 15990.00, 18, '/images/tiles/motherboards.png', TRUE),
    (12, 9,  'Оперативная память Kingston Fury Beast DDR5 32 ГБ (2x16) 6000 МГц', 'ram-kingston-fury-ddr5-32g', 'CMP-RAM-001',
        NULL, NULL, 32, NULL, 11490.00, 30, '/images/tiles/ram.png', TRUE),
    (13, 10, 'SSD накопитель Samsung 990 PRO 1 ТБ NVMe PCIe 4.0', 'ssd-samsung-990-pro-1tb', 'CMP-SSD-001',
        NULL, NULL, NULL, 'SSD 1 ТБ NVMe', 13990.00, 22, '/images/tiles/storage.png', TRUE),
    (14, 11, 'Блок питания be quiet! Pure Power 12 M, 850 Вт, 80 PLUS Gold', 'psu-bequiet-pure-power-12m-850w', 'CMP-PSU-001',
        NULL, NULL, NULL, NULL, 13490.00, 16, '/images/tiles/psu.png', TRUE),
    (15, 12, 'Корпус Lian Li Lancool 216, Midi-Tower, без БП', 'case-lianli-lancool-216', 'CMP-CSE-001',
        NULL, NULL, NULL, NULL, 9990.00, 11, '/images/tiles/cases.png', TRUE),
    (16, 13, 'Кулер для процессора ID-COOLING SE-224-XT, 4 тепловые трубки', 'cooler-idcooling-se-224-xt', 'CMP-CLR-001',
        NULL, NULL, NULL, NULL, 2490.00, 40, '/images/tiles/cpu-coolers.png', TRUE),
    (17, 14, 'СЖО Arctic Liquid Freezer III 360, 360 мм', 'aio-arctic-liquid-freezer-iii-360', 'CMP-AIO-001',
        NULL, NULL, NULL, NULL, 12490.00, 13, '/images/tiles/liquid-cooling.png', TRUE),
    (18, 16, 'Клавиатура ARDOR GAMING Blade Pro, механическая, RGB', 'kb-ardor-gaming-blade-pro', 'PER-KBD-001',
        NULL, NULL, NULL, NULL, 4990.00, 27, '/images/tiles/keyboards.png', TRUE),
    (19, 17, 'Мышь Logitech G502 X Lightspeed, беспроводная', 'mouse-logitech-g502x', 'PER-MOU-001',
        NULL, NULL, NULL, NULL, 7990.00, 19, '/images/tiles/mice.png', TRUE),
    (20, 18, 'Монитор MSI G272QPF 27", 2560x1440, 170 Гц, IPS', 'monitor-msi-g272qpf', 'PER-MON-001',
        NULL, NULL, NULL, NULL, 27990.00, 8, '/images/tiles/monitors.png', TRUE),
    (21, 19, 'Наушники HyperX Cloud III, игровая гарнитура', 'headset-hyperx-cloud-iii', 'PER-HED-001',
        NULL, NULL, NULL, NULL, 10990.00, 15, '/images/tiles/headphones.png', TRUE);

-- -----------------------------------------------------------------------------
-- 5. Заказы и их позиции
-- -----------------------------------------------------------------------------
INSERT INTO orders (order_id, customer_id, order_status, total_amount, tradein_discount, final_payable, delivery_type, payment_method, is_paid, shipping_notes, created_at) VALUES
    (1, 3, 'delivered', 14000.00,    0.00, 14000.00, 'pickup',  'card', TRUE,  'Самовывоз со склада, ул. Галущака, 52', CURRENT_TIMESTAMP - INTERVAL '21 days'),
    (2, 3, 'created',   55000.00, 5000.00, 50000.00, 'courier', 'cash', FALSE, 'Доставка курьером, 10:00-21:00',        CURRENT_TIMESTAMP - INTERVAL '2 days'),
    (3, 4, 'paid',      89990.00,    0.00, 89990.00, 'courier', 'card', TRUE,  NULL,                                     CURRENT_TIMESTAMP - INTERVAL '5 days');

INSERT INTO order_items (item_id, order_id, product_id, fixed_unit_price, quantity, subtotal_amount) VALUES
    (1, 1, 1,  14000.00, 1,  14000.00),
    (2, 2, 3,  55000.00, 1,  55000.00),
    (3, 3, 9,  89990.00, 1,  89990.00);

-- -----------------------------------------------------------------------------
-- 6. Обращения по программе Trade-In
-- -----------------------------------------------------------------------------
INSERT INTO trade_in_requests (tradein_id, user_id, contact_name, contact_phone, device_category, item_description, known_defects, photo_urls, preliminary_price, approved_price, request_status, manager_notes, created_at) VALUES
    (1, 3,    'Данил Маренич', '+7 999 123-45-67', 'Видеокарта', 'GeForce GTX 1660 Super 6 ГБ, использовалась 2 года',
        'Помято крепление бэкплейта', '/uploads/tradein/1-1.jpg,/uploads/tradein/1-2.jpg', 9000.00, 8500.00, 'approved',
        'Скидка подтверждена после осмотра в сервисном центре', CURRENT_TIMESTAMP - INTERVAL '10 days'),
    (2, 4,    'Егор Соколов',  '+7 913 555-77-21', 'Процессор', 'AMD Ryzen 5 3600, боксовый кулер в комплекте',
        NULL, '/uploads/tradein/2-1.jpg', 4500.00, NULL, 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '1 day'),
    (3, NULL, 'Ирина Волкова', '+7 923 401-88-90', 'Готовый ПК', 'Системный блок 2018 года, Core i5-8400, GTX 1060 6 ГБ, 16 ГБ ОЗУ',
        'Не запускается, требуется диагностика', NULL, NULL, NULL, 'pending', NULL, CURRENT_TIMESTAMP - INTERVAL '6 hours');

-- -----------------------------------------------------------------------------
-- 7. Отзывы покупателей
-- -----------------------------------------------------------------------------
INSERT INTO reviews (review_id, author_id, product_id, rating_score, comment_text, moderation_status, created_at) VALUES
    (1, 3, 1, 5, 'Забрал самовывозом, собрано аккуратно. Для 1С и Word хватает с запасом, работает тихо.', 'published', CURRENT_TIMESTAMP - INTERVAL '18 days'),
    (2, 3, 1, 4, 'За свои деньги отличный вариант. Хотелось бы SSD побольше, но за 14 000 рублей претензий нет.', 'published', CURRENT_TIMESTAMP - INTERVAL '15 days'),
    (3, 4, 9, 5, 'В Cyberpunk 2077 в 1440p выдаёт стабильные 90+ кадров с трассировкой. Очень доволен.', 'published', CURRENT_TIMESTAMP - INTERVAL '3 days'),
    (4, 3, 3, 5, 'Отличная сборка для дома, ребёнок играет, я работаю. Привезли на следующий день.', 'on_moderation', CURRENT_TIMESTAMP - INTERVAL '1 day');

-- -----------------------------------------------------------------------------
-- 8. Синхронизация последовательностей с фактическими данными
-- -----------------------------------------------------------------------------
SELECT setval('roles_role_id_seq',              (SELECT MAX(role_id) FROM roles));
SELECT setval('users_user_id_seq',              (SELECT MAX(user_id) FROM users));
SELECT setval('categories_category_id_seq',     (SELECT MAX(category_id) FROM categories));
SELECT setval('products_product_id_seq',        (SELECT MAX(product_id) FROM products));
SELECT setval('orders_order_id_seq',            (SELECT MAX(order_id) FROM orders));
SELECT setval('order_items_item_id_seq',        (SELECT MAX(item_id) FROM order_items));
SELECT setval('trade_in_requests_tradein_id_seq',(SELECT MAX(tradein_id) FROM trade_in_requests));
SELECT setval('reviews_review_id_seq',          (SELECT MAX(review_id) FROM reviews));

-- =============================================================================
--  Конец скрипта наполнения
-- =============================================================================
