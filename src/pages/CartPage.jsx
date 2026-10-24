import { useContext, useEffect, useState } from 'react';
import { CartItem } from '@/components/base/cart-item/cart-item';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';
import { AuthContext } from '@/context/AuthContext';
import { CartContext } from '@/context/CartContext';

function getPluralGoods(count) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'товаров';
  if (mod10 === 1) return 'товар';
  if (mod10 >= 2 && mod10 <= 4) return 'товара';
  return 'товаров';
}

const CartPage = () => {
  const { cart, increase, decrease, deleteFromCart, total, isLoading } =
    useContext(CartContext);
  const { session, updateSession, refreshUser } = useContext(AuthContext);
  const showSpinner = useDelayedLoading(isLoading, 300);

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    if (session?.token && refreshUser) {
      refreshUser();
    }
  }, [session?.token, refreshUser]);

  const totalCount = cart.reduce(
    (sum, item) => sum + (item.count || item.quantity || 0),
    0,
  );

  const rawSubtotal = Number(total || 0);
  const discountPercent = Number(session?.coupon_discount || 0);
  const discountAmount =
    discountPercent > 0 ? (rawSubtotal * discountPercent) / 100 : 0;
  const finalTotal = Math.max(0, rawSubtotal - discountAmount);

  const formatPrice = (value) =>
    Number(value || 0).toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });

  const handleApplyCoupon = async (event) => {
    event.preventDefault();
    const trimmedCode = couponCode.trim();

    if (!trimmedCode) {
      setCouponError('Введите промокод');
      return;
    }

    if (!session?.id) {
      setCouponError('Войдите в аккаунт для применения купона');
      return;
    }

    setCouponError('');
    setCouponSuccess('');
    setIsApplying(true);

    try {
      const response = await fetch('http://localhost:3001/api/coupons/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ?
            { Authorization: `Bearer ${session.token}` }
          : {}),
        },
        body: JSON.stringify({
          user_id: session.id,
          code: trimmedCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Неверный промокод');
      }

      updateSession({
        coupon_code: data.coupon_code,
        coupon_discount: data.coupon_discount,
      });

      setCouponSuccess(
        `Купон ${data.coupon_code} применен (-${data.coupon_discount}%)`,
      );
      setCouponCode('');
    } catch (err) {
      setCouponError(err.message || 'Ошибка применения промокода');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <section className="flex min-h-dvh flex-col mx-auto w-full max-w-container px-8 py-12">
      <div className="prose">
        <h1>Корзина</h1>
      </div>

      {isLoading ?
        showSpinner ?
          <div className="flex flex-1 items-center justify-center py-24">
            <LoadingIndicator
              size="md"
              type="line-spinner"
              label="Загрузка корзины..."
            />
          </div>
        : <div className="min-h-50" />
      : cart.length > 0 ?
        <div className="flex flex-col w-full my-12">
          {cart.map((product) => (
            <CartItem
              key={product.cart_item_id || product.id}
              image={product.image || product.image_url}
              title={product.title || product.name || 'Роутер'}
              price={Number(product.unit_final_price || product.price)}
              count={product.count || product.quantity}
              onIncreaseClick={() => increase(product)}
              onDecreaseClick={() => decrease(product)}
              onRemoveClick={() => deleteFromCart(product)}
            />
          ))}

          <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 items-start border-t border-secondary pt-8">
            <div className="lg:col-span-6 w-full max-w-md">
              <form
                onSubmit={handleApplyCoupon}
                className="flex flex-col gap-2">
                <label className="text-sm font-medium text-primary">
                  Промокод на скидку
                </label>
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <Input
                      placeholder="Например: SALE15"
                      value={couponCode}
                      onChange={(val) => {
                        const next =
                          typeof val === 'string' ? val : (
                            (val?.target?.value ?? '')
                          );
                        setCouponCode(next);
                        if (couponError) setCouponError('');
                        if (couponSuccess) setCouponSuccess('');
                      }}
                      isInvalid={Boolean(couponError)}
                      hint={couponError}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="md"
                    color="secondary"
                    isDisabled={isApplying || !couponCode.trim()}>
                    {isApplying ? '...' : 'Применить'}
                  </Button>
                </div>

                {couponSuccess && (
                  <p className="text-xs font-medium text-fg-brand-primary">
                    {couponSuccess}
                  </p>
                )}

                {session?.coupon_code && !couponSuccess && (
                  <p className="text-xs text-tertiary">
                    Активен купон:{' '}
                    <span className="font-semibold text-fg-brand-primary">
                      {session.coupon_code} (-{session.coupon_discount}%)
                    </span>
                  </p>
                )}
              </form>
            </div>

            <div className="lg:col-span-6 flex flex-col gap-3 rounded-2xl bg-secondary/20 p-6">
              <div className="flex justify-between text-sm text-tertiary">
                <span>
                  Товары ({totalCount} {getPluralGoods(totalCount)}):
                </span>
                <span className="font-medium text-primary">
                  {formatPrice(rawSubtotal)} ₽
                </span>
              </div>

              {discountPercent > 0 && (
                <div className="flex justify-between text-sm text-fg-brand-primary font-medium">
                  <span>Скидка по купону (-{discountPercent}%):</span>
                  <span>-{formatPrice(discountAmount)} ₽</span>
                </div>
              )}

              <div className="mt-2 flex items-baseline justify-between border-t border-secondary pt-4">
                <span className="text-lg font-semibold text-primary">
                  Итого к оплате:
                </span>
                <span className="text-2xl font-bold text-fg-brand-primary">
                  {formatPrice(finalTotal)} ₽
                </span>
              </div>
            </div>
          </div>
        </div>
      : <div className="flex flex-1 items-center justify-center py-24">
          <p className="text-tertiary">Корзина пуста</p>
        </div>
      }
    </section>
  );
};

export default CartPage;
