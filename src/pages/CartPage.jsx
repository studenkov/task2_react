import { CartItem } from "@/components/base/cart-item/cart-item";
import { CartContext } from "@/context/CartContext";
import { useContext } from "react";

const CartPage = () => {
  const { cart, addToCart, decrease, deleteFromCart, total } =
    useContext(CartContext);

  const totalCount = cart.reduce((sum, item) => sum + item.count, 0);

  return (
    <section className="flex min-h-dvh flex-col mx-auto w-full max-w-container px-4 md:px-8 py-16 md:py-24">
      <div className="prose">
        <h1>Корзина</h1>
      </div>

      {cart.length > 0 ?
        <div className="flex flex-col w-full my-16">
          {cart.map((product) => (
            <CartItem
              key={product.id}
              image={product.image}
              title={product.title}
              price={product.price}
              count={product.count}
              onIncreaseClick={() => addToCart(product)}
              onDecreaseClick={() => decrease(product)}
              onRemoveClick={() => deleteFromCart(product)}
            />
          ))}

          <div className="flex items-center justify-between border-t border-secondary pe-4 py-6">
            <div className="flex flex-col">
              <span className="text-xl font-semibold text-primary">Итого:</span>
              <span className="text-sm text-tertiary">
                {totalCount}{" "}
                {totalCount === 1 ?
                  "товар"
                : totalCount < 5 ?
                  "товара"
                : "товаров"}
              </span>
            </div>
            <span className="text-2xl font-bold text-fg-brand-primary">
              {total} ₽
            </span>
          </div>
        </div>
      : <div className="flex flex-1 items-center justify-center">
          <p>Корзина пуста</p>
        </div>
      }
    </section>
  );
};

export default CartPage;
