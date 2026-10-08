import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout.jsx";
import AccountPage from "./pages/AccountPage.jsx";
import CartPage from "./pages/CartPage.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OrderSuccessPage from "./pages/OrderSuccessPage.jsx";
import PaymentPage from "./pages/PaymentPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import ReviewsPage from "./pages/ReviewsPage.jsx";
import TradeInPage from "./pages/TradeInPage.jsx";
import { useAuth } from "./store/AuthContext.jsx";

/** Маршрут, доступный только авторизованному пользователю. */
function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return <div className="empty-state">Загрузка профиля…</div>;
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/catalog/:slug" element={<CatalogPage />} />
        <Route path="/product/:slug" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
        <Route path="/trade-in" element={<TradeInPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountPage />
            </RequireAuth>
          }
        />
        <Route
          path="/account/history"
          element={
            <RequireAuth>
              <HistoryPage />
            </RequireAuth>
          }
        />
        <Route
          path="/account/reviews"
          element={
            <RequireAuth>
              <ReviewsPage />
            </RequireAuth>
          }
        />
        <Route path="*" element={<div className="empty-state">Страница не найдена</div>} />
      </Route>
    </Routes>
  );
}
