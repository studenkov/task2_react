import { Card } from "@/components/base/card/card";
import { useContext } from "react";
import { useNavigate } from "react-router";
import { CartContext } from "@/context/CartContext";

const HomePage = () => {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate();

  const products = [
    {
      id: 1,
      image:
        "https://m.media-amazon.com/images/I/61h60ZXZHRL._AC_UF1000,1000_QL80_.jpg",
      title: "TP-Link Archer AX23",
      price: 4999,
    },
    {
      id: 2,
      image:
        "https://m.media-amazon.com/images/I/71nVafv1k6L._AC_UF894,1000_QL80_.jpg",
      title: "ASUS RT-AX55",
      price: 6499,
    },
    {
      id: 3,
      image:
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRLQJa-bZCA9k8KmMJK02JDZAhcrGUb7ZcWXGIUuGw6fg&s=10",
      title: "Keenetic Giga KN-1011",
      price: 16500,
    },
    {
      id: 4,
      image:
        "https://m.media-amazon.com/images/I/4144zdXMbHL._AC_UF1000,1000_QL80_.jpg",
      title: "Keenetic Titan BE7200",
      price: 30000,
    },
    {
      id: 5,
      image:
        "https://c.dns-shop.ru/thumb/st4/fit/wm/0/0/9fd33dff820b2e6a98f85f8b961c36ba/ea540c1c041cccc74f6635ca3f74404ccb6769328e5697c455da48106c1e7c97.jpg.webp",
      title: "TP-Link Archer C54",
      price: 2990,
    },
  ];

  function handleAdd(product) {
    addToCart(product);
    navigate("/cart");
  }

  return (
    <section className="mx-auto w-full max-w-container px-4 md:px-8 py-16 md:py-24">
      <div className="prose">
        <h1>Товары</h1>
      </div>

      <div className="grid w-full my-16 gap-6 grid-cols-4">
        {products.map((product) => (
          <Card
            key={product.id}
            image={product.image}
            title={product.title}
            price={product.price}
            onAddClick={() => handleAdd(product)}
          />
        ))}
      </div>
    </section>
  );
};

export default HomePage;
