import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, formatPrice } from "../api/client.js";
import Icon from "../components/Icon.jsx";
import RatingStars from "../components/RatingStars.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useCart } from "../store/CartContext.jsx";
import { useNavigate } from "react-router-dom";

/** Карточка товара: характеристики, цена, отзывы и форма оценки. */
export default function ProductPage() {
  const { slug } = useParams();
  const { add } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [added, setAdded] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewMessage, setReviewMessage] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setAdded(false);

    api
      .product(slug)
      .then(async (data) => {
        if (cancelled) return;
        setProduct(data);
        const list = await api.productReviews(data.product_id).catch(() => []);
        if (!cancelled) setReviews(list);
      })
      .catch((exception) => !cancelled && setError(exception.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function submitReview(event) {
    event.preventDefault();
    setReviewMessage(null);
    try {
      await api.createReview({
        product_id: product.product_id,
        rating_score: rating,
        comment_text: comment,
      });
      setComment("");
      setReviewMessage({
        type: "success",
        text: "Спасибо! Отзыв отправлен на модерацию и появится после проверки.",
      });
    } catch (exception) {
      setReviewMessage({ type: "error", text: exception.message });
    }
  }

  if (loading) return <div className="empty-state">Загрузка товара…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!product) return null;

  const inStock = product.stock_quantity > 0;

  const specs = [
    ["Процессор", product.cpu_spec],
    ["Видеокарта", product.gpu_spec],
    ["Оперативная память", product.ram_capacity_gb ? `${product.ram_capacity_gb} ГБ` : null],
    ["Накопитель", product.storage_spec],
    ["Артикул", product.sku_code],
    ["Наличие", inStock ? `${product.stock_quantity} шт. на складе` : "под заказ"],
  ].filter(([, value]) => Boolean(value));

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>›</span>
        <Link to={`/catalog/${product.category.slug}`}>{product.category.name}</Link>
        <span>›</span>
        <span>{product.title.slice(0, 42)}…</span>
      </nav>

      <div className="layout-2col">
        <div className="panel" style={{ display: "flex", gap: 26, flexWrap: "wrap" }}>
          <div
            style={{
              flex: "0 0 340px",
              background: "var(--bg-alt)",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius)",
              display: "grid",
              placeItems: "center",
              padding: 20,
              minHeight: 400,
            }}
          >
            <img
              src={product.image_url ?? "/images/products/pc.svg"}
              alt={product.title}
              style={{ maxWidth: "100%", maxHeight: 380 }}
            />
          </div>

          <div style={{ flex: 1, minWidth: 300 }}>
            <span className={inStock ? "badge" : "badge badge--order"}
                  style={{ position: "static", display: "inline-block", marginBottom: 12 }}>
              {inStock ? "В наличии" : "Под заказ"}
            </span>
            <h1 style={{ fontSize: 24, marginBottom: 12 }}>{product.title}</h1>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <RatingStars value={product.rating_average ?? 0} />
              <span className="small muted">
                {product.rating_average
                  ? `${product.rating_average} из 5 · ${product.reviews_count} отзыв(ов)`
                  : "Пока нет отзывов"}
              </span>
            </div>

            <dl className="spec-list" style={{ marginBottom: 20 }}>
              {specs.map(([label, value]) => (
                <li key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </li>
              ))}
            </dl>

            <div className="product-card__price-row" style={{ borderTop: "1px solid var(--line)" }}>
              <div>
                <div className="small muted">Цена</div>
                <span className="price price--accent">{formatPrice(product.price_retail)}</span>
              </div>
              <div className="quantity">
                <button type="button" onClick={() => setQuantity((v) => Math.max(1, v - 1))}>
                  −
                </button>
                <span>{quantity}</span>
                <button type="button" onClick={() => setQuantity((v) => Math.min(99, v + 1))}>
                  +
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              <button
                type="button"
                className="btn btn--primary btn--lg"
                disabled={!inStock}
                onClick={() => {
                  add(product, quantity);
                  setAdded(true);
                }}
              >
                Добавить в корзину
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--lg"
                onClick={() => navigate("/cart")}
              >
                Перейти в корзину
              </button>
            </div>

            {added && <div className="alert alert--success" style={{ marginTop: 16 }}>
              Товар добавлен в корзину: {quantity} шт.
            </div>}

            <div className="link-green" style={{ marginTop: 16 }}>
              Поможем проверить конфигурацию — напишите в WhatsApp или Telegram
            </div>
          </div>
        </div>

        <aside className="summary">
          <h2 className="panel__title" style={{ marginBottom: 10 }}>Гарантия и доставка</h2>
          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="shield" />
            </span>
            <div>
              <div className="info-row__label">Гарантия</div>
              <div className="info-row__value">12 месяцев на сборку</div>
            </div>
          </div>
          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="truck" />
            </span>
            <div>
              <div className="info-row__label">Доставка курьером</div>
              <div className="info-row__value">10:00–21:00, от 500 ₽</div>
            </div>
          </div>
          <div className="info-row">
            <span className="info-row__icon">
              <Icon name="refresh" />
            </span>
            <div>
              <div className="info-row__label">Trade-In</div>
              <div className="info-row__value">Скидка до 35 % за старую технику</div>
            </div>
          </div>
        </aside>
      </div>

      <div className="panel" style={{ marginTop: 24 }}>
        <h2 className="panel__title">Отзывы покупателей</h2>

        {reviews.length === 0 ? (
          <p className="muted">Опубликованных отзывов пока нет. Станьте первым!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.review_id} className="info-row">
              <span className="info-row__icon">
                <Icon name="chat" />
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <b>{review.author_name}</b>
                  <RatingStars value={review.rating_score} />
                  <span className="small muted">
                    {new Date(review.created_at).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                <p style={{ margin: "6px 0 0" }}>{review.comment_text}</p>
              </div>
            </div>
          ))
        )}

        <hr style={{ border: "none", borderTop: "1px solid var(--line)", margin: "22px 0" }} />

        {isAuthenticated ? (
          <form onSubmit={submitReview}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Оставить отзыв</h3>
            {reviewMessage && (
              <div className={`alert alert--${reviewMessage.type}`}>{reviewMessage.text}</div>
            )}
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label>Оценка</label>
              <RatingStars value={rating} interactive onChange={setRating} />
            </div>
            <div className="form-field" style={{ marginBottom: 14 }}>
              <label htmlFor="review-text">Комментарий</label>
              <textarea
                id="review-text"
                required
                minLength={5}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Расскажите о качестве сборки, шуме, производительности…"
              />
            </div>
            <button type="submit" className="btn btn--success">
              Отправить отзыв
            </button>
          </form>
        ) : (
          <p className="muted">
            Чтобы оставить отзыв, войдите в <Link to="/login">личный кабинет</Link>.
          </p>
        )}
      </div>
    </>
  );
}
