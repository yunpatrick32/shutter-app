// stripe-account-status — polls Stripe Connect account status for the authenticated creator.
// Called client-side after returning from Express onboarding and on interval while setup is incomplete.
// JWT verification ON — caller's Supabase session authorizes the lookup.
//
// Deploy: npx supabase functions deploy stripe-account-status --project-ref panktkmwgcttjpebucqy

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

    // Verify JWT from Authorization header
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

    // Resolve profiles.id via user_id lookup (service-role to bypass RLS)
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profile.stripe_account_id) {
      return new Response(JSON.stringify({ connected: false, payoutsEnabled: false }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Retrieve account from Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const payoutsEnabled = !!account.payouts_enabled;
    const status = account.requirements?.disabled_reason
      ? 'restricted'
      : account.payouts_enabled
        ? 'active'
        : account.details_submitted
          ? 'pending_verification'
          : 'pending_onboarding';

    // Upsert into profiles
    const updates: Record<string, unknown> = {
      stripe_payouts_enabled: payoutsEnabled,
      stripe_account_status: status,
    };

    const { error: updateErr } = await admin
      .from('profiles')
      .update(updates)
      .eq('id', profile.id);

    if (updateErr) console.error('[stripe-account-status] profile update error:', updateErr);

    return new Response(JSON.stringify({ connected: true, payoutsEnabled, status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('stripe-account-status error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
