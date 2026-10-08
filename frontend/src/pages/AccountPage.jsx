import { useState } from "react";
import { Link } from "react-router-dom";

import { api } from "../api/client.js";
import Icon from "../components/Icon.jsx";
import { useAuth } from "../store/AuthContext.jsx";
import { useCart } from "../store/CartContext.jsx";

/** Личный кабинет — макет «Личный кабинет». */
export default function AccountPage() {
  const { user, logout } = useAuth();
  const { totals } = useCart();

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [message, setMessage] = useState(null);

  async function changePassword(event) {
    event.preventDefault();
    setMessage(null);
    try {
      await api.changePassword(passwords);
      setPasswords({ current_password: "", new_password: "" });
      setShowPasswordForm(false);
      setMessage({ type: "success", text: "Пароль успешно изменён" });
    } catch (exception) {
      setMessage({ type: "error", text: exception.message });
    }
  }

  return (
    <>
      <div className="account-hero">
        <span className="account-icon">
          <Icon name="user" />
        </span>
        Личный кабинет
      </div>

      {message && <div className={`alert alert--${message.type}`}>{message.text}</div>}

      <div className="account-grid">
        <Link to="/account/history" className="account-card">
          <span className="account-icon">
            <Icon name="clock" />
          </span>
          История покупок
        </Link>
        <Link to="/cart" className="account-card">
          <span className="account-icon">
            <Icon name="cart" />
          </span>
          Корзина
          {totals.units > 0 && <span className="status-pill">{totals.units}</span>}
        </Link>
        <Link to="/account/reviews" className="account-card">
          <span className="account-icon">
            <Icon name="chat" />
          </span>
          Отзывы
        </Link>
      </div>

      <div className="panel" style={{ marginTop: 26 }}>
        <h2 className="panel__title">Данные профиля</h2>
        <div className="form-grid">
          <div>
            <div className="info-row__label">Имя</div>
            <div className="info-row__value">{user?.first_name}</div>
          </div>
          <div>
            <div className="info-row__label">Логин</div>
            <div className="info-row__value">{user?.login}</div>
          </div>
          <div>
            <div className="info-row__label">Электронная почта</div>
            <div className="info-row__value">{user?.email}</div>
          </div>
          <div>
            <div className="info-row__label">Телефон</div>
            <div className="info-row__value">{user?.phone_number}</div>
          </div>
          <div className="form-field--full">
            <div className="info-row__label">Адрес доставки</div>
            <div className="info-row__value">{user?.delivery_address ?? "не указан"}</div>
          </div>
        </div>
      </div>

      {showPasswordForm && (
        <form className="panel" onSubmit={changePassword}>
          <h2 className="panel__title">Смена пароля</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="pw-current">Текущий пароль</label>
              <input
                id="pw-current"
                type="password"
                required
                value={passwords.current_password}
                onChange={(event) =>
                  setPasswords({ ...passwords, current_password: event.target.value })
                }
              />
            </div>
            <div className="form-field">
              <label htmlFor="pw-new">Новый пароль</label>
              <input
                id="pw-new"
                type="password"
                required
                minLength={6}
                value={passwords.new_password}
                onChange={(event) =>
                  setPasswords({ ...passwords, new_password: event.target.value })
                }
              />
            </div>
          </div>
          <button type="submit" className="btn btn--primary" style={{ marginTop: 16 }}>
            Сохранить новый пароль
          </button>
        </form>
      )}

      <div className="account-actions">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setShowPasswordForm((value) => !value)}
        >
          Сменить пароль
        </button>
        <button type="button" className="btn btn--ghost" onClick={logout}>
          Выйти из аккаунта
        </button>
        <button type="button" className="btn btn--danger">
          Удалить профиль
        </button>
      </div>
    </>
  );
}
