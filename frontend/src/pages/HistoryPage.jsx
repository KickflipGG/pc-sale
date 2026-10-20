import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  DELIVERY_LABELS,
  ORDER_STATUS_LABELS,
  api,
  formatPrice,
} from "../api/client.js";
import Icon from "../components/Icon.jsx";

/** История покупок — макет «История покупок». */
export default function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .myOrders()
      .then((data) => !cancelled && setOrders(data))
      .catch((exception) => !cancelled && setError(exception.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/account">Личный кабинет</Link>
        <span>›</span>
        <span>История покупок</span>
      </nav>

      <div className="account-hero">
        <span className="account-icon">
          <Icon name="clock" />
        </span>
        <h1>История покупок</h1>
        <meta name="robots" content="noindex" />
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <div className="empty-state">Загрузка заказов…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <h3>Покупок пока нет</h3>
          <p>Оформленные заказы появятся здесь вместе со статусом доставки.</p>
          <Link to="/" className="btn btn--primary" style={{ marginTop: 16 }}>
            В каталог
          </Link>
        </div>
      ) : (
        <table className="table-simple">
          <thead>
            <tr>
              <th style={{ width: 46 }}>№</th>
              <th style={{ width: 96 }}>Фото</th>
              <th>Описание</th>
              <th style={{ width: 190 }}>Цена и количество</th>
              <th style={{ width: 190 }}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) =>
              order.items.map((item, index) => (
                <tr key={`${order.order_id}-${item.item_id}`}>
                  <td>{index === 0 ? order.order_id : ""}</td>
                  <td>
                    <div className="cart-product__media">
                      <img
                        src={item.product.image_url ?? "/images/products/pc.svg"}
                        alt={item.product.title}
                      />
                    </div>
                  </td>
                  <td>
                    <div className="cart-product__title">{item.product.title}</div>
                    <div className="small muted">
                      Заказ от {new Date(order.created_at).toLocaleDateString("ru-RU")} ·{" "}
                      {DELIVERY_LABELS[order.delivery_type] ?? order.delivery_type}
                    </div>
                  </td>
                  <td>
                    <div className="small muted">Цена:</div>
                    <b>{formatPrice(item.fixed_unit_price)}</b>
                    <div className="small muted">Количество: {item.quantity}</div>
                  </td>
                  <td>
                    <span
                      className={
                        order.order_status === "delivered"
                          ? "status-pill status-pill--done"
                          : "status-pill"
                      }
                    >
                      {ORDER_STATUS_LABELS[order.order_status] ?? order.order_status}
                    </span>
                    {order.order_status === "delivered" && (
                      <div style={{ marginTop: 8 }}>
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="small"
                          style={{ color: "var(--accent)", fontWeight: 700 }}
                        >
                          Оставить отзыв
                        </Link>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </>
  );
}
