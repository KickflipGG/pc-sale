/**
 * Тонкий клиент REST API «PC Sale».
 * В режиме разработки запросы идут на тот же источник и проксируются
 * Vite на FastAPI (см. vite.config.js), поэтому базовый адрес не нужен.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const TOKEN_KEY = "pc-sale-token";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

export class ApiError extends Error {
  constructor(status, detail) {
    super(typeof detail === "string" ? detail : "Ошибка запроса к серверу");
    this.status = status;
    this.detail = detail;
  }
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = payload?.detail ?? payload;
    throw new ApiError(response.status, detail);
  }
  return payload;
}

export const api = {
  health: () => request("/", { auth: false }),

  categories: () => request("/api/categories", { auth: false }),
  categorySections: (slug) => request(`/api/categories/${slug}/sections`, { auth: false }),
  catalogSummary: () => request("/api/catalog/summary", { auth: false }),

  products: ({ category, q, sort = "default", page = 1, pageSize = 12 } = {}) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    params.set("page_size", String(pageSize));
    return request(`/api/products?${params.toString()}`, { auth: false });
  },
  product: (slug) => request(`/api/products/${slug}`, { auth: false }),

  register: (payload) => request("/api/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/api/auth/login", { method: "POST", body: payload, auth: false }),
  me: () => request("/api/auth/me"),
  updateProfile: (payload) => request("/api/auth/me", { method: "PATCH", body: payload }),
  changePassword: (payload) =>
    request("/api/auth/change-password", { method: "POST", body: payload }),

  createOrder: (payload) => request("/api/orders", { method: "POST", body: payload }),
  myOrders: () => request("/api/orders"),
  payOrder: (id) => request(`/api/orders/${id}/pay`, { method: "POST" }),
  cancelOrder: (id) => request(`/api/orders/${id}`, { method: "DELETE" }),

  productReviews: (productId) => request(`/api/reviews/product/${productId}`, { auth: false }),
  myReviews: () => request("/api/reviews/my"),
  createReview: (payload) => request("/api/reviews", { method: "POST", body: payload }),

  tradeInCategories: () => request("/api/trade-in/categories", { auth: false }),
  createTradeIn: (payload) => request("/api/trade-in", { method: "POST", body: payload }),
  myTradeIn: () => request("/api/trade-in/my"),
};

export function formatPrice(value) {
  const number = Number(value ?? 0);
  return `${number.toLocaleString("ru-RU", { minimumFractionDigits: 0 })} ₽`;
}

export const ORDER_STATUS_LABELS = {
  created: "Оформлен",
  paid: "Оплачен",
  assembled: "Собран",
  delivered: "Куплено",
  cancelled: "Отменён",
};

export const DELIVERY_LABELS = {
  pickup: "Самовывоз",
  courier: "Курьером",
  transport: "Транспортной компанией",
};

export const PAYMENT_LABELS = {
  card: "Банковская карта",
  sbp: "СБП",
  cash: "При получении",
};
