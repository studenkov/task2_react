import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Card } from '@/components/base/card/card';
import { CategoryAside } from '@/components/CategoryAside';
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator';
import { CartContext } from '@/context/CartContext';
import { AuthContext } from '@/context/AuthContext';
import { getProducts } from '@/api/products';
import { getCategories } from '@/api/categories';
import { useDelayedLoading } from '@/hooks/use-delayed-loading';

const HomePage = () => {
  const { addToCart } = useContext(CartContext);
  const { session } = useContext(AuthContext);
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const showSpinner = useDelayedLoading(status === 'loading', 350);

  useEffect(() => {
    let ignore = false;

    getCategories()
      .then((data) => {
        if (!ignore) {
          setCategories(Array.isArray(data) ? data : []);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Ошибка при получении категорий:', err);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    getProducts(selectedCategories)
      .then((response) => {
        if (!ignore) {
          const items =
            Array.isArray(response) ? response : response.items || [];
          setProducts(items);
          setStatus('ready');
        }
      })
      .catch((requestError) => {
        if (!ignore) {
          setError(requestError.message || 'Ошибка загрузки данных');
          setStatus('error');
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedCategories]);

  const handleCategoryChange = (newCategories) => {
    setStatus('loading');
    setError('');
    setSelectedCategories(newCategories);
  };

  const handleAdd = (product) => {
    addToCart(product);
    navigate('/cart');
  };

  const handleCategoryCreated = (newCategory) => {
    setCategories((prev) => [...prev, newCategory]);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 md:px-8 py-8 md:py-12">
      <div className="prose mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Каталог роутеров
        </h1>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-8">
        <CategoryAside
          categories={categories}
          selectedCategories={selectedCategories}
          onChange={handleCategoryChange}
          onCategoryCreated={handleCategoryCreated}
          isAdmin={session?.role === 'admin'}
        />

        <div className="flex-1 w-full min-w-0">
          {status === 'loading' && showSpinner && (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <LoadingIndicator size="lg" className="text-fg-brand-primary" />
              <p className="text-sm font-medium text-tertiary">
                Загрузка каталога
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="p-4 rounded-xl bg-error-primary border border-error_subtle my-6">
              <p className="text-sm font-medium text-text-error-primary">
                Не удалось загрузить каталог: {error}
              </p>
            </div>
          )}

          {status === 'ready' && products.length === 0 && (
            <div className="py-24 text-center">
              <p className="text-sm text-tertiary">
                В выбранных категориях роутеры не найдены
              </p>
            </div>
          )}

          {status === 'ready' && products.length > 0 && (
            <div className="grid w-full gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => {
                const title = product.name;
                const price = Number(
                  product.final_price || product.salePrice || product.price,
                );
                const originalPrice = Number(product.price);
                const imageUrl = product.image_url || product.image;
                const hasDiscount = product.discount_percent > 0;

                return (
                  <div key={product.id} className="relative flex flex-col">
                    {hasDiscount && (
                      <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-xs font-semibold text-white bg-red-500 rounded-md shadow-xs">
                        -{product.discount_percent}%
                      </span>
                    )}

                    <Card
                      image={imageUrl}
                      title={title}
                      description={product.description}
                      price={price}
                      originalPrice={hasDiscount ? originalPrice : null}
                      onAddClick={() =>
                        handleAdd({
                          id: product.id,
                          name: title,
                          price: price,
                          image: imageUrl,
                        })
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomePage;
