import { neon } from '@neondatabase/serverless';
import { otpConfigured, otpDevModeEnabled } from './otp-config.js';
import { verifySessionToken, verifyStaffSessionToken } from './session.js';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'nb2admin2024';
const ORDER_STATUSES = [
  'new',
  'confirmed',
  'preparing',
  'ready',
  'out-for-delivery',
  'completed',
  'cancelled',
];

let sqlClient = null;
let schemaPromise = null;

const memory = {
  orders: [],
  customers: new Map(),
};

export function getSql() {
  if (!process.env.DATABASE_URL) return null;
  if (!sqlClient) sqlClient = neon(process.env.DATABASE_URL);
  return sqlClient;
}

export function getServiceStatus() {
  return {
    database: Boolean(process.env.DATABASE_URL),
    whatsapp: Boolean(
      process.env.WHATSAPP_TOKEN &&
        process.env.WHATSAPP_PHONE_NUMBER_ID &&
        (process.env.WHATSAPP_ORDER_TO || '919366986853'),
    ),
    otp: otpConfigured(),
    otpDevMode: otpDevModeEnabled(),
  };
}

export async function ensureSchema() {
  const sql = getSql();
  if (!sql) return false;
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          customer_name TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          order_type TEXT NOT NULL,
          address TEXT,
          notes TEXT,
          items JSONB NOT NULL,
          subtotal INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'new',
          whatsapp_sent BOOLEAN NOT NULL DEFAULT false,
          phone_verified BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        ALTER TABLE orders
        ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false
      `;
      await sql`CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (customer_phone)`;
      await sql`CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC)`;
      await sql`
        CREATE TABLE IF NOT EXISTS customers (
          phone TEXT PRIMARY KEY,
          name TEXT,
          address TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS otp_codes (
          phone TEXT PRIMARY KEY,
          code_hash TEXT NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS site_settings (
          key TEXT PRIMARY KEY,
          value JSONB NOT NULL,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS staff_users (
          id TEXT PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          display_name TEXT NOT NULL,
          phone TEXT NOT NULL DEFAULT '',
          password_hash TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'staff',
          active BOOLEAN NOT NULL DEFAULT true,
          failed_attempts INTEGER NOT NULL DEFAULT 0,
          locked_until TIMESTAMPTZ,
          last_login_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS staff_users_username_idx ON staff_users (lower(username))`;
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}

function cleanText(value, maxLength = 200) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(-10);
}

function phoneIsValid(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function makeOrderId() {
  const date = new Date();
  const stamp = [
    String(date.getFullYear()).slice(2),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  return `NB2-${stamp}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

function mapOrder(row) {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    orderType: row.order_type,
    address: row.address || '',
    notes: row.notes || '',
    items: row.items || [],
    subtotal: Number(row.subtotal) || 0,
    status: row.status || 'new',
    whatsappSent: Boolean(row.whatsapp_sent),
    phoneVerified: Boolean(row.phone_verified),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at || ''),
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at || ''),
  };
}

function validateOrder(body) {
  const customer = body?.customer || {};
  const name = cleanText(customer.name, 60);
  const phone = normalizePhone(customer.phone);
  const orderType = customer.orderType === 'delivery' ? 'delivery' : 'pickup';
  const address = cleanText(customer.address, 300);
  const notes = cleanText(body?.notes, 300);
  const rawItems = Array.isArray(body?.items) ? body.items : [];

  if (name.length < 2) return { error: 'Please enter your name.' };
  if (!phoneIsValid(phone)) return { error: 'Please enter a valid 10-digit mobile number.' };
  if (orderType === 'delivery' && address.length < 8) {
    return { error: 'Please enter a delivery address with a landmark.' };
  }

  const items = rawItems
    .slice(0, 40)
    .map((item) => {
      const quantity = Math.min(20, Math.max(1, Number(item.quantity) || 1));
      const price = Math.max(0, Math.min(5000, Number(item.price) || 0));
      return {
        id: cleanText(item.id, 80),
        name: cleanText(item.name, 120),
        portion: cleanText(item.portion, 40),
        price,
        quantity,
      };
    })
    .filter((item) => item.name && item.price > 0);

  if (!items.length) return { error: 'Your basket is empty.' };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal <= 0 || subtotal > 50000) {
    return { error: 'That order total looks incorrect. Please refresh and try again.' };
  }

  return {
    value: {
      name,
      phone,
      orderType,
      address: orderType === 'delivery' ? address : '',
      notes,
      items,
      subtotal,
      id: makeOrderId(),
    },
  };
}

