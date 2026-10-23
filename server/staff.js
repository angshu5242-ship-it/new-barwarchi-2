import crypto from 'node:crypto';
import { ensureSchema, getSql } from './orders.js';
import { createStaffSessionToken, verifyStaffSessionToken } from './session.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nb2admin2024';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 10 * 60 * 1000;
const ROLES = ['staff', 'manager'];

function adminAuthorized(headers) {
  return headers['x-admin-password'] === ADMIN_PASSWORD;
}

function cleanText(value, max = 120) {
  return Array.from(String(value ?? ''))
    .filter((character) => {
      const code = character.codePointAt(0);
      return code >= 32 && code !== 127;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(-10);
}

function validPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function normalizeUsername(value) {
  return cleanText(value, 30).toLowerCase();
}

function validUsername(username) {
  return /^[a-z0-9._-]{3,30}$/.test(username);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  try {
    const [scheme, salt, hash] = String(stored).split('$');
    if (scheme !== 'scrypt' || !salt || !hash) return false;
    const expected = Buffer.from(hash, 'hex');
    const candidate = crypto.scryptSync(String(password), salt, 64);
    return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
  } catch {
    return false;
  }
}

function publicStaff(row) {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    phone: row.phone || '',
    role: row.role || 'staff',
    active: Boolean(row.active),
    lockedUntil: row.locked_until
      ? row.locked_until instanceof Date
        ? row.locked_until.toISOString()
        : String(row.locked_until)
      : null,
    lastLoginAt: row.last_login_at
      ? row.last_login_at instanceof Date
        ? row.last_login_at.toISOString()
        : String(row.last_login_at)
      : null,
    createdAt:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
  };
}

function tokenFromHeaders(headers) {
  const value = headers.authorization || headers.Authorization || '';
  return String(value).startsWith('Bearer ') ? String(value).slice(7).trim() : '';
}

async function seedDefaultStaff(sql) {
  const username = normalizeUsername(process.env.STAFF_SEED_USERNAME);
  const password = String(process.env.STAFF_SEED_PASSWORD || '');
  if (!validUsername(username) || password.length < 8) return;

  const rows = await sql`SELECT count(*)::int AS count FROM staff_users`;
  if (Number(rows[0]?.count) > 0) return;

  await sql`
    INSERT INTO staff_users (id, username, display_name, phone, password_hash, role, active)
    VALUES (
      ${crypto.randomUUID()},
      ${username},
      ${cleanText(process.env.STAFF_SEED_DISPLAY_NAME || 'Kitchen Staff', 60)},
      ${normalizePhone(process.env.STAFF_SEED_PHONE || '')},
      ${hashPassword(password)},
      'staff',
      true
    )
    ON CONFLICT DO NOTHING
  `;
  console.info(`[staff] Seeded the first staff account "${username}". Change its password in Admin → Staff.`);
}

async function ensureStaffReady() {
  const sql = getSql();
  if (!sql) return null;
  await ensureSchema();
  await seedDefaultStaff(sql);
  return sql;
}

async function activeStaffFromToken(headers, sql) {
  const token = tokenFromHeaders(headers);
  const session = verifyStaffSessionToken(token);
  if (!session) return null;
  const rows = await sql`
    SELECT * FROM staff_users WHERE id = ${session.staffId} AND active = true LIMIT 1
  `;
  return rows[0] || null;
}

export async function getStaffSession(headers) {
  const sql = await ensureStaffReady();
  if (!sql) {
    return { status: 503, body: { ok: false, error: 'Staff login needs DATABASE_URL to be configured.' } };
  }
  const row = await activeStaffFromToken(headers, sql);
  if (!row) return { status: 401, body: { ok: false, error: 'Staff session expired. Please sign in again.' } };
  return { status: 200, body: { ok: true, staff: publicStaff(row) } };
}

export async function loginStaff(body) {
  const sql = await ensureStaffReady();
  if (!sql) {
    return { status: 503, body: { ok: false, error: 'Staff login needs DATABASE_URL to be configured.' } };
  }

  const username = normalizeUsername(body?.username);
  const password = String(body?.password || '');
  if (!validUsername(username) || !password) {
    return { status: 400, body: { ok: false, error: 'Enter your staff username and password.' } };
  }

  const rows = await sql`SELECT * FROM staff_users WHERE lower(username) = ${username} LIMIT 1`;
  const row = rows[0];
  if (!row || !row.active) {
    return { status: 401, body: { ok: false, error: 'Wrong username or password.' } };
  }

  const lockedUntil = row.locked_until ? new Date(row.locked_until).getTime() : 0;
  if (lockedUntil && lockedUntil > Date.now()) {
    const wait = Math.ceil((lockedUntil - Date.now()) / 60000);
    return {
      status: 429,
      body: {
        ok: false,
        error: `Too many wrong passwords. Try again in ${wait} minute${wait === 1 ? '' : 's'}.`,
        retryAfter: wait * 60,
      },
    };
  }

  if (!verifyPassword(password, row.password_hash)) {
    const attempts = Number(row.failed_attempts || 0) + 1;
    const lock = attempts >= MAX_FAILED_ATTEMPTS ? new Date(Date.now() + LOCK_MS) : null;
    await sql`
      UPDATE staff_users
      SET failed_attempts = ${attempts},
          locked_until = ${lock},
          updated_at = now()
      WHERE id = ${row.id}
    `;
    return {
      status: 401,
      body: {
        ok: false,
        error:
          attempts >= MAX_FAILED_ATTEMPTS
            ? 'Too many wrong passwords. This staff login is locked for 10 minutes.'
            : 'Wrong username or password.',
      },
    };
  }

  await sql`
    UPDATE staff_users
    SET failed_attempts = 0,
        locked_until = NULL,
        last_login_at = now(),
        updated_at = now()
    WHERE id = ${row.id}
  `;

  return {
    status: 200,
    body: {
      ok: true,
      token: createStaffSessionToken(row, SESSION_TTL_MS),
      expiresAt: Date.now() + SESSION_TTL_MS,
      staff: publicStaff({ ...row, last_login_at: new Date() }),
    },
  };
}

export async function listStaff(headers) {
  if (!adminAuthorized(headers)) {
    return { status: 401, body: { ok: false, error: 'Admin password is required.' } };
  }
  const sql = await ensureStaffReady();
  if (!sql) {
    return { status: 200, body: { ok: true, staff: [], persisted: false } };
  }
  const rows = await sql`SELECT * FROM staff_users ORDER BY active DESC, display_name ASC`;
  return { status: 200, body: { ok: true, persisted: true, staff: rows.map(publicStaff) } };
}

export async function createStaff(body, headers) {
  if (!adminAuthorized(headers)) {
    return { status: 401, body: { ok: false, error: 'Admin password is required.' } };
  }
  const sql = await ensureStaffReady();
  if (!sql) {
    return { status: 503, body: { ok: false, error: 'Connect DATABASE_URL before adding staff.' } };
  }

  const username = normalizeUsername(body?.username);
  const displayName = cleanText(body?.displayName || body?.name, 60);
  const phone = normalizePhone(body?.phone);
  const password = String(body?.password || '');
  const role = ROLES.includes(body?.role) ? body.role : 'staff';

  if (!validUsername(username)) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'Username must be 3–30 characters using letters, numbers, dots, dashes or underscores.',
      },
    };
  }
  if (displayName.length < 2) {
    return { status: 400, body: { ok: false, error: 'Enter the staff member’s name.' } };
  }
  if (phone && !validPhone(phone)) {
    return { status: 400, body: { ok: false, error: 'Enter a valid 10-digit WhatsApp number, or leave it blank.' } };
  }
  if (password.length < 8) {
    return { status: 400, body: { ok: false, error: 'Use a password with at least 8 characters.' } };
  }

  try {
    const rows = await sql`
      INSERT INTO staff_users (id, username, display_name, phone, password_hash, role, active)
      VALUES (
        ${crypto.randomUUID()},
        ${username},
        ${displayName},
        ${phone},
        ${hashPassword(password)},
        ${role},
        ${body?.active !== false}
      )
      RETURNING *
    `;
    return { status: 201, body: { ok: true, staff: publicStaff(rows[0]) } };
  } catch (error) {
    if (error?.code === '23505') {
      return { status: 409, body: { ok: false, error: 'That username is already taken.' } };
    }
    throw error;
  }
}

