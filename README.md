# PC Sale

Интернет-магазин компьютерной техники. Индивидуальный проект по дисциплине
ОПВ.15 «Проектирование, разработка и оптимизация веб-приложений»,
специальность 09.02.07.

## Стек

- СУБД: PostgreSQL 18
- Серверная часть: Python 3.14, FastAPI, SQLAlchemy
- Клиентская часть: React 19, Vite

## Запуск

База данных:

    psql -U postgres -f backend/database/01_schema.sql
    psql -U postgres -d pc_sale -f backend/database/02_seed.sql

Серверная часть:

    cd backend
    python -m venv .venv
    .venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn app.main:app --reload

Клиентская часть:

    cd frontend
    npm install
    npm run dev

Документация API открывается по адресу http://127.0.0.1:8000/docs

## Настройки

Приложение читает настройки из файла `backend/.env`. В репозиторий он не
попадает, поэтому его нужно создать рядом с `requirements.txt`:

    DATABASE_URL=postgresql+psycopg://postgres:ПАРОЛЬ@localhost:5432/pc_sale
    SECRET_KEY=длинная-случайная-строка
    ACCESS_TOKEN_EXPIRE_MINUTES=720

Без этого файла применяются значения по умолчанию, и подключиться к базе
не получится.

## Docker

    docker compose up -d --build

Приложение поднимется на http://127.0.0.1:8000 вместе с базой данных;
схема и демонстрационные данные загрузятся автоматически при первом запуске.

## Тестовые аккаунты

| Логин | Пароль | Роль |
|-------|--------|------|
| danil | client123 | покупатель |
| manager | manager123 | менеджер |
| admin | admin123 | администратор |

## Структура

- `backend/` — API на FastAPI, модели и скрипты базы данных
- `frontend/` — интерфейс магазина на React
- `docs/` — ER-диаграмма, скриншоты и отчёты по заданиям
- `screens_from_figma/` — макеты интерфейса
- `images_from_figma/` — изображения товаров из макета

Автор: Маренич Д. Д., группа ПР-24.103
