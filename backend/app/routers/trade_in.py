"""Маршруты программы Trade-In: приём заявок и работа менеджера."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..deps import get_current_user, get_optional_user, require_manager
from ..models import TradeInRequest, User
from ..schemas import TradeInCreate, TradeInOut, TradeInPriceUpdate

router = APIRouter(prefix="/api/trade-in", tags=["Trade-In"])

DEVICE_CATEGORIES = [
    "Готовый ПК",
    "Процессор",
    "Видеокарта",
    "Материнская плата",
    "Оперативная память",
    "Накопитель",
    "Блок питания",
    "Корпус",
    "Периферия",
]


@router.get("/categories", summary="Список категорий техники для обмена")
def list_device_categories() -> dict:
    return {"items": DEVICE_CATEGORIES}


@router.post(
    "",
    response_model=TradeInOut,
    status_code=status.HTTP_201_CREATED,
    summary="Отправить заявку на обмен техники",
)
def create_request(
    payload: TradeInCreate,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_user),
) -> TradeInRequest:
    """Принимает заявку с формы Trade-In; авторизация не обязательна."""
    request = TradeInRequest(
        user_id=current_user.user_id if current_user else None,
        contact_name=payload.contact_name,
        contact_phone=payload.contact_phone,
        device_category=payload.device_category,
        item_description=payload.item_description,
        known_defects=payload.known_defects,
        photo_urls=payload.photo_urls,
        request_status="pending",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return request


@router.get("/my", response_model=list[TradeInOut], summary="Мои заявки Trade-In")
def list_my_requests(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[TradeInRequest]:
    return list(
        db.execute(
            select(TradeInRequest)
            .where(TradeInRequest.user_id == current_user.user_id)
            .order_by(TradeInRequest.created_at.desc())
        ).scalars()
    )


@router.get(
    "/all",
    response_model=list[TradeInOut],
    summary="Все заявки Trade-In (менеджер, администратор)",
)
def list_all_requests(
    db: Session = Depends(get_db), _: User = Depends(require_manager)
) -> list[TradeInRequest]:
    return list(
        db.execute(
            select(TradeInRequest).order_by(TradeInRequest.created_at.desc())
        ).scalars()
    )


@router.patch(
    "/{tradein_id}",
    response_model=TradeInOut,
    summary="Оценка заявки менеджером",
)
def update_request(
    tradein_id: int,
    payload: TradeInPriceUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
) -> TradeInRequest:
    """Менеджер выставляет предварительную и итоговую оценку техники."""
    request = db.get(TradeInRequest, tradein_id)
    if request is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заявка не найдена")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(request, field, value)
    db.commit()
    db.refresh(request)
    return request
