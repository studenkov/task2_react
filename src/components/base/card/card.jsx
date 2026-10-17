import { cx } from "@/utils/cx";
import { Button } from "../buttons/button";

export const Card = ({ image, title, price, onAddClick, className }) => {
  return (
    <div
      className={cx(
        "flex flex-col rounded-xl ring-1 ring-secondary cursor-pointer",
        className,
      )}
    >
      <img
        className="aspect-square rounded-t-xl mb-4"
        src={image}
        alt={title}
      />
      <div className="w-full flex flex-col px-4">
        <p className="w-full py-2 text-lg font-semibold text-primary hover:text-fg-brand-secondary">
          {title}
        </p>
        <p className="text-xl font-black text-fg-brand-primary">{price} ₽</p>
      </div>
      <Button size="md" className="m-4" onClick={onAddClick}>
        В корзину
      </Button>
    </div>
  );
};
