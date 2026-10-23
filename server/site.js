import { ensureSchema, getSql } from './orders.js';
import { sanitizeMenuStyle } from '../src/data/menuStyles.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nb2admin2024';

function adminAuthorized(headers) {
  return headers['x-admin-password'] === ADMIN_PASSWORD;
}

function parseValue(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

export async function getSiteSettings() {
  const sql = getSql();
  if (!sql) {
    return {
      status: 200,
      body: { ok: true, persisted: false, settings: {} },
    };
  }

  await ensureSchema();
  const rows = await sql`SELECT key, value FROM site_settings`;
  const settings = {};

  for (const row of rows) {
    if (row.key === 'menuStyle') {
      const value = parseValue(row.value);
      if (value) settings.menuStyle = sanitizeMenuStyle(value);
    }
  }

  return {
    status: 200,
    body: { ok: true, persisted: true, settings },
  };
}

export async function saveMenuStyle(style, headers) {
  if (!adminAuthorized(headers)) {
    return { status: 401, body: { ok: false, error: 'Admin password is required.' } };
  }

  const sanitized = sanitizeMenuStyle(style);
  const sql = getSql();
  if (!sql) {
    return {
      status: 200,
      body: { ok: true, persisted: false, style: sanitized },
    };
  }

  await ensureSchema();
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('menuStyle', ${JSON.stringify(sanitized)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = now()
  `;

  return {
    status: 200,
    body: { ok: true, persisted: true, style: sanitized },
  };
}

export async function handleSiteRequest({ method = 'GET', headers = {}, body = null }) {
  try {
    if (method === 'GET') return await getSiteSettings();
    if (method === 'POST') {
      return await saveMenuStyle(body?.menuStyle ?? body, headers);
    }
    return { status: 405, body: { ok: false, error: 'Method not allowed.' } };
  } catch (error) {
    console.error('[site]', error);
    return {
      status: 500,
      body: { ok: false, error: 'The site settings service is unavailable right now.' },
    };
  }
}
