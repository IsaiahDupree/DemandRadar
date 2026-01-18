/**
 * Production Supabase Setup Tests
 *
 * Tests to verify that the Supabase production setup is configured correctly
 * Feature: INF-008 - Production Supabase Setup
 */

import fs from 'fs';
import path from 'path';

describe('Production Supabase Setup', () => {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  describe('Migration files', () => {
    it('should have migrations directory', () => {
      expect(fs.existsSync(migrationsDir)).toBe(true);
    });

    it('should have at least initial schema migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));

      expect(sqlFiles.length).toBeGreaterThan(0);
    });

    it('should have migrations in correct naming format (timestamp_description.sql)', () => {
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));

      sqlFiles.forEach((file) => {
        // Migration files should follow format: YYYYMMDDHHMMSS_description.sql
        expect(file).toMatch(/^\d{14}_[\w-]+\.sql$/);
      });
    });

    it('should have migrations ordered chronologically', () => {
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql')).sort();

      // Extract timestamps and verify they are in ascending order
      const timestamps = sqlFiles.map((f) => f.split('_')[0]);
      const sortedTimestamps = [...timestamps].sort();

      expect(timestamps).toEqual(sortedTimestamps);
    });

    it('should have initial schema migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const initialMigration = files.find((f) => f.includes('initial_schema'));

      expect(initialMigration).toBeDefined();
    });
  });

  describe('Migration content validation', () => {
    it('should create core tables in initial migration', () => {
      const files = fs.readdirSync(migrationsDir);
      const initialMigration = files.find((f) => f.includes('initial_schema'));

      if (!initialMigration) {
        throw new Error('Initial migration not found');
      }

      const content = fs.readFileSync(
        path.join(migrationsDir, initialMigration),
        'utf-8'
      );

      // Check for essential tables (using IF NOT EXISTS pattern)
      const essentialTables = [
        'users',
        'runs',
        'ad_creatives',
        'reddit_mentions',
        'gap_opportunities',
        'concept_ideas',
      ];

      essentialTables.forEach((table) => {
        expect(content).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
      });
    });

    it('should include Row Level Security (RLS) policies', () => {
      const files = fs.readdirSync(migrationsDir);

      // Check at least one migration file contains RLS policies
      let hasRLS = false;

      for (const file of files.filter((f) => f.endsWith('.sql'))) {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        if (
          content.includes('ALTER TABLE') &&
          content.includes('ENABLE ROW LEVEL SECURITY')
        ) {
          hasRLS = true;
          break;
        }
      }

      expect(hasRLS).toBe(true);
    });

    it('should include indexes for performance', () => {
      const files = fs.readdirSync(migrationsDir);

      // Check if any migration includes indexes
      let hasIndexes = false;

      for (const file of files.filter((f) => f.endsWith('.sql'))) {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        if (content.includes('CREATE INDEX')) {
          hasIndexes = true;
          break;
        }
      }

      expect(hasIndexes).toBe(true);
    });

    it('should use IF NOT EXISTS for table creation', () => {
      const files = fs.readdirSync(migrationsDir);
      const initialMigration = files.find((f) => f.includes('initial_schema'));

      if (!initialMigration) {
        throw new Error('Initial migration not found');
      }

      const content = fs.readFileSync(
        path.join(migrationsDir, initialMigration),
        'utf-8'
      );

      // Tables should be created with IF NOT EXISTS for idempotency
      expect(content).toContain('IF NOT EXISTS');
    });
  });

  describe('Documentation', () => {
    it('should have production Supabase setup documentation', () => {
      const docsPath = path.join(
        process.cwd(),
        'docs',
        'PRODUCTION_SUPABASE_SETUP.md'
      );
      expect(fs.existsSync(docsPath)).toBe(true);
    });

    it('should document migration process', () => {
      const docsPath = path.join(
        process.cwd(),
        'docs',
        'PRODUCTION_SUPABASE_SETUP.md'
      );
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('Run Database Migrations');
      expect(docs).toContain('supabase db push');
    });

    it('should document RLS configuration', () => {
      const docsPath = path.join(
        process.cwd(),
        'docs',
        'PRODUCTION_SUPABASE_SETUP.md'
      );
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('Row Level Security');
      expect(docs).toContain('RLS');
    });

    it('should document environment variables', () => {
      const docsPath = path.join(
        process.cwd(),
        'docs',
        'PRODUCTION_SUPABASE_SETUP.md'
      );
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('NEXT_PUBLIC_SUPABASE_URL');
      expect(docs).toContain('NEXT_PUBLIC_SUPABASE_ANON_KEY');
      expect(docs).toContain('SUPABASE_SERVICE_ROLE_KEY');
    });

    it('should include production checklist', () => {
      const docsPath = path.join(
        process.cwd(),
        'docs',
        'PRODUCTION_SUPABASE_SETUP.md'
      );
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs).toContain('Production Checklist');
      expect(docs).toContain('- [ ]');
    });
  });

  describe('Supabase configuration', () => {
    it('should have supabase directory with config', () => {
      const supabaseDir = path.join(process.cwd(), 'supabase');
      expect(fs.existsSync(supabaseDir)).toBe(true);
    });

    it('should have .gitignore configured for Supabase secrets', () => {
      const gitignorePath = path.join(process.cwd(), '.gitignore');
      const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

      // Supabase local config should be ignored
      expect(gitignore).toContain('.env');
    });
  });

  describe('Database client setup', () => {
    it('should have Supabase client library installed', () => {
      const packageJsonPath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf-8')
      );

      expect(packageJson.dependencies['@supabase/supabase-js']).toBeDefined();
      expect(packageJson.dependencies['@supabase/ssr']).toBeDefined();
    });

    it('should have Supabase utilities for client creation', () => {
      const utilsPath = path.join(process.cwd(), 'src', 'lib', 'supabase');
      expect(fs.existsSync(utilsPath)).toBe(true);
    });
  });

  describe('Security configuration', () => {
    it('should not commit service role key to git', () => {
      const envLocalPath = path.join(process.cwd(), '.env.local');

      // If .env.local exists, it should be in .gitignore
      if (fs.existsSync(envLocalPath)) {
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        const gitignore = fs.readFileSync(gitignorePath, 'utf-8');

        // .gitignore can use .env.local or .env* pattern
        expect(gitignore).toMatch(/\.env(\*|\.local)/);
      }
    });

    it('should document security warnings in setup docs', () => {
      const docsPath = path.join(
        process.cwd(),
        'docs',
        'PRODUCTION_SUPABASE_SETUP.md'
      );
      const docs = fs.readFileSync(docsPath, 'utf-8');

      expect(docs.toLowerCase()).toContain('security');
      expect(docs.toLowerCase()).toContain('never commit');
    });
  });

  describe('Migration validation', () => {
    it('should not have duplicate migration timestamps', () => {
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));

      const timestamps = sqlFiles.map((f) => f.split('_')[0]);
      const uniqueTimestamps = new Set(timestamps);

      expect(timestamps.length).toBe(uniqueTimestamps.size);
    });

    it('should have valid SQL syntax in migrations', () => {
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));

      sqlFiles.forEach((file) => {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        // Basic SQL validation - should contain CREATE, ALTER, or other SQL keywords
        const hasValidSQL =
          content.includes('CREATE') ||
          content.includes('ALTER') ||
          content.includes('INSERT') ||
          content.includes('UPDATE');

        expect(hasValidSQL).toBe(true);
      });
    });

    it('should use proper foreign key constraints', () => {
      const files = fs.readdirSync(migrationsDir);
      const initialMigration = files.find((f) => f.includes('initial_schema'));

      if (!initialMigration) {
        throw new Error('Initial migration not found');
      }

      const content = fs.readFileSync(
        path.join(migrationsDir, initialMigration),
        'utf-8'
      );

      // Should have foreign key references
      expect(content).toContain('REFERENCES');
    });
  });

  describe('Production readiness', () => {
    it('should have all required migrations for core features', () => {
      const files = fs.readdirSync(migrationsDir);
      const sqlFiles = files.filter((f) => f.endsWith('.sql'));

      // Should have multiple migrations for various features
      expect(sqlFiles.length).toBeGreaterThanOrEqual(10);
    });

    it('should have migrations for authentication tables', () => {
      const files = fs.readdirSync(migrationsDir);

      let hasUsersTables = false;

      for (const file of files.filter((f) => f.endsWith('.sql'))) {
        const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

        if (
          content.includes('CREATE TABLE') &&
          (content.includes('users') || content.includes('IF NOT EXISTS users'))
        ) {
          hasUsersTables = true;
          break;
        }
      }

      expect(hasUsersTables).toBe(true);
    });

    it('should have migrations for core business tables', () => {
      const files = fs.readdirSync(migrationsDir);
      const allContent = files
        .filter((f) => f.endsWith('.sql'))
        .map((f) => fs.readFileSync(path.join(migrationsDir, f), 'utf-8'))
        .join('\n');

      // Core business logic tables (check with IF NOT EXISTS pattern)
      const coreTables = ['runs', 'gap_opportunities', 'concept_ideas'];

      coreTables.forEach((table) => {
        expect(allContent).toContain(`CREATE TABLE IF NOT EXISTS ${table}`);
      });
    });
  });
});
