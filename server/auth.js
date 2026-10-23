import crypto from 'node:crypto';
import { ensureSchema, getServiceStatus, getSql } from './orders.js';
import { otpDeliveryConfigured, otpDevModeEnabled } from './otp-config.js';
import { createSessionToken } from './session.js';

const OTP_TTL_MS = 5 * 60 * 1000;
const RESEND_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

const memoryOtps = new Map();

function normalizePhone(value) {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return digits.slice(-10);
}

function validPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

function hashCode(phone, code) {
  const secret = process.env.OTP_SECRET || process.env.AUTH_SECRET || 'nb2-local-otp-secret';
  return crypto
    .createHmac('sha256', secret)
    .update(`${phone}:${code}`)
    .digest('hex');
}

function hashesMatch(left, right) {
  try {
    const a = Buffer.from(String(left), 'hex');
    const b = Buffer.from(String(right), 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

async function sendOtpOnWhatsApp(phone, code) {
  if (!otpDeliveryConfigured()) {
    return {
      sent: false,
      configured: false,
      reason: 'WhatsApp OTP delivery is not configured.',
    };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const version = process.env.WHATSAPP_GRAPH_VERSION || 'v21.0';
  const endpoint = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  const templateLanguage = process.env.WHATSAPP_OTP_TEMPLATE_LANG || 'en';

  const components = [
    {
      type: 'body',
      parameters: [{ type: 'text', text: code }],
    },
  ];

  // Some OTP templates have a URL button. Enable this only if the template
  // uses one; copy-code buttons generally do not need a button component.
  if (process.env.WHATSAPP_OTP_TEMPLATE_URL_BUTTON === 'true') {
    components.push({
      type: 'button',
      sub_type: 'url',
      index: '0',
      parameters: [{ type: 'text', text: code }],
    });
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: `91${phone}`,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components,
        },
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      console.error('[auth] WhatsApp OTP failed:', response.status, detail.slice(0, 400));
      return {
        sent: false,
        configured: true,
        reason: 'WhatsApp could not deliver the code. Please try again or order on WhatsApp.',
      };
    }

    return { sent: true, configured: true };
  } catch (error) {
    console.error('[auth] WhatsApp OTP request failed:', error);
    return {
      sent: false,
      configured: true,
      reason: 'WhatsApp could not deliver the code. Please try again or order on WhatsApp.',
    };
  }
}

async function requestOtp(body) {
  const phone = normalizePhone(body?.phone);
  if (!validPhone(phone)) {
    return {
      status: 400,
      body: { ok: false, error: 'Enter a valid 10-digit mobile number starting with 6, 7, 8 or 9.' },
    };
  }

  const sql = getSql();
  const devMode = otpDevModeEnabled();
  if (!sql && !devMode) {
    return {
      status: 503,
      body: {
        ok: false,
        otpConfigured: false,
        error: 'OTP login is not available yet. Please order on WhatsApp for now.',
      },
    };
  }

  if (sql) {
    await ensureSchema();
    const rows = await sql`
      SELECT last_sent_at FROM otp_codes WHERE phone = ${phone} LIMIT 1
    `;
    if (rows[0]?.last_sent_at) {
      const elapsed = Date.now() - new Date(rows[0].last_sent_at).getTime();
      if (elapsed < RESEND_MS) {
        return {
          status: 429,
          body: {
            ok: false,
            error: `Please wait ${Math.ceil((RESEND_MS - elapsed) / 1000)} seconds before requesting another code.`,
            retryAfter: Math.ceil((RESEND_MS - elapsed) / 1000),
          },
        };
      }
    }
  } else {
    const existing = memoryOtps.get(phone);
    if (existing && Date.now() - existing.lastSentAt < RESEND_MS) {
      const wait = Math.ceil((RESEND_MS - (Date.now() - existing.lastSentAt)) / 1000);
      return {
        status: 429,
        body: {
          ok: false,
          error: `Please wait ${wait} seconds before requesting another code.`,
          retryAfter: wait,
        },
      };
    }
  }

  const code = generateCode();
  const codeHash = hashCode(phone, code);
  const expiresAt = Date.now() + OTP_TTL_MS;

  if (sql) {
    await sql`
      INSERT INTO otp_codes (phone, code_hash, expires_at, attempts, last_sent_at)
      VALUES (${phone}, ${codeHash}, ${new Date(expiresAt)}, 0, now())
      ON CONFLICT (phone) DO UPDATE SET
        code_hash = EXCLUDED.code_hash,
        expires_at = EXCLUDED.expires_at,
        attempts = 0,
        last_sent_at = now()
    `;
  } else {
    memoryOtps.set(phone, {
      codeHash,
      expiresAt,
      attempts: 0,
      lastSentAt: Date.now(),
    });
  }

  const delivery = await sendOtpOnWhatsApp(phone, code);

  if (delivery.sent) {
    return {
      status: 200,
      body: {
        ok: true,
        delivery: 'whatsapp',
        message: 'A 6-digit code was sent to your WhatsApp.',
        expiresIn: Math.floor(OTP_TTL_MS / 1000),
        resendAfter: Math.floor(RESEND_MS / 1000),
      },
    };
  }

  if (devMode) {
    console.info(`[auth] Development OTP for +91 ${phone}: ${code}`);
    return {
      status: 200,
      body: {
        ok: true,
        delivery: 'dev',
        message: 'Development mode: use the code shown below.',
        devCode: code,
        expiresIn: Math.floor(OTP_TTL_MS / 1000),
        resendAfter: Math.floor(RESEND_MS / 1000),
      },
    };
  }

  return {
    status: 503,
    body: {
      ok: false,
      otpConfigured: delivery.configured,
      error: delivery.configured
        ? delivery.reason
        : 'OTP delivery is not set up yet. Please order on WhatsApp for now.',
    },
  };
}

async function verifyOtp(body) {
  const phone = normalizePhone(body?.phone);
  const code = String(body?.code ?? '').replace(/\D/g, '').slice(0, 6);

  if (!validPhone(phone)) {
    return { status: 400, body: { ok: false, error: 'Enter a valid mobile number.' } };
  }
  if (!/^\d{6}$/.test(code)) {
    return { status: 400, body: { ok: false, error: 'Enter the 6-digit code from WhatsApp.' } };
  }

  const sql = getSql();
  const devMode = otpDevModeEnabled();
  if (!sql && !devMode) {
    return {
      status: 503,
      body: { ok: false, error: 'OTP login is not available right now.' },
    };
  }

  const completeLogin = () => {
    const token = createSessionToken(phone, SESSION_TTL_MS);
    return {
      status: 200,
      body: {
        ok: true,
        phone,
        token,
        expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
        message: 'Mobile number verified.',
      },
    };
  };

  if (sql) {
    await ensureSchema();
    const rows = await sql`
      SELECT phone, code_hash, expires_at, attempts
      FROM otp_codes
      WHERE phone = ${phone}
      LIMIT 1
    `;
    const record = rows[0];

    if (!record) {
      return {
        status: 400,
        body: { ok: false, error: 'That code has expired. Request a new code.' },
      };
    }

    if (Number(record.attempts) >= MAX_ATTEMPTS) {
      await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;
      return {
        status: 429,
        body: { ok: false, error: 'Too many incorrect attempts. Request a new code.' },
      };
    }

    if (new Date(record.expires_at).getTime() <= Date.now()) {
      await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;
      return {
        status: 400,
        body: { ok: false, error: 'That code has expired. Request a new code.' },
      };
    }

    if (!hashesMatch(record.code_hash, hashCode(phone, code))) {
      const attempts = Number(record.attempts) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;
        return {
          status: 429,
          body: { ok: false, error: 'Too many incorrect attempts. Request a new code.' },
        };
      }
      await sql`UPDATE otp_codes SET attempts = ${attempts} WHERE phone = ${phone}`;
      return {
        status: 400,
        body: {
          ok: false,
          error: 'Incorrect code. Please check and try again.',
          attemptsRemaining: MAX_ATTEMPTS - attempts,
        },
      };
    }

    await sql`DELETE FROM otp_codes WHERE phone = ${phone}`;
    return completeLogin();
  }

  const record = memoryOtps.get(phone);
  if (!record) {
    return {
      status: 400,
      body: { ok: false, error: 'That code has expired. Request a new code.' },
    };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    memoryOtps.delete(phone);
    return {
      status: 429,
      body: { ok: false, error: 'Too many incorrect attempts. Request a new code.' },
    };
  }
  if (record.expiresAt <= Date.now()) {
    memoryOtps.delete(phone);
    return {
      status: 400,
      body: { ok: false, error: 'That code has expired. Request a new code.' },
    };
  }
  if (!hashesMatch(record.codeHash, hashCode(phone, code))) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      memoryOtps.delete(phone);
      return {
        status: 429,
        body: { ok: false, error: 'Too many incorrect attempts. Request a new code.' },
      };
    }
    return {
      status: 400,
      body: {
        ok: false,
        error: 'Incorrect code. Please check and try again.',
        attemptsRemaining: MAX_ATTEMPTS - record.attempts,
      },
    };
  }

  memoryOtps.delete(phone);
  return completeLogin();
}

export async function handleAuthRequest({ method = 'GET', query = {}, body = null }) {
  try {
    if (method === 'GET') {
      return { status: 200, body: { ok: true, service: getServiceStatus() } };
    }
    if (method !== 'POST') {
      return { status: 405, body: { ok: false, error: 'Method not allowed.' } };
    }

    const action = query.action || body?.action;
    if (action === 'request') return await requestOtp(body);
    if (action === 'verify') return await verifyOtp(body);

    return {
      status: 400,
      body: { ok: false, error: 'Use ?action=request or ?action=verify.' },
    };
  } catch (error) {
    console.error('[auth]', error);
    return {
      status: 500,
      body: {
        ok: false,
        error: 'The login service is unavailable right now. Please try again or order on WhatsApp.',
      },
    };
  }
}
