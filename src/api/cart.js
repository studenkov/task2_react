import { getAuthHeaders } from './auth';

const API_URL = 'http://localhost:3001/api/cart';

export async function getCart(userId) {
  const query = userId ? `?user_id=${userId}` : '';
  const response = await fetch(`${API_URL}${query}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Ошибка при получении корзины');
  return await response.json();
}

export async function addToCart(cartItem) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(cartItem),
  });
  if (!response.ok) throw new Error('Ошибка при добавлении товара в корзину');
  return await response.json();
}

export async function updateCartItem(id, quantity) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ quantity }),
  });
  if (!response.ok) throw new Error('Ошибка при обновлении количества');
  return await response.json();
}

export async function deleteCartItem(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (!response.ok) throw new Error('Ошибка при удалении товара из корзины');
  return await response.json();
}
