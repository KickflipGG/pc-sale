import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../store/AuthContext.jsx";
import { useCart } from "../store/CartContext.jsx";
import AuthModal from "./AuthModal.jsx";
import Icon from "./Icon.jsx";

/** Общий каркас страниц: шапка с поиском, содержимое маршрута и подвал. */
export default function Layout() {
  const { isAuthenticated, logout } = useAuth();
  const { totals } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    document.title = "PC Sale — компьютеры и комплектующие";
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    navigate(value.length >= 2 ? `/catalog?q=${encodeURIComponent(value)}` : "/catalog");
  }

  return (
    <div className="page">
      <header className="topbar">
        <div className="container">
          <div className="topbar__inner">
            <Link to="/" className="brand">
              <img className="brand__logo" src="/images/logo.png" alt="PC Sale" />
              <span>
                <span className="brand__name">PC Sale</span>
                <div className="brand__tag">компьютеры и комплектующие</div>
              </span>
            </Link>

            <form className="search" onSubmit={submitSearch}>
              <Icon name="search" />
              <input
                type="search"
                placeholder="Поиск по каталогу"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Поиск по каталогу"
              />
            </form>

            <div className="topbar__actions">
              <a
                className="social-pill"
                href="https://wa.me/79991234567"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="whatsapp" /> WhatsApp
              </a>
              <a
                className="social-pill"
                href="https://t.me/pcsale_nsk"
                target="_blank"
                rel="noreferrer"
              >
                <Icon name="telegram" /> Telegram
              </a>

              <NavLink to="/cart" className="btn btn--ghost btn--sm">
                <Icon name="cart" />
                Корзина
                {totals.units > 0 && <span className="status-pill">{totals.units}</span>}
              </NavLink>

              {isAuthenticated ? (
                <>
                  <NavLink to="/account" className="btn btn--primary btn--sm">
                    Личный кабинет
                  </NavLink>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      logout();
                      navigate("/");
                    }}
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => setAuthOpen(true)}
                >
                  Войти
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        <Outlet context={{ openAuth: () => setAuthOpen(true) }} />
      </main>

      <footer className="footer">
        <div className="container footer__inner">
          <span>
            © 2026 PC Sale — интернет-магазин компьютерной техники, г. Новосибирск, ул. Галущака, 52
          </span>
          <nav className="footer__links">
            <Link to="/catalog">Каталог</Link>
            <Link to="/trade-in">Trade-In</Link>
            <Link to="/account">Личный кабинет</Link>
          </nav>
        </div>
      </footer>

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setAuthOpen(false);
            navigate("/account");
          }}
        />
      )}
    </div>
  );
}
