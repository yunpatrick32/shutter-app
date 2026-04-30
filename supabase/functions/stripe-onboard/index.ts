// stripe-onboard — creates a Stripe Connect Express account and returns an onboarding URL
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno&no-check';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { profileId, userId } = await req.json();
    if (!profileId) {
      return new Response(JSON.stringify({ error: 'profileId required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create a Stripe Express account for the creator
    const account = await stripe.accounts.create({
      type: 'express',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { profile_id: profileId, user_id: userId || '' },
    });

    // Generate the hosted onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `https://shutterfind.app?stripe_refresh=1&profile_id=${profileId}`,
      return_url:  `https://shutterfind.app?stripe_return=1&profile_id=${profileId}&account_id=${account.id}`,
      type: 'account_onboarding',
    });

    return new Response(
      JSON.stringify({ url: accountLink.url, accountId: account.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('stripe-onboard error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
