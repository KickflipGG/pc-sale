import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import { api, formatPrice } from "../api/client.js";
import { useAuth } from "../store/AuthContext.jsx";

const COMPONENT_FIELDS = [
  { key: "cpu", label: "Процессор", options: ["Intel Core i3/i5", "Intel Core i7/i9", "AMD Ryzen 3/5", "AMD Ryzen 7/9"] },
  { key: "gpu", label: "Видеокарта", options: ["GeForce GTX 10xx", "GeForce RTX 20xx/30xx", "GeForce RTX 40xx/50xx", "Radeon RX 5000/6000/9000"] },
  { key: "motherboard", label: "Материнская плата", options: ["LGA1200/LGA1700", "AM4", "AM5", "Не знаю модель"] },
  { key: "ram", label: "Оперативная память", options: ["8 ГБ", "16 ГБ", "32 ГБ", "64 ГБ и более"] },
  { key: "storage", label: "Накопители", options: ["HDD", "SATA SSD", "NVMe SSD", "Несколько дисков"] },
  { key: "psu", label: "Блоки питания", options: ["до 500 Вт", "550–650 Вт", "700–850 Вт", "от 1000 Вт"] },
  { key: "monitors", label: "Мониторы", options: ["до 24\"", "27\"", "32\" и более", "Нет"] },
  { key: "peripherals", label: "Периферия", options: ["Клавиатура и мышь", "Гарнитура", "Комплект целиком", "Нет"] },
];

