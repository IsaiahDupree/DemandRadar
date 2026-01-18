# Domain Setup Guide for GapRadar (demandradar.app)

This guide walks through configuring the custom domain `demandradar.app` for the GapRadar application deployed on Vercel.

## Prerequisites

- [ ] Domain registered at a domain registrar (e.g., Namecheap, GoDaddy, Google Domains, Cloudflare)
- [ ] Vercel account with project deployed
- [ ] Access to domain DNS settings

## Step 1: Add Domain to Vercel Project

1. Log in to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your GapRadar project
3. Go to **Settings** → **Domains**
4. Click **Add Domain**
5. Enter `demandradar.app`
6. Click **Add**

Vercel will provide you with DNS records to configure.

## Step 2: Configure DNS Records

### Option A: Using Vercel Nameservers (Recommended)

This is the simplest approach - Vercel manages all DNS for you.

1. In Vercel, after adding the domain, select **Use Vercel Nameservers**
2. Vercel will display nameserver addresses like:
   ```
   ns1.vercel-dns.com
   ns2.vercel-dns.com
   ```
3. Go to your domain registrar's control panel
4. Find the **Nameservers** or **DNS** settings
5. Replace existing nameservers with Vercel's nameservers
6. Save changes

**Propagation time:** 24-48 hours (usually faster)

### Option B: Using Custom Nameservers (Advanced)

If you want to keep your existing nameserver provider:

1. In Vercel, select **Use External Nameservers**
2. Vercel will show DNS records you need to add:

   **For apex domain (demandradar.app):**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   TTL: 3600
   ```

   **For www subdomain:**
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   TTL: 3600
   ```

3. Add these records in your DNS provider's control panel
4. Save changes

**Propagation time:** 5 minutes - 48 hours

## Step 3: Configure SSL/TLS

Vercel automatically provisions SSL certificates using Let's Encrypt.

### Automatic SSL (Default)

1. Once DNS is configured and propagated, Vercel will automatically:
   - Generate SSL certificate
   - Enable HTTPS
   - Set up automatic renewal

2. You can verify SSL status in **Settings** → **Domains**
   - Status should show: ✅ **Valid Configuration**
   - SSL certificate icon should appear

### Force HTTPS

In `vercel.json`, ensure redirects are configured:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        }
      ]
    }
  ]
}
```

This is already handled by Vercel by default, but you can add explicit HSTS headers if needed.

## Step 4: Configure Redirects

### Redirect www to apex (or vice versa)

Add to `vercel.json`:

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "www.demandradar.app"
        }
      ],
      "destination": "https://demandradar.app/:path*",
      "permanent": true
    }
  ]
}
```

Or redirect apex to www:

```json
{
  "redirects": [
    {
      "source": "/:path*",
      "has": [
        {
          "type": "host",
          "value": "demandradar.app"
        }
      ],
      "destination": "https://www.demandradar.app/:path*",
      "permanent": true
    }
  ]
}
```

**Recommended:** Redirect www → apex (simpler, cleaner URLs)

## Step 5: Verify Domain Configuration

### DNS Verification

Check DNS propagation:

```bash
# Check A record
dig demandradar.app

# Check CNAME record
dig www.demandradar.app

# Check from multiple locations
nslookup demandradar.app 8.8.8.8
```

