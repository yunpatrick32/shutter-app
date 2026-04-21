// stripe-webhook — handles 6 Stripe Connect events for the Shutter booking flow.
//   account.updated                     → sync creators.stripe_payouts_enabled
//   payment_intent.succeeded            → bookings.status = 'paid'
//   payment_intent.payment_failed       → bookings.status = 'payment_failed' + notify-message
//   payout.paid                         → creators.last_payout_at
//   charge.refunded                     → bookings.status = 'refunded', store amount, recompute 8% fee
//   account.application.deauthorized    → creators.stripe_account_status = 'disconnected'
//
// Signature verified via STRIPE_WEBHOOK_SECRET.
// DB writes use SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — webhook is trusted server-side).
// Platform commission is a flat 8% (Orchestrator ruling, Apr 20 2026) via application_fee_amount.
//
// Deploy: npx supabase functions deploy stripe-webhook --project-ref panktkmwgcttjpebucqy --no-verify-jwt
// The --no-verify-jwt flag is required — Stripe does not send a Supabase JWT.

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const PLATFORM_FEE_BPS = 800; // 8.00 % expressed in basis points

// 8 % of an integer-cent amount, rounded to the nearest cent.
function platformFeeCents(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_BPS) / 10000);
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) return new Response('missing stripe-signature', { status: 400 });

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      WEBHOOK_SECRET,
      undefined,
      cryptoProvider,
    );
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed:', err.message);
    return new Response(`bad signature: ${err.message}`, { status: 400 });
  }

  console.log(`[stripe-webhook] ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case 'account.updated':
        await onAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'payment_intent.succeeded':
        await onPaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await onPaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payout.paid':
        await onPayoutPaid(event.data.object as Stripe.Payout, event.account);
        break;

      case 'charge.refunded':
        await onChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'account.application.deauthorized':
        // For deauthorization, the affected account lives in event.account (Connect event).
        await onAccountDeauthorized(event.account);
        break;

      default:
        console.log(`[stripe-webhook] unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe-webhook] handler for ${event.type} threw:`, err);
    // Return 500 so Stripe retries.
    return new Response(`handler error: ${err.message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// ─── Handlers ──────────────────────────────────────────────────────────────

// NOTE: The codebase's creators table is actually `profiles`. The user's spec
// says "creators.*" but the DB column prefix is stripe_* on profiles. Writes
// target `profiles`; if a true `creators` table is added later, update here.

async function onAccountUpdated(account: Stripe.Account) {
  const payoutsEnabled = !!account.payouts_enabled;
  const status = deriveAccountStatus(account);

  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_payouts_enabled: payoutsEnabled,
      stripe_account_status: status,
      stripe_onboarded: payoutsEnabled || account.details_submitted === true,
    })
    .eq('stripe_account_id', account.id);

  if (error) console.error('[account.updated] profile update error:', error);
}

function deriveAccountStatus(account: Stripe.Account): string {
  if (account.payouts_enabled && account.charges_enabled) return 'active';
  if (account.requirements?.disabled_reason) return 'restricted';
  if (account.details_submitted) return 'pending_verification';
  return 'pending_onboarding';
}

async function onPaymentIntentSucceeded(pi: Stripe.PaymentIntent) {
  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'paid',
      stripe_payment_intent_id: pi.id,
      amount_total: pi.amount / 100,
    })
    .eq('stripe_payment_intent_id', pi.id);

  if (error) console.error('[payment_intent.succeeded] update error:', error);
}

async function onPaymentIntentFailed(pi: Stripe.PaymentIntent) {
  const { data: booking, error } = await supabase
    .from('bookings')
    .update({ status: 'payment_failed' })
    .eq('stripe_payment_intent_id', pi.id)
    .select('id, client_user_id, creator_profile_id')
    .maybeSingle();

  if (error) {
    console.error('[payment_intent.payment_failed] update error:', error);
    return;
  }
  if (!booking) return;

  // Fire notify-message so both parties are told. Best-effort — do not throw.
  try {
    await supabase.functions.invoke('notify-message', {
      body: {
        type: 'payment_failed',
        booking_id: booking.id,
        client_user_id: booking.client_user_id,
        creator_profile_id: booking.creator_profile_id,
        reason: pi.last_payment_error?.message || 'card declined',
      },
    });
  } catch (err) {
    console.error('[payment_intent.payment_failed] notify-message error:', err);
  }
}

async function onPayoutPaid(_payout: Stripe.Payout, connectedAccountId: string | undefined) {
  if (!connectedAccountId) return;
  const { error } = await supabase
    .from('profiles')
    .update({ last_payout_at: new Date().toISOString() })
    .eq('stripe_account_id', connectedAccountId);

  if (error) console.error('[payout.paid] profile update error:', error);
}

async function onChargeRefunded(charge: Stripe.Charge) {
  const piId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;
  if (!piId) return;

  const refundedCents = charge.amount_refunded ?? 0;
  const isFull = refundedCents >= (charge.amount ?? 0);

  // Recompute the platform fee on the KEPT amount (original - refunded).
  // When Stripe refunds with refund_application_fee=true, the fee reversal is
  // handled on their side. We record the remaining fee we'd expect to retain
  // so the bookings row matches the final ledger state.
  const keptCents = (charge.amount ?? 0) - refundedCents;
  const remainingFeeCents = platformFeeCents(keptCents);

  const { error } = await supabase
    .from('bookings')
    .update({
      status: isFull ? 'refunded' : 'partially_refunded',
      amount_refunded: refundedCents / 100,
      platform_fee_remaining: remainingFeeCents / 100,
    })
    .eq('stripe_payment_intent_id', piId);

  if (error) console.error('[charge.refunded] booking update error:', error);
}

async function onAccountDeauthorized(connectedAccountId: string | undefined) {
  if (!connectedAccountId) return;
  const { error } = await supabase
    .from('profiles')
    .update({
      stripe_account_status: 'disconnected',
      stripe_payouts_enabled: false,
    })
    .eq('stripe_account_id', connectedAccountId);

  if (error) console.error('[account.application.deauthorized] update error:', error);
}
