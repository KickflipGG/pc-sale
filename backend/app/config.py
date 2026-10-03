"""Конфигурация приложения PC Sale.

Значения читаются из переменных окружения и файла ``.env`` (через
``pydantic-settings``), что позволяет не хранить учётные данные СУБД в коде.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Настройки серверной части интернет-магазина."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_title: str = "PC Sale API"
    app_description: str = "REST API интернет-магазина компьютерной техники PC Sale"
    app_version: str = "1.0.0"

    # Подключение к СУБД PostgreSQL.
    # Значение по умолчанию — заготовка: реальные учётные данные указываются
    # в файле .env, который не попадает в систему контроля версий.
    database_url: str = "postgresql+psycopg://postgres:change-me@localhost:5432/pc_sale"

    # Аутентификация
    secret_key: str = "pc-sale-development-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 720

    # CORS
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    @property
    def cors_origin_list(self) -> list[str]:
        """Разбирает строку CORS_ORIGINS в список источников."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Возвращает единственный экземпляр настроек (кэшируется)."""
    return Settings()


settings = get_settings()
