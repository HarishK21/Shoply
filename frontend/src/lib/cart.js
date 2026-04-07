import { apiFetch, clearAuthSession, getAuthToken } from './auth';

const readResponse = async (response) => {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }
  return payload;
};

const ensureSuccess = async (response) => {
  const payload = await readResponse(response);
  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
      throw new Error(payload.message || 'Session expired. Please login again.');
    }
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
};

export const fetchCart = async () => {
  if (!getAuthToken()) return [];
  const response = await apiFetch('/api/cart');
  const payload = await ensureSuccess(response);
  return Array.isArray(payload.items) ? payload.items : [];
};

export const addItemToCart = async (itemId, quantity = 1) => {
  const response = await apiFetch('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify({ itemId, quantity })
  });
  const payload = await ensureSuccess(response);
  window.dispatchEvent(new Event('cartUpdated'));
  return Array.isArray(payload.items) ? payload.items : [];
};

export const updateCartItemQuantity = async (itemId, quantity) => {
  const response = await apiFetch(`/api/cart/items/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity })
  });
  const payload = await ensureSuccess(response);
  window.dispatchEvent(new Event('cartUpdated'));
  return Array.isArray(payload.items) ? payload.items : [];
};

export const removeItemFromCart = async (itemId) => {
  const response = await apiFetch(`/api/cart/items/${itemId}`, {
    method: 'DELETE'
  });
  const payload = await ensureSuccess(response);
  window.dispatchEvent(new Event('cartUpdated'));
  return Array.isArray(payload.items) ? payload.items : [];
};

export const clearCart = async () => {
  const response = await apiFetch('/api/cart', {
    method: 'DELETE'
  });
  const payload = await ensureSuccess(response);
  window.dispatchEvent(new Event('cartUpdated'));
  return Array.isArray(payload.items) ? payload.items : [];
};
