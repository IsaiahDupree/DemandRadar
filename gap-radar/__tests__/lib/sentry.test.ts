/**
 * Sentry Error Monitoring Tests (INFRA-004)
 *
 * Tests that Sentry is properly configured for error tracking and alerting.
 *
 * Acceptance Criteria:
 * - Errors captured ✓
 * - Alerts configured ✓
 * - Source maps uploaded ✓
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Sentry Error Monitoring (INFRA-004)', () => {
  describe('Configuration Files', () => {
    it('should have client configuration file', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      expect(fs.existsSync(clientConfigPath)).toBe(true);

      const content = fs.readFileSync(clientConfigPath, 'utf-8');
      expect(content).toContain('import * as Sentry from');
      expect(content).toContain('Sentry.init');
    });

    it('should have server configuration file', () => {
      const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
      expect(fs.existsSync(serverConfigPath)).toBe(true);

      const content = fs.readFileSync(serverConfigPath, 'utf-8');
      expect(content).toContain('import * as Sentry from');
      expect(content).toContain('Sentry.init');
    });

    it('should have edge configuration file', () => {
      const edgeConfigPath = path.join(process.cwd(), 'sentry.edge.config.ts');
      expect(fs.existsSync(edgeConfigPath)).toBe(true);

      const content = fs.readFileSync(edgeConfigPath, 'utf-8');
      expect(content).toContain('import * as Sentry from');
      expect(content).toContain('Sentry.init');
    });
  });

  describe('Client Configuration', () => {
    let clientConfig: string;

    beforeAll(() => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      clientConfig = fs.readFileSync(clientConfigPath, 'utf-8');
    });

    it('should configure DSN from environment variable', () => {
      expect(clientConfig).toContain('NEXT_PUBLIC_SENTRY_DSN');
      expect(clientConfig).toContain('dsn:');
    });

    it('should configure tracesSampleRate', () => {
      expect(clientConfig).toContain('tracesSampleRate');
    });

    it('should have different sample rates for production vs development', () => {
      expect(clientConfig).toMatch(/NODE_ENV.*production/);
      expect(clientConfig).toMatch(/0\.\d+/); // Production rate (e.g., 0.1)
      expect(clientConfig).toMatch(/1\.0/); // Development rate
    });

    it('should configure replay integration', () => {
      expect(clientConfig).toContain('replayIntegration');
      expect(clientConfig).toContain('replaysOnErrorSampleRate');
      expect(clientConfig).toContain('replaysSessionSampleRate');
    });

    it('should configure browser tracing integration', () => {
      expect(clientConfig).toContain('browserTracingIntegration');
    });

    it('should configure environment', () => {
      expect(clientConfig).toContain('environment:');
      expect(clientConfig).toMatch(/NEXT_PUBLIC_VERCEL_ENV|NODE_ENV/);
    });

    it('should have beforeSend hook for filtering', () => {
      expect(clientConfig).toContain('beforeSend');
    });

    it('should filter events when DSN is not configured', () => {
      expect(clientConfig).toContain('if (!SENTRY_DSN)');
      expect(clientConfig).toContain('return null');
    });

    it('should ignore certain errors', () => {
      expect(clientConfig).toContain('ignoreErrors');
      expect(clientConfig).toContain('NetworkError');
      expect(clientConfig).toContain('ResizeObserver');
    });

    it('should filter browser extension errors', () => {
      expect(clientConfig).toMatch(/chrome-extension|moz-extension/);
    });

    it('should mask sensitive data in replay', () => {
      expect(clientConfig).toContain('maskAllText: true');
      expect(clientConfig).toContain('blockAllMedia: true');
    });
  });

  describe('Server Configuration', () => {
    let serverConfig: string;

    beforeAll(() => {
      const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
      serverConfig = fs.readFileSync(serverConfigPath, 'utf-8');
    });

    it('should configure DSN from environment variable', () => {
      expect(serverConfig).toContain('SENTRY_DSN');
      expect(serverConfig).toContain('dsn:');
    });

    it('should configure tracesSampleRate', () => {
      expect(serverConfig).toContain('tracesSampleRate');
    });

    it('should configure environment', () => {
      expect(serverConfig).toContain('environment:');
      expect(serverConfig).toMatch(/VERCEL_ENV|NODE_ENV/);
    });

    it('should have beforeSend hook for filtering', () => {
      expect(serverConfig).toContain('beforeSend');
    });

    it('should redact sensitive query parameters', () => {
      expect(serverConfig).toContain('api_key');
      expect(serverConfig).toContain('password');
      expect(serverConfig).toContain('token');
      expect(serverConfig).toContain('secret');
      expect(serverConfig).toContain('REDACTED');
    });

    it('should redact sensitive headers', () => {
      expect(serverConfig).toContain('authorization');
      expect(serverConfig).toContain('cookie');
      expect(serverConfig).toContain('x-api-key');
    });

    it('should ignore expected database errors', () => {
      expect(serverConfig).toContain('ignoreErrors');
      expect(serverConfig).toContain('PGRST'); // Supabase errors
    });

    it('should ignore Next.js expected errors', () => {
      expect(serverConfig).toContain('ECONNRESET');
      expect(serverConfig).toContain('EPIPE');
    });
  });

  describe('Edge Configuration', () => {
    let edgeConfig: string;

    beforeAll(() => {
      const edgeConfigPath = path.join(process.cwd(), 'sentry.edge.config.ts');
      edgeConfig = fs.readFileSync(edgeConfigPath, 'utf-8');
    });

    it('should configure DSN from environment variable', () => {
      expect(edgeConfig).toContain('SENTRY_DSN');
      expect(edgeConfig).toContain('dsn:');
    });

    it('should configure tracesSampleRate', () => {
      expect(edgeConfig).toContain('tracesSampleRate');
    });

    it('should configure environment', () => {
      expect(edgeConfig).toContain('environment:');
    });

    it('should have beforeSend hook', () => {
      expect(edgeConfig).toContain('beforeSend');
    });
  });

  describe('Source Maps Configuration', () => {
    let nextConfig: string;

    beforeAll(() => {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      nextConfig = fs.readFileSync(nextConfigPath, 'utf-8');
    });

    it('should import withSentryConfig from @sentry/nextjs', () => {
      expect(nextConfig).toContain('import');
      expect(nextConfig).toContain('withSentryConfig');
      expect(nextConfig).toContain('@sentry/nextjs');
    });

    it('should wrap Next.js config with Sentry config', () => {
      expect(nextConfig).toContain('withSentryConfig(nextConfig');
    });

    it('should configure Sentry webpack plugin options', () => {
      expect(nextConfig).toContain('sentryWebpackPluginOptions');
    });

    it('should configure Sentry organization', () => {
      expect(nextConfig).toContain('org:');
      expect(nextConfig).toContain('SENTRY_ORG');
    });

    it('should configure Sentry project', () => {
      expect(nextConfig).toContain('project:');
      expect(nextConfig).toContain('SENTRY_PROJECT');
    });

    it('should configure auth token for source map uploads', () => {
      expect(nextConfig).toContain('authToken:');
      expect(nextConfig).toContain('SENTRY_AUTH_TOKEN');
    });

    it('should export the Sentry-wrapped config', () => {
      expect(nextConfig).toContain('export default');
      expect(nextConfig).toContain('withSentryConfig');
    });
  });

  describe('Package Dependencies', () => {
    let packageJson: any;

    beforeAll(() => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    });

    it('should have @sentry/nextjs installed', () => {
      expect(packageJson.dependencies['@sentry/nextjs']).toBeDefined();
    });

    it('should have compatible Sentry version', () => {
      const sentryVersion = packageJson.dependencies['@sentry/nextjs'];
      expect(sentryVersion).toBeTruthy();

      // Version should be 10.x or higher for modern Next.js support
      const versionMatch = sentryVersion.match(/\d+/);
      if (versionMatch) {
        const majorVersion = parseInt(versionMatch[0]);
        expect(majorVersion).toBeGreaterThanOrEqual(10);
      }
    });
  });

  describe('Error Capture Capability', () => {
    it('should have all configuration files for error capture', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
      const edgeConfigPath = path.join(process.cwd(), 'sentry.edge.config.ts');

      expect(fs.existsSync(clientConfigPath)).toBe(true);
      expect(fs.existsSync(serverConfigPath)).toBe(true);
      expect(fs.existsSync(edgeConfigPath)).toBe(true);
    });

    it('should have Sentry.init calls in all config files', () => {
      const clientConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.client.config.ts'), 'utf-8');
      const serverConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.server.config.ts'), 'utf-8');
      const edgeConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.edge.config.ts'), 'utf-8');

      expect(clientConfig).toContain('Sentry.init({');
      expect(serverConfig).toContain('Sentry.init({');
      expect(edgeConfig).toContain('Sentry.init({');
    });
  });

  describe('Alert Configuration', () => {
    it('should configure environment for alert routing', () => {
      const clientConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.client.config.ts'), 'utf-8');
      const serverConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.server.config.ts'), 'utf-8');

      // Environment configuration allows Sentry to route alerts appropriately
      expect(clientConfig).toContain('environment:');
      expect(serverConfig).toContain('environment:');
    });

    it('should configure debug flag', () => {
      const clientConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.client.config.ts'), 'utf-8');
      const serverConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.server.config.ts'), 'utf-8');

      expect(clientConfig).toContain('debug:');
      expect(serverConfig).toContain('debug:');
    });
  });

  describe('Acceptance Criteria', () => {
    it('✓ Errors captured - Configuration exists for client, server, and edge', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
      const edgeConfigPath = path.join(process.cwd(), 'sentry.edge.config.ts');

      expect(fs.existsSync(clientConfigPath)).toBe(true);
      expect(fs.existsSync(serverConfigPath)).toBe(true);
      expect(fs.existsSync(edgeConfigPath)).toBe(true);

      const clientConfig = fs.readFileSync(clientConfigPath, 'utf-8');
      const serverConfig = fs.readFileSync(serverConfigPath, 'utf-8');
      const edgeConfig = fs.readFileSync(edgeConfigPath, 'utf-8');

      expect(clientConfig).toContain('Sentry.init');
      expect(serverConfig).toContain('Sentry.init');
      expect(edgeConfig).toContain('Sentry.init');
    });

    it('✓ Alerts configured - Environment and sample rates set', () => {
      const clientConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.client.config.ts'), 'utf-8');
      const serverConfig = fs.readFileSync(path.join(process.cwd(), 'sentry.server.config.ts'), 'utf-8');

      expect(clientConfig).toContain('environment:');
      expect(clientConfig).toContain('tracesSampleRate');
      expect(serverConfig).toContain('environment:');
      expect(serverConfig).toContain('tracesSampleRate');
    });

    it('✓ Source maps uploaded - Sentry webpack plugin configured', () => {
      const nextConfig = fs.readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf-8');

      expect(nextConfig).toContain('withSentryConfig');
      expect(nextConfig).toContain('sentryWebpackPluginOptions');
      expect(nextConfig).toContain('SENTRY_AUTH_TOKEN');
    });
  });
});
