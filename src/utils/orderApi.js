import apiRequest from './apiRequest';

const API_PATH = '/api/orders';

export function getOrderServiceStatus() {
  return apiRequest(`${API_PATH}?health=1`, { cache: 'no-store' });
}

export function lookupCustomer(phone) {
  return apiRequest(`${API_PATH}?phone=${encodeURIComponent(phone)}`, { cache: 'no-store' });
}

export function submitOnlineOrder(payload) {
  return apiRequest(API_PATH, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getAdminOrders(password) {
  return apiRequest(`${API_PATH}?admin=1`, {
    cache: 'no-store',
    headers: { 'x-admin-password': password },
  });
}

export function patchOrderStatus(id, status, password) {
  return apiRequest(API_PATH, {
    method: 'PATCH',
    headers: { 'x-admin-password': password },
    body: JSON.stringify({ id, status }),
  });
}

export function getOrderTracking(id) {
  return apiRequest(`${API_PATH}?track=${encodeURIComponent(id)}`, { cache: 'no-store' });
}

export function getLoyalty(phone, token) {
  return apiRequest(
    `${API_PATH}?loyalty=${encodeURIComponent(phone)}&token=${encodeURIComponent(token)}`,
    { cache: 'no-store' },
  );
}

export function getAnalytics(days, password) {
  return apiRequest(`${API_PATH}?analytics=1&days=${encodeURIComponent(days)}`, {
    cache: 'no-store',
    headers: { 'x-admin-password': password },
  });
}

export function requestReview(id, password) {
  return apiRequest(API_PATH, {
    method: 'POST',
    headers: { 'x-admin-password': password },
    body: JSON.stringify({ action: 'review-request', id }),
  });
}

export function patchPaymentStatus(id, paymentStatus, password) {
  return apiRequest(API_PATH, {
    method: 'PATCH',
    headers: { 'x-admin-password': password },
    body: JSON.stringify({ action: 'payment', id, paymentStatus }),
  });
}
