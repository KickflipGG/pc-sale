import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { formatPrice } from "../api/client.js";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useCart } from "../store/CartContext.jsx";

const DELIVERY_OPTIONS = [
  { value: "pickup", title: "Самовывоз", note: "г. Новосибирск, ул. Галущака, 52", price: 0 },
  { value: "courier", title: "Курьером", note: "Доставка по городу, 10:00–21:00", price: 500 },
  { value: "transport", title: "Транспортной компанией", note: "По России, 3–7 дней", price: 900 },
];

/** Шаг 1 оформления заказа: контактные данные и способ доставки. */
export default function CheckoutPage() {
  const { items, totals } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contact, setContact] = useState({
    name: user?.first_name ?? "",
    phone: user?.phone_number ?? "",
    email: user?.email ?? "",
  });
  const [delivery, setDelivery] = useState("courier");
  const [notes, setNotes] = useState("");
  const [pickupPoint, setPickupPoint] = useState("г. Новосибирск, ул. Галущака, 52");
  const [floor, setFloor] = useState("");
  const [intercom, setIntercom] = useState("");

  // Профиль подгружается асинхронно (токен из localStorage), поэтому
  // контактные данные дозаполняются, как только пользователь стал известен.
  useEffect(() => {
    if (!user) return;
    setContact((current) => ({
      name: current.name || user.first_name,
      phone: current.phone || user.phone_number,
      email: current.email || user.email,
    }));
    if (user.delivery_address) {
      setPickupPoint((current) => current || user.delivery_address);
    }
  }, [user]);

  const selected = DELIVERY_OPTIONS.find((option) => option.value === delivery);
  const deliveryPrice = selected?.price ?? 0;
  const total = totals.amount + deliveryPrice;

  if (items.length === 0) {
    return (
      <div className="empty-state">
        <h3>Корзина пуста</h3>
        <p>Добавьте товары, чтобы перейти к оформлению заказа.</p>
        <Link to="/" className="btn btn--primary" style={{ marginTop: 16 }}>
          В каталог
        </Link>
      </div>
    );
  }

  function proceed(event) {
    event.preventDefault();
    const draft = {
      contact,
      delivery,
      deliveryPrice,
      notes,
      pickupPoint,
      floor,
      intercom,
      total,
    };
    // Черновик заказа переживает переход на страницу входа в личный кабинет
    sessionStorage.setItem("pc-sale-checkout", JSON.stringify(draft));
    navigate("/payment", { state: draft });
  }

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/cart">Корзина</Link>
        <span>›</span>
        <span>Оформление заказа</span>
      </nav>

      <div className="section-head">
        <div>
          <span className="small muted">ОФОРМЛЕНИЕ ЗАКАЗА</span>
          <h1 className="section-title">Контакты и доставка</h1>
          <p className="section-subtitle">
            Перезвоним для подтверждения — мы используем ваши данные только внутри магазина.
          </p>
        </div>
        <div className="steps">
          <span className="step step--active">
            <span className="step__dot">1</span> Данные и доставка
          </span>
          <span className="step__line" />
          <span className="step">
            <span className="step__dot">2</span> Оплата
          </span>
          <span className="step__line" />
          <span className="step">
            <span className="step__dot">3</span> Готово
          </span>
        </div>
      </div>

      <form className="layout-2col" onSubmit={proceed}>
        <div>
          <div className="panel">
            <h2 className="panel__title">
              <span className="account-icon">
                <Icon name="user" />
              </span>
              Контактные данные
            </h2>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="co-name">Имя и фамилия</label>
                <input
                  id="co-name"
                  required
                  value={contact.name}
                  onChange={(event) => setContact({ ...contact, name: event.target.value })}
                  placeholder="Данил Маренич"
                />
              </div>
              <div className="form-field">
                <label htmlFor="co-phone">Телефон</label>
                <input
                  id="co-phone"
                  required
                  value={contact.phone}
                  onChange={(event) => setContact({ ...contact, phone: event.target.value })}
                  placeholder="+7 999 123-45-67"
                />
              </div>
              <div className="form-field form-field--full">
                <label htmlFor="co-email">Электронная почта</label>
                <input
                  id="co-email"
                  type="email"
                  required
                  value={contact.email}
                  onChange={(event) => setContact({ ...contact, email: event.target.value })}
                  placeholder="marenich@mail.ru"
                />
              </div>
            </div>
          </div>

          <div className="panel">
            <h2 className="panel__title">
              <span className="account-icon">
                <Icon name="truck" />
              </span>
              Доставка
            </h2>

            <div className="radio-row">
              {DELIVERY_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={
                    delivery === option.value ? "radio-card radio-card--active" : "radio-card"
                  }
                >
                  <input
                    type="radio"
                    name="delivery"
                    value={option.value}
                    checked={delivery === option.value}
                    onChange={() => setDelivery(option.value)}
                  />
                  <span>
                    <span className="radio-card__title">{option.title}</span>
                    <div className="radio-card__note">{option.note}</div>
                  </span>
                  <span className="radio-card__price">
                    {option.price === 0 ? "бесплатно" : `${option.price} ₽`}
                  </span>
                </label>
              ))}
            </div>

            <div className="form-grid" style={{ marginTop: 18 }}>
              <div className="form-field form-field--full">
                <label htmlFor="co-point">
                  {delivery === "pickup" ? "Пункт выдачи" : "Адрес доставки"}
                </label>
                <input
                  id="co-point"
                  required
                  value={pickupPoint}
                  onChange={(event) => setPickupPoint(event.target.value)}
                />
              </div>
              {delivery === "courier" && (
                <>
                  <div className="form-field">
                    <label htmlFor="co-floor">Этаж</label>
                    <input
                      id="co-floor"
                      value={floor}
                      onChange={(event) => setFloor(event.target.value)}
                      placeholder="5"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="co-intercom">Код домофона</label>
                    <input
                      id="co-intercom"
                      value={intercom}
                      onChange={(event) => setIntercom(event.target.value)}
                      placeholder="47"
                    />
                  </div>
                </>
              )}
              <div className="form-field form-field--full">
                <label htmlFor="co-notes">Комментарий к заказу</label>
                <textarea
                  id="co-notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Например: позвонить за час до доставки"
                />
              </div>
            </div>

            <label className="radio-card" style={{ marginTop: 16 }}>
              <input type="checkbox" defaultChecked />
              <span className="radio-card__title">
                Застраховать заказ на время доставки
              </span>
            </label>
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
            <b>{deliveryPrice === 0 ? "бесплатно" : formatPrice(deliveryPrice)}</b>
          </div>
          <div className="summary__total">
            <span>Итого</span>
            <span className="price">{formatPrice(total)}</span>
          </div>

          <button type="submit" className="btn btn--primary btn--block btn--lg" style={{ marginTop: 14 }}>
            Перейти к оплате
          </button>
          <p className="form-hint" style={{ marginTop: 10 }}>
            Нажимая кнопку, вы соглашаетесь с условиями обработки персональных данных.
          </p>
        </aside>
      </form>
    </>
  );
}