function formatAddress(order) {
  if (order.orderType === 'delivery') return `Delivery · ${order.address}`;
  return 'Pickup · College Square, Belonia';
}

export function buildOrderAlert(order) {
  const name = order.customerName || order.name || 'Customer';
  const phone = order.customerPhone || order.phone || '';
  const itemLines = order.items.map(
    (item) =>
      `• ${item.quantity} × ${item.name}${item.portion ? ` (${item.portion})` : ''} — ₹${
        item.price * item.quantity
      }`,
  );
  return [
    `🛎️ NEW ORDER — ${order.id}`,
    '',
    `Name: ${name}`,
    `Phone: +91 ${phone}`,
    formatAddress(order),
    '',
    ...itemLines,
    '',
    `Total: ₹${order.subtotal}`,
    order.notes ? `Notes: ${order.notes}` : '',
    '',
    'Reply on WhatsApp to confirm the order.',
  ]
    .filter(Boolean)
    .join('\n');
}

async function whatsAppRecipients() {
  const numbers = new Set(
    String(process.env.WHATSAPP_ORDER_TO || '919366986853')
      .split(',')
      .map((number) => normalizePhone(number))
      .filter((number) => phoneIsValid(number)),
  );

  // Active staff with a WhatsApp number get the same alert as the owner.
  if (process.env.WHATSAPP_NOTIFY_STAFF !== 'false') {
    const sql = getSql();
    if (sql) {
      try {
        await ensureSchema();
        const rows = await sql`
          SELECT phone FROM staff_users WHERE active = true AND phone <> ''
        `;
        rows.forEach((row) => {
          const phone = normalizePhone(row.phone);
          if (phoneIsValid(phone)) numbers.add(phone);
        });
      } catch (error) {
        console.error('[orders] Could not load staff notification numbers:', error);
      }
    }
  }

  return [...numbers];
}

async function sendWhatsApp(order) {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { sent: false, reason: 'WhatsApp Cloud API is not configured.' };
  }

  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
  const endpoint = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  const recipients = await whatsAppRecipients();
  if (!recipients.length) {
    return { sent: false, reason: 'No WhatsApp recipients are configured.' };
  }
  const templateName = process.env.WHATSAPP_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_TEMPLATE_LANG || 'en';
  const text = buildOrderAlert(order);
  const itemSummary = order.items
    .map(
      (item) =>
        `${item.quantity}x ${item.name}${item.portion ? ` (${item.portion})` : ''} ₹${
          item.price * item.quantity
        }`,
    )
    .join(', ')
    .slice(0, 700);

  const sendTo = async (to) => {
    const payload = templateName
      ? {
          messaging_product: 'whatsapp',
          to: `91${to}`,
          type: 'template',
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: order.id },
                  { type: 'text', text: order.customerName },
                  { type: 'text', text: `+91 ${order.customerPhone}` },
                  { type: 'text', text: formatAddress(order) },
                  { type: 'text', text: itemSummary },
                  { type: 'text', text: `₹${order.subtotal}` },
                  { type: 'text', text: order.notes || '—' },
                ],
              },
            ],
          },
        }
      : {
          messaging_product: 'whatsapp',
          to: `91${to}`,
          type: 'text',
          text: { preview_url: false, body: text },
        };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`WhatsApp API ${response.status}: ${detail.slice(0, 300)}`);
    }
    return response.json();
  };

  const results = await Promise.allSettled(recipients.map(sendTo));
  const failures = results
    .filter((result) => result.status === 'rejected')
    .map((result) => result.reason?.message || 'Unknown error');

  if (results.some((result) => result.status === 'fulfilled')) {
    return { sent: true, failures };
  }

  return {
    sent: false,
    reason: failures[0] || 'WhatsApp notification failed.',
    failures,
  };
}

