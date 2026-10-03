"""Хеширование паролей и выпуск/проверка JWT-токенов доступа.

Пароли хранятся в виде строки ``pbkdf2_sha256$<итерации>$<соль>$<хеш>``:
медленный алгоритм PBKDF2-HMAC-SHA256 с индивидуальной солью для каждой
учётной записи не позволяет восстановить пароль по содержимому таблицы users.
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt

from .config import settings

PBKDF2_ALGORITHM = "pbkdf2_sha256"
PBKDF2_ITERATIONS = 120_000


def hash_password(password: str) -> str:
    """Возвращает строковое представление хеша пароля с солью."""
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), PBKDF2_ITERATIONS
    )
    return f"{PBKDF2_ALGORITHM}${PBKDF2_ITERATIONS}${salt}${digest.hex()}"


def verify_password(password: str, password_hash: str) -> bool:
    """Сравнивает пароль с сохранённым хешем за постоянное время."""
    try:
        algorithm, iterations, salt, digest = password_hash.split("$")
    except ValueError:
        return False
    if algorithm != PBKDF2_ALGORITHM:
        return False

    candidate = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt), int(iterations)
    )
    return hmac.compare_digest(candidate.hex(), digest)


def create_access_token(subject: str, role: str) -> str:
    """Выпускает подписанный JWT с идентификатором и ролью пользователя."""
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict:
    """Проверяет подпись и срок действия токена; возвращает полезную нагрузку."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
