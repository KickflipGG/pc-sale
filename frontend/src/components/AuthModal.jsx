import { useState } from "react";

import Icon from "./Icon.jsx";
import { useAuth } from "../store/AuthContext.jsx";

const EMPTY_LOGIN = { login: "", password: "" };
const EMPTY_REGISTER = {
  login: "",
  email: "",
  password: "",
  first_name: "",
  phone_number: "",
  delivery_address: "",
};

/**
 * Модальное окно входа и регистрации — соответствует макетам
 * «Вход в личный кабинет» и «Регистрация аккаунта».
 */
export default function AuthModal({ onClose, onSuccess }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN);
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") {
        await login(loginForm);
      } else {
        await register(registerForm);
      }
      onSuccess?.();
    } catch (exception) {
      setError(exception.message || "Не удалось выполнить операцию");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div className="modal" onClick={(event) => event.stopPropagation()} role="dialog">
        <button type="button" className="modal__close" onClick={onClose} aria-label="Закрыть">
          <Icon name="close" size={14} />
        </button>

        <div className="modal__logo">PC</div>
        <h2 className="modal__title">Личный кабинет</h2>
        <p className="modal__subtitle">
          {mode === "login" ? "Вход в аккаунт" : "Создание нового аккаунта"}
        </p>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={submit}>
          {mode === "login" ? (
            <>
              <div className="form-field" style={{ marginBottom: 14 }}>
                <input
                  type="text"
                  placeholder="Ваш логин"
                  required
                  value={loginForm.login}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, login: event.target.value })
                  }
                />
              </div>
              <div className="form-field" style={{ marginBottom: 18, position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Введите пароль"
                  required
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm({ ...loginForm, password: event.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: 9,
                    border: "1px solid var(--line)",
                    borderRadius: "var(--radius)",
                    background: "var(--surface)",
                    color: "var(--muted)",
                    width: 30,
                    height: 30,
                    display: "grid",
                    placeItems: "center",
                  }}
                  aria-label="Показать пароль"
                >
                  <Icon name="eye" size={14} />
                </button>
              </div>
            </>
          ) : (
            <div className="form-grid" style={{ marginBottom: 18 }}>
              <div className="form-field form-field--full">
                <label htmlFor="reg-login">Логин</label>
                <input
                  id="reg-login"
                  required
                  minLength={3}
                  value={registerForm.login}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, login: event.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label htmlFor="reg-name">Имя</label>
                <input
                  id="reg-name"
                  required
                  value={registerForm.first_name}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, first_name: event.target.value })
                  }
                />
              </div>
              <div className="form-field">
                <label htmlFor="reg-phone">Телефон</label>
                <input
                  id="reg-phone"
                  required
                  placeholder="+7 999 123-45-67"
                  value={registerForm.phone_number}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, phone_number: event.target.value })
                  }
                />
              </div>
              <div className="form-field form-field--full">
                <label htmlFor="reg-email">Электронная почта</label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, email: event.target.value })
                  }
                />
              </div>
              <div className="form-field form-field--full">
                <label htmlFor="reg-password">Новый пароль</label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={6}
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, password: event.target.value })
                  }
                />
              </div>
              <div className="form-field form-field--full">
                <label htmlFor="reg-address">Адрес доставки</label>
                <input
                  id="reg-address"
                  value={registerForm.delivery_address}
                  onChange={(event) =>
                    setRegisterForm({ ...registerForm, delivery_address: event.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="modal__actions">
            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? "Отправка…" : mode === "login" ? "Войти" : "Регистрация"}
            </button>
            <button
              type="button"
              className="btn btn--success btn--block"
              onClick={() => {
                setError(null);
                setMode(mode === "login" ? "register" : "login");
              }}
            >
              {mode === "login" ? "Регистрация" : "Авторизация"}
            </button>
          </div>
        </form>

        <p className="small muted" style={{ textAlign: "center", marginTop: 16 }}>
          Тестовый доступ: логин <b>danil</b>, пароль <b>client123</b>
        </p>
      </div>
    </div>
  );
}
