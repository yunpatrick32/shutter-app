// create-payment-intent — destination charge with platform application fee
// Fee structure:
//   Client pays:    bookingAmount × 1.04  (+4% service fee)
//   Creator gets:   bookingAmount × 0.98  (−2% platform cut)
//   Platform keeps: 6% of booking amount  (minus Stripe's 2.9% + $0.30)
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

    const { bookingAmount, creatorStripeAccountId, metadata } = await req.json();

    if (!bookingAmount || !creatorStripeAccountId) {
      return new Response(
        JSON.stringify({ error: 'bookingAmount and creatorStripeAccountId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const clientTotal    = Math.round(bookingAmount * 1.04 * 100); // cents
    const creatorPayout  = Math.round(bookingAmount * 0.98 * 100); // cents
    const applicationFee = clientTotal - creatorPayout;             // platform gross fee

    const paymentIntent = await stripe.paymentIntents.create({
      amount: clientTotal,
      currency: 'usd',
      application_fee_amount: applicationFee,
      transfer_data: { destination: creatorStripeAccountId },
      metadata: metadata || {},
    });

    return new Response(
      JSON.stringify({
        clientSecret:   paymentIntent.client_secret,
        clientTotal:    clientTotal  / 100,
        creatorPayout:  creatorPayout / 100,
        applicationFee: applicationFee / 100,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-payment-intent error:', err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