/** Страница программы Trade-In — макет «Система Трейд-Ин». */
export default function TradeInPage() {
  const { isAuthenticated } = useAuth();
  const { openAuth } = useOutletContext();

  const [mode, setMode] = useState("components");
  const [components, setComponents] = useState({});
  const [contact, setContact] = useState({ contact_name: "", contact_phone: "" });
  const [description, setDescription] = useState("");
  const [defects, setDefects] = useState("");
  const [photos, setPhotos] = useState("");
  const [myRequests, setMyRequests] = useState([]);
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setMyRequests([]);
      return;
    }
    api.myTradeIn().then(setMyRequests).catch(() => setMyRequests([]));
  }, [isAuthenticated]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);

    const componentsSummary = Object.entries(components)
      .filter(([, value]) => value)
      .map(([key, value]) => `${COMPONENT_FIELDS.find((f) => f.key === key)?.label}: ${value}`)
      .join("; ");

    const payload = {
      contact_name: contact.contact_name,
      contact_phone: contact.contact_phone,
      device_category: mode === "build" ? "Готовый ПК" : "Процессор",
      item_description:
        mode === "build"
          ? `Компьютер в сборе. Комплектующие: ${componentsSummary || "не уточнены"}. ${description}`
          : `Отдельные комплектующие: ${componentsSummary || "не уточнены"}. ${description}`,
      known_defects: defects || null,
      photo_urls: photos || null,
    };

    try {
      const created = await api.createTradeIn(payload);
      setMessage({
        type: "success",
        text: `Заявка №${created.tradein_id} принята. Менеджер оценит технику и свяжется с вами.`,
      });
      setComponents({});
      setDescription("");
      setDefects("");
      setPhotos("");
      if (isAuthenticated) {
        setMyRequests(await api.myTradeIn());
      }
    } catch (exception) {
      setMessage({ type: "error", text: exception.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <nav className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>›</span>
        <span>Trade-In</span>
      </nav>

      <div className="panel" style={{ textAlign: "center", marginBottom: 20 }}>
        <h1 className="section-title">Программа Trade-In</h1>
        <p className="section-subtitle" style={{ margin: "8px auto 0" }}>
          Обмен старых комплектующих на скидку до 35 % при покупке новой техники.
          Оценим бесплатно и заберём технику сами.
        </p>
      </div>

      {message && <div className={`alert alert--${message.type}`}>{message.text}</div>}

      {!isAuthenticated && (
        <div className="alert alert--info">
          Заявку можно отправить без регистрации.{" "}
          <button
            type="button"
            onClick={openAuth}
            style={{
              border: "none",
              background: "none",
              color: "var(--accent-dark)",
              fontWeight: 700,
              textDecoration: "underline",
              padding: 0,
            }}
          >
            Войти
          </button>{" "}
          — чтобы отслеживать статус оценки в личном кабинете.
        </div>
      )}

      <form onSubmit={submit}>
        <div className="panel">
          <h2 className="panel__title">Что вы сдаёте?</h2>
          <div className="radio-row">
            <label className={mode === "build" ? "radio-card radio-card--active" : "radio-card"}>
              <input
                type="radio"
                name="mode"
                checked={mode === "build"}
                onChange={() => setMode("build")}
              />
              <span className="radio-card__title">Компьютер в сборе</span>
            </label>
            <label
              className={mode === "components" ? "radio-card radio-card--active" : "radio-card"}
            >
              <input
                type="radio"
                name="mode"
                checked={mode === "components"}
                onChange={() => setMode("components")}
              />
              <span className="radio-card__title">Отдельные комплектующие</span>
            </label>
          </div>

          <div className="form-grid" style={{ marginTop: 20 }}>
            {COMPONENT_FIELDS.map((field) => (
              <div className="form-field" key={field.key}>
                <label htmlFor={`ti-${field.key}`}>{field.label}</label>
                <select
                  id={`ti-${field.key}`}
                  value={components[field.key] ?? ""}
                  onChange={(event) =>
                    setComponents({ ...components, [field.key]: event.target.value })
                  }
                >
                  <option value="">Поиск…</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2 className="panel__title">Контакты и описание</h2>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="ti-name">Контактное лицо</label>
              <input
                id="ti-name"
                required
                value={contact.contact_name}
                onChange={(event) =>
                  setContact({ ...contact, contact_name: event.target.value })
                }
                placeholder="Данил Маренич"
              />
            </div>
            <div className="form-field">
              <label htmlFor="ti-phone">Телефон</label>
              <input
                id="ti-phone"
                required
                value={contact.contact_phone}
                onChange={(event) =>
                  setContact({ ...contact, contact_phone: event.target.value })
                }
                placeholder="+7 999 123-45-67"
              />
            </div>
            <div className="form-field form-field--full">
              <label htmlFor="ti-description">Описание техники</label>
              <textarea
                id="ti-description"
                required
                minLength={10}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Модель, год покупки, комплектация"
              />
            </div>
            <div className="form-field">
              <label htmlFor="ti-defects">Известные неисправности</label>
              <input
                id="ti-defects"
                value={defects}
                onChange={(event) => setDefects(event.target.value)}
                placeholder="Например: не работает один вентилятор"
              />
            </div>
            <div className="form-field">
              <label htmlFor="ti-photos">Ссылки на фото (через запятую)</label>
              <input
                id="ti-photos"
                value={photos}
                onChange={(event) => setPhotos(event.target.value)}
                placeholder="/uploads/tradein/1-1.jpg, /uploads/tradein/1-2.jpg"
              />
            </div>
          </div>

          <div
            style={{
              marginTop: 18,
              border: "1px dashed var(--line-strong)",
              borderRadius: "var(--radius)",
              padding: "26px 20px",
              textAlign: "center",
              color: "var(--muted)",
              background: "var(--bg-alt)",
            }}
          >
            Место для скриншотов комплектующих / ПК
            <div className="small muted" style={{ marginTop: 6 }}>
              Загрузите фотографии — это ускорит предварительную оценку
            </div>
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--lg"
            style={{ marginTop: 20 }}
            disabled={busy}
          >
            {busy ? "Отправляем заявку…" : "Отправить заявку на оценку"}
          </button>
        </div>
      </form>

      {myRequests.length > 0 && (
        <div className="panel">
          <h2 className="panel__title">Мои заявки Trade-In</h2>
          <table className="table-simple">
            <thead>
              <tr>
                <th>№</th>
                <th>Техника</th>
                <th>Оценка</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {myRequests.map((request) => (
                <tr key={request.tradein_id}>
                  <td>{request.tradein_id}</td>
                  <td>{request.device_category}</td>
                  <td>
                    {request.approved_price
                      ? formatPrice(request.approved_price)
                      : request.preliminary_price
                        ? `предв. ${formatPrice(request.preliminary_price)}`
                        : "оценивается"}
                  </td>
                  <td>
                    <span className="status-pill status-pill--wait">
                      {request.request_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
