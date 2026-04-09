-- ─────────────────────────────────────────────────────────────────────────────
-- Sprint 10: user_carts — persisted cart per authenticated user
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_carts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  items      jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS — users can only read/write their own cart
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cart_owner"
  ON user_carts
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
