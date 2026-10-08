import { useNavigate } from "react-router-dom";

import AuthModal from "../components/AuthModal.jsx";

/** Отдельная страница входа — та же форма, что и в модальном окне макета. */
export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <>
      <div className="section-head">
        <div>
          <span className="small muted">ЛИЧНЫЙ КАБИНЕТ</span>
          <h1 className="section-title">Вход в личный кабинет</h1>
          <p className="section-subtitle">
            Авторизуйтесь, чтобы видеть историю покупок, оформлять заказы и оставлять отзывы.
          </p>
        </div>
      </div>

      <AuthModal onClose={() => navigate("/")} onSuccess={() => navigate("/account")} />
    </>
  );
}
