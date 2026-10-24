import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { AuthContext } from '@/context/AuthContext';
import {
  getCart,
  addToCart as apiAddToCart,
  updateCartItem as apiUpdateCartItem,
  deleteCartItem as apiDeleteCartItem,
} from '@/api/cart';

export const CartContext = createContext();

export function CartProvider({ children }) {
  const { session } = useContext(AuthContext);

  // Состояние корзины для авторизованного пользователя (с сервера)
  const [serverCart, setServerCart] = useState([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [serverTotalCount, setServerTotalCount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);

  // Состояние локальной корзины для гостя (сохраняется в localStorage)
  const [guestCart, setGuestCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cart_guest') || '[]');
    } catch {
      return [];
    }
  });

  const isAuthorized = Boolean(session?.id);

  // Вычисляемые данные для гостя
  const guestTotal = guestCart.reduce(
    (sum, item) =>
      sum +
      Number(item.price || item.unit_final_price || 0) *
        Number(item.count || item.quantity || 1),
    0,
  );
  const guestTotalCount = guestCart.reduce(
    (sum, item) => sum + Number(item.count || item.quantity || 1),
    0,
  );

  const cart = isAuthorized ? serverCart : guestCart;
  const total = isAuthorized ? serverTotal : guestTotal;
  const totalCount = isAuthorized ? serverTotalCount : guestTotalCount;

  const isLoading =
    actionLoading || Boolean(session?.id && loadedUserId !== session?.id);

  const clearCart = useCallback(() => {
    setServerCart([]);
    setServerTotal(0);
    setServerTotalCount(0);
    setLoadedUserId(null);
    setGuestCart([]);
    localStorage.removeItem('cart_guest');
  }, []);

  const loadCart = useCallback(async () => {
    if (!session?.id) return;

    try {
      setActionLoading(true);
      const data = await getCart(session.id);
      setServerCart(data.items || []);
      setServerTotal(data.totalAmount || 0);
      setServerTotalCount(data.totalCount || 0);
      setLoadedUserId(session.id);
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  }, [session?.id]);

  useEffect(() => {
    let ignore = false;
    if (!session?.id) {
      return;
    }

    async function syncAndLoad() {
      // Если у гостя были товары в localStorage, синхронизируем их в БД
      try {
        const guestItems = JSON.parse(
          localStorage.getItem('cart_guest') || '[]',
        );
        if (guestItems.length > 0) {
          for (const item of guestItems) {
            const pid = item.product_id || item.id;
            const qty = item.count || item.quantity || 1;
            await apiAddToCart({
              user_id: session.id,
              product_id: pid,
              quantity: qty,
            });
          }
          localStorage.removeItem('cart_guest');
          setGuestCart([]);
        }
      } catch (err) {
        console.error('Ошибка синхронизации гостевой корзины:', err);
      }

      try {
        const data = await getCart(session.id);
        if (!ignore) {
          setServerCart(data.items || []);
          setServerTotal(data.totalAmount || 0);
          setServerTotalCount(data.totalCount || 0);
          setLoadedUserId(session.id);
        }
      } catch (error) {
        if (!ignore) {
          console.error(error);
          setLoadedUserId(session.id);
        }
      }
    }

    syncAndLoad();

    return () => {
      ignore = true;
    };
  }, [session?.id]);

  async function addToCart(product, quantity = 1) {
    const productId =
      typeof product === 'object' ?
        product.product_id || product.id
      : product;

    if (!productId) {
      console.error('addToCart: отсутствует product_id', product);
      return false;
    }

    if (!session?.id) {
      setGuestCart((prev) => {
        const existing = prev.find(
          (p) => (p.product_id || p.id) === productId,
        );
        let next;
        if (existing) {
          next = prev.map((p) => {
            if ((p.product_id || p.id) === productId) {
              const nextCount = (p.count || p.quantity || 1) + quantity;
              return { ...p, count: nextCount, quantity: nextCount };
            }
            return p;
          });
        } else {
          const title = product.name || product.title || 'Роутер';
          const price = Number(
            product.final_price || product.price || 0,
          );
          const image = product.image_url || product.image || '';
          next = [
            ...prev,
            {
              id: productId,
              product_id: productId,
              title,
              name: title,
              price,
              unit_final_price: price,
              image,
              image_url: image,
              count: quantity,
              quantity,
            },
          ];
        }
        localStorage.setItem('cart_guest', JSON.stringify(next));
        return next;
      });
      return true;
    }

    await apiAddToCart({
      user_id: session.id,
      product_id: productId,
      quantity,
    });
    await loadCart();
    return true;
  }

  async function updateQuantity(cartItemId, quantity) {
    if (!session?.id) {
      setGuestCart((prev) => {
        let next;
        if (quantity <= 0) {
          next = prev.filter(
            (p) => (p.cart_item_id || p.product_id || p.id) !== cartItemId,
          );
        } else {
          next = prev.map((p) => {
            if (
              (p.cart_item_id || p.product_id || p.id) === cartItemId
            ) {
              return { ...p, count: quantity, quantity };
            }
            return p;
          });
        }
        localStorage.setItem('cart_guest', JSON.stringify(next));
        return next;
      });
      return;
    }

    if (quantity <= 0) {
      await deleteFromCart(cartItemId);
      return;
    }
    await apiUpdateCartItem(cartItemId, quantity);
    await loadCart();
  }

  async function increase(item) {
    const cartItemId = item.cart_item_id || item.product_id || item.id;
    const currentQty = item.quantity || item.count || 1;
    await updateQuantity(cartItemId, currentQty + 1);
  }

  async function decrease(item) {
    const cartItemId = item.cart_item_id || item.product_id || item.id;
    const currentQty = item.quantity || item.count || 1;

    if (currentQty <= 1) {
      await deleteFromCart(cartItemId);
    } else {
      await updateQuantity(cartItemId, currentQty - 1);
    }
  }

  async function deleteFromCart(itemOrId) {
    const cartItemId =
      typeof itemOrId === 'object' ?
        itemOrId.cart_item_id || itemOrId.product_id || itemOrId.id
      : itemOrId;

    if (!session?.id) {
      setGuestCart((prev) => {
        const next = prev.filter(
          (p) => (p.cart_item_id || p.product_id || p.id) !== cartItemId,
        );
        localStorage.setItem('cart_guest', JSON.stringify(next));
        return next;
      });
      return;
    }

    await apiDeleteCartItem(cartItemId);
    await loadCart();
  }

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        totalCount,
        isLoading,
        loadCart,
        clearCart,
        addToCart,
        increase,
        updateQuantity,
        decrease,
        deleteFromCart,
      }}>
      {children}
    </CartContext.Provider>
  );
}
