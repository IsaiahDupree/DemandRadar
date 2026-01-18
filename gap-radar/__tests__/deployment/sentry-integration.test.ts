/**
 * Sentry Integration Tests
 *
 * Tests to verify that Sentry error tracking is configured correctly
 * Feature: INF-013 - Sentry Integration
 */

import fs from 'fs';
import path from 'path';

describe('Sentry Integration', () => {
  describe('Configuration files', () => {
    it('should have sentry.client.config.ts', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      expect(fs.existsSync(clientConfigPath)).toBe(true);
    });

    it('should have sentry.server.config.ts', () => {
      const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
      expect(fs.existsSync(serverConfigPath)).toBe(true);
    });

    it('should have sentry.edge.config.ts', () => {
      const edgeConfigPath = path.join(process.cwd(), 'sentry.edge.config.ts');
      expect(fs.existsSync(edgeConfigPath)).toBe(true);
    });
  });

  describe('Client configuration', () => {
    it('should import Sentry SDK', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain("import * as Sentry from '@sentry/nextjs'");
    });

    it('should initialize Sentry with DSN', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('Sentry.init');
      expect(content).toContain('dsn:');
      expect(content).toContain('NEXT_PUBLIC_SENTRY_DSN');
    });

    it('should configure traces sample rate', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('tracesSampleRate');
    });

    it('should configure replay integration', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('replayIntegration');
      expect(content).toContain('replaysOnErrorSampleRate');
      expect(content).toContain('replaysSessionSampleRate');
    });

    it('should have error filtering in beforeSend', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('beforeSend');
    });

    it('should filter out browser extension errors', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('chrome-extension://');
    });

    it('should filter out network errors', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('NetworkError');
      expect(content).toContain('Failed to fetch');
    });

    it('should set environment from process.env', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('environment:');
    });
  });

  describe('Server configuration', () => {
    it('should import Sentry SDK', () => {
      const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
      const content = fs.readFileSync(serverConfigPath, 'utf-8');

      expect(content).toContain("import * as Sentry from '@sentry/nextjs'");
    });

    it('should initialize Sentry with DSN', () => {
      const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
      const content = fs.readFileSync(serverConfigPath, 'utf-8');

      expect(content).toContain('Sentry.init');
      expect(content).toContain('dsn:');
    });

    it('should configure traces sample rate', () => {
      const serverConfigPath = path.join(process.cwd(), 'sentry.server.config.ts');
      const content = fs.readFileSync(serverConfigPath, 'utf-8');

      expect(content).toContain('tracesSampleRate');
    });
  });

  describe('Edge configuration', () => {
    it('should import Sentry SDK', () => {
      const edgeConfigPath = path.join(process.cwd(), 'sentry.edge.config.ts');
      const content = fs.readFileSync(edgeConfigPath, 'utf-8');

      expect(content).toContain("import * as Sentry from '@sentry/nextjs'");
    });

    it('should initialize Sentry with DSN', () => {
      const edgeConfigPath = path.join(process.cwd(), 'sentry.edge.config.ts');
      const content = fs.readFileSync(edgeConfigPath, 'utf-8');

      expect(content).toContain('Sentry.init');
      expect(content).toContain('dsn:');
    });
  });

  describe('Next.js integration', () => {
    it('should have Sentry integration in next.config.ts', () => {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      const content = fs.readFileSync(nextConfigPath, 'utf-8');

      expect(content).toContain('@sentry/nextjs');
      expect(content).toContain('withSentryConfig');
    });

    it('should configure Sentry webpack plugin options', () => {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      const content = fs.readFileSync(nextConfigPath, 'utf-8');

      expect(content).toContain('sentryWebpackPluginOptions');
      expect(content).toContain('org:');
      expect(content).toContain('project:');
      expect(content).toContain('authToken:');
    });

    it('should read Sentry config from environment variables', () => {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      const content = fs.readFileSync(nextConfigPath, 'utf-8');

      expect(content).toContain('process.env.SENTRY_ORG');
      expect(content).toContain('process.env.SENTRY_PROJECT');
      expect(content).toContain('process.env.SENTRY_AUTH_TOKEN');
    });
  });

  describe('Package dependencies', () => {
    it('should have @sentry/nextjs installed', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.dependencies['@sentry/nextjs']).toBeDefined();
    });
  });

  describe('Documentation', () => {
    it('should have Sentry setup documentation', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      expect(fs.existsSync(docsPath)).toBe(true);
    });

    it('should document how to get DSN', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('DSN');
      expect(docs).toContain('sentry.io');
    });

    it('should document environment variables', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('SENTRY_DSN');
      expect(docs).toContain('NEXT_PUBLIC_SENTRY_DSN');
      expect(docs).toContain('SENTRY_ORG');
      expect(docs).toContain('SENTRY_PROJECT');
      expect(docs).toContain('SENTRY_AUTH_TOKEN');
    });

    it('should document how to test integration', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs.toLowerCase()).toContain('test');
      expect(docs).toContain('error');
    });

    it('should document source maps configuration', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('source map');
    });

    it('should document production setup', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('Production');
      expect(docs).toContain('Vercel');
    });

    it('should document monitoring best practices', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('Best Practices');
      expect(docs.toLowerCase()).toContain('alert');
    });
  });

  describe('Security configuration', () => {
    it('should not expose Sentry DSN in client bundle without NEXT_PUBLIC prefix', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      // Should use NEXT_PUBLIC_SENTRY_DSN for client config
      expect(content).toContain('NEXT_PUBLIC_SENTRY_DSN');
    });

    it('should mask sensitive data in replay', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('maskAllText');
      expect(content).toContain('blockAllMedia');
    });

    it('should document data sanitization', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      // Documentation should mention data sanitization or redaction
      expect(docs.toLowerCase()).toMatch(/(sanitiz|redact|mask)/);
    });
  });

  describe('Performance monitoring', () => {
    it('should configure browser tracing integration', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('browserTracingIntegration');
    });

    it('should configure trace sampling for production', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      // Should have different sample rates for dev vs production
      expect(content).toMatch(/production.*0\.\d+/);
    });

    it('should document performance monitoring', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'SENTRY_SETUP.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('Performance');
    });
  });

  describe('Error filtering', () => {
    it('should have ignoreErrors list', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('ignoreErrors');
    });

    it('should filter ResizeObserver errors', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('ResizeObserver');
    });

    it('should not send events when DSN is not configured', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('if (!SENTRY_DSN)');
      expect(content).toContain('return null');
    });
  });

  describe('Environment variables', () => {
    it('should have .env.local ignored in git', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

      expect(gitignore).toMatch(/\.env/);
    });

    it('should not commit SENTRY_AUTH_TOKEN', () => {
      const envLocalPath = path.join(process.cwd(), '.env.local');

      if (fs.existsSync(envLocalPath)) {
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

        // .env.local should be in gitignore
        expect(gitignore).toMatch(/\.env/);
      }
    });
  });

  describe('Production readiness', () => {
    it('should configure different sample rates for dev and prod', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('NODE_ENV');
      expect(content).toContain('production');
    });

    it('should disable debug mode in production', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      expect(content).toContain('debug: false');
    });

    it('should configure session replay with appropriate sampling', () => {
      const clientConfigPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const content = fs.readFileSync(clientConfigPath, 'utf-8');

      // Should capture all errors
      expect(content).toContain('replaysOnErrorSampleRate: 1.0');

      // Should sample normal sessions at lower rate
      expect(content).toMatch(/replaysSessionSampleRate: 0\.\d+/);
    });
  });
});
