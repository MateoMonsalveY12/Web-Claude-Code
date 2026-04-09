-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 9: customer_profiles — persisted shipping address per auth user
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_profiles (
  id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name      text,
  last_name       text,
  email           text,
  phone           text,
  document_type   text DEFAULT 'CC',
  document_number text,
  address_line1   text,
  address_line2   text,
  city            text,
  state           text,
  postal_code     text,
  country         text DEFAULT 'CO',
  updated_at      timestamptz DEFAULT now()
);

-- Enable RLS — users can only read/write their own row
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profile_owner"
  ON customer_profiles
  FOR ALL
  USING  (id = auth.uid())
  WITH CHECK (id = auth.uid());