function fallbackUrl(order) {
  const infoName = process.env.RESTAURANT_NAME || 'New Bawarchi 2';
  const number = String(process.env.RESTAURANT_WHATSAPP || '919366986853').replace(/\D/g, '');
  return `https://wa.me/${number}?text=${encodeURIComponent(
    `Hello ${infoName}! New order ${order.id}\n\n${buildOrderAlert(order)}`,
  )}`;
}

export async function createOrder(body) {
  const checked = validateOrder(body);
  if (checked.error) return { error: checked.error, status: 400 };
  const order = checked.value;
  const session = verifySessionToken(body?.authToken);
  const phoneVerified = Boolean(session && session.phone === order.phone);

  if (process.env.REQUIRE_PHONE_VERIFICATION === 'true' && !phoneVerified) {
    return {
      error: 'Please verify your mobile number with the OTP before placing the order.',
      status: 401,
    };
  }

  order.phoneVerified = phoneVerified;
  const sql = getSql();
  const service = getServiceStatus();

  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO orders (
        id, customer_name, customer_phone, order_type, address, notes,
        items, subtotal, status, phone_verified
      ) VALUES (
        ${order.id}, ${order.name}, ${order.phone}, ${order.orderType},
        ${order.address}, ${order.notes}, ${JSON.stringify(order.items)}::jsonb,
        ${order.subtotal}, 'new', ${phoneVerified}
      )
    `;
    await sql`
      INSERT INTO customers (phone, name, address, updated_at)
      VALUES (${order.phone}, ${order.name}, ${order.address || null}, now())
      ON CONFLICT (phone) DO UPDATE SET
        name = EXCLUDED.name,
        address = COALESCE(NULLIF(EXCLUDED.address, ''), customers.address),
        updated_at = now()
    `;
  } else {
    const storedOrder = {
      ...order,
      customerName: order.name,
      customerPhone: order.phone,
      status: 'new',
      whatsappSent: false,
      createdAt: new Date().toISOString(),
    };
    order.status = 'new';
    order.createdAt = storedOrder.createdAt;
    memory.orders.unshift(storedOrder);
    memory.customers.set(order.phone, {
      name: order.name,
      address: order.address,
      updatedAt: storedOrder.createdAt,
    });
  }

  const notify = await sendWhatsApp(order);
  if (notify.sent) {
    order.whatsappSent = true;
    if (sql) {
      await sql`UPDATE orders SET whatsapp_sent = true, updated_at = now() WHERE id = ${order.id}`;
    } else {
      const stored = memory.orders.find((entry) => entry.id === order.id);
      if (stored) stored.whatsappSent = true;
    }
  }

  return {
    status: 201,
    body: {
      ok: true,
      order: {
        ...order,
        customerName: order.name,
        customerPhone: order.phone,
        status: 'new',
        whatsappSent: Boolean(notify.sent),
        createdAt: new Date().toISOString(),
      },
      service,
      notify,
      fallbackUrl: fallbackUrl(order),
    },
  };
}

export async function getCustomerOrders(phone) {
  const normalized = normalizePhone(phone);
  if (!phoneIsValid(normalized)) return { error: 'Please enter a valid mobile number.', status: 400 };
  const sql = getSql();
  const service = getServiceStatus();

  if (!sql) {
    const customer = memory.customers.get(normalized);
    const orders = memory.orders
      .filter((order) => order.phone === normalized)
      .slice(0, 8)
      .map((order) => ({
        id: order.id,
        status: order.status || 'new',
        subtotal: order.subtotal,
        createdAt: order.createdAt || new Date().toISOString(),
        items: order.items,
      }));
    return {
      status: 200,
      body: { ok: true, service, customer: customer ? { name: customer.name } : null, orders },
    };
  }

  await ensureSchema();
  const rows = await sql`
    SELECT id, status, subtotal, created_at
    FROM orders
    WHERE customer_phone = ${normalized}
    ORDER BY created_at DESC
    LIMIT 8
  `;
  const customerRows = await sql`
    SELECT name FROM customers WHERE phone = ${normalized} LIMIT 1
  `;

  return {
    status: 200,
    body: {
      ok: true,
      service,
      customer: customerRows[0] ? { name: customerRows[0].name } : null,
      orders: rows.map((row) => ({
        id: row.id,
        status: row.status,
        subtotal: Number(row.subtotal) || 0,
        createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at),
      })),
    },
  };
}

function adminAuthorized(headers) {
  return headers['x-admin-password'] === ADMIN_PASSWORD;
}

async function staffAuthorized(headers) {
  const value = headers.authorization || headers.Authorization || '';
  const token = String(value).startsWith('Bearer ') ? String(value).slice(7).trim() : '';
  const session = verifyStaffSessionToken(token);
  if (!session) return false;

  const sql = getSql();
  if (!sql) return false;
  await ensureSchema();
  const rows = await sql`
    SELECT id FROM staff_users WHERE id = ${session.staffId} AND active = true LIMIT 1
  `;
  return rows.length > 0;
}

async function ordersAuthorized(headers) {
  return adminAuthorized(headers) || (await staffAuthorized(headers));
}

export async function getAllOrders(headers) {
  if (!(await ordersAuthorized(headers))) {
    return { status: 401, body: { ok: false, error: 'Staff sign-in or admin password is required.' } };
  }
  const sql = getSql();
  const service = getServiceStatus();
  if (!sql) {
    return {
      status: 200,
      body: {
        ok: true,
        service,
        orders: memory.orders.map((order) => ({
          ...order,
          customerName: order.customerName || order.name,
          customerPhone: order.customerPhone || order.phone,
        })),
      },
    };
  }

  await ensureSchema();
  const rows = await sql`
    SELECT * FROM orders ORDER BY created_at DESC LIMIT 100
  `;
  return {
    status: 200,
    body: { ok: true, service, orders: rows.map(mapOrder) },
  };
}

export async function updateOrderStatus({ id, status }, headers) {
  if (!(await ordersAuthorized(headers))) {
    return { status: 401, body: { ok: false, error: 'Staff sign-in or admin password is required.' } };
  }
  const cleanId = cleanText(id, 40);
  if (!cleanId || !ORDER_STATUSES.includes(status)) {
    return { status: 400, body: { ok: false, error: 'Unknown order or status.' } };
  }

  const sql = getSql();
  if (!sql) {
    const order = memory.orders.find((entry) => entry.id === cleanId);
    if (!order) return { status: 404, body: { ok: false, error: 'Order not found.' } };
    order.status = status;
    return { status: 200, body: { ok: true, order } };
  }

  await ensureSchema();
  const rows = await sql`
    UPDATE orders
    SET status = ${status}, updated_at = now()
    WHERE id = ${cleanId}
    RETURNING *
  `;
  if (!rows.length) return { status: 404, body: { ok: false, error: 'Order not found.' } };
  return { status: 200, body: { ok: true, order: mapOrder(rows[0]) } };
}

/**
 * Shared request handler used by the Vercel function and the local Vite
 * middleware. Keeping one handler ensures local development behaves like
 * production.
 */
export async function handleOrdersRequest({ method = 'GET', query = {}, headers = {}, body = null }) {
  try {
    if (method === 'GET') {
      if (query.health === '1' || query.health === 'true') {
        return { status: 200, body: { ok: true, service: getServiceStatus() } };
      }
      if (query.admin === '1') return await getAllOrders(headers);
      if (query.phone) return await getCustomerOrders(query.phone);
      return { status: 200, body: { ok: true, service: getServiceStatus() } };
    }

    if (method === 'POST') {
      return await createOrder(body);
    }

    if (method === 'PATCH') {
      return await updateOrderStatus({
        id: body?.id || query.id,
        status: body?.status || query.status,
      }, headers);
    }

    return { status: 405, body: { ok: false, error: 'Method not allowed.' } };
  } catch (error) {
    console.error('[orders]', error);
    return {
      status: 500,
      body: {
        ok: false,
        error:
          error?.message?.includes('fetch failed') || error?.message?.includes('connect')
            ? 'The order service could not reach the database. Please try again or order on WhatsApp.'
            : 'The order service is unavailable right now. Please try again or order on WhatsApp.',
      },
    };
  }
}

export { ORDER_STATUSES };
