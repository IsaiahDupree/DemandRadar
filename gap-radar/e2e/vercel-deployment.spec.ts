import { test, expect } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Vercel Deployment Configuration Tests
 *
 * Tests that vercel.json exists and is properly configured
 * for deployment on Vercel.
 */

test.describe('Vercel Deployment Configuration', () => {
  const vercelConfigPath = join(process.cwd(), 'vercel.json');

  test('should have vercel.json file', () => {
    expect(existsSync(vercelConfigPath)).toBeTruthy();
  });

  test('should have valid JSON structure in vercel.json', () => {
    const configExists = existsSync(vercelConfigPath);
    if (!configExists) {
      test.skip();
      return;
    }

    const configContent = readFileSync(vercelConfigPath, 'utf-8');
    expect(() => JSON.parse(configContent)).not.toThrow();
  });

  test('should configure build settings', () => {
    const configExists = existsSync(vercelConfigPath);
    if (!configExists) {
      test.skip();
      return;
    }

    const config = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));

    // Check for build command configuration
    expect(config).toHaveProperty('buildCommand');
    expect(config.buildCommand).toContain('build');
  });

  test('should configure environment variables', () => {
    const configExists = existsSync(vercelConfigPath);
    if (!configExists) {
      test.skip();
      return;
    }

    const config = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));

    // Should have env configuration or reference to env
    // At minimum, should not expose secrets in the config
    if (config.env) {
      // Ensure no hardcoded secrets
      const envValues = Object.values(config.env);
      envValues.forEach((value: any) => {
        if (typeof value === 'string') {
          expect(value).not.toContain('sk_');
          expect(value).not.toContain('your-');
        }
      });
    }
  });

  test('should configure framework detection', () => {
    const configExists = existsSync(vercelConfigPath);
    if (!configExists) {
      test.skip();
      return;
    }

    const config = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));

    // Should specify Next.js framework
    if (config.framework) {
      expect(config.framework).toBe('nextjs');
    }
  });

  test('should optimize for production build', () => {
    const configExists = existsSync(vercelConfigPath);
    if (!configExists) {
      test.skip();
      return;
    }

    const config = JSON.parse(readFileSync(vercelConfigPath, 'utf-8'));

    // Should not have development-only settings
    if (config.build) {
      expect(config.build).not.toHaveProperty('env.NODE_ENV', 'development');
    }
  });
});

test.describe('Environment Variables Setup', () => {
  test('should have .env.example file', () => {
    const envExamplePath = join(process.cwd(), '.env.example');
    expect(existsSync(envExamplePath)).toBeTruthy();
  });

  test('should document required environment variables', () => {
    const envExamplePath = join(process.cwd(), '.env.example');
    const envExampleExists = existsSync(envExamplePath);

    if (!envExampleExists) {
      test.skip();
      return;
    }

    const envContent = readFileSync(envExamplePath, 'utf-8');

    // Check for critical environment variables
    expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_URL');
    expect(envContent).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    expect(envContent).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(envContent).toContain('OPENAI_API_KEY');
    expect(envContent).toContain('STRIPE_SECRET_KEY');
    expect(envContent).toContain('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
  });
});

test.describe('Build Configuration', () => {
  test('should have build script in package.json', () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    expect(packageJson.scripts).toHaveProperty('build');
    expect(packageJson.scripts.build).toContain('next build');
  });

  test('should have start script in package.json', () => {
    const packageJsonPath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

    expect(packageJson.scripts).toHaveProperty('start');
    expect(packageJson.scripts.start).toContain('next start');
  });
});
