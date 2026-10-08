import { Link } from "react-router-dom";

import { formatPrice } from "../api/client.js";
import { useCart } from "../store/CartContext.jsx";

const PLACEHOLDER = "/images/products/pc.svg";

/** Карточка товара в списках каталога. */
export default function ProductCard({ product, categoryName }) {
  const { add } = useCart();
  const inStock = product.stock_quantity > 0;

  const specs = [
    ["Процессор", product.cpu_spec],
    ["Видеокарта", product.gpu_spec],
    ["Память", product.ram_capacity_gb ? `${product.ram_capacity_gb} ГБ` : null],
    ["Накопитель", product.storage_spec],
  ].filter(([, value]) => Boolean(value));

  return (
    <article className="product-card">
      <Link to={`/product/${product.slug}`} className="product-card__media">
        <span className={inStock ? "badge" : "badge badge--order"}>
          {inStock ? "В наличии" : "Под заказ"}
        </span>
        <img src={product.image_url || PLACEHOLDER} alt={product.title} loading="lazy" />
      </Link>

      <div className="product-card__body">
        {categoryName && <span className="product-card__category">{categoryName}</span>}

        <Link to={`/product/${product.slug}`} className="product-card__title">
          {product.title}
        </Link>

        {specs.length > 0 && (
          <dl className="spec-list">
            {specs.map(([label, value]) => (
              <li key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </li>
            ))}
          </dl>
        )}

        <div className="product-card__price-row">
          <span className="price price--accent">{formatPrice(product.price_retail)}</span>
          <span className="small muted">арт. {product.sku_code}</span>
        </div>

        <div className="product-card__actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            disabled={!inStock}
            onClick={() => add(product)}
          >
            {inStock ? "В корзину" : "Нет в наличии"}
          </button>
          <Link to={`/product/${product.slug}`} className="link-green">
            Проверить конфигурацию →
          </Link>
        </div>
      </div>
    </article>
  );
}
