-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Adds Stripe Connect columns to the profiles table

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id    text,
  ADD COLUMN IF NOT EXISTS stripe_onboarded     bool DEFAULT false;

-- Optional: store the payment intent ID on bookings for reconciliation
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS amount_total              numeric,
  ADD COLUMN IF NOT EXISTS amount_creator            numeric;
