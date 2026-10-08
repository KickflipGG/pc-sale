import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { api, formatPrice } from "../api/client.js";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useCart } from "../store/CartContext.jsx";

const PAYMENT_OPTIONS = [
  {
    value: "card",
    title: "Банковская карта",
    note: "Visa, Mastercard, МИР — доступно для всех банков",
    badge: "Доступно для всех банков",
  },
  { value: "sbp", title: "СБП", note: "Оплата по QR-коду в приложении банка", badge: "Без комиссии" },
  { value: "cash", title: "При получении", note: "Наличными или картой курьеру", badge: "При получении" },
];

/** Шаг 2 оформления заказа: выбор способа оплаты и подтверждение. */
export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { items, totals, clear } = useCart();
  const { isAuthenticated, user } = useAuth();

  const draft =
    location.state ?? JSON.parse(sessionStorage.getItem("pc-sale-checkout") ?? "null");

  const [method, setMethod] = useState("card");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [saveCard, setSaveCard] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!draft || items.length === 0) {
    return (
      <div className="empty-state">
        <h3>Нет данных для оплаты</h3>
        <p>Вернитесь в корзину и оформите заказ заново.</p>
        <Link to="/cart" className="btn btn--primary" style={{ marginTop: 16 }}>
          В корзину
        </Link>
      </div>
    );
  }

  async function pay(event) {
    event.preventDefault();
    if (!isAuthenticated) {
      setError("Для оформления заказа войдите в личный кабинет — состав корзины сохранён.");
      return;
    }
    setBusy(true);
    setError(null);

    try {
      const order = await api.createOrder({
        items: items.map((line) => ({
          product_id: line.product.product_id,
          quantity: line.quantity,
        })),
        delivery_type: draft.delivery,
        payment_method: method,
        shipping_notes: [
          draft.notes,
          draft.pickupPoint,
          draft.floor ? `этаж ${draft.floor}` : null,
          draft.intercom ? `домофон ${draft.intercom}` : null,
        ]
          .filter(Boolean)
          .join("; "),
        tradein_discount: 0,
      });

      if (method !== "cash") {
        await api.payOrder(order.order_id);
      }

      clear();
      sessionStorage.removeItem("pc-sale-checkout");
      navigate(`/order-success/${order.order_id}`, { replace: true });
    } catch (exception) {
      setError(exception.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/cart">Корзина</Link>
        <span>›</span>
        <Link to="/checkout">Оформление заказа</Link>
        <span>›</span>
        <span>Оплата</span>
      </nav>

      <div className="section-head">
        <div>
          <span className="small muted">ОФОРМЛЕНИЕ ЗАКАЗА</span>
          <h1 className="section-title">Выберите способ оплаты</h1>
          <p className="section-subtitle">
            Все транзакции защищены. Итоговая сумма в рублях, без скрытых комиссий.
          </p>
        </div>
        <div className="steps">
          <span className="step step--done">
            <span className="step__dot">✓</span> Данные и доставка
          </span>
          <span className="step__line" />
          <span className="step step--active">
            <span className="step__dot">2</span> Оплата
          </span>
          <span className="step__line" />
          <span className="step">
            <span className="step__dot">3</span> Готово
          </span>
        </div>
      </div>

      <form className="layout-2col" onSubmit={pay}>
        <div>
          <div className="panel">
            <h2 className="panel__title">Оплата заказа</h2>

            {!isAuthenticated && (
              <div className="alert alert--info">
                Заказ оформляется из личного кабинета.{" "}
                <Link to="/login" style={{ fontWeight: 700, textDecoration: "underline" }}>
                  Войти
                </Link>{" "}
                или{" "}
                <Link to="/login" style={{ fontWeight: 700, textDecoration: "underline" }}>
                  зарегистрироваться
                </Link>
                . Состав корзины сохранён.
              </div>
            )}

            {error && <div className="alert alert--error">{error}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PAYMENT_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={method === option.value ? "radio-card radio-card--active" : "radio-card"}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={option.value}
                    checked={method === option.value}
                    onChange={() => setMethod(option.value)}
                  />
                  <span>
                    <span className="radio-card__title">{option.title}</span>
                    <div className="radio-card__note">{option.note}</div>
                  </span>
                  <span className="badge badge--soft" style={{ position: "static" }}>
                    {option.badge}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {method === "card" && (
            <div className="panel">
              <h2 className="panel__title">Данные карты</h2>
              <p className="form-hint" style={{ marginBottom: 14 }}>
                Оплата на странице банка — магазин не хранит реквизиты карты.
                Для тестирования используйте карту 2200 **** **** 4821, срок 12/29, CVC 123.
              </p>
              <div className="form-grid">
                <div className="form-field form-field--full">
                  <label htmlFor="card-number">Номер карты</label>
                  <input
                    id="card-number"
                    required
                    inputMode="numeric"
                    placeholder="2200 0000 0000 4821"
                    value={card.number}
                    onChange={(event) => setCard({ ...card, number: event.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="card-expiry">Срок действия</label>
                  <input
                    id="card-expiry"
                    required
                    placeholder="12 / 29"
                    value={card.expiry}
                    onChange={(event) => setCard({ ...card, expiry: event.target.value })}
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="card-cvc">Код CVC</label>
                  <input
                    id="card-cvc"
                    required
                    placeholder="***"
                    value={card.cvc}
                    onChange={(event) => setCard({ ...card, cvc: event.target.value })}
                  />
                </div>
              </div>

              <label className="radio-card" style={{ marginTop: 16 }}>
                <input
                  type="checkbox"
                  checked={saveCard}
                  onChange={(event) => setSaveCard(event.target.checked)}
                />
                <span className="radio-card__title">Сохранить карту для следующих покупок</span>
              </label>
            </div>
          )}

          <div style={{ marginTop: 18 }}>
            <button type="submit" className="btn btn--primary btn--lg" disabled={busy}>
              {busy ? "Оформляем заказ…" : "Оплатить и оформить"}
            </button>
            <Link to="/checkout" className="btn btn--ghost btn--lg" style={{ marginLeft: 12 }}>
              ← Вернуться к доставке
            </Link>
          </div>
        </div>

        <aside className="summary">
          <h2 className="panel__title">Ваш заказ</h2>

          {items.map((line) => (
            <div key={line.product.product_id} className="order-preview-item">
              <img
                src={line.product.image_url ?? "/images/products/pc.svg"}
                alt={line.product.title}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  {line.product.title.slice(0, 46)}
                </div>
                <div className="small muted">
                  {line.quantity} × {formatPrice(line.product.price_retail)}
                </div>
              </div>
            </div>
          ))}

          <div className="summary__row" style={{ marginTop: 14 }}>
            <span>Товары</span>
            <b>{formatPrice(totals.amount)}</b>
          </div>
          <div className="summary__row">
            <span>Доставка</span>
            <b>
              {draft.deliveryPrice === 0 ? "бесплатно" : formatPrice(draft.deliveryPrice)}
            </b>
          </div>
          <div className="summary__total">
            <span>Итого</span>
            <span className="price">{formatPrice(totals.amount + (draft.deliveryPrice ?? 0))}</span>
          </div>

          <button type="submit" className="btn btn--success btn--block btn--lg" disabled={busy}>
            {busy ? "Оформляем заказ…" : "Оплатить и оформить"}
          </button>

          <div className="info-row" style={{ marginTop: 12 }}>
            <span className="info-row__icon">
              <Icon name="lock" />
            </span>
            <div>
              <div className="info-row__label">Безопасная оплата</div>
              <div className="info-row__value small">
                Данные защищены по стандарту PCI DSS
              </div>
            </div>
          </div>
          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="phone" />
            </span>
            <div>
              <div className="info-row__label">Менеджер свяжется</div>
              <div className="info-row__value small">
                {user?.phone_number ?? draft.contact?.phone}
              </div>
            </div>
          </div>
        </aside>
      </form>
    </>
  );
}
