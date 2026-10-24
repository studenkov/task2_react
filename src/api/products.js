const API_URL = 'http://localhost:3001/api/products';

export async function getProducts(categoryIds = []) {
  const query =
    categoryIds.length > 0 ? `?categories=${categoryIds.join(',')}` : '';
  const response = await fetch(`${API_URL}${query}`);
  if (!response.ok) throw new Error('Ошибка при получении товаров');
  return await response.json();
}

export async function getProductById(id) {
  const response = await fetch(`${API_URL}/${id}`);
  if (!response.ok) throw new Error('Ошибка при получении товара');
  return await response.json();
}

export async function createProduct(product) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error('Ошибка при создании товара');
  return await response.json();
}

export async function updateProduct(id, product) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении товара');
  return await response.json();
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Ошибка при удалении товара');
}
