import { neon } from '@neondatabase/serverless';
import { otpConfigured, otpDevModeEnabled } from './otp-config.js';
import { verifySessionToken, verifyStaffSessionToken } from './session.js';
import {
  normalizeAvailability,
  readAvailability,
  readSettings,
  writeAvailability,
} from './settings.js';

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
  loyalty: new Map(),
  availability: normalizeAvailability(),
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
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_zone TEXT`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS total INTEGER NOT NULL DEFAULT 0`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS prep_minutes INTEGER NOT NULL DEFAULT 20`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'pay_later'`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending'`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_reward_used BOOLEAN NOT NULL DEFAULT false`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_stamp_awarded BOOLEAN NOT NULL DEFAULT false`;
      await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ`;
      await sql`CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (customer_phone)`;
      await sql`CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC)`;
      await sql`CREATE INDEX IF NOT EXISTS orders_ready_idx ON orders (ready_at)`;
      await sql`CREATE INDEX IF NOT EXISTS orders_review_idx ON orders (status, review_requested_at)`;
      await sql`
        CREATE TABLE IF NOT EXISTS customers (
          phone TEXT PRIMARY KEY,
          name TEXT,
          address TEXT,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS loyalty_accounts (
          phone TEXT PRIMARY KEY,
          stamps INTEGER NOT NULL DEFAULT 0,
          reward_available BOOLEAN NOT NULL DEFAULT false,
          total_completed INTEGER NOT NULL DEFAULT 0,
          rewards_redeemed INTEGER NOT NULL DEFAULT 0,
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
  // Order numbers are dated in the restaurant's timezone, not the server's.
  const stamp = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
  })
    .format(new Date())
    .replace(/-/g, '');
  return `NB2-${stamp}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function toIso(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapOrder(row) {
  const subtotal = Number(row.subtotal) || 0;
  const deliveryFee = Number(row.delivery_fee) || 0;
  const discount = Number(row.discount) || 0;
  const storedTotal = Number(row.total) || 0;
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    orderType: row.order_type,
    address: row.address || '',
    notes: row.notes || '',
    items: row.items || [],
    subtotal,
    deliveryZone: row.delivery_zone || '',
    deliveryFee,
    discount,
    total: storedTotal > 0 ? storedTotal : Math.max(0, subtotal + deliveryFee - discount),
    status: row.status || 'new',
    scheduledFor: toIso(row.scheduled_for),
    prepMinutes: Number(row.prep_minutes) || 20,
    readyAt: toIso(row.ready_at),
    paymentMethod: row.payment_method || 'pay_later',
    paymentStatus: row.payment_status || 'pending',
    loyaltyRewardUsed: Boolean(row.loyalty_reward_used),
    loyaltyStampAwarded: Boolean(row.loyalty_stamp_awarded),
    reviewRequestedAt: toIso(row.review_requested_at),
    whatsappSent: Boolean(row.whatsapp_sent),
    phoneVerified: Boolean(row.phone_verified),
    createdAt: toIso(row.created_at) || '',
    updatedAt: toIso(row.updated_at) || '',
  };
}

function parseScheduledFor(value) {
  if (!value) return { value: null };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { error: 'Please choose a valid scheduled date and time.' };
  }
  const now = Date.now();
  if (date.getTime() < now + 10 * 60 * 1000) {
    return { error: 'Scheduled orders must be at least 10 minutes from now.' };
  }
  if (date.getTime() > now + 7 * 24 * 60 * 60 * 1000) {
    return { error: 'Scheduled orders can be placed up to 7 days in advance.' };
  }
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      hour12: false,
    }).format(date),
  );
  if (hour < 8 || hour >= 22) {
    return { error: 'Scheduled orders must be between 8:00 AM and 10:00 PM.' };
  }
  return { value: date.toISOString() };
}

function validateOrder(body, settings, availability) {
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

  const soldOut = new Set((availability?.soldOut || []).map(String));
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
  const unavailable = items.find((item) => soldOut.has(String(item.id)));
  if (unavailable) {
    return { error: `${unavailable.name} is sold out right now. Please remove it from your basket.` };
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (subtotal <= 0 || subtotal > 50000) {
    return { error: 'That order total looks incorrect. Please refresh and try again.' };
  }

  const zone =
    orderType === 'delivery'
      ? (settings?.deliveryZones || []).find((entry) => entry.id === String(body?.deliveryZoneId || ''))
      : null;
  if (orderType === 'delivery' && !zone) {
    return { error: 'Please choose a valid delivery area.' };
  }

  const scheduled = parseScheduledFor(body?.scheduledFor);
  if (scheduled.error) return { error: scheduled.error };

  const prepMinutes = (settings?.prepTimes || []).includes(Number(body?.prepMinutes))
    ? Number(body.prepMinutes)
    : settings?.prepTimes?.[0] || 20;
  const readyAt = scheduled.value
    ? scheduled.value
    : new Date(Date.now() + prepMinutes * 60 * 1000).toISOString();
  const paymentMethod =
    body?.paymentMethod === 'upi' && settings?.payment?.upiEnabled ? 'upi' : 'pay_later';

  return {
    value: {
      name,
      phone,
      orderType,
      address: orderType === 'delivery' ? address : '',
      notes,
      items,
      subtotal,
      deliveryZone: zone?.name || '',
      deliveryZoneId: zone?.id || '',
      deliveryFee: zone ? Number(zone.fee) || 0 : 0,
      discount: 0,
      total: subtotal + (zone ? Number(zone.fee) || 0 : 0),
      scheduledFor: scheduled.value,
      prepMinutes,
      readyAt,
      paymentMethod,
      paymentStatus: 'pending',
      useLoyaltyReward: Boolean(body?.useLoyaltyReward),
      loyaltyRewardUsed: false,
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
    order.scheduledFor
      ? `Scheduled for: ${new Date(order.scheduledFor).toLocaleString('en-IN', {
          timeZone: 'Asia/Kolkata',
          dateStyle: 'medium',
          timeStyle: 'short',
        })}`
      : `Preparation time: ~${order.prepMinutes || 20} min`,
    order.paymentMethod === 'upi' ? 'Payment: UPI (verify before handover)' : 'Payment: pay at pickup/delivery',
    '',
    ...itemLines,
    '',
    `Subtotal: ₹${order.subtotal}`,
    order.deliveryFee ? `Delivery fee: ₹${order.deliveryFee}` : '',
    order.discount ? `Loyalty reward: -₹${order.discount}` : '',
    `Total: ₹${order.total ?? order.subtotal}`,
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

async function readLoyaltyAccount(sql, phone) {
  const normalized = normalizePhone(phone);
  if (!sql) {
    return (
      memory.loyalty.get(normalized) || {
        phone: normalized,
        stamps: 0,
        rewardAvailable: false,
        totalCompleted: 0,
        rewardsRedeemed: 0,
      }
    );
  }

  const rows = await sql`
    SELECT phone, stamps, reward_available, total_completed, rewards_redeemed
    FROM loyalty_accounts
    WHERE phone = ${normalized}
    LIMIT 1
  `;
  if (!rows.length) {
    return {
      phone: normalized,
      stamps: 0,
      rewardAvailable: false,
      totalCompleted: 0,
      rewardsRedeemed: 0,
    };
  }
  const row = rows[0];
  return {
    phone: row.phone,
    stamps: Number(row.stamps) || 0,
    rewardAvailable: Boolean(row.reward_available),
    totalCompleted: Number(row.total_completed) || 0,
    rewardsRedeemed: Number(row.rewards_redeemed) || 0,
  };
}

async function redeemLoyaltyReward(sql, phone) {
  const normalized = normalizePhone(phone);
  if (!sql) {
    const account = memory.loyalty.get(normalized);
    if (account?.rewardAvailable) {
      account.stamps = 0;
      account.rewardAvailable = false;
      account.rewardsRedeemed = (account.rewardsRedeemed || 0) + 1;
      account.updatedAt = new Date().toISOString();
    }
    return;
  }

  await sql`
    UPDATE loyalty_accounts
    SET stamps = 0,
        reward_available = false,
        rewards_redeemed = rewards_redeemed + 1,
        updated_at = now()
    WHERE phone = ${normalized} AND reward_available = true
  `;
}

async function awardLoyaltyStamp(sql, order, settings) {
  if (!settings?.loyalty?.enabled) return;
  const phone = normalizePhone(order.customerPhone || order.phone);
  if (!phoneIsValid(phone)) return;
  const target = Math.max(2, Number(settings.loyalty.target) || 5);

  if (!sql) {
    const stored = memory.orders.find((entry) => entry.id === order.id);
    if (!stored || stored.loyaltyStampAwarded) return;
    stored.loyaltyStampAwarded = true;
    const account =
      memory.loyalty.get(phone) || {
        phone,
        stamps: 0,
        rewardAvailable: false,
        totalCompleted: 0,
        rewardsRedeemed: 0,
      };
    account.totalCompleted = (account.totalCompleted || 0) + 1;
    if (!account.rewardAvailable) {
      account.stamps = Math.min(target, (account.stamps || 0) + 1);
      if (account.stamps >= target) account.rewardAvailable = true;
    }
    account.updatedAt = new Date().toISOString();
    memory.loyalty.set(phone, account);
    return;
  }

  const marked = await sql`
    UPDATE orders
    SET loyalty_stamp_awarded = true
    WHERE id = ${order.id} AND loyalty_stamp_awarded = false
    RETURNING customer_phone
  `;
  if (!marked.length) return;

  await sql`
    INSERT INTO loyalty_accounts (
      phone, stamps, reward_available, total_completed, rewards_redeemed, updated_at
    ) VALUES (
      ${phone}, 1, false, 1, 0, now()
    )
    ON CONFLICT (phone) DO UPDATE SET
      stamps = CASE
        WHEN loyalty_accounts.reward_available THEN loyalty_accounts.stamps
        WHEN loyalty_accounts.stamps + 1 >= ${target} THEN ${target}
        ELSE loyalty_accounts.stamps + 1
      END,
      reward_available = loyalty_accounts.reward_available
        OR (loyalty_accounts.stamps + 1 >= ${target}),
      total_completed = loyalty_accounts.total_completed + 1,
      updated_at = now()
  `;
}

export async function createOrder(body) {
  const sql = getSql();
  if (sql) await ensureSchema();

  const settings = await readSettings(sql);
  const availability = sql ? await readAvailability(sql) : memory.availability;
  const checked = validateOrder(body, settings, availability);
  if (checked.error) {
    return { status: 400, body: { ok: false, error: checked.error } };
  }
  const order = checked.value;
  const session = verifySessionToken(body?.authToken);
  const phoneVerified = Boolean(session && session.phone === order.phone);

  if (process.env.REQUIRE_PHONE_VERIFICATION === 'true' && !phoneVerified) {
    return {
      status: 401,
      body: {
        ok: false,
        error: 'Please verify your mobile number with the OTP before placing the order.',
      },
    };
  }

  order.phoneVerified = phoneVerified;
  const service = getServiceStatus();

  if (order.useLoyaltyReward) {
    if (!settings.loyalty.enabled) {
      return {
        status: 400,
        body: { ok: false, error: 'The loyalty card is not available right now.' },
      };
    }
    const account = await readLoyaltyAccount(sql, order.phone);
    if (!account.rewardAvailable) {
      return {
        status: 400,
        body: { ok: false, error: 'That loyalty reward is not available on this number.' },
      };
    }
    order.discount = Math.min(settings.loyalty.reward, order.subtotal);
    order.total = Math.max(0, order.subtotal + order.deliveryFee - order.discount);
    order.loyaltyRewardUsed = true;
  }

  if (sql) {
    await sql`
      INSERT INTO orders (
        id, customer_name, customer_phone, order_type, address, notes,
        items, subtotal, delivery_zone, delivery_fee, discount, total,
        scheduled_for, prep_minutes, ready_at, payment_method, payment_status,
        loyalty_reward_used, status, phone_verified
      ) VALUES (
        ${order.id}, ${order.name}, ${order.phone}, ${order.orderType},
        ${order.address}, ${order.notes}, ${JSON.stringify(order.items)}::jsonb,
        ${order.subtotal}, ${order.deliveryZone || null}, ${order.deliveryFee},
        ${order.discount}, ${order.total}, ${order.scheduledFor},
        ${order.prepMinutes}, ${order.readyAt}, ${order.paymentMethod},
        ${order.paymentStatus}, ${order.loyaltyRewardUsed}, 'new', ${phoneVerified}
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
      updatedAt: new Date().toISOString(),
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

  if (order.loyaltyRewardUsed) {
    await redeemLoyaltyReward(sql, order.phone);
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
        createdAt: order.createdAt || new Date().toISOString(),
      },
      service,
      notify,
      fallbackUrl: fallbackUrl(order),
    },
  };
}

