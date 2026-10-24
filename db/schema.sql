-- Run this in the Neon SQL editor if you prefer to create the tables manually.
-- The API also creates them automatically on the first request.

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
  delivery_zone TEXT,
  delivery_fee INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  scheduled_for TIMESTAMPTZ,
  prep_minutes INTEGER NOT NULL DEFAULT 20,
  ready_at TIMESTAMPTZ,
  payment_method TEXT NOT NULL DEFAULT 'pay_later',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  loyalty_reward_used BOOLEAN NOT NULL DEFAULT false,
  loyalty_stamp_awarded BOOLEAN NOT NULL DEFAULT false,
  review_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_zone TEXT;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_fee INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS total INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS prep_minutes INTEGER NOT NULL DEFAULT 20;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS ready_at TIMESTAMPTZ;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'pay_later';
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS loyalty_reward_used BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS loyalty_stamp_awarded BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (customer_phone);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS orders_ready_idx ON orders (ready_at);
CREATE INDEX IF NOT EXISTS orders_review_idx ON orders (status, review_requested_at);

CREATE TABLE IF NOT EXISTS customers (
  phone TEXT PRIMARY KEY,
  name TEXT,
  address TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Phone-based loyalty card. A stamp is awarded once when an order is completed.
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  phone TEXT PRIMARY KEY,
  stamps INTEGER NOT NULL DEFAULT 0,
  reward_available BOOLEAN NOT NULL DEFAULT false,
  total_completed INTEGER NOT NULL DEFAULT 0,
  rewards_redeemed INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One active OTP per mobile number. Only a hash is stored, never the code.
CREATE TABLE IF NOT EXISTS otp_codes (
  phone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Small key/value store for site-wide settings such as the menu theme
-- and the published menu/gallery/homepage content.
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Staff accounts for the kitchen order screen. Passwords are scrypt hashes.
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
);

CREATE UNIQUE INDEX IF NOT EXISTS staff_users_username_idx ON staff_users (lower(username));