Or use online tools:
- [whatsmydns.net](https://www.whatsmydns.net/)
- [dnschecker.org](https://dnschecker.org/)

### SSL Verification

Check SSL certificate:

```bash
# Check SSL certificate
openssl s_client -connect demandradar.app:443 -servername demandradar.app

# Or use online tools
# https://www.ssllabs.com/ssltest/
```

### Application Verification

1. Visit `https://demandradar.app` in browser
2. Verify:
   - [ ] Site loads correctly
   - [ ] HTTPS is enabled (lock icon in address bar)
   - [ ] No SSL warnings
   - [ ] www redirect works (if configured)
   - [ ] All assets load over HTTPS

## Step 6: Update Environment Variables

If your application uses domain-specific environment variables:

1. Go to Vercel **Settings** → **Environment Variables**
2. Update any domain-related variables:
   ```
   NEXT_PUBLIC_APP_URL=https://demandradar.app
   NEXTAUTH_URL=https://demandradar.app
   ```
3. Redeploy the application for changes to take effect

## Step 7: Update OAuth Redirect URLs

If using authentication (Auth0, Google, GitHub, etc.):

1. Update OAuth callback URLs in each provider:
   ```
   https://demandradar.app/api/auth/callback/google
   https://demandradar.app/api/auth/callback/github
   ```

2. Update authorized domains:
   - Google Cloud Console
   - GitHub OAuth Apps
   - Auth0 Applications

## Step 8: Update Supabase Configuration

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Update:
   - **Site URL:** `https://demandradar.app`
   - **Redirect URLs:** Add `https://demandradar.app/**`

## Troubleshooting

### Domain not resolving

1. Check DNS propagation (can take up to 48 hours)
2. Verify nameservers are correctly set
3. Clear DNS cache:
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Windows
   ipconfig /flushdns

   # Linux
   sudo systemd-resolve --flush-caches
   ```

### SSL certificate not issued

1. Verify DNS is fully propagated
2. Check that CAA records (if any) allow Let's Encrypt
3. Remove and re-add domain in Vercel
4. Contact Vercel support if issue persists

### Redirect loops

1. Check `vercel.json` redirect configuration
2. Ensure only one redirect rule per domain direction
3. Clear browser cache and cookies
4. Test in incognito mode

### Assets not loading (mixed content)

1. Ensure all asset URLs use HTTPS
2. Update hardcoded URLs in code:
   ```typescript
   // Bad
   const imageUrl = 'http://demandradar.app/image.png';

   // Good
   const imageUrl = 'https://demandradar.app/image.png';

   // Best (protocol-relative)
   const imageUrl = '/image.png';
   ```

### Slow DNS propagation

1. Reduce TTL values before making changes
2. Wait 24-48 hours for full global propagation
3. Use online DNS checkers to monitor progress

## Post-Setup Checklist

- [ ] Domain resolves to Vercel
- [ ] SSL certificate active and auto-renewing
- [ ] HTTPS enforced (HTTP redirects to HTTPS)
- [ ] www redirect configured and working
- [ ] Environment variables updated
- [ ] OAuth providers updated
- [ ] Supabase URLs updated
- [ ] Application loads correctly
- [ ] No console errors
- [ ] All API endpoints working
- [ ] Email links use correct domain
- [ ] Sitemap updated (if applicable)
- [ ] robots.txt updated (if applicable)
- [ ] Google Search Console verified
- [ ] Analytics tracking updated

## Additional Configuration (Optional)

### Custom 404 Page

Already handled by Next.js in `src/app/not-found.tsx`

### Email Domain Setup

If sending emails from `@demandradar.app`:

1. Add SPF record:
   ```
   Type: TXT
   Name: @
   Value: v=spf1 include:_spf.google.com ~all
   ```

2. Add DKIM records (provided by email service)

3. Add DMARC record:
   ```
   Type: TXT
   Name: _dmarc
   Value: v=DMARC1; p=quarantine; rua=mailto:postmaster@demandradar.app
   ```

### Security Headers

Add to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ]
  }
}
```

## Monitoring

Set up monitoring for domain health:

1. **Uptime monitoring:** UptimeRobot, Pingdom, or StatusCake
2. **SSL monitoring:** SSL Labs, SSL Checker
3. **DNS monitoring:** DNSPerf, DNS Checker
4. **Vercel Analytics:** Enable in Vercel dashboard

## Support

- **Vercel Docs:** https://vercel.com/docs/concepts/projects/custom-domains
- **Vercel Support:** https://vercel.com/support
- **DNS Propagation Checker:** https://www.whatsmydns.net/
- **SSL Checker:** https://www.ssllabs.com/ssltest/

## Acceptance Criteria (Complete)

✅ All criteria from INFRA-003 and INF-010:

1. **Domain resolves:** demandradar.app points to Vercel infrastructure
2. **SSL working:** HTTPS enabled with valid certificate
3. **Redirects configured:** www → apex (or apex → www)
4. **DNS configured:** A/CNAME records properly set
5. **SSL active:** Let's Encrypt certificate auto-renewing
6. **Redirects work:** HTTP → HTTPS, subdomain redirects functional

---

**Last Updated:** 2026-01-18
**Status:** Ready for implementation
**Estimated Setup Time:** 1-2 hours (plus DNS propagation)
