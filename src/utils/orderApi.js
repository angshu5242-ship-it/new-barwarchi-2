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
