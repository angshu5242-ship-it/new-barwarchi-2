import {
  defaultDeliveryZones,
  defaultPaymentSettings,
  defaultPrepTimes,
  loyaltyConfig,
  normalizeDeliveryZones,
  normalizeLoyaltySettings,
  normalizePaymentSettings,
  normalizePrepTimes,
  normalizeSiteConfig,
} from '../src/data/delivery.js';

export const SETTINGS_KEYS = {
  deliveryZones: 'deliveryZones',
  loyalty: 'loyaltySettings',
  payment: 'paymentSettings',
  prepTimes: 'prepTimes',
  availability: 'availability',
};

function parseJson(value) {
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

export function normalizeAvailability(value = {}) {
  const soldOut = Array.isArray(value?.soldOut)
    ? [...new Set(value.soldOut.map((entry) => String(entry).slice(0, 80)).filter(Boolean))].slice(0, 300)
    : [];
  return {
    soldOut,
    updatedAt: value?.updatedAt || null,
    updatedBy: value?.updatedBy ? String(value.updatedBy).slice(0, 80) : '',
  };
}

export function defaultSettings() {
  const payment = normalizePaymentSettings({
    ...defaultPaymentSettings,
    upiId: process.env.UPI_ID || '',
    upiName: process.env.UPI_NAME || defaultPaymentSettings.upiName,
    upiEnabled: Boolean(process.env.UPI_ID),
  });

  return {
    deliveryZones: normalizeDeliveryZones(defaultDeliveryZones),
    loyalty: normalizeLoyaltySettings(loyaltyConfig),
    payment,
    prepTimes: normalizePrepTimes(defaultPrepTimes),
    availability: normalizeAvailability(),
  };
}

export async function readSettings(sql) {
  const fallback = defaultSettings();
  if (!sql) return fallback;

  const rows = await sql`
    SELECT key, value
    FROM site_settings
    WHERE key IN (
      ${SETTINGS_KEYS.deliveryZones},
      ${SETTINGS_KEYS.loyalty},
      ${SETTINGS_KEYS.payment},
      ${SETTINGS_KEYS.prepTimes},
      ${SETTINGS_KEYS.availability}
    )
  `;

  const byKey = new Map(rows.map((row) => [row.key, parseJson(row.value)]));
  return normalizeSiteConfig({
    deliveryZones: byKey.get(SETTINGS_KEYS.deliveryZones) ?? fallback.deliveryZones,
    loyalty: byKey.get(SETTINGS_KEYS.loyalty) ?? fallback.loyalty,
    payment: byKey.get(SETTINGS_KEYS.payment) ?? fallback.payment,
    prepTimes: byKey.get(SETTINGS_KEYS.prepTimes) ?? fallback.prepTimes,
  });
}

export async function readAvailability(sql) {
  if (!sql) return normalizeAvailability();
  const rows = await sql`
    SELECT value FROM site_settings WHERE key = ${SETTINGS_KEYS.availability} LIMIT 1
  `;
  return normalizeAvailability(parseJson(rows[0]?.value));
}

export async function writeSettings(sql, patch = {}) {
  if (!sql) {
    return { settings: normalizeSiteConfig(patch), persisted: false };
  }

  const normalized = normalizeSiteConfig(patch);
  const entries = [
    [SETTINGS_KEYS.deliveryZones, normalized.deliveryZones],
    [SETTINGS_KEYS.loyalty, normalized.loyalty],
    [SETTINGS_KEYS.payment, normalized.payment],
    [SETTINGS_KEYS.prepTimes, normalized.prepTimes],
  ];

  for (const [key, value] of entries) {
    await sql`
      INSERT INTO site_settings (key, value, updated_at)
      VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
    `;
  }

  return { settings: normalized, persisted: true };
}

export async function writeAvailability(sql, availability) {
  const normalized = normalizeAvailability(availability);
  if (!sql) return { availability: normalized, persisted: false };

  await sql`
    INSERT INTO site_settings (key, value, updated_at)
    VALUES (${SETTINGS_KEYS.availability}, ${JSON.stringify(normalized)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `;
  return { availability: normalized, persisted: true };
}

export { normalizeSiteConfig };
