"""Pydantic-схемы (DTO) для валидации входных и выходных данных API."""

from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

# Простая проверка формата адреса электронной почты без внешних зависимостей
EMAIL_PATTERN = r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"

EmailField = Annotated[str, Field(max_length=128, pattern=EMAIL_PATTERN)]

# -----------------------------------------------------------------------------
#  Роли и пользователи
# -----------------------------------------------------------------------------


class RoleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role_id: int
    name: str


class UserRegister(BaseModel):
    """Данные формы регистрации нового покупателя."""

    login: Annotated[str, Field(min_length=3, max_length=64)]
    email: EmailField
    password: Annotated[str, Field(min_length=6, max_length=128)]
    first_name: Annotated[str, Field(min_length=2, max_length=128)]
    phone_number: Annotated[str, Field(min_length=7, max_length=20)]
    delivery_address: str | None = None


class UserLogin(BaseModel):
    login: str
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    login: str
    email: str
    first_name: str
    phone_number: str
    delivery_address: str | None
    created_at: datetime
    is_blocked: bool
    role: RoleOut


class UserUpdate(BaseModel):
    first_name: str | None = None
    phone_number: str | None = None
    delivery_address: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: Annotated[str, Field(min_length=6, max_length=128)]


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut


# -----------------------------------------------------------------------------
#  Каталог
# -----------------------------------------------------------------------------


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_id: int
    name: str
    slug: str
    description: str | None
    sort_order: int


class CategoryTreeOut(CategoryOut):
    children: list["CategoryOut"] = []


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    category_id: int
    title: str
    slug: str
    sku_code: str
    cpu_spec: str | None
    gpu_spec: str | None
    ram_capacity_gb: int | None
    storage_spec: str | None
    price_retail: Decimal
    stock_quantity: int
    image_url: str | None
    is_active: bool


class ProductDetailOut(ProductOut):
    category: CategoryOut
    rating_average: float | None = None
    reviews_count: int = 0


class ProductPage(BaseModel):
    """Страница результатов поиска по каталогу."""

    total: int
    page: int
    page_size: int
    items: list[ProductOut]


class CategorySectionOut(BaseModel):
    """Раздел каталога со списком товаров и минимальной ценой."""

    category: CategoryOut
    products_count: int
    min_price: Decimal | None
    preview_image: str | None


# -----------------------------------------------------------------------------
#  Заказы
# -----------------------------------------------------------------------------


class OrderItemIn(BaseModel):
    product_id: int
    quantity: Annotated[int, Field(gt=0, le=99)] = 1


class OrderCreate(BaseModel):
    """Оформление заказа из корзины."""

    items: Annotated[list[OrderItemIn], Field(min_length=1)]
    delivery_type: Literal["pickup", "courier", "transport"]
    payment_method: Literal["card", "sbp", "cash"]
    shipping_notes: str | None = None
    tradein_discount: Annotated[Decimal, Field(ge=0)] = Decimal("0.00")


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    item_id: int
    product_id: int
    fixed_unit_price: Decimal
    quantity: int
    subtotal_amount: Decimal
    product: ProductOut


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: int
    order_status: str
    total_amount: Decimal
    tradein_discount: Decimal
    final_payable: Decimal
    delivery_type: str
    payment_method: str
    is_paid: bool
    shipping_notes: str | None
    created_at: datetime
    items: list[OrderItemOut]


class OrderStatusUpdate(BaseModel):
    order_status: Literal["created", "paid", "assembled", "delivered", "cancelled"]


# -----------------------------------------------------------------------------
#  Trade-In
# -----------------------------------------------------------------------------


class TradeInCreate(BaseModel):
    """Заявка на обмен техники со скидкой."""

    contact_name: Annotated[str, Field(min_length=2, max_length=128)]
    contact_phone: Annotated[str, Field(min_length=7, max_length=20)]
    device_category: Annotated[str, Field(min_length=2, max_length=64)]
    item_description: Annotated[str, Field(min_length=10)]
    known_defects: str | None = None
    photo_urls: str | None = None


class TradeInOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    tradein_id: int
    contact_name: str
    contact_phone: str
    device_category: str
    item_description: str
    known_defects: str | None
    photo_urls: str | None
    preliminary_price: Decimal | None
    approved_price: Decimal | None
    request_status: str
    manager_notes: str | None
    created_at: datetime


class TradeInPriceUpdate(BaseModel):
    preliminary_price: Decimal | None = None
    approved_price: Decimal | None = None
    request_status: Literal["pending", "approved", "rejected", "completed"] | None = None
    manager_notes: str | None = None


# -----------------------------------------------------------------------------
#  Отзывы
# -----------------------------------------------------------------------------


class ReviewCreate(BaseModel):
    product_id: int
    rating_score: Annotated[int, Field(ge=1, le=5)]
    comment_text: Annotated[str, Field(min_length=5, max_length=2000)]

    @field_validator("comment_text")
    @classmethod
    def strip_comment(cls, value: str) -> str:
        return value.strip()


class ReviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    review_id: int
    product_id: int
    rating_score: int
    comment_text: str
    moderation_status: str
    created_at: datetime
    author_name: str
    product: "ProductOut | None" = None


class ReviewModeration(BaseModel):
    moderation_status: Literal["on_moderation", "published", "rejected"]


# -----------------------------------------------------------------------------
#  Служебные ответы
# -----------------------------------------------------------------------------


class MessageOut(BaseModel):
    detail: str


class HealthOut(BaseModel):
    status: str
    service: str
    version: str
    database: str


CategoryTreeOut.model_rebuild()
ReviewOut.model_rebuild()
