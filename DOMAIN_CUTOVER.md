# Domain Cutover: shutterfind.app

## Code Changes (done in this PR)
- `src/app.js` — all `shutter-app.netlify.app` URLs replaced with `shutterfind.app`
- `supabase/functions/stripe-onboard/index.ts` — return/refresh URLs updated
- `supabase/functions/notify-message/index.ts` — email body link updated (from address NOT changed yet — see step 3 below)
- `manifest.json` — no change needed (start_url is `/`)
- `_redirects` — added to redirect old Netlify subdomain to new domain

## Step 1: DNS + Netlify (Patrick action)

### Recommended: Path A — Netlify DNS
1. In **Cloudflare Registrar** > Domain Settings > change nameservers to Netlify's 4 NS records:
   - `dns1.p06.nsone.net`
   - `dns2.p06.nsone.net`
   - `dns3.p06.nsone.net`
   - `dns4.p06.nsone.net`
   (Exact values from Netlify Dashboard > Domains > Set up Netlify DNS)
2. In **Netlify Dashboard** > Domain Management > Add Custom Domain > `shutterfind.app`
3. Add `www.shutterfind.app` as alias if desired
4. Netlify auto-provisions Let's Encrypt (HTTPS mandatory on `.app` TLD — HSTS preloaded)
5. Wait for DNS propagation (15min – 48h)

### Alternative: Path B — Keep Cloudflare DNS
1. Keep Cloudflare DNS active
2. Add A/ALIAS record for apex `shutterfind.app` pointing to Netlify's load balancer IP
3. Add CNAME `www` pointing to `shutter-app.netlify.app`
4. **Set Cloudflare proxy OFF (gray cloud / DNS-only)** on those records — otherwise Netlify's SSL handshake conflicts with Cloudflare's edge

### Rollback
- Point CNAME back to Netlify default subdomain
- Leave HTTPS redirect untouched on Netlify side

## Step 2: OAuth + Stripe Redirect URL Allowlists (Patrick action)

### Supabase Dashboard
- [ ] Authentication > URL Configuration > add `https://shutterfind.app/**` to Redirect URLs
- [ ] Set Site URL to `https://shutterfind.app`

### Google Cloud Console
- [ ] APIs & Services > Credentials > OAuth 2.0 client ID
- [ ] Add `https://shutterfind.app` to Authorized JavaScript origins
- [ ] Verify redirect URI (Supabase handles the actual callback at `https://<project>.supabase.co/auth/v1/callback`)

### Stripe Dashboard
- [ ] Connect settings > Branding > swap business URL to `https://shutterfind.app`
- [ ] The Express onboarding return URL is set per-call in code (already updated)

## Step 3: Resend Domain Verification (after DNS lands)

1. **Resend Dashboard** > Domains > Add Domain > `shutterfind.app`
2. Resend displays 3 DNS records:
   - `_resend` TXT (verification)
   - `resend._domainkey` CNAME (DKIM)
   - SPF TXT record
3. Add those records at whichever DNS host is authoritative (Netlify DNS if Path A, Cloudflare if Path B)
4. Wait for Resend to verify (15min – 24h)
5. Once verified, edit `supabase/functions/notify-message/index.ts`:
   - Change `from: 'Shutter <notifications@shutter-app.netlify.app>'`
   - To: `from: 'Shutter <hello@shutterfind.app>'`
6. Redeploy: `npx supabase functions deploy notify-message --project-ref panktkmwgcttjpebucqy`
7. Test: send an in-app message from a test creator, verify email arrives with correct From header

### DMARC (after verification)
Add TXT record at `_dmarc.shutterfind.app`:
```
v=DMARC1; p=none; rua=mailto:dmarc@shutterfind.app;
```
Upgrade to `p=quarantine` after 2 weeks of clean deliverability.

## Step 4: Keep Netlify Subdomain as Redirect
The `_redirects` file in the repo root handles this:
```
/* https://shutterfind.app/:splat 301
```
This applies to `shutter-app.netlify.app` only (not the primary domain). Any old shared links continue to work.

**Do NOT remove `shutter-app.netlify.app` from Netlify.**
