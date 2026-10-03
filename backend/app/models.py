"""Декларативное описание таблиц БД (SQLAlchemy ORM).

Модели полностью соответствуют физической схеме, созданной скриптом
``database/01_schema.sql``: восемь взаимосвязанных сущностей предметной
области интернет-магазина «PC Sale».
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Role(Base):
    """Справочник ролей доступа (guest, client, manager, admin)."""

    __tablename__ = "roles"

    role_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(32), nullable=False, unique=True)

    users: Mapped[list["User"]] = relationship(back_populates="role")


class User(Base):
    """Учётная запись покупателя или сотрудника магазина."""

    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    role_id: Mapped[int] = mapped_column(
        ForeignKey("roles.role_id"), nullable=False, default=2
    )
    login: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str] = mapped_column(String(128), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(20), nullable=False)
    delivery_address: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    is_blocked: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    role: Mapped["Role"] = relationship(back_populates="users")
    orders: Mapped[list["Order"]] = relationship(back_populates="customer")
    reviews: Mapped[list["Review"]] = relationship(back_populates="author")
    trade_in_requests: Mapped[list["TradeInRequest"]] = relationship(back_populates="user")


class Category(Base):
    """Узел дерева категорий каталога (самоссылающаяся иерархия)."""

    __tablename__ = "categories"

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.category_id"), nullable=True
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    slug: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=100)

    parent: Mapped["Category | None"] = relationship(
        back_populates="children", remote_side="Category.category_id"
    )
    children: Mapped[list["Category"]] = relationship(
        back_populates="parent", order_by="Category.sort_order"
    )
    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    """Номенклатурная единица каталога: готовая сборка или комплектующее."""

    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price_retail >= 0", name="products_price_retail_check"),
        CheckConstraint("stock_quantity >= 0", name="products_stock_quantity_check"),
    )

    product_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.category_id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    sku_code: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)
    cpu_spec: Mapped[str | None] = mapped_column(String(128))
    gpu_spec: Mapped[str | None] = mapped_column(String(128))
    ram_capacity_gb: Mapped[int | None] = mapped_column(SmallInteger)
    storage_spec: Mapped[str | None] = mapped_column(String(255))
    price_retail: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    stock_quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    image_url: Mapped[str | None] = mapped_column(String(512))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    category: Mapped["Category"] = relationship(back_populates="products")
    order_items: Mapped[list["OrderItem"]] = relationship(back_populates="product")
    reviews: Mapped[list["Review"]] = relationship(back_populates="product")


class Order(Base):
    """Заказ покупателя."""

    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("total_amount >= 0", name="orders_total_amount_check"),
        CheckConstraint("tradein_discount >= 0", name="orders_tradein_discount_check"),
        CheckConstraint("final_payable >= 0", name="orders_final_payable_check"),
    )

    order_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    customer_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id"), nullable=False
    )
    order_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="created"
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    tradein_discount: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )
    final_payable: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    delivery_type: Mapped[str] = mapped_column(String(32), nullable=False)
    payment_method: Mapped[str] = mapped_column(String(32), nullable=False)
    is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    shipping_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    customer: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )


class OrderItem(Base):
    """Позиция заказа с зафиксированной на момент покупки ценой."""

    __tablename__ = "order_items"
    __table_args__ = (
        CheckConstraint("fixed_unit_price >= 0", name="order_items_fixed_unit_price_check"),
        CheckConstraint("quantity > 0", name="order_items_quantity_check"),
        CheckConstraint("subtotal_amount >= 0", name="order_items_subtotal_amount_check"),
    )

    item_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="RESTRICT"), nullable=False
    )
    fixed_unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    quantity: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=1)
    subtotal_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship(back_populates="order_items")


class TradeInRequest(Base):
    """Обращение покупателя по программе обмена техники Trade-In."""

    __tablename__ = "trade_in_requests"
    __table_args__ = (
        CheckConstraint(
            "preliminary_price >= 0", name="trade_in_requests_preliminary_price_check"
        ),
        CheckConstraint(
            "approved_price >= 0", name="trade_in_requests_approved_price_check"
        ),
    )

    tradein_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True
    )
    contact_name: Mapped[str] = mapped_column(String(128), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    device_category: Mapped[str] = mapped_column(String(64), nullable=False)
    item_description: Mapped[str] = mapped_column(Text, nullable=False)
    known_defects: Mapped[str | None] = mapped_column(Text)
    photo_urls: Mapped[str | None] = mapped_column(Text)
    preliminary_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    approved_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    request_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="pending"
    )
    manager_notes: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User | None"] = relationship(back_populates="trade_in_requests")


class Review(Base):
    """Отзыв покупателя о товаре с оценкой от 1 до 5."""

    __tablename__ = "reviews"
    __table_args__ = (
        CheckConstraint(
            "rating_score BETWEEN 1 AND 5", name="reviews_rating_score_check"
        ),
    )

    review_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False
    )
    rating_score: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment_text: Mapped[str] = mapped_column(Text, nullable=False)
    moderation_status: Mapped[str] = mapped_column(
        String(32), nullable=False, default="on_moderation"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    author: Mapped["User"] = relationship(back_populates="reviews")
    product: Mapped["Product"] = relationship(back_populates="reviews")
