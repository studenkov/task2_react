import { createContext, useState } from "react";

export const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  function addToCart(item) {
    if (cart.find((p) => p.id === item.id)) {
      setCart(
        cart.map((p) => (p.id === item.id ? { ...p, count: p.count + 1 } : p)),
      );
    } else {
      setCart([...cart, { ...item, count: 1 }]);
    }
  }

  function decrease(item) {
    setCart(
      cart
        .map((p) => (p.id === item.id ? { ...p, count: p.count - 1 } : p))
        .filter((p) => p.count > 0),
    );
  }

  function deleteFromCart(item) {
    setCart(cart.filter((p) => p.id !== item.id));
  }

  const total = cart.reduce((sum, p) => sum + p.price * p.count, 0);
  const totalCount = cart.reduce((sum, p) => sum + p.count, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        decrease,
        deleteFromCart,
        total,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
