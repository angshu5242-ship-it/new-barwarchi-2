import crypto from 'node:crypto';

function sessionSecret() {
  return (
    process.env.AUTH_SECRET ||
    process.env.OTP_SECRET ||
    'nb2-local-dev-session-secret-change-me'
  );
}

/**
 * Creates a compact, signed session token. This proves the customer completed
 * OTP verification without storing anything sensitive in the browser.
 */
export function createSessionToken(phone, ttlMs = 24 * 60 * 60 * 1000) {
  const payload = Buffer.from(
    JSON.stringify({ phone, exp: Date.now() + ttlMs }),
    'utf8',
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Returns { phone, exp } for a valid token, or null when the token is missing,
 * tampered with or expired.
 */
export function verifySessionToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url');

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!data?.phone || !Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
    return { phone: String(data.phone), exp: Number(data.exp) };
  } catch {
    return null;
  }
}

function signedPayload(data) {
  const payload = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

function readSignedPayload(token) {
  if (typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = crypto
    .createHmac('sha256', sessionSecret())
    .update(payload)
    .digest('base64url');

  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (
    receivedBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

/** Signed 12-hour staff session. Staff accounts are checked again on login. */
export function createStaffSessionToken(staff, ttlMs = 12 * 60 * 60 * 1000) {
  return signedPayload({
    kind: 'staff',
    staffId: staff.id,
    username: staff.username,
    role: staff.role || 'staff',
    exp: Date.now() + ttlMs,
  });
}

export function verifyStaffSessionToken(token) {
  const data = readSignedPayload(token);
  if (!data || data.kind !== 'staff' || !data.staffId) return null;
  if (!Number.isFinite(data.exp) || data.exp <= Date.now()) return null;
  return {
    staffId: String(data.staffId),
    username: String(data.username || ''),
    role: String(data.role || 'staff'),
    exp: Number(data.exp),
  };
}
