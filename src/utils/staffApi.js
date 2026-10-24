import apiRequest from './apiRequest';

const STAFF_PATH = '/api/staff';

function bearer(token) {
  return { Authorization: `Bearer ${token}` };
}

export function staffLogin(username, password) {
  return apiRequest(`${STAFF_PATH}?action=login`, {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getStaffSession(token) {
  return apiRequest(`${STAFF_PATH}?action=me&ts=${Date.now()}`, {
    headers: bearer(token),
    cache: 'no-store',
  });
}

export function getStaffOrders(token) {
  return apiRequest(`/api/orders?admin=1&ts=${Date.now()}`, {
    headers: bearer(token),
    cache: 'no-store',
  });
}

export function updateStaffOrderStatus(orderId, status, token) {
  return apiRequest('/api/orders', {
    method: 'PATCH',
    headers: bearer(token),
    body: JSON.stringify({ id: orderId, status }),
  });
}

export function setStaffItemAvailability(itemId, soldOut, token) {
  return apiRequest('/api/orders', {
    method: 'PATCH',
    headers: bearer(token),
    body: JSON.stringify({ action: 'availability', itemId, soldOut }),
  });
}

export function updateStaffPaymentStatus(orderId, paymentStatus, token) {
  return apiRequest('/api/orders', {
    method: 'PATCH',
    headers: bearer(token),
    body: JSON.stringify({ action: 'payment', id: orderId, paymentStatus }),
  });
}

export function sendStaffReviewRequest(orderId, token) {
  return apiRequest('/api/orders', {
    method: 'POST',
    headers: bearer(token),
    body: JSON.stringify({ action: 'review-request', id: orderId }),
  });
}

export function listStaff(adminPassword) {
  return apiRequest(`${STAFF_PATH}?action=list&ts=${Date.now()}`, {
    headers: { 'x-admin-password': adminPassword },
    cache: 'no-store',
  });
}

export function createStaff(payload, adminPassword) {
  return apiRequest(`${STAFF_PATH}?action=create`, {
    method: 'POST',
    headers: { 'x-admin-password': adminPassword },
    body: JSON.stringify(payload),
  });
}

export function updateStaff(id, payload, adminPassword) {
  return apiRequest(`${STAFF_PATH}?action=update`, {
    method: 'PATCH',
    headers: { 'x-admin-password': adminPassword },
    body: JSON.stringify({ id, ...payload }),
  });
}

export function deleteStaff(id, adminPassword) {
  return apiRequest(`${STAFF_PATH}?action=delete`, {
    method: 'DELETE',
    headers: { 'x-admin-password': adminPassword },
    body: JSON.stringify({ id }),
  });
}
