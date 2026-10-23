import apiRequest from './apiRequest';

const SITE_PATH = '/api/site';
const STYLIST_PATH = '/api/menu-stylist';

export function getSiteSettings() {
  return apiRequest(`${SITE_PATH}?ts=${Date.now()}`, { cache: 'no-store' });
}

export function saveSiteMenuStyle(menuStyle, password) {
  return apiRequest(SITE_PATH, {
    method: 'POST',
    headers: { 'x-admin-password': password },
    body: JSON.stringify({ menuStyle }),
  });
}

export function saveSiteContent(siteContent, password) {
  return apiRequest(SITE_PATH, {
    method: 'POST',
    headers: { 'x-admin-password': password },
    body: JSON.stringify({ siteContent }),
  });
}

export function generateMenuStyle(prompt, currentStyle, password) {
  return apiRequest(STYLIST_PATH, {
    method: 'POST',
    headers: { 'x-admin-password': password },
    body: JSON.stringify({ prompt, currentStyle }),
  });
}
