/**
 * Звёздный рейтинг товара. В режиме ввода (interactive) позволяет
 * покупателю выбрать оценку от 1 до 5.
 */
export default function RatingStars({ value = 0, interactive = false, onChange, size }) {
  const stars = [1, 2, 3, 4, 5];

  if (!interactive) {
    return (
      <span className="stars" style={size ? { fontSize: size } : undefined} title={`${value} из 5`}>
        {stars.map((star) => (
          <span key={star} aria-hidden="true">
            {star <= Math.round(value) ? "★" : "☆"}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span className="stars stars--input">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          className={star <= value ? "active" : ""}
          onClick={() => onChange?.(star)}
          aria-label={`Оценка ${star}`}
        >
          ★
        </button>
      ))}
    </span>
  );
}
