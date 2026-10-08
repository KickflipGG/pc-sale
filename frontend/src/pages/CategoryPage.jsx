import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { api, formatPrice } from "../api/client.js";
import { sectionImage } from "../api/catalogImages.js";

/**
 * Страница корневого раздела каталога (например, «Готовые компьютеры»):
 * плитки подразделов с количеством моделей и минимальной ценой.
 */
export default function CategoryPage() {
  const { slug } = useParams();
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .categorySections(slug)
      .then((data) => {
        if (!cancelled) setSections(data);
      })
      .catch((exception) => !cancelled && setError(exception.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) return <div className="empty-state">Загрузка раздела…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;

  const totalModels = sections.reduce((sum, section) => sum + section.products_count, 0);

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>›</span>
        <span>{sections[0]?.category ? "Готовые компьютеры" : slug}</span>
      </nav>

      <div className="section-head">
        <div>
          <h1 className="section-title">Готовые компьютеры</h1>
          <p className="section-subtitle">
            Проверенные конфигурации под конкретные задачи: документы, учёба и игры,
            требовательные рабочие приложения.
          </p>
        </div>
        <div className="small muted">{totalModels} моделей в наличии</div>
      </div>

      <div className="card-grid">
        {sections.map((section) => (
          <article key={section.category.category_id} className="category-card">
            <div className="category-card__media">
              <img src={sectionImage(section.category.slug)} alt="" />
            </div>
            <div className="category-card__body">
              <h2 className="category-card__title">{section.category.name}</h2>
              <p className="category-card__text">{section.category.description}</p>
              <div className="product-card__price-row">
                <span className="price-from">
                  {section.min_price ? `от ${formatPrice(section.min_price)}` : "по запросу"}
                </span>
                <span className="small muted">{section.products_count} модели</span>
              </div>
              <Link
                to={`/catalog/${section.category.slug}`}
                className="btn btn--primary btn--block"
              >
                Смотреть модели
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
