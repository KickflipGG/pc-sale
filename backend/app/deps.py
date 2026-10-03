"""Общие зависимости FastAPI: текущий пользователь и проверка роли."""

from collections.abc import Callable

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)

CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Требуется авторизация",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Возвращает пользователя по JWT из заголовка Authorization."""
    if credentials is None:
        raise CREDENTIALS_ERROR
    try:
        payload = decode_access_token(credentials.credentials)
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError) as exc:
        raise CREDENTIALS_ERROR from exc

    user = db.get(User, user_id)
    if user is None:
        raise CREDENTIALS_ERROR
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Учётная запись заблокирована",
        )
    return user


def get_optional_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User | None:
    """Возвращает пользователя, если токен передан, иначе None."""
    if credentials is None:
        return None
    try:
        payload = decode_access_token(credentials.credentials)
        user = db.get(User, int(payload["sub"]))
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
    return user if user and not user.is_blocked else None


def require_role(*allowed_roles: str) -> Callable[[User], User]:
    """Фабрика зависимостей: пропускает только указанные роли."""

    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Недостаточно прав для выполнения операции",
            )
        return current_user

    return checker


# Готовые зависимости для маршрутов администратора и менеджера
require_manager = require_role("manager", "admin")
require_admin = require_role("admin")
