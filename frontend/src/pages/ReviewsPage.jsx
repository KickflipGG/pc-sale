import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api, formatPrice } from "../api/client.js";
import Icon from "../components/Icon.jsx";
import RatingStars from "../components/RatingStars.jsx";

const STATUS_LABELS = {
  published: "Опубликован",
  on_moderation: "На модерации",
  rejected: "Отклонён",
};

/** Отзывы покупателя — макет «Отзывы». */
export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .myReviews()
      .then((data) => !cancelled && setReviews(data))
      .catch((exception) => !cancelled && setError(exception.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = reviews.filter((review) =>
    (review.product?.title ?? "").toLowerCase().includes(search.trim().toLowerCase())
  );

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/account">Личный кабинет</Link>
        <span>›</span>
        <span>Отзывы</span>
      </nav>

      <div className="account-hero" style={{ justifyContent: "space-between" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="account-icon">
            <Icon name="chat" />
          </span>
          <h1>Отзывы</h1>
          <meta name="robots" content="noindex" />
        </span>
        <input
          type="search"
          placeholder="Поиск"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          style={{
            border: "1px solid var(--line)",
            borderRadius: "var(--radius)",
            padding: "8px 12px",
            fontSize: 13,
            minWidth: 220,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <div className="empty-state">Загрузка отзывов…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>Отзывов пока нет</h3>
          <p>Отзыв можно оставить на странице купленного товара.</p>
          <Link to="/account/history" className="btn btn--primary" style={{ marginTop: 16 }}>
            История покупок
          </Link>
        </div>
      ) : (
        <table className="table-simple">
          <thead>
            <tr>
              <th style={{ width: 46 }}>№</th>
              <th style={{ width: 96 }}>Фото</th>
              <th>Описание</th>
              <th style={{ width: 210 }}>Цена и оценка</th>
              <th style={{ width: 150 }}>Статус</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((review, index) => (
              <tr key={review.review_id}>
                <td>{index + 1}</td>
                <td>
                  <div className="cart-product__media">
                    <img
                      src={review.product?.image_url ?? "/images/products/pc.svg"}
                      alt={review.product?.title ?? "Товар"}
                    />
                  </div>
                </td>
                <td>
                  <div className="cart-product__title">
                    {review.product?.title ?? `Товар №${review.product_id}`}
                  </div>
                  <div className="small muted">{review.comment_text}</div>
                  <div className="small muted">
                    {new Date(review.created_at).toLocaleDateString("ru-RU")}
                  </div>
                </td>
                <td>
                  <div className="small muted">Цена:</div>
                  <b>{formatPrice(review.product?.price_retail ?? 0)}</b>
                  <div className="small muted" style={{ marginTop: 6 }}>
                    Оценка:
                  </div>
                  <RatingStars value={review.rating_score} />
                </td>
                <td>
                  <span
                    className={
                      review.moderation_status === "published"
                        ? "status-pill status-pill--done"
                        : "status-pill status-pill--wait"
                    }
                  >
                    {STATUS_LABELS[review.moderation_status] ?? review.moderation_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
