import { ensureSchema, getSql } from './orders.js';
import { sanitizeMenuStyle } from '../src/data/menuStyles.js';
import { restaurantInfo as defaultRestaurantInfo } from '../src/data/site.js';
import { readAvailability, readSettings, writeSettings } from './settings.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nb2admin2024';
const MAX_SITE_CONTENT_BYTES = 3_500_000;

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

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeGoogleListingUrl(value) {
  const url = String(value || '');
  const hasPlaceId = /0x[0-9a-f]+:0x[0-9a-f]+/i.test(url) && !/0x0:0x/i.test(url);
  if (url.includes('/maps/place/') && hasPlaceId) return url;
  return defaultRestaurantInfo.googleListingUrl;
}

function normalizeSiteContent(value) {
  const content = parseValue(value);
  if (!isPlainObject(content)) return null;

  const categories = Array.isArray(content.categories) ? content.categories : null;
  const galleryImages = Array.isArray(content.galleryImages) ? content.galleryImages : null;
  const heroImages = Array.isArray(content.heroImages) ? content.heroImages : null;
  const restaurantInfo = isPlainObject(content.restaurantInfo) ? content.restaurantInfo : null;

  if (!categories || !galleryImages || !heroImages || !restaurantInfo) return null;

  // Keep a single accidental upload from filling the database or making the
  // public site settings response too large for a serverless function.
  if (categories.length > 100 || galleryImages.length > 300 || heroImages.length > 50) {
    return null;
  }

  return {
    categories,
    galleryImages,
    heroImages,
    restaurantInfo: {
      ...restaurantInfo,
      googleListingUrl: normalizeGoogleListingUrl(restaurantInfo.googleListingUrl),
    },
  };
}

export async function getSiteSettings() {
  const sql = getSql();
  if (!sql) {
    return {
      status: 200,
      body: {
        ok: true,
        persisted: false,
        settings: {
          config: await readSettings(null),
          availability: await readAvailability(null),
        },
      },
    };
  }

  await ensureSchema();
  const rows = await sql`SELECT key, value, updated_at FROM site_settings`;
  const settings = {
    config: await readSettings(sql),
    availability: await readAvailability(sql),
  };

  for (const row of rows) {
    if (row.key === 'menuStyle') {
      const value = parseValue(row.value);
      if (value) settings.menuStyle = sanitizeMenuStyle(value);
    }

    if (row.key === 'siteContent') {
      const value = normalizeSiteContent(row.value);
      if (value) {
        settings.siteContent = value;
        settings.siteContentUpdatedAt = row.updated_at
          ? new Date(row.updated_at).toISOString()
          : null;
      }
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

export async function saveSiteContent(content, headers) {
  if (!adminAuthorized(headers)) {
    return { status: 401, body: { ok: false, error: 'Admin password is required.' } };
  }

  const normalized = normalizeSiteContent(content);
  if (!normalized) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'The site content is incomplete. Save the menu, gallery, homepage photos and details together.',
      },
    };
  }

  const serialized = JSON.stringify(normalized);
  const bytes = Buffer.byteLength(serialized, 'utf8');
  if (bytes > MAX_SITE_CONTENT_BYTES) {
    return {
      status: 413,
      body: {
        ok: false,
        error:
          'This content is too large to publish online. Remove a few uploaded photos or use image URLs, then save again.',
      },
    };
  }

  const sql = getSql();
  if (!sql) {
    return {
      status: 200,
      body: {
        ok: true,
        persisted: false,
        siteContent: normalized,
      },
    };
  }

  await ensureSchema();
  const updatedAt = new Date().toISOString();
  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES ('siteContent', ${serialized}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET
      value = EXCLUDED.value,
      updated_at = now()
  `;

  return {
    status: 200,
    body: {
      ok: true,
      persisted: true,
      siteContent: normalized,
      updatedAt,
    },
  };
}

export async function saveSiteConfig(config, headers) {
  if (!adminAuthorized(headers)) {
    return { status: 401, body: { ok: false, error: 'Admin password is required.' } };
  }
  const sql = getSql();
  if (sql) await ensureSchema();
  const current = await readSettings(sql);
  const result = await writeSettings(sql, {
    ...current,
    ...(config && typeof config === 'object' ? config : {}),
  });
  return {
    status: 200,
    body: { ok: true, persisted: result.persisted, config: result.settings },
  };
}

export async function handleSiteRequest({ method = 'GET', headers = {}, body = null }) {
  try {
    if (method === 'GET') return await getSiteSettings();

    if (method === 'POST') {
      if (body?.config !== undefined) return await saveSiteConfig(body.config, headers);

      const siteContent = body?.siteContent ?? body?.content;
      if (siteContent !== undefined) return await saveSiteContent(siteContent, headers);

      // Keep the original single-style payload working as well.
      const menuStyle = body?.menuStyle ?? body?.style;
      if (menuStyle !== undefined) return await saveMenuStyle(menuStyle, headers);
      if (isPlainObject(body) && (body.preset || body.accent || body.bg)) {
        return await saveMenuStyle(body, headers);
      }

      return {
        status: 400,
        body: { ok: false, error: 'Send siteContent or menuStyle to save.' },
      };
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