export async function updateStaff(body, headers) {
  if (!adminAuthorized(headers)) {
    return { status: 401, body: { ok: false, error: 'Admin password is required.' } };
  }
  const sql = await ensureStaffReady();
  if (!sql) {
    return { status: 503, body: { ok: false, error: 'Connect DATABASE_URL before editing staff.' } };
  }

  const id = cleanText(body?.id, 60);
  if (!id) return { status: 400, body: { ok: false, error: 'Staff member is required.' } };

  const rows = await sql`SELECT * FROM staff_users WHERE id = ${id} LIMIT 1`;
  const row = rows[0];
  if (!row) return { status: 404, body: { ok: false, error: 'Staff member not found.' } };

  const displayName = cleanText(body?.displayName ?? row.display_name, 60);
  const phone = normalizePhone(body?.phone ?? row.phone);
  const role = ROLES.includes(body?.role) ? body.role : row.role;
  const active = body?.active === undefined ? Boolean(row.active) : Boolean(body.active);
  const password = body?.password ? String(body.password) : '';

  if (displayName.length < 2) {
    return { status: 400, body: { ok: false, error: 'Enter the staff member’s name.' } };
  }
  if (phone && !validPhone(phone)) {
    return { status: 400, body: { ok: false, error: 'Enter a valid 10-digit WhatsApp number, or leave it blank.' } };
  }
  if (password && password.length < 8) {
    return { status: 400, body: { ok: false, error: 'Use a password with at least 8 characters.' } };
  }

  const passwordHash = password ? hashPassword(password) : row.password_hash;
  const updated = await sql`
    UPDATE staff_users
    SET display_name = ${displayName},
        phone = ${phone},
        password_hash = ${passwordHash},
        role = ${role},
        active = ${active},
        failed_attempts = ${password ? 0 : row.failed_attempts},
        locked_until = ${password ? null : row.locked_until},
        updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  return { status: 200, body: { ok: true, staff: publicStaff(updated[0]) } };
}

export async function deleteStaff(body, headers) {
  if (!adminAuthorized(headers)) {
    return { status: 401, body: { ok: false, error: 'Admin password is required.' } };
  }
  const sql = await ensureStaffReady();
  if (!sql) {
    return { status: 503, body: { ok: false, error: 'Connect DATABASE_URL before removing staff.' } };
  }

  const id = cleanText(body?.id, 60);
  if (!id) return { status: 400, body: { ok: false, error: 'Staff member is required.' } };

  const rows = await sql`DELETE FROM staff_users WHERE id = ${id} RETURNING id`;
  if (!rows.length) return { status: 404, body: { ok: false, error: 'Staff member not found.' } };
  return { status: 200, body: { ok: true } };
}

export async function handleStaffRequest({ method = 'GET', query = {}, headers = {}, body = null }) {
  try {
    const action = String(query.action || body?.action || '');
    if (method === 'GET' && action === 'me') return await getStaffSession(headers);
    if (method === 'GET' && action === 'list') return await listStaff(headers);
    if (method === 'POST' && action === 'login') return await loginStaff(body);
    if (method === 'POST' && action === 'create') return await createStaff(body, headers);
    if (method === 'PATCH' && action === 'update') return await updateStaff(body, headers);
    if (method === 'DELETE' && action === 'delete') return await deleteStaff(body, headers);
    return { status: 404, body: { ok: false, error: 'Unknown staff action.' } };
  } catch (error) {
    console.error('[staff]', error);
    return {
      status: 500,
      body: { ok: false, error: 'The staff service is unavailable right now.' },
    };
  }
}
