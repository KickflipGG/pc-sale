"""Точка входа ASGI-приложения PC Sale API.

Запуск для разработки::

    uvicorn app.main:app --reload --port 8000

Интерактивная документация OpenAPI: http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .database import engine
from .routers import auth, catalog, orders, reviews, trade_in
from .schemas import HealthOut

# Каталог собранного SPA-интерфейса (создаётся командой npm run build)
FRONTEND_DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


class SpaStaticFiles(StaticFiles):
    """Отдаёт собранный интерфейс и поддерживает клиентскую маршрутизацию.

    Если запрошенный файл не найден, возвращается index.html — иначе
    переход по прямым ссылкам вида /catalog/office завершался бы ошибкой 404.
    """

    async def get_response(self, path: str, scope):
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as exc:
            if exc.status_code == 404:
                return await super().get_response("index.html", scope)
            raise

DESCRIPTION = """
Серверная часть интернет-магазина компьютерной техники **PC Sale**.

Возможности API:

* **Каталог** — дерево категорий, поиск, фильтрация и сортировка товаров;
* **Аутентификация** — регистрация, вход и профиль на JWT-токенах;
* **Заказы** — оформление из корзины, оплата, история покупок;
* **Trade-In** — приём заявок на обмен техники со скидкой;
* **Отзывы** — оценки товаров с модерацией менеджером.

СУБД — PostgreSQL 18, доступ к данным — через SQLAlchemy ORM.
"""


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Проверяет соединение с PostgreSQL при старте приложения."""
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    yield
    engine.dispose()


app = FastAPI(
    title=settings.app_title,
    description=DESCRIPTION,
    version=settings.app_version,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(catalog.router)
app.include_router(orders.router)
app.include_router(reviews.router)
app.include_router(trade_in.router)


@app.get(
    "/api/health",
    response_model=HealthOut,
    tags=["Служебные"],
    summary="Проверка доступности",
)
def health_check() -> HealthOut:
    """Проверяет, что сервис запущен и база данных отвечает."""
    with engine.connect() as connection:
        version = connection.execute(text("SHOW server_version")).scalar_one()
    return HealthOut(
        status="ok",
        service=settings.app_title,
        version=settings.app_version,
        database=f"PostgreSQL {version}",
    )


# Собранный интерфейс подключается последним, чтобы не перекрывать маршруты /api
if FRONTEND_DIST.is_dir():
    app.mount("/", SpaStaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
