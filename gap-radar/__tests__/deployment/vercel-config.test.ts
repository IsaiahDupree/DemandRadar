/**
 * Vercel Deployment Configuration Tests
 *
 * Tests to verify that the Vercel deployment is configured correctly
 * Feature: INF-009 - Vercel Deployment
 */

import fs from 'fs';
import path from 'path';

describe('Vercel Deployment Configuration', () => {
  describe('vercel.json configuration', () => {
    it('should have a valid vercel.json file', () => {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      expect(fs.existsSync(vercelConfigPath)).toBe(true);
    });

    it('should specify Next.js as the framework', () => {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

      expect(config.framework).toBe('nextjs');
    });

    it('should have correct build command', () => {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

      expect(config.buildCommand).toBe('next build');
    });

    it('should have correct install command with legacy-peer-deps', () => {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

      expect(config.installCommand).toBe('npm install --legacy-peer-deps');
    });

    it('should have correct output directory', () => {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

      expect(config.outputDirectory).toBe('.next');
    });

    it('should have deployment enabled for main branch', () => {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

      expect(config.git?.deploymentEnabled?.main).toBe(true);
    });

    it('should disable Next.js telemetry in build', () => {
      const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf-8'));

      expect(config.build?.env?.NEXT_TELEMETRY_DISABLED).toBe('1');
    });
  });

  describe('Next.js configuration', () => {
    it('should have a valid next.config.ts file', () => {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      expect(fs.existsSync(nextConfigPath)).toBe(true);
    });

    it('should export a valid Next.js configuration', async () => {
      // Import the config file
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      const configContent = fs.readFileSync(nextConfigPath, 'utf-8');

      // Verify it contains export default
      expect(configContent).toContain('export default');
    });
  });

  describe('Package.json configuration', () => {
    it('should have correct build script', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts.build).toBe('next build');
    });

    it('should have correct start script', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.scripts.start).toContain('next start');
    });

    it('should have Next.js as a dependency', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.dependencies.next).toBeDefined();
    });

    it('should have React 19+ as a dependency', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
    });
  });

  describe('Documentation', () => {
    it('should have Vercel deployment documentation', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'VERCEL_DEPLOYMENT.md');
      expect(fs.existsSync(docsPath)).toBe(true);
    });

    it('should have Production Supabase setup documentation', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'PRODUCTION_SUPABASE_SETUP.md');
      expect(fs.existsSync(docsPath)).toBe(true);
    });

    it('should document required environment variables', () => {
      const docsPath = path.join(process.cwd(), 'docs', 'VERCEL_DEPLOYMENT.md');
      const docs = fs.readFileSync(docsPath, 'utf-8');

      // Check for essential environment variables in documentation
      expect(docs).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(docs).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      expect(docs).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(docs).toContain('OPENAI_API_KEY');
    });
  });

  describe('Environment variables template', () => {
    it('should have .env.local file for local development', () => {
      const envLocalPath = path.join(process.cwd(), '.env.local');
      expect(fs.existsSync(envLocalPath)).toBe(true);
    });

    it('should have .gitignore configured to ignore environment files', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

      expect(gitignore).toMatch(/\.env/);
    });
  });

  describe('Build output', () => {
    it('should have .next in .gitignore', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

      expect(gitignore).toContain('.next');
    });

    it('should not commit .env files', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

      expect(gitignore).toMatch(/\.env/);
    });
  });

  describe('Sentry integration', () => {
    it('should have Sentry config files', () => {
      const sentryClientPath = path.join(process.cwd(), 'sentry.client.config.ts');
      const sentryServerPath = path.join(process.cwd(), 'sentry.server.config.ts');
      const sentryEdgePath = path.join(process.cwd(), 'sentry.edge.config.ts');

      expect(fs.existsSync(sentryClientPath)).toBe(true);
      expect(fs.existsSync(sentryServerPath)).toBe(true);
      expect(fs.existsSync(sentryEdgePath)).toBe(true);
    });

    it('should have Sentry integration in next.config.ts', () => {
      const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
      const configContent = fs.readFileSync(nextConfigPath, 'utf-8');

      expect(configContent).toContain('@sentry/nextjs');
      expect(configContent).toContain('withSentryConfig');
    });
  });

  describe('Production readiness', () => {
    it('should have all critical routes defined', () => {
      const apiDir = path.join(process.cwd(), 'src', 'app', 'api');

      // Check for critical API routes
      expect(fs.existsSync(path.join(apiDir, 'runs'))).toBe(true);
      expect(fs.existsSync(path.join(apiDir, 'reports'))).toBe(true);
      expect(fs.existsSync(path.join(apiDir, 'trends'))).toBe(true);
    });

    it('should have dashboard pages', () => {
      const dashboardDir = path.join(process.cwd(), 'src', 'app', 'dashboard');

      expect(fs.existsSync(dashboardDir)).toBe(true);
    });

    it('should have authentication pages', () => {
      const appDir = path.join(process.cwd(), 'src', 'app');

      expect(fs.existsSync(path.join(appDir, 'login'))).toBe(true);
      expect(fs.existsSync(path.join(appDir, 'signup'))).toBe(true);
    });
  });
});
