import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

import { api } from "../api/client.js";
import ProductCard from "../components/ProductCard.jsx";

const PAGE_SIZE = 9;

const SORT_LABELS = {
  default: "По умолчанию",
  price_asc: "Сначала дешёвые",
  price_desc: "Сначала дорогие",
  title: "По названию",
};

/**
 * Список товаров: используется и для подкатегории (/catalog/:slug),
 * и для сквозного поиска по каталогу (/catalog?q=...).
 */
export default function CatalogPage() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const sort = searchParams.get("sort") ?? "default";
  const page = Number(searchParams.get("page") ?? 1);

  const [data, setData] = useState(null);
  const [category, setCategory] = useState(null);
  const [search, setSearch] = useState(query);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .products({ category: slug, q: query, sort, page, pageSize: PAGE_SIZE })
      .then(async (result) => {
        if (cancelled) return;
        setData(result);
        if (slug) {
          const tree = await api.categories();
          const flat = tree.flatMap((node) => [node, ...(node.children ?? [])]);
          if (!cancelled) setCategory(flat.find((item) => item.slug === slug) ?? null);
        } else {
          setCategory(null);
        }
      })
      .catch((exception) => !cancelled && setError(exception.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [slug, query, sort, page]);

  function updateParams(patch) {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === null || value === "") next.delete(key);
      else next.set(key, String(value));
    });
    if (!("page" in patch)) next.delete("page");
    setSearchParams(next);
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>›</span>
        {category?.name ? (
          <>
            <Link to="/category/ready-pc">Каталог</Link>
            <span>›</span>
            <span>{category.name}</span>
          </>
        ) : (
          <span>{query ? `Поиск: ${query}` : "Каталог"}</span>
        )}
      </nav>

      <div className="section-head">
        <div>
          <h1 className="section-title">{category?.name ?? "Каталог товаров"}</h1>
          <p className="section-subtitle">
            {category?.description ??
              "Готовые сборки, комплектующие и периферия. Уточните совместимость с инженером."}
          </p>
        </div>
        <div className="small muted">
          {data ? `Найдено ${data.total} товаров` : "Загрузка…"}
        </div>
      </div>

      <form
        className="panel"
        style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" }}
        onSubmit={(event) => {
          event.preventDefault();
          updateParams({ q: search.trim() });
        }}
      >
        <div className="form-field" style={{ flex: 1, minWidth: 240 }}>
          <label htmlFor="catalog-search">Поиск по названию, характеристикам и артикулу</label>
          <input
            id="catalog-search"
            type="search"
            value={search}
            placeholder="Например: RTX 5070 или Ryzen"
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="form-field" style={{ minWidth: 190 }}>
          <label htmlFor="catalog-sort">Сортировка</label>
          <select
            id="catalog-sort"
            value={sort}
            onChange={(event) => updateParams({ sort: event.target.value })}
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn--primary">
          Найти
        </button>
        {(query || sort !== "default") && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setSearchParams(new URLSearchParams())}
          >
            Сбросить
          </button>
        )}
      </form>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <div className="empty-state">Загрузка товаров…</div>
      ) : data && data.items.length > 0 ? (
        <>
          <div className="card-grid card-grid--products" style={{ marginTop: 22 }}>
            {data.items.map((product) => (
              <ProductCard key={product.product_id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 28,
                flexWrap: "wrap",
              }}
            >
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  type="button"
                  className={number === page ? "btn btn--primary btn--sm" : "btn btn--ghost btn--sm"}
                  onClick={() => updateParams({ page: number })}
                >
                  {number}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">
          <h2>Ничего не найдено</h2>
          <p>Измените поисковый запрос или выберите другую категорию каталога.</p>
        </div>
      )}
    </>
  );
}
