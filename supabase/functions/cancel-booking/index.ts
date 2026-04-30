// cancel-booking — cancels a booking with refund logic per Finance Apr 23 option-a ruling.
// JWT verification ON — caller's Supabase session authorizes.
//
// Refund tiers:
//   >=72h → 100% refund, refund_application_fee: true, reverse_transfer: true (booking not consummated)
//   24-72h → 50% refund, refund_application_fee: false, reverse_transfer: false (platform keeps full fee)
//   <24h → 0% refund, no Stripe call
//   weather → no immediate refund, 14-day reschedule window
//
// FLAG: amount_total in bookings is stored as DOLLARS (not cents). Convert to cents for Stripe.
//
// Deploy: npx supabase functions deploy cancel-booking --project-ref panktkmwgcttjpebucqy

import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await anonClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { bookingId, reason, note } = await req.json();
    if (!bookingId || !reason) {
      return new Response(JSON.stringify({ error: 'bookingId and reason required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Fetch booking
    const { data: booking, error: bookingErr } = await admin
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (bookingErr || !booking) {
      return new Response(JSON.stringify({ error: 'Booking not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Authorize: caller must be client_user_id or creator_profile_id's user_id
    let authorized = booking.client_user_id === user.id;
    if (!authorized && booking.creator_profile_id) {
      const { data: creatorProfile } = await admin
        .from('profiles')
        .select('user_id')
        .eq('id', booking.creator_profile_id)
        .single();
      if (creatorProfile?.user_id === user.id) authorized = true;
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check cancellable status
    const cancellableStatuses = ['paid', 'pending_payment', 'confirmed'];
    if (!cancellableStatuses.includes(booking.status)) {
      return new Response(JSON.stringify({ error: 'Cannot cancel booking in current status' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = new Date();
    const shootDate = new Date(booking.shoot_date);
    const hoursUntilShoot = (shootDate.getTime() - now.getTime()) / (1000 * 3600);

    // amount_total is stored as DOLLARS — convert to cents for Stripe
    const amountTotalDollars = parseFloat(booking.amount_total) || 0;
    const amountTotalCents = Math.round(amountTotalDollars * 100);

    // Compute original platform fee (8% of total)
    const originalFeeCents = Math.round(amountTotalCents * 0.08);
    const originalFeeDollars = originalFeeCents / 100;

    // ─── Weather branch ──────────────────────────────────────────────────────
    if (reason === 'weather') {
      const rescheduleWindowEndsAt = new Date(now.getTime() + 14 * 24 * 3600 * 1000).toISOString();

      await admin.from('bookings').update({
        cancellation_reason: 'weather',
        weather_reschedule_at: now.toISOString(),
      }).eq('id', bookingId);

      // System message
      await admin.from('messages').insert([{
        sender_id: user.id,
        recipient_profile_id: booking.creator_profile_id,
        body: 'Weather cancellation — 14 days to propose a new date.',
        is_rate_proposal: false,
        read: false,
      }]);

      return new Response(JSON.stringify({
        rescheduleWindowEndsAt,
        refunded: false,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ─── Standard cancellation branch (Finance Apr 23 option-a) ──────────
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const refundPct = hoursUntilShoot >= 72 ? 1 : hoursUntilShoot >= 24 ? 0.5 : 0;
    const refundAmountCents = Math.round(amountTotalCents * refundPct);
    const refundAmountDollars = refundAmountCents / 100;
    let systemMsg = '';

    if (refundPct === 1) {
      // 72h+ — full refund, booking NOT consummated, platform returns fee
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundAmountCents,
        refund_application_fee: true,
        reverse_transfer: true,
        metadata: { bookingId: String(bookingId), reason, refundPct: '1' },
      });

      await admin.from('bookings').update({
        status: 'refunded',
        amount_refunded: refundAmountDollars,
        platform_fee_remaining: 0,
        cancellation_reason: reason,
      }).eq('id', bookingId);

      systemMsg = `100% refund ($${refundAmountDollars.toFixed(2)})`;

    } else if (refundPct === 0.5) {
      // 24–72h — 50% refund, platform keeps full fee
      await stripe.refunds.create({
        payment_intent: booking.stripe_payment_intent_id,
        amount: refundAmountCents,
        refund_application_fee: false,
        reverse_transfer: false,
        metadata: { bookingId: String(bookingId), reason, refundPct: '0.5' },
      });

      await admin.from('bookings').update({
        status: 'refunded',
        amount_refunded: refundAmountDollars,
        // platform_fee_remaining unchanged — full original fee retained
        cancellation_reason: reason,
      }).eq('id', bookingId);

      systemMsg = `50% refund ($${refundAmountDollars.toFixed(2)}) — platform service fee is non-refundable`;

    } else {
      // <24h — no refund
      await admin.from('bookings').update({
        status: 'cancelled_no_refund',
        cancellation_reason: reason,
      }).eq('id', bookingId);

      systemMsg = 'No refund issued.';
    }

    // Insert system message
    await admin.from('messages').insert([{
      sender_id: user.id,
      recipient_profile_id: booking.creator_profile_id,
      body: `Booking cancelled: ${systemMsg}${note ? ' — ' + note : ''}`,
      is_rate_proposal: false,
      read: false,
    }]);

    return new Response(JSON.stringify({
      refunded: refundPct > 0,
      refundAmountCents,
      refundPct,
      feeRetained: refundPct === 0.5 ? originalFeeCents : 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('cancel-booking error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
