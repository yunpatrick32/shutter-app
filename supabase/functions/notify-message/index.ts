import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { recipientProfileId, senderName, messageBody } = await req.json()

    if (!recipientProfileId || !senderName || !messageBody) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Service-role client — required to read auth.users
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Look up the recipient's auth user_id via their profile row
    const { data: profile, error: profileErr } = await admin
      .from('profiles')
      .select('user_id')
      .eq('id', recipientProfileId)
      .single()

    if (profileErr || !profile?.user_id) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Fetch the email address from auth.users (requires service role)
    const { data: { user }, error: userErr } = await admin.auth.admin.getUserById(profile.user_id)

    if (userErr || !user?.email) {
      return new Response(JSON.stringify({ error: 'User email not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 3. Send via Supabase's built-in emailer (Resend under the hood).
    //    One-time setup: Dashboard → Edge Functions → Secrets → add RESEND_API_KEY
    //    From address must be a verified domain in your Resend account.
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      },
      body: JSON.stringify({
        from: 'Shutter <notifications@shutter-app.netlify.app>',
        to: [user.email],
        subject: 'New message on Shutter',
        text: `${senderName} sent you a message: ${messageBody}\n\n— Open Shutter: https://shutterfind.app`,
      }),
    })

    if (!emailRes.ok) {
      const errText = await emailRes.text()
      throw new Error(`Email delivery failed: ${errText}`)
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('notify-message error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
