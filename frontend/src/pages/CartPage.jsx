import { Link, useNavigate } from "react-router-dom";

import { formatPrice } from "../api/client.js";
import Icon from "../components/Icon.jsx";
import { useCart } from "../store/CartContext.jsx";

/** Корзина покупателя — макет «Корзина». */
export default function CartPage() {
  const { items, setQuantity, remove, totals } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <>
        <nav className="breadcrumbs">
          <Link to="/">Главная</Link>
          <span>›</span>
          <span>Корзина</span>
        </nav>
        <div className="account-hero">
          <span className="account-icon">
            <Icon name="cart" />
          </span>
          <h1>Корзина</h1>
        </div>
        <div className="empty-state">
          <h3>Корзина пуста</h3>
          <p>Добавьте товары из каталога — мы сохраним их до оформления заказа.</p>
          <Link to="/" className="btn btn--primary" style={{ marginTop: 16 }}>
            Перейти в каталог
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>›</span>
        <span>Корзина</span>
      </nav>

      <div className="account-hero">
        <span className="account-icon">
          <Icon name="cart" />
        </span>
        <h1>Корзина</h1>
      </div>

      <div className="layout-2col">
        <div>
          <table className="cart-table">
            <thead>
              <tr>
                <th style={{ width: 48 }}>№</th>
                <th>Фото</th>
                <th>Описание</th>
                <th style={{ width: 230 }}>Цена и количество</th>
                <th style={{ width: 170 }}>Статус</th>
              </tr>
            </thead>
            <tbody>
              {items.map((line, index) => (
                <tr key={line.product.product_id}>
                  <td>{index + 1}</td>
                  <td>
                    <div className="cart-product__media">
                      <img
                        src={line.product.image_url ?? "/images/products/pc.svg"}
                        alt={line.product.title}
                      />
                    </div>
                  </td>
                  <td>
                    <Link
                      to={`/product/${line.product.slug}`}
                      className="cart-product__title"
                    >
                      {line.product.title}
                    </Link>
                    <div className="small muted">арт. {line.product.sku_code}</div>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      style={{ marginTop: 8 }}
                      onClick={() => remove(line.product.product_id)}
                    >
                      Удалить
                    </button>
                  </td>
                  <td>
                    <div className="small muted">Цена:</div>
                    <b>{formatPrice(line.product.price_retail)}</b>
                    <div className="small muted" style={{ marginTop: 8 }}>
                      Количество:
                    </div>
                    <div className="quantity" style={{ marginTop: 4 }}>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(line.product.product_id, line.quantity - 1)
                        }
                      >
                        −
                      </button>
                      <span>{line.quantity}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setQuantity(line.product.product_id, line.quantity + 1)
                        }
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className="status-pill">
                      {line.product.stock_quantity > 0 ? "В наличии" : "Под заказ"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <aside className="summary">
          <h2 className="panel__title">Итого</h2>
          <div className="summary__row">
            <span>Позиций</span>
            <b>{totals.positions}</b>
          </div>
          <div className="summary__row">
            <span>Товаров, шт.</span>
            <b>{totals.units}</b>
          </div>
          <div className="summary__row">
            <span>Доставка</span>
            <b style={{ color: "var(--green-dark)" }}>рассчитается на следующем шаге</b>
          </div>
          <div className="summary__total">
            <span>Сумма</span>
            <span className="price">{formatPrice(totals.amount)}</span>
          </div>
          <button
            type="button"
            className="btn btn--primary btn--block btn--lg"
            style={{ marginTop: 14 }}
            onClick={() => navigate("/checkout")}
          >
            Перейти к оформлению
          </button>
          <Link
            to="/"
            className="btn btn--ghost btn--block"
            style={{ marginTop: 10 }}
          >
            Продолжить покупки
          </Link>
        </aside>
      </div>
    </>
  );
}
