-- Run in Supabase SQL Editor.
-- Adds columns the stripe-webhook Edge Function relies on.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_payouts_enabled bool   DEFAULT false,
  ADD COLUMN IF NOT EXISTS stripe_account_status  text   DEFAULT 'pending_onboarding',
                        -- 'pending_onboarding' | 'pending_verification' | 'active' | 'restricted' | 'disconnected'
  ADD COLUMN IF NOT EXISTS last_payout_at         timestamptz;

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS amount_refunded        numeric,
  ADD COLUMN IF NOT EXISTS platform_fee_remaining numeric,
  ADD COLUMN IF NOT EXISTS weather_reschedule_at  timestamptz,
                        -- set when either party invokes the weather-reschedule path.
                        -- If no reschedule agreed within 14 days, full refund is triggered.
  ADD COLUMN IF NOT EXISTS cancellation_reason    text;
                        -- 'client_cancelled' | 'creator_cancelled' | 'weather' | 'no_show'

-- Broaden bookings.status value set. Current values observed in code: 'pending',
-- 'confirmed', 'accepted', 'countered', 'declined', 'offer_pending'. The webhook
-- adds: 'paid', 'payment_failed', 'refunded', 'partially_refunded'.
-- No enum migration needed — column is `text`.

CREATE INDEX IF NOT EXISTS bookings_stripe_pi_idx
  ON bookings (stripe_payment_intent_id);

CREATE INDEX IF NOT EXISTS profiles_stripe_acct_idx
  ON profiles (stripe_account_id);
