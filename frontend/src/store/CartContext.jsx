import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "pc-sale-cart";

/**
 * Корзина покупателя. Содержимое хранится в localStorage, серверная
 * часть получает готовый список позиций только при оформлении заказа.
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((line) => line.product.product_id === product.product_id);
      if (existing) {
        return current.map((line) =>
          line.product.product_id === product.product_id
            ? { ...line, quantity: Math.min(line.quantity + quantity, 99) }
            : line
        );
      }
      return [...current, { product, quantity }];
    });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((line) => line.product.product_id !== productId)
        : current.map((line) =>
            line.product.product_id === productId
              ? { ...line, quantity: Math.min(quantity, 99) }
              : line
          )
    );
  }, []);

  const remove = useCallback((productId) => {
    setItems((current) => current.filter((line) => line.product.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const totals = useMemo(() => {
    const positions = items.length;
    const units = items.reduce((sum, line) => sum + line.quantity, 0);
    const amount = items.reduce(
      (sum, line) => sum + Number(line.product.price_retail) * line.quantity,
      0
    );
    return { positions, units, amount };
  }, [items]);

  const value = useMemo(
    () => ({ items, add, setQuantity, remove, clear, totals }),
    [items, add, setQuantity, remove, clear, totals]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart должен использоваться внутри CartProvider");
  }
  return context;
}
