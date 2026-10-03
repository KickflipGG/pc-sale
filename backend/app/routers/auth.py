"""Маршруты аутентификации: регистрация, вход и профиль пользователя."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user
from ..models import Role, User
from ..schemas import (
    MessageOut,
    PasswordChange,
    TokenOut,
    UserLogin,
    UserOut,
    UserRegister,
    UserUpdate,
)
from ..security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["Аутентификация"])

CLIENT_ROLE_ID = 2


@router.post(
    "/register",
    response_model=TokenOut,
    status_code=status.HTTP_201_CREATED,
    summary="Регистрация покупателя",
)
def register(payload: UserRegister, db: Session = Depends(get_db)) -> TokenOut:
    """Создаёт учётную запись с ролью client и сразу выдаёт токен доступа."""
    exists = db.execute(
        select(User).where(
            or_(User.login == payload.login, User.email == payload.email)
        )
    ).scalar_one_or_none()
    if exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Пользователь с таким логином или e-mail уже существует",
        )

    client_role = db.get(Role, CLIENT_ROLE_ID)
    if client_role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Справочник ролей не инициализирован",
        )

    user = User(
        role_id=CLIENT_ROLE_ID,
        login=payload.login,
        email=payload.email,
        password_hash=hash_password(payload.password),
        first_name=payload.first_name,
        phone_number=payload.phone_number,
        delivery_address=payload.delivery_address,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenOut(
        access_token=create_access_token(str(user.user_id), user.role.name),
        user=UserOut.model_validate(user),
    )


@router.post("/login", response_model=TokenOut, summary="Вход в личный кабинет")
def login(payload: UserLogin, db: Session = Depends(get_db)) -> TokenOut:
    """Проверяет логин и пароль, возвращает JWT и профиль пользователя."""
    user = db.execute(
        select(User).where(
            or_(User.login == payload.login, User.email == payload.login)
        )
    ).scalar_one_or_none()

    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный логин или пароль",
        )
    if user.is_blocked:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Учётная запись заблокирована"
        )

    return TokenOut(
        access_token=create_access_token(str(user.user_id), user.role.name),
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut, summary="Профиль текущего пользователя")
def read_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.patch("/me", response_model=UserOut, summary="Изменение профиля")
def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    """Позволяет покупателю изменить контактные данные и адрес доставки."""
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password", response_model=MessageOut, summary="Смена пароля")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Текущий пароль указан неверно"
        )
    current_user.password_hash = hash_password(payload.new_password)
    db.commit()
    return MessageOut(detail="Пароль успешно изменён")


@router.delete("/me", response_model=MessageOut, summary="Удаление профиля")
def delete_me(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> MessageOut:
    """Удаление учётной записи; история заказов при этом сохраняется."""
    current_user.is_blocked = True
    current_user.login = f"deleted_{current_user.user_id}"
    current_user.email = f"deleted_{current_user.user_id}@pc-sale.local"
    db.commit()
    return MessageOut(detail="Профиль удалён")
