"""Маршруты отзывов и оценок товаров."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import get_current_user, require_manager
from ..models import Product, Review, User
from ..schemas import MessageOut, ProductOut, ReviewCreate, ReviewModeration, ReviewOut

router = APIRouter(prefix="/api/reviews", tags=["Отзывы"])


def _to_out(review: Review, with_product: bool = False) -> ReviewOut:
    """Преобразует ORM-объект в DTO, подставляя имя автора и товар."""
    return ReviewOut(
        review_id=review.review_id,
        product_id=review.product_id,
        rating_score=review.rating_score,
        comment_text=review.comment_text,
        moderation_status=review.moderation_status,
        created_at=review.created_at,
        author_name=review.author.first_name if review.author else "Пользователь",
        product=ProductOut.model_validate(review.product)
        if with_product and review.product
        else None,
    )


@router.get(
    "/product/{product_id}",
    response_model=list[ReviewOut],
    summary="Опубликованные отзывы о товаре",
)
def list_product_reviews(
    product_id: int,
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
) -> list[ReviewOut]:
    reviews = db.execute(
        select(Review)
        .where(
            Review.product_id == product_id,
            Review.moderation_status == "published",
        )
        .order_by(Review.created_at.desc())
        .limit(limit)
        .options(selectinload(Review.author))
    ).scalars().all()
    return [_to_out(review) for review in reviews]


@router.get("/my", response_model=list[ReviewOut], summary="Мои отзывы")
def list_my_reviews(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[ReviewOut]:
    reviews = db.execute(
        select(Review)
        .where(Review.author_id == current_user.user_id)
        .order_by(Review.created_at.desc())
        .options(selectinload(Review.author), selectinload(Review.product))
    ).scalars().all()
    return [_to_out(review, with_product=True) for review in reviews]


@router.post(
    "",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
    summary="Оставить отзыв",
)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReviewOut:
    """Создаёт отзыв; он публикуется только после проверки модератором."""
    product = db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден")

    review = Review(
        author_id=current_user.user_id,
        product_id=payload.product_id,
        rating_score=payload.rating_score,
        comment_text=payload.comment_text,
        moderation_status="on_moderation",
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return _to_out(review)


@router.get(
    "/moderation",
    response_model=list[ReviewOut],
    summary="Отзывы на модерации (менеджер, администратор)",
)
def list_for_moderation(
    db: Session = Depends(get_db), _: User = Depends(require_manager)
) -> list[ReviewOut]:
    reviews = db.execute(
        select(Review)
        .where(Review.moderation_status == "on_moderation")
        .order_by(Review.created_at.asc())
        .options(selectinload(Review.author))
    ).scalars().all()
    return [_to_out(review) for review in reviews]


@router.patch(
    "/{review_id}/moderate",
    response_model=ReviewOut,
    summary="Изменить статус модерации (менеджер, администратор)",
)
def moderate_review(
    review_id: int,
    payload: ReviewModeration,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
) -> ReviewOut:
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Отзыв не найден")
    review.moderation_status = payload.moderation_status
    db.commit()
    db.refresh(review)
    return _to_out(review)


@router.delete("/{review_id}", response_model=MessageOut, summary="Удалить свой отзыв")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    review = db.get(Review, review_id)
    if review is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Отзыв не найден")
    if review.author_id != current_user.user_id and current_user.role.name != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Нельзя удалить чужой отзыв"
        )
    db.delete(review)
    db.commit()
    return MessageOut(detail="Отзыв удалён")