export async function getCustomerOrders(phone) {
  const normalized = normalizePhone(phone);
  if (!phoneIsValid(normalized)) {
    return {
      status: 400,
      body: { ok: false, error: 'Please enter a valid mobile number.' },
    };
  }
  const sql = getSql();
  const service = getServiceStatus();

  if (!sql) {
    const customer = memory.customers.get(normalized);
    const orders = memory.orders
      .filter((order) => (order.customerPhone || order.phone) === normalized)
      .slice(0, 8)
      .map((order) => ({
        id: order.id,
        status: order.status || 'new',
        orderType: order.orderType || 'pickup',
        subtotal: Number(order.subtotal) || 0,
        deliveryFee: Number(order.deliveryFee) || 0,
        discount: Number(order.discount) || 0,
        total: Number(order.total) || Number(order.subtotal) || 0,
        scheduledFor: order.scheduledFor || null,
        prepMinutes: order.prepMinutes || 20,
        readyAt: order.readyAt || null,
        paymentMethod: order.paymentMethod || 'pay_later',
        paymentStatus: order.paymentStatus || 'pending',
        createdAt: order.createdAt || new Date().toISOString(),
        items: order.items || [],
      }));
    return {
      status: 200,
      body: { ok: true, service, customer: customer ? { name: customer.name } : null, orders },
    };
  }

  await ensureSchema();
  const rows = await sql`
    SELECT * FROM orders
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
      orders: rows.map(mapOrder),
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
    order.updatedAt = new Date().toISOString();
    if (status === 'completed') {
      const settings = await readSettings(null);
      await awardLoyaltyStamp(null, order, settings);
    }
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
  if (status === 'completed') {
    const settings = await readSettings(sql);
    await awardLoyaltyStamp(sql, mapOrder(rows[0]), settings);
    const refreshed = await sql`SELECT * FROM orders WHERE id = ${cleanId} LIMIT 1`;
    if (refreshed.length) return { status: 200, body: { ok: true, order: mapOrder(refreshed[0]) } };
  }
  return { status: 200, body: { ok: true, order: mapOrder(rows[0]) } };
}

export async function updatePaymentStatus({ id, paymentStatus }, headers) {
  if (!(await ordersAuthorized(headers))) {
    return { status: 401, body: { ok: false, error: 'Staff sign-in or admin password is required.' } };
  }
  const cleanId = cleanText(id, 40);
  const status = ['pending', 'paid', 'refunded'].includes(paymentStatus)
    ? paymentStatus
    : '';
  if (!cleanId || !status) {
    return { status: 400, body: { ok: false, error: 'Unknown order or payment status.' } };
  }

  const sql = getSql();
  if (!sql) {
    const order = memory.orders.find((entry) => entry.id === cleanId);
    if (!order) return { status: 404, body: { ok: false, error: 'Order not found.' } };
    order.paymentStatus = status;
    order.updatedAt = new Date().toISOString();
    return { status: 200, body: { ok: true, order } };
  }

  await ensureSchema();
  const rows = await sql`
    UPDATE orders
    SET payment_status = ${status}, updated_at = now()
    WHERE id = ${cleanId}
    RETURNING *
  `;
  if (!rows.length) return { status: 404, body: { ok: false, error: 'Order not found.' } };
  return { status: 200, body: { ok: true, order: mapOrder(rows[0]) } };
}

const TRACKING_STEPS = {
  pickup: [
    { id: 'new', label: 'Order placed' },
    { id: 'confirmed', label: 'Confirmed by kitchen' },
    { id: 'preparing', label: 'Being prepared' },
    { id: 'ready', label: 'Ready for pickup' },
    { id: 'completed', label: 'Picked up' },
  ],
  delivery: [
    { id: 'new', label: 'Order placed' },
    { id: 'confirmed', label: 'Confirmed by kitchen' },
    { id: 'preparing', label: 'Being prepared' },
    { id: 'ready', label: 'Packed' },
    { id: 'out-for-delivery', label: 'Out for delivery' },
    { id: 'completed', label: 'Delivered' },
  ],
};

function buildTracking(order) {
  const steps = TRACKING_STEPS[order.orderType] || TRACKING_STEPS.pickup;
  const cancelled = order.status === 'cancelled';
  const currentIndex = steps.findIndex((step) => step.id === order.status);
  return {
    id: order.id,
    status: order.status,
    orderType: order.orderType,
    deliveryZone: order.deliveryZone,
    items: order.items.map((item) => ({
      name: item.name,
      portion: item.portion,
      quantity: item.quantity,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    discount: order.discount,
    total: order.total,
    scheduledFor: order.scheduledFor,
    prepMinutes: order.prepMinutes,
    readyAt: order.readyAt,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    cancelled,
    timeline: steps.map((step, index) => ({
      ...step,
      done: cancelled ? index === 0 : currentIndex >= index,
      current: !cancelled && currentIndex === index,
    })),
  };
}

export async function getOrderTracking(id) {
  const cleanId = cleanText(id, 40).toUpperCase();
  if (!cleanId) return { status: 400, body: { ok: false, error: 'Order number is required.' } };
  const sql = getSql();

  if (!sql) {
    const order = memory.orders.find((entry) => entry.id === cleanId);
    if (!order) return { status: 404, body: { ok: false, error: 'Order not found.' } };
    return { status: 200, body: { ok: true, order: buildTracking(order) } };
  }

  await ensureSchema();
  const rows = await sql`SELECT * FROM orders WHERE id = ${cleanId} LIMIT 1`;
  if (!rows.length) return { status: 404, body: { ok: false, error: 'Order not found.' } };
  return { status: 200, body: { ok: true, order: buildTracking(mapOrder(rows[0])) } };
}

export async function getLoyalty({ phone, token }) {
  const normalized = normalizePhone(phone);
  const session = verifySessionToken(token);
  if (!phoneIsValid(normalized) || !session || session.phone !== normalized) {
    return { status: 401, body: { ok: false, error: 'Please verify this mobile number first.' } };
  }

  const sql = getSql();
  if (sql) await ensureSchema();
  const settings = await readSettings(sql);
  const account = await readLoyaltyAccount(sql, normalized);
  return {
    status: 200,
    body: {
      ok: true,
      loyalty: {
        enabled: settings.loyalty.enabled,
        target: settings.loyalty.target,
        reward: settings.loyalty.reward,
        rewardLabel: settings.loyalty.rewardLabel,
        description: settings.loyalty.description,
        ...account,
      },
    },
  };
}

export async function getAvailability() {
  const sql = getSql();
  if (sql) await ensureSchema();
  const availability = sql ? await readAvailability(sql) : memory.availability;
  return { status: 200, body: { ok: true, availability } };
}

export async function setAvailability({ itemId, soldOut }, headers) {
  if (!(await ordersAuthorized(headers))) {
    return { status: 401, body: { ok: false, error: 'Staff sign-in or admin password is required.' } };
  }
  const cleanId = cleanText(itemId, 80);
  if (!cleanId) return { status: 400, body: { ok: false, error: 'Choose a menu item.' } };

  const sql = getSql();
  if (sql) await ensureSchema();
  const current = sql ? await readAvailability(sql) : memory.availability;
  const next = new Set(current.soldOut || []);
  if (soldOut) next.add(cleanId);
  else next.delete(cleanId);
  const availability = normalizeAvailability({
    soldOut: [...next],
    updatedAt: new Date().toISOString(),
    updatedBy: adminAuthorized(headers) ? 'Admin' : 'Kitchen staff',
  });

  if (sql) {
    await writeAvailability(sql, availability);
  } else {
    memory.availability = availability;
  }
  return { status: 200, body: { ok: true, availability } };
}

function istDateKey(value) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}

function memoryAnalytics(days) {
  const todayKey = istDateKey(new Date());
  const start = new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1000);
  const inWindow = memory.orders.filter((order) => new Date(order.createdAt) >= start);
  const today = memory.orders.filter((order) => istDateKey(order.createdAt) === todayKey);
  const active = memory.orders.filter((order) =>
    ['new', 'confirmed', 'preparing', 'ready', 'out-for-delivery'].includes(order.status),
  );
  const revenueOf = (order) => (order.status === 'cancelled' ? 0 : Number(order.total) || Number(order.subtotal) || 0);
  const statusCounts = {};
  today.forEach((order) => {
    statusCounts[order.status || 'new'] = (statusCounts[order.status || 'new'] || 0) + 1;
  });
  const top = new Map();
  inWindow.forEach((order) => {
    if (order.status === 'cancelled') return;
    (order.items || []).forEach((item) => {
      const key = item.name;
      const entry = top.get(key) || { name: key, quantity: 0, revenue: 0 };
      entry.quantity += Number(item.quantity) || 0;
      entry.revenue += (Number(item.price) || 0) * (Number(item.quantity) || 0);
      top.set(key, entry);
    });
  });
  const series = Array.from({ length: days }, (_, index) => {
    const date = new Date(start.getTime() + index * 24 * 60 * 60 * 1000);
    const key = istDateKey(date);
    const orders = memory.orders.filter((order) => istDateKey(order.createdAt) === key);
    return {
      day: key,
      orders: orders.length,
      revenue: orders.reduce((sum, order) => sum + revenueOf(order), 0),
    };
  });
  const loyalty = [...memory.loyalty.values()];
  return {
    today: {
      orders: today.length,
      revenue: today.reduce((sum, order) => sum + revenueOf(order), 0),
      average: today.length
        ? Math.round(today.reduce((sum, order) => sum + revenueOf(order), 0) / today.length)
        : 0,
      deliveryOrders: today.filter((order) => order.orderType === 'delivery').length,
      pickupOrders: today.filter((order) => order.orderType === 'pickup').length,
    },
    series,
    statusCounts,
    topItems: [...top.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 6),
    loyalty: {
      accounts: loyalty.length,
      rewardsAvailable: loyalty.filter((account) => account.rewardAvailable).length,
      rewardsRedeemed: loyalty.reduce((sum, account) => sum + (account.rewardsRedeemed || 0), 0),
    },
    reviewPending: memory.orders.filter(
      (order) => order.status === 'completed' && !order.reviewRequestedAt,
    ).length,
    activeOrders: active.length,
  };
}

export async function getAnalytics(headers, requestedDays = 7) {
  if (!(await ordersAuthorized(headers))) {
    return { status: 401, body: { ok: false, error: 'Staff sign-in or admin password is required.' } };
  }
  const days = Math.max(1, Math.min(30, Number(requestedDays) || 7));
  const sql = getSql();
  if (!sql) {
    return { status: 200, body: { ok: true, analytics: memoryAnalytics(days) } };
  }

  await ensureSchema();
  const todaySummary = await sql`
    SELECT
      count(*)::int AS orders,
      count(*) FILTER (WHERE order_type = 'delivery')::int AS delivery_orders,
      count(*) FILTER (WHERE order_type = 'pickup')::int AS pickup_orders,
      COALESCE(sum(
        CASE WHEN status <> 'cancelled'
          THEN CASE WHEN total > 0 THEN total ELSE subtotal END
          ELSE 0 END
      ), 0)::int AS revenue,
      COALESCE(round(avg(
        CASE WHEN status <> 'cancelled'
          THEN CASE WHEN total > 0 THEN total ELSE subtotal END
          ELSE NULL END
      ))::int, 0) AS average
    FROM orders
    WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date
      = (now() AT TIME ZONE 'Asia/Kolkata')::date
  `;
  const statusRows = await sql`
    SELECT status, count(*)::int AS count
    FROM orders
    WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date
      = (now() AT TIME ZONE 'Asia/Kolkata')::date
    GROUP BY status
  `;
  const topRows = await sql`
    SELECT
      item->>'name' AS name,
      sum((item->>'quantity')::int)::int AS quantity,
      sum(((item->>'quantity')::int * (item->>'price')::numeric))::int AS revenue
    FROM orders o
    CROSS JOIN LATERAL jsonb_array_elements(o.items) item
    WHERE o.created_at >= now() - (${days}::int * interval '1 day')
      AND o.status <> 'cancelled'
    GROUP BY item->>'name'
    ORDER BY quantity DESC
    LIMIT 6
  `;
  const seriesRows = await sql`
    WITH days AS (
      SELECT generate_series(
        (now() AT TIME ZONE 'Asia/Kolkata')::date - ${days - 1}::int,
        (now() AT TIME ZONE 'Asia/Kolkata')::date,
        interval '1 day'
      )::date AS day
    )
    SELECT
      to_char(d.day, 'YYYY-MM-DD') AS day,
      count(o.id)::int AS orders,
      COALESCE(sum(
        CASE WHEN o.status <> 'cancelled'
          THEN CASE WHEN o.total > 0 THEN o.total ELSE o.subtotal END
          ELSE 0 END
      ), 0)::int AS revenue
    FROM days d
    LEFT JOIN orders o
      ON (o.created_at AT TIME ZONE 'Asia/Kolkata')::date = d.day
    GROUP BY d.day
    ORDER BY d.day
  `;
  const loyaltyRows = await sql`
    SELECT
      count(*)::int AS accounts,
      count(*) FILTER (WHERE reward_available)::int AS rewards_available,
      COALESCE(sum(rewards_redeemed), 0)::int AS rewards_redeemed
    FROM loyalty_accounts
  `;
  const activeRows = await sql`
    SELECT count(*)::int AS active
    FROM orders
    WHERE status IN ('new', 'confirmed', 'preparing', 'ready', 'out-for-delivery')
  `;
  const reviewRows = await sql`
    SELECT count(*)::int AS pending
    FROM orders
    WHERE status = 'completed' AND review_requested_at IS NULL
  `;

  const summary = todaySummary[0] || {};
  const loyalty = loyaltyRows[0] || {};
  return {
    status: 200,
    body: {
      ok: true,
      analytics: {
        today: {
          orders: Number(summary.orders) || 0,
          revenue: Number(summary.revenue) || 0,
          average: Number(summary.average) || 0,
          deliveryOrders: Number(summary.delivery_orders) || 0,
          pickupOrders: Number(summary.pickup_orders) || 0,
        },
        statusCounts: Object.fromEntries(
          statusRows.map((row) => [row.status, Number(row.count) || 0]),
        ),
        topItems: topRows.map((row) => ({
          name: row.name,
          quantity: Number(row.quantity) || 0,
          revenue: Number(row.revenue) || 0,
        })),
        series: seriesRows.map((row) => ({
          day: row.day,
          orders: Number(row.orders) || 0,
          revenue: Number(row.revenue) || 0,
        })),
        loyalty: {
          accounts: Number(loyalty.accounts) || 0,
          rewardsAvailable: Number(loyalty.rewards_available) || 0,
          rewardsRedeemed: Number(loyalty.rewards_redeemed) || 0,
        },
        activeOrders: Number(activeRows[0]?.active) || 0,
        reviewPending: Number(reviewRows[0]?.pending) || 0,
      },
    },
  };
}

function reviewUrl() {
  // Never invent a Google listing URL. The owner must supply the exact review
  // link before the booster can send anything.
  return String(process.env.GOOGLE_REVIEW_URL || '').trim();
}

function reviewMessage(order) {
  const name = order.customerName || 'there';
  const url = reviewUrl();
  const lines = [
    `Thank you for ordering from New Bawarchi 2, ${name}! 🍛`,
    '',
    'If you enjoyed your food, a quick Google review helps our small Belonia kitchen a lot:',
  ];
  if (url) lines.push(url);
  lines.push('', 'See you again soon!');
  return lines.join('\n');
}

function customerWhatsAppUrl(phone, text) {
  const digits = String(phone || '').replace(/\D/g, '').slice(-10);
  return `https://wa.me/91${digits}?text=${encodeURIComponent(text)}`;
}

