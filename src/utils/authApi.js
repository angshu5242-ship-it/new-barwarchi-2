import apiRequest from './apiRequest';

const AUTH_PATH = '/api/auth';

export function requestOtp(phone) {
  return apiRequest(`${AUTH_PATH}?action=request`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifyOtp(phone, code) {
  return apiRequest(`${AUTH_PATH}?action=verify`, {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}
