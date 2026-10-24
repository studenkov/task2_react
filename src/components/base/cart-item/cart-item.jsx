import { Minus, Plus, Trash01 } from '@untitledui/icons';
import { Button } from '../buttons/button';
import { ButtonUtility } from '../buttons/button-utility';

export const CartItem = ({
  image,
  title,
  price,
  count,
  onIncreaseClick,
  onDecreaseClick,
  onRemoveClick,
}) => {
  return (
    <div className="flex items-center gap-4 p-4">
      <div className="flex items-center gap-4 flex-1">
        <img className="size-16 rounded-xl" src={image} alt={title} />

        <div className="flex flex-col min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-tertiary">{price} ₽ / шт.</p>
        </div>
      </div>

      <ButtonUtility
        color="primary"
        size="sm"
        tooltip="Удалить из корзины"
        icon={Trash01}
        onClick={onRemoveClick}
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center rounded-lg border border-secondary bg-primary ms-4 p-0.5">
          <Button
            color="tertiary"
            size="xs"
            iconLeading={Minus}
            aria-label="Уменьшить количество"
            onClick={onDecreaseClick}
          />

          <span className="text-sm font-semibold text-primary px-2">
            {count}
          </span>

          <Button
            color="tertiary"
            size="xs"
            iconLeading={Plus}
            aria-label="Увеличить количество"
            onClick={onIncreaseClick}
          />
        </div>

        <div className="min-w-24 text-end ps-4">
          <p className="text-lg font-bold text-primary">
            {Number((price * count).toFixed(2)).toLocaleString('ru-RU')} ₽
          </p>{' '}
        </div>
      </div>
    </div>
  );
};
