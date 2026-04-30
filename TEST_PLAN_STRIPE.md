# Stripe E2E Test Plan

Manual checklist for Patrick after deploy.

## Prerequisites
- Stripe test mode enabled (or test keys in staging env)
- Two test accounts: one creator, one client

## 1. Creator Onboarding
- [ ] Sign in as creator
- [ ] Open My Profile > click "Connect payouts"
- [ ] Complete Stripe Express test onboarding (use test SSN `000-00-0000`, DOB `01/01/1901`, etc per Stripe docs)
- [ ] On return, `stripe-account-status` fires automatically
- [ ] Banner should flip to "Payouts active" (may take 10s polling cycle)

## 2. Client Books Creator
- [ ] Sign in as different account (client)
- [ ] Find creator on map > Book Now
- [ ] Select shoot type, date, duration
- [ ] Pay with card `4242 4242 4242 4242`, any future exp, any CVC, any ZIP

## 3. Verify Payment
- [ ] Stripe Dashboard shows charge with 8% `application_fee`
- [ ] `bookings.status = 'paid'` in Supabase
- [ ] Both parties received notify-message email

## 4. Webhook Refund (Dashboard)
- [ ] In Stripe Dashboard > Refund the test charge
- [ ] Confirm webhook flips booking to `'refunded'`
- [ ] `amount_refunded` populates in bookings table

## 5. Cancel-Booking Flow (Finance Option-A Rules)

### 5a. 72h+ cancel (full refund)
- [ ] Create booking with shoot date 96h out
- [ ] Cancel via in-app button
- [ ] Expect: `status='refunded'`, 100% refund, `platform_fee_remaining=0`
- [ ] Stripe shows `application_fee` reversed

### 5b. 24-72h cancel (50% refund, platform keeps fee)
- [ ] Create booking with shoot date 48h out
- [ ] Cancel via in-app button
- [ ] Expect: 50% refund, `platform_fee_remaining` **unchanged from original fee**
- [ ] Stripe shows `application_fee` **NOT reversed** (platform keeps fee)

### 5c. <24h cancel (no refund)
- [ ] Create booking with shoot date 12h out
- [ ] Cancel via in-app button
- [ ] Expect: `status='cancelled_no_refund'`, no Stripe refund call

### 5d. Weather cancel
- [ ] Create booking with shoot date 96h out
- [ ] Cancel with reason='weather'
- [ ] Expect: booking stays `paid`, `weather_reschedule_at` set, no refund
- [ ] System message in chat thread confirms 14-day window
