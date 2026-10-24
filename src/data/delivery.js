/**
 * Local delivery areas around Belonia.
 *
 * Fees are deliberately conservative estimates. The kitchen can change them in
 * Admin → Restaurant details; the order API reads the published values and
 * recalculates the fee on the server so a customer cannot edit it in the
 * browser.
 */
export const defaultDeliveryZones = [
  {
    id: 'college-square',
    name: 'College Square / Market',
    areas: 'College Square, Main Market, nearby lanes',
    fee: 0,
  },
  {
    id: 'court-motor-stand',
    name: 'Court Area / Motor Stand',
    areas: 'Court, Motor Stand, bus stand side',
    fee: 20,
  },
  {
    id: 'bbi-vidyapith',
    name: 'BBI / Vidyapith',
    areas: 'BBI, Vidyapith, school para',
    fee: 30,
  },
  {
    id: 'outskirts',
    name: 'Belonia outskirts',
    areas: 'Outer Belonia and nearby villages — confirm on WhatsApp',
    fee: 40,
  },
];

export const loyaltyConfig = {
  enabled: true,
  target: 5,
  reward: 50,
  rewardLabel: '₹50 off',
  description: 'Collect 5 stamps on completed orders and get ₹50 off your next order.',
};

export const defaultPaymentSettings = {
  upiId: '',
  upiName: 'New Bawarchi 2',
  upiEnabled: false,
};

export const defaultPrepTimes = [10, 20, 30, 45];

export const defaultSiteConfig = {
  deliveryZones: defaultDeliveryZones,
  loyalty: loyaltyConfig,
  payment: defaultPaymentSettings,
  prepTimes: defaultPrepTimes,
};

export function normalizePaymentSettings(value = {}) {
  const upiId = String(value?.upiId || '').trim().slice(0, 80);
  const upiName = String(value?.upiName || defaultPaymentSettings.upiName).trim().slice(0, 80);
  const upiEnabled = Boolean(value?.upiEnabled) && /^[a-zA-Z0-9._-]{2,}@[a-zA-Z]{2,}$/.test(upiId);
  return { upiId, upiName: upiName || defaultPaymentSettings.upiName, upiEnabled };
}

export function normalizeLoyaltySettings(value = {}) {
  return {
    enabled: value?.enabled !== false,
    target: Math.max(2, Math.min(20, Math.round(Number(value?.target) || loyaltyConfig.target))),
    reward: Math.max(10, Math.min(1000, Math.round(Number(value?.reward) || loyaltyConfig.reward))),
    rewardLabel: String(value?.rewardLabel || '').slice(0, 60) || `₹${Math.round(Number(value?.reward) || loyaltyConfig.reward)} off`,
    description: String(value?.description || '').slice(0, 240) || loyaltyConfig.description,
  };
}

export function normalizePrepTimes(value) {
  const list = Array.isArray(value) ? value : defaultPrepTimes;
  const cleaned = [...new Set(list.map((entry) => Math.round(Number(entry))).filter((entry) => entry >= 5 && entry <= 120))].slice(0, 6);
  return cleaned.length ? cleaned : defaultPrepTimes;
}

export function normalizeSiteConfig(value = {}) {
  return {
    deliveryZones: normalizeDeliveryZones(value?.deliveryZones),
    loyalty: normalizeLoyaltySettings(value?.loyalty),
    payment: normalizePaymentSettings(value?.payment),
    prepTimes: normalizePrepTimes(value?.prepTimes),
  };
}

export function normalizeDeliveryZones(zones) {
  const source = Array.isArray(zones) && zones.length ? zones : defaultDeliveryZones;
  return source
    .slice(0, 12)
    .map((zone, index) => ({
      id: String(zone?.id || `zone-${index + 1}`).slice(0, 50),
      name: String(zone?.name || `Delivery area ${index + 1}`).slice(0, 80),
      areas: String(zone?.areas || '').slice(0, 160),
      fee: Math.max(0, Math.min(200, Math.round(Number(zone?.fee) || 0))),
    }));
}

export function getDeliveryZone(zones, zoneId) {
  return normalizeDeliveryZones(zones).find((zone) => zone.id === zoneId) || null;
}
