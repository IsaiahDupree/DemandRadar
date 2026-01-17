# Sentry Setup Guide

This guide explains how to set up Sentry error monitoring for DemandRadar.

## Prerequisites

- A Sentry account (sign up at [sentry.io](https://sentry.io))
- Admin access to the project

## Step 1: Create a Sentry Project

1. Log in to [sentry.io](https://sentry.io)
2. Click "Create Project"
3. Select "Next.js" as the platform
4. Name the project "demandradar" (or your preferred name)
5. Choose your team/organization
6. Click "Create Project"

## Step 2: Get Your DSN

After creating the project, Sentry will show you a DSN (Data Source Name). It looks like:

```
https://[key]@[organization].ingest.sentry.io/[project-id]
```

Copy this DSN - you'll need it for the next step.

## Step 3: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Sentry DSN (from Step 2)
SENTRY_DSN=https://[key]@[organization].ingest.sentry.io/[project-id]
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[organization].ingest.sentry.io/[project-id]

# Sentry organization slug (find in Settings > General)
SENTRY_ORG=your-org-slug

# Sentry project name (from Step 1)
SENTRY_PROJECT=demandradar

# Auth token for uploading source maps (see Step 4)
SENTRY_AUTH_TOKEN=your-auth-token
```

## Step 4: Create an Auth Token

For uploading source maps in production:

1. Go to Settings > Account > API > Auth Tokens
2. Click "Create New Token"
3. Select the following scopes:
   - `project:read`
   - `project:releases`
   - `org:read`
4. Click "Create Token"
5. Copy the token and add it to your environment variables as `SENTRY_AUTH_TOKEN`

## Step 5: Test Sentry Integration

### Test Client-Side Error

Create a test page or button that throws an error:

```typescript
// Example test component
export default function TestError() {
  return (
    <button onClick={() => {
      throw new Error('Test client error');
    }}>
      Trigger Client Error
    </button>
  );
}
```

### Test Server-Side Error

Create an API route that throws an error:

```typescript
// app/api/test-error/route.ts
export async function GET() {
  throw new Error('Test server error');
}
```

### Verify in Sentry

1. Trigger the test errors
2. Go to your Sentry project dashboard
3. You should see the errors appear within a few seconds
4. Click on an error to see the full stack trace and context

## Step 6: Production Configuration

### Vercel Deployment

Add environment variables in Vercel:

1. Go to your project in Vercel
2. Navigate to Settings > Environment Variables
3. Add all the Sentry variables from Step 3
4. Redeploy your application

### Source Maps

Source maps are automatically uploaded during the build process when `SENTRY_AUTH_TOKEN` is set. This allows Sentry to show readable stack traces in production.

## Configuration Files

The Sentry integration uses these files:

- `sentry.client.config.ts` - Client-side error tracking
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking
- `instrumentation.ts` - Initializes Sentry on server start
- `next.config.ts` - Webpack plugin for source maps

## Features Enabled

### Error Tracking
- Client-side JavaScript errors
- Server-side Node.js errors
- Edge runtime errors
- Unhandled promise rejections
- Console errors

### Performance Monitoring
- Transaction tracing (10% sample rate in production)
- API route performance
- Page load performance
- Database query performance

### Session Replay
- 100% of error sessions recorded
- 10% of normal sessions recorded
- Sensitive data masked (text, media)

### Error Filtering

The following errors are filtered out:
- Browser extension errors
- Network errors (user-caused)
- ResizeObserver errors (harmless)
- Expected database errors

### Data Sanitization

Sensitive data is automatically redacted:
- Authorization headers
- API keys in query strings
- Cookies
- Passwords and tokens

## Monitoring Best Practices

1. **Set Up Alerts**
   - Go to Alerts > Create Alert
   - Configure alerts for error spikes or new issues
   - Add notification channels (email, Slack, etc.)

2. **Create Teams**
   - Assign issues to specific team members
   - Set up ownership rules for automatic assignment

3. **Release Tracking**
   - Sentry automatically tracks releases via `VERCEL_GIT_COMMIT_SHA`
   - View errors by release in the dashboard
   - Get notified when new releases introduce errors

4. **Performance Budget**
   - Set performance thresholds in Project Settings
   - Get alerted when pages/routes exceed thresholds

5. **Regular Review**
   - Review unresolved issues weekly
   - Mark false positives as "Ignored"
   - Create issues in your project tracker for real bugs

## Troubleshooting

### Errors Not Showing Up

- Verify DSN is correct in environment variables
- Check browser console for Sentry initialization
- Ensure you're not filtering out the error type
- Check if error occurs in development (some filters only apply to production)

### Source Maps Not Working

- Verify `SENTRY_AUTH_TOKEN` is set
- Check Vercel build logs for source map upload success
- Ensure `SENTRY_ORG` and `SENTRY_PROJECT` match your Sentry account

### Too Many Events

- Increase sample rates in config files
- Add more error filters in `beforeSend`
- Set up inbound filters in Sentry project settings

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Error Monitoring Best Practices](https://docs.sentry.io/product/issues/)
- [Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Session Replay](https://docs.sentry.io/product/session-replay/)

## Support

For issues with Sentry integration, contact the development team or file an issue in the repository.
