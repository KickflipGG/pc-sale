import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
  DELIVERY_LABELS,
  ORDER_STATUS_LABELS,
  PAYMENT_LABELS,
  api,
  formatPrice,
} from "../api/client.js";
import Icon from "../components/Icon.jsx";

/** Шаг 3: подтверждение успешного оформления заказа — макет «Заказ успешно оформлен». */
export default function OrderSuccessPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .myOrders()
      .then((orders) => {
        if (cancelled) return;
        const found = orders.find((item) => String(item.order_id) === String(orderId));
        if (found) setOrder(found);
        else setError("Заказ не найден в истории покупок");
      })
      .catch((exception) => !cancelled && setError(exception.message));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="empty-state">
        <h3>{error}</h3>
        <Link to="/account/history" className="btn btn--primary" style={{ marginTop: 16 }}>
          История покупок
        </Link>
      </div>
    );
  }

  if (!order) return <div className="empty-state">Загрузка заказа…</div>;

  const number = `PC-${String(order.order_id).padStart(6, "0")}-${new Date(order.created_at)
    .getFullYear()
    .toString()
    .slice(-4)}`;

  return (
    <>
      <div className="steps" style={{ margin: "22px 0" }}>
        <span className="step step--done">
          <span className="step__dot">✓</span> Данные и доставка
        </span>
        <span className="step__line" />
        <span className="step step--done">
          <span className="step__dot">✓</span> Оплата
        </span>
        <span className="step__line" />
        <span className="step step--active">
          <span className="step__dot">3</span> Готово
        </span>
      </div>

      <div className="success-card">
        <div>
          <div className="success-check">✓</div>
          <h1 className="section-title">Заказ успешно оформлен!</h1>
          <p className="section-subtitle">
            Спасибо за покупку. Мы уже готовим ваш заказ к отправке и свяжемся
            в ближайшее время для подтверждения.
          </p>

          <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 18 }}>
            <span className="small muted">Номер заказа:</span>
            <span className="status-pill status-pill--done">{number}</span>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <Link to="/account/history" className="btn btn--primary btn--lg">
              Отследить заказ
            </Link>
            <Link to="/" className="btn btn--ghost btn--lg">
              Вернуться в каталог
            </Link>
          </div>

          <div className="alert alert--success" style={{ marginTop: 20 }}>
            Подтверждение отправлено на вашу электронную почту
          </div>
        </div>

        <aside>
          <h2 className="panel__title">Что дальше</h2>

          {order.items.map((item) => (
            <div key={item.item_id} className="order-preview-item">
              <img
                src={item.product.image_url ?? "/images/products/pc.svg"}
                alt={item.product.title}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 12.5 }}>
                  {item.product.title.slice(0, 44)}
                </div>
                <div className="small muted">
                  {item.quantity} × {formatPrice(item.fixed_unit_price)}
                </div>
              </div>
            </div>
          ))}

          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="box" />
            </span>
            <div>
              <div className="info-row__label">Статус заказа</div>
              <div className="info-row__value">
                {ORDER_STATUS_LABELS[order.order_status] ?? order.order_status}
              </div>
            </div>
          </div>
          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="truck" />
            </span>
            <div>
              <div className="info-row__label">Доставка</div>
              <div className="info-row__value">
                {DELIVERY_LABELS[order.delivery_type] ?? order.delivery_type}, 10:00–21:00
              </div>
            </div>
          </div>
          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="pin" />
            </span>
            <div>
              <div className="info-row__label">Адрес</div>
              <div className="info-row__value small">{order.shipping_notes || "уточняется"}</div>
            </div>
          </div>
          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="card" />
            </span>
            <div>
              <div className="info-row__label">Оплата</div>
              <div className="info-row__value small">
                {PAYMENT_LABELS[order.payment_method] ?? order.payment_method} ·{" "}
                {formatPrice(order.final_payable)}
              </div>
            </div>
          </div>
          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="tag" />
            </span>
            <div>
              <div className="info-row__label">Скидка Trade-In</div>
              <div className="info-row__value small">{formatPrice(order.tradein_discount)}</div>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
