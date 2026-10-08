/**
 * Набор монохромных пиктограмм для интерфейса магазина.
 * Все знаки построены на одной сетке 24×24, рисуются линией толщиной 1.6
 * и наследуют цвет текста, поэтому подходят для строгого оформления.
 */

const PATHS = {
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M4 5h16v11H9l-5 4z" />
      <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" />
    </>
  ),
  telegram: (
    <>
      <path d="M21 3 3 10.5l7 2.5 2.5 7z" />
      <path d="M21 3l-11 10" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.6" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  cart: (
    <>
      <path d="M3 5h2.5l2.2 10h10.6L21 8H7" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5.5l4 2" />
    </>
  ),
  chat: (
    <>
      <path d="M20 5H4v11h4v4l5-4h7z" />
      <path d="M8 9h8M8 12h5" />
    </>
  ),
  truck: (
    <>
      <path d="M2 6h11v9H2z" />
      <path d="M13 9h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="10" />
      <path d="M8 10V7.5a4 4 0 0 1 8 0V10" />
    </>
  ),
  phone: (
    <>
      <path d="M6 3h4l1.5 4-2 1.5a12 12 0 0 0 6 6L17 12.5l4 1.5v4a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2z" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </>
  ),
  tag: (
    <>
      <path d="M3 12l9-9h8v8l-9 9z" />
      <circle cx="16.5" cy="7.5" r="1.3" />
    </>
  ),
  box: (
    <>
      <path d="M3 7l9-4 9 4v10l-9 4-9-4z" />
      <path d="M3 7l9 4 9-4" />
      <path d="M12 11v10" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.5-6" />
      <path d="M20.5 4v5h-5" />
    </>
  ),
  check: <path d="M4 12l5 5L20 6" />,
  eye: (
    <>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  monitor: (
    <>
      <rect x="2" y="4" width="20" height="13" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
};

export default function Icon({ name, size = 16, className = "" }) {
  const path = PATHS[name];
  if (!path) return null;

  return (
    <svg
      className={`icon ${className}`.trim()}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {path}
    </svg>
  );
}
