const AUTH_TOKEN_KEY = 'authToken';
const USER_KEY = 'user';

export const getStoredUser = () => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      return null;
    }
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const storeAuthSession = ({ token, user }) => {
  if (!token || !user) {
    clearAuthSession();
    return false;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('authChanged'));
  return true;
};

export const clearAuthSession = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.dispatchEvent(new Event('authChanged'));
  window.dispatchEvent(new Event('cartUpdated'));
};

export const apiFetch = async (url, options = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const hasBody = options.body !== undefined && options.body !== null;
  const bodyIsFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (hasBody && !bodyIsFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(url, {
    ...options,
    headers
  });
};
