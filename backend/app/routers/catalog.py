"""Маршруты каталога: дерево категорий, поиск и карточка товара."""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..models import Category, Product, Review
from ..schemas import (
    CategoryOut,
    CategorySectionOut,
    CategoryTreeOut,
    ProductDetailOut,
    ProductPage,
)

router = APIRouter(prefix="/api", tags=["Каталог"])


def _descendant_ids(db: Session, category_id: int) -> list[int]:
    """Собирает идентификаторы категории и всех её потомков (обход в ширину)."""
    ids = [category_id]
    frontier = [category_id]
    while frontier:
        rows = db.execute(
            select(Category.category_id).where(Category.parent_id.in_(frontier))
        ).scalars().all()
        rows = [row for row in rows if row not in ids]
        ids.extend(rows)
        frontier = rows
    return ids


@router.get("/categories", response_model=list[CategoryTreeOut], summary="Дерево категорий")
def get_categories(db: Session = Depends(get_db)) -> list[CategoryTreeOut]:
    """Возвращает двухуровневое дерево категорий каталога."""
    roots = db.execute(
        select(Category)
        .where(Category.parent_id.is_(None))
        .order_by(Category.sort_order)
        .options(selectinload(Category.children))
    ).scalars().all()

    return [
        CategoryTreeOut(
            **CategoryOut.model_validate(root).model_dump(),
            children=[CategoryOut.model_validate(child) for child in root.children],
        )
        for root in roots
    ]


@router.get(
    "/categories/{slug}",
    response_model=CategoryOut,
    summary="Категория по ЧПУ-идентификатору",
)
def get_category(slug: str, db: Session = Depends(get_db)) -> Category:
    category = db.execute(
        select(Category).where(Category.slug == slug)
    ).scalar_one_or_none()
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена"
        )
    return category


@router.get(
    "/categories/{slug}/sections",
    response_model=list[CategorySectionOut],
    summary="Подразделы категории со сводкой по товарам",
)
def get_category_sections(
    slug: str, db: Session = Depends(get_db)
) -> list[CategorySectionOut]:
    """Возвращает дочерние категории со счётчиком товаров и минимальной ценой.

    Используется страницей «Готовые компьютеры», где выводятся плитки
    «Офисные ПК», «ПК для дома и учёбы», «Мощные игровые ПК».
    """
    category = db.execute(
        select(Category).where(Category.slug == slug)
    ).scalar_one_or_none()
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена"
        )

    sections: list[CategorySectionOut] = []
    for child in category.children:
        stats = db.execute(
            select(
                func.count(Product.product_id),
                func.min(Product.price_retail),
                func.min(Product.image_url),
            ).where(Product.category_id == child.category_id, Product.is_active.is_(True))
        ).one()
        sections.append(
            CategorySectionOut(
                category=CategoryOut.model_validate(child),
                products_count=stats[0] or 0,
                min_price=stats[1],
                preview_image=stats[2],
            )
        )
    return sections


@router.get("/products", response_model=ProductPage, summary="Поиск и фильтрация товаров")
def get_products(
    db: Session = Depends(get_db),
    category: str | None = Query(None, description="ЧПУ-идентификатор категории"),
    q: str | None = Query(None, min_length=2, description="Поисковая строка"),
    sort: str = Query("default", pattern="^(default|price_asc|price_desc|title)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=48),
) -> ProductPage:
    """Возвращает страницу товаров с учётом категории, поиска и сортировки."""
    stmt = select(Product).where(Product.is_active.is_(True))

    if category:
        target = db.execute(
            select(Category).where(Category.slug == category)
        ).scalar_one_or_none()
        if target is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Категория не найдена"
            )
        stmt = stmt.where(Product.category_id.in_(_descendant_ids(db, target.category_id)))

    if q:
        pattern = f"%{q.lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Product.title).like(pattern),
                func.lower(func.coalesce(Product.cpu_spec, "")).like(pattern),
                func.lower(func.coalesce(Product.gpu_spec, "")).like(pattern),
                func.lower(Product.sku_code).like(pattern),
            )
        )

    total = db.execute(
        select(func.count()).select_from(stmt.subquery())
    ).scalar_one()

    order_by = {
        "default": (Product.product_id.asc(),),
        "price_asc": (Product.price_retail.asc(),),
        "price_desc": (Product.price_retail.desc(),),
        "title": (Product.title.asc(),),
    }[sort]

    items = db.execute(
        stmt.order_by(*order_by).offset((page - 1) * page_size).limit(page_size)
    ).scalars().all()

    return ProductPage(total=total, page=page, page_size=page_size, items=items)


@router.get(
    "/products/{slug}",
    response_model=ProductDetailOut,
    summary="Карточка товара с рейтингом",
)
def get_product(slug: str, db: Session = Depends(get_db)) -> ProductDetailOut:
    """Возвращает подробные характеристики товара и агрегированный рейтинг."""
    product = db.execute(
        select(Product)
        .where(Product.slug == slug)
        .options(selectinload(Product.category))
    ).scalar_one_or_none()
    if product is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Товар не найден"
        )

    rating, reviews_count = db.execute(
        select(func.avg(Review.rating_score), func.count(Review.review_id)).where(
            Review.product_id == product.product_id,
            Review.moderation_status == "published",
        )
    ).one()

    detail = ProductDetailOut.model_validate(product)
    detail.rating_average = round(float(rating), 1) if rating is not None else None
    detail.reviews_count = reviews_count or 0
    return detail


@router.get("/catalog/summary", summary="Сводка по каталогу для главной страницы")
def catalog_summary(db: Session = Depends(get_db)) -> dict:
    """Отдаёт агрегаты для плиток главной страницы."""
    total_products, min_price = db.execute(
        select(func.count(Product.product_id), func.min(Product.price_retail)).where(
            Product.is_active.is_(True)
        )
    ).one()
    return {
        "products_total": total_products or 0,
        "min_price": min_price or Decimal("0.00"),
        "categories_total": db.execute(
            select(func.count(Category.category_id)).where(Category.parent_id.is_not(None))
        ).scalar_one(),
    }