async function sendCustomerWhatsApp(phone, text, customerName = '') {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { sent: false, reason: 'WhatsApp Cloud API is not configured.' };
  }
  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
  const templateName = process.env.WHATSAPP_REVIEW_TEMPLATE_NAME;
  const url = reviewUrl();
  const payload = templateName
    ? {
        messaging_product: 'whatsapp',
        to: `91${normalizePhone(phone)}`,
        type: 'template',
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_REVIEW_TEMPLATE_LANG || 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: String(customerName || 'there').slice(0, 60) },
                { type: 'text', text: url },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: 'whatsapp',
        to: `91${normalizePhone(phone)}`,
        type: 'text',
        text: { preview_url: true, body: text },
      };
  const response = await fetch(
    `https://graph.facebook.com/${version}/${phoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return { sent: false, reason: `WhatsApp API ${response.status}: ${detail.slice(0, 300)}` };
  }
  return { sent: true };
}

async function markReviewRequested(sql, id) {
  if (!sql) {
    const order = memory.orders.find((entry) => entry.id === id);
    if (order) order.reviewRequestedAt = new Date().toISOString();
    return;
  }
  await sql`UPDATE orders SET review_requested_at = now(), updated_at = now() WHERE id = ${id}`;
}

export async function sendReviewRequest({ id }, headers) {
  if (!(await ordersAuthorized(headers))) {
    return { status: 401, body: { ok: false, error: 'Staff sign-in or admin password is required.' } };
  }
  const cleanId = cleanText(id, 40).toUpperCase();
  const sql = getSql();
  if (sql) await ensureSchema();
  let order;
  if (sql) {
    const rows = await sql`SELECT * FROM orders WHERE id = ${cleanId} LIMIT 1`;
    if (!rows.length) return { status: 404, body: { ok: false, error: 'Order not found.' } };
    order = mapOrder(rows[0]);
  } else {
    order = memory.orders.find((entry) => entry.id === cleanId);
    if (!order) return { status: 404, body: { ok: false, error: 'Order not found.' } };
  }
  if (order.status !== 'completed') {
    return { status: 400, body: { ok: false, error: 'Mark the order completed before asking for a review.' } };
  }
  const url = reviewUrl();
  if (!url) {
    return {
      status: 400,
      body: {
        ok: false,
        error: 'Set GOOGLE_REVIEW_URL to the restaurant’s exact Google review link before sending review requests.',
      },
    };
  }
  await markReviewRequested(sql, cleanId);
  const text = reviewMessage(order);
  return {
    status: 200,
    body: {
      ok: true,
      url: customerWhatsAppUrl(order.customerPhone, text),
      message: text,
      reviewUrl: url,
    },
  };
}

export async function runReviewCron({ headers = {}, query = {} }) {
  const secret = process.env.CRON_SECRET;
  const auth = headers.authorization || headers.Authorization || '';
  const secretAuthorized = Boolean(secret) && (auth === `Bearer ${secret}` || query.secret === secret);
  if (!secretAuthorized && !(await ordersAuthorized(headers))) {
    return { status: 401, body: { ok: false, error: 'Cron secret or staff sign-in is required.' } };
  }

  const sql = getSql();
  if (sql) await ensureSchema();
  const delayHours = Math.max(1, Math.min(72, Number(process.env.REVIEW_DELAY_HOURS) || 2));
  const limit = Math.max(1, Math.min(25, Number(query.limit) || 20));
  let candidates;
  if (sql) {
    const rows = await sql`
      SELECT * FROM orders
      WHERE status = 'completed'
        AND review_requested_at IS NULL
        AND updated_at < now() - (${delayHours}::int * interval '1 hour')
      ORDER BY updated_at ASC
      LIMIT ${limit}
    `;
    candidates = rows.map(mapOrder);
  } else {
    candidates = memory.orders
      .filter(
        (order) =>
          order.status === 'completed' &&
          !order.reviewRequestedAt &&
          new Date(order.updatedAt || order.createdAt).getTime() <
            Date.now() - delayHours * 60 * 60 * 1000,
      )
      .slice(0, limit);
  }

  const reviewLink = reviewUrl();
  if (!reviewLink) {
    return {
      status: 200,
      body: {
        ok: true,
        configured: false,
        sent: 0,
        pending: [],
        note: 'GOOGLE_REVIEW_URL is not configured; review requests are paused until the owner supplies the exact Google review link.',
      },
    };
  }

  const configured = Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  if (!configured) {
    return {
      status: 200,
      body: {
        ok: true,
        configured: false,
        sent: 0,
        pending: candidates.map((order) => ({
          id: order.id,
          url: customerWhatsAppUrl(order.customerPhone, reviewMessage(order)),
        })),
        note: 'WhatsApp Cloud API is not configured; use the staff review button or wa.me links.',
      },
    };
  }

  let sent = 0;
  const failures = [];
  for (const order of candidates) {
    try {
      const result = await sendCustomerWhatsApp(
        order.customerPhone,
        reviewMessage(order),
        order.customerName,
      );
      if (result.sent) {
        await markReviewRequested(sql, order.id);
        sent += 1;
      } else {
        failures.push({ id: order.id, error: result.reason });
      }
    } catch (error) {
      failures.push({ id: order.id, error: error?.message || 'Send failed' });
    }
  }
  return {
    status: 200,
    body: { ok: true, configured: true, sent, failed: failures.length, failures },
  };
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
      if (query.track) return await getOrderTracking(query.track);
      if (query.loyalty) {
        return await getLoyalty({ phone: query.loyalty, token: query.token });
      }
      if (query.availability === '1') return await getAvailability();
      if (query.analytics === '1') return await getAnalytics(headers, query.days);
      if (query.reviewCron === '1') return await runReviewCron({ headers, query });
      if (query.phone) return await getCustomerOrders(query.phone);
      return { status: 200, body: { ok: true, service: getServiceStatus() } };
    }

    if (method === 'POST') {
      if (body?.action === 'review-request') {
        return await sendReviewRequest({ id: body?.id || query.id }, headers);
      }
      return await createOrder(body);
    }

    if (method === 'PATCH') {
      if (body?.action === 'availability') {
        return await setAvailability(
          { itemId: body?.itemId, soldOut: Boolean(body?.soldOut) },
          headers,
        );
      }
      if (body?.action === 'payment') {
        return await updatePaymentStatus(
          { id: body?.id || query.id, paymentStatus: body?.paymentStatus },
          headers,
        );
      }
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
