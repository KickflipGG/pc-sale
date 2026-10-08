import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";
import { tileImage } from "../api/catalogImages.js";

/**
 * Главная страница: плитки разделов каталога и переход к программе Trade-In.
 * Состав плиток повторяет макет Figma «Первая страница».
 */
export default function HomePage() {
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .categories()
      .then((data) => !cancelled && setTree(data))
      .catch((exception) => !cancelled && setError(exception.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return <div className="empty-state">Загрузка каталога…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;

  const readyPc = tree.find((node) => node.slug === "ready-pc");
  const components = tree.find((node) => node.slug === "components");
  const peripherals = tree.find((node) => node.slug === "peripherals");

  // Порядок плиток соответствует макету: готовые ПК, комплектующие, периферия
  const tiles = [
    ...(readyPc ? [{ ...readyPc, rootLink: true }] : []),
    ...(components?.children ?? []),
    ...(peripherals?.children ?? []),
  ];

  return (
    <>
      <div className="section-head">
        <div>
          <h1 className="section-title">Каталог</h1>
          <p className="section-subtitle">
            Готовые сборки, комплектующие и периферия с гарантией. Обмен старой техники
            на скидку по программе Trade-In.
          </p>
        </div>
        <div className="small muted">Доставка по Новосибирску от 1 дня</div>
      </div>

      <div className="tiles">
        {tiles.map((category) => (
          <Link
            key={category.category_id}
            to={category.rootLink ? `/category/${category.slug}` : `/catalog/${category.slug}`}
            className="tile"
          >
            <span className="tile__media">
              <img src={tileImage(category.slug)} alt="" />
            </span>
            <span className="tile__label">{category.name}</span>
          </Link>
        ))}

        <Link to="/trade-in" className="tile tile--tradein">
          <span className="tile__media">
            <img src="/images/tiles/trade-in.png" alt="" />
          </span>
          <span className="tile__label">TRADE-IN</span>
        </Link>
      </div>
    </>
  );
}
