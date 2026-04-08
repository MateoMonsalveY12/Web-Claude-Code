-- ── Migration 002: Newsletter subscribers + discount codes ─────────────────

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email                     text        PRIMARY KEY,
  subscribed_at             timestamptz DEFAULT now(),
  active                    boolean     DEFAULT true,
  source                    text        DEFAULT 'website',
  welcome_coupon_code       text,
  welcome_coupon_sent_at    timestamptz,
  first_order_discount_used boolean     DEFAULT false
);

-- Discount codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  code              text        PRIMARY KEY,
  type              text        NOT NULL DEFAULT 'percentage',  -- 'percentage' | 'fixed'
  value             numeric     NOT NULL DEFAULT 10,
  active            boolean     DEFAULT true,
  usage_limit       integer     DEFAULT 1,
  usage_count       integer     DEFAULT 0,
  valid_for         text        DEFAULT 'first_order',          -- 'first_order' | 'all'
  min_order_amount  numeric     DEFAULT 0,
  assigned_email    text,
  created_at        timestamptz DEFAULT now(),
  used_at           timestamptz,
  used_by_order_id  uuid
);

-- Add discount columns to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code   text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes         ENABLE ROW LEVEL SECURITY;

-- Service role has full access to both tables
CREATE POLICY "service_role_all_newsletter"
  ON newsletter_subscribers FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "service_role_all_discount_codes"
  ON discount_codes FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
