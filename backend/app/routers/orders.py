"""Маршруты оформления и сопровождения заказов."""

from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from ..database import get_db
from ..deps import get_current_user, require_manager
from ..models import Order, OrderItem, Product, User
from ..schemas import MessageOut, OrderCreate, OrderOut, OrderStatusUpdate

router = APIRouter(prefix="/api/orders", tags=["Заказы"])


@router.post(
    "",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
    summary="Оформление заказа",
)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:
    """Создаёт заказ, фиксирует цены позиций и уменьшает остатки на складе.

    Все действия выполняются в одной транзакции: при нехватке товара
    изменения откатываются, поэтому склад не может уйти в минус.
    """
    product_ids = [item.product_id for item in payload.items]
    products = {
        product.product_id: product
        for product in db.execute(
            select(Product).where(Product.product_id.in_(product_ids)).with_for_update()
        ).scalars()
    }

    total = Decimal("0.00")
    order_items: list[OrderItem] = []

    for item in payload.items:
        product = products.get(item.product_id)
        if product is None or not product.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Товар с идентификатором {item.product_id} недоступен",
            )
        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Недостаточно товара «{product.title}» на складе: "
                    f"доступно {product.stock_quantity} шт."
                ),
            )

        subtotal = product.price_retail * item.quantity
        total += subtotal
        product.stock_quantity -= item.quantity
        order_items.append(
            OrderItem(
                product_id=product.product_id,
                fixed_unit_price=product.price_retail,
                quantity=item.quantity,
                subtotal_amount=subtotal,
            )
        )

    discount = min(payload.tradein_discount, total)

    order = Order(
        customer_id=current_user.user_id,
        order_status="created",
        total_amount=total,
        tradein_discount=discount,
        final_payable=total - discount,
        delivery_type=payload.delivery_type,
        payment_method=payload.payment_method,
        is_paid=False,
        shipping_notes=payload.shipping_notes,
        items=order_items,
    )
    db.add(order)
    db.commit()

    return db.execute(
        select(Order)
        .where(Order.order_id == order.order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    ).scalar_one()


@router.get("", response_model=list[OrderOut], summary="История покупок пользователя")
def list_my_orders(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Order]:
    return list(
        db.execute(
            select(Order)
            .where(Order.customer_id == current_user.user_id)
            .order_by(Order.created_at.desc())
            .options(selectinload(Order.items).selectinload(OrderItem.product))
        ).scalars()
    )


@router.get("/{order_id}", response_model=OrderOut, summary="Заказ по идентификатору")
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:
    order = db.execute(
        select(Order)
        .where(Order.order_id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    ).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")

    is_staff = current_user.role.name in {"manager", "admin"}
    if order.customer_id != current_user.user_id and not is_staff:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Заказ принадлежит другому пользователю"
        )
    return order


@router.post("/{order_id}/pay", response_model=OrderOut, summary="Оплата заказа")
def pay_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Order:
    """Имитация подтверждения оплаты платёжным шлюзом."""
    order = db.execute(
        select(Order)
        .where(Order.order_id == order_id)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
    ).scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    if order.customer_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Заказ принадлежит другому пользователю"
        )
    if order.is_paid:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Заказ уже оплачен"
        )

    order.is_paid = True
    order.order_status = "paid"
    order.updated_at = func.now()
    db.commit()
    db.refresh(order)
    return order


@router.get(
    "/admin/all",
    response_model=list[OrderOut],
    summary="Все заказы (менеджер, администратор)",
)
def list_all_orders(
    db: Session = Depends(get_db), _: User = Depends(require_manager)
) -> list[Order]:
    return list(
        db.execute(
            select(Order)
            .order_by(Order.created_at.desc())
            .options(selectinload(Order.items).selectinload(OrderItem.product))
        ).scalars()
    )


@router.patch(
    "/{order_id}/status",
    response_model=OrderOut,
    summary="Изменение статуса заказа (менеджер, администратор)",
)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_manager),
) -> Order:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    order.order_status = payload.order_status
    order.updated_at = func.now()
    db.commit()
    db.refresh(order)
    return order


@router.delete(
    "/{order_id}",
    response_model=MessageOut,
    summary="Отмена заказа с возвратом товара на склад",
)
def cancel_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MessageOut:
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Заказ не найден")
    if order.customer_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Заказ принадлежит другому пользователю"
        )
    if order.order_status in {"delivered", "cancelled"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Заказ в этом статусе отменить нельзя",
        )

    for item in order.items:
        product = db.get(Product, item.product_id)
        if product is not None:
            product.stock_quantity += item.quantity
    order.order_status = "cancelled"
    order.updated_at = func.now()
    db.commit()
    return MessageOut(detail="Заказ отменён, товары возвращены на склад")
