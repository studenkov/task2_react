const API_URL = 'http://localhost:3001/api/auth';

async function handleResponse(response, fallbackError) {
  const isJson = response.headers
    .get('content-type')
    ?.includes('application/json');
  let data = null;

  if (isJson) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    if (data?.error || data?.message) {
      throw new Error(data.error || data.message);
    }
    if (response.status === 404) {
      throw new Error('Эндпоинт авторизации не найден на сервере (404)');
    }
    if (response.status >= 500) {
      throw new Error('Сервер временно недоступен (500). Попробуйте позже');
    }
    throw new Error(fallbackError);
  }

  return data;
}

export async function login(credentials, maybePassword) {
  const payload =
    typeof credentials === 'string' ?
      { email: credentials, password: maybePassword }
    : credentials;

  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse(response, 'Неверный email или пароль');
}

export async function register(userData, maybePassword, maybeName) {
  const payload =
    typeof userData === 'string' ?
      { email: userData, password: maybePassword, full_name: maybeName }
    : userData;

  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  return handleResponse(response, 'Ошибка при регистрации');
}

export async function getMe(token) {
  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response, 'Ошибка проверки токена авторизации');
}

export function getAuthHeaders() {
  try {
    const session = JSON.parse(localStorage.getItem('session') || 'null');
    if (session?.token) {
      return { Authorization: `Bearer ${session.token}` };
    }
  } catch {
    // игнорируем ошибку парсинга
  }
  return {};
}
