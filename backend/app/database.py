"""Подключение к СУБД PostgreSQL и управление сессиями SQLAlchemy."""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from .config import settings

# Пул соединений с PostgreSQL. pool_pre_ping отсекает «протухшие» соединения.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    echo=False,
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Базовый класс декларативных моделей SQLAlchemy 2.x."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI-зависимость: открывает сессию БД и гарантированно закрывает её."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
