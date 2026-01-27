/**
 * Simplified tests for unified_event table (GDP-003: Unified Events Table)
 *
 * Tests the Growth Data Plane unified_event table structure and basic operations.
 * Uses direct database access via Docker exec to bypass RLS for testing.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Helper function to run SQL queries directly on the database
async function runSQL(query: string): Promise<any> {
  const { stdout } = await execAsync(
    `docker exec supabase_db_gap-radar psql -U postgres -d postgres -t -A -q -c "${query.replace(/"/g, '\\"')}"`
  );
  return stdout.trim();
}

// Helper to run SQL and parse JSON result
async function runSQLJSON(query: string): Promise<any> {
  const result = await runSQL(query);
  if (!result) return null;
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}

describe('GDP-003: Unified Events Table - Direct Database Tests', () => {
  let testPersonId: string;
  const testEmail = `test-unified-${Date.now()}@test.com`;

  beforeAll(async () => {
    // Create a test person with unique email
    const result = await runSQL(
      `INSERT INTO person (email, first_name, last_name) VALUES ('${testEmail}', 'Test', 'User') RETURNING id;`
    );
    testPersonId = result;
  });

  afterAll(async () => {
    // Clean up - delete events first (due to FK), then person
    if (testPersonId) {
      await runSQL(`DELETE FROM unified_event WHERE person_id = '${testPersonId}';`);
      await runSQL(`DELETE FROM person WHERE id = '${testPersonId}';`);
    }
  });

  describe('Table Structure', () => {
    it('should have unified_event table', async () => {
      const result = await runSQL(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'unified_event');`
      );
      expect(result).toBe('t');
    });

    it('should have required columns', async () => {
      const columns = await runSQL(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'unified_event' ORDER BY ordinal_position;`
      );

      expect(columns).toContain('id');
      expect(columns).toContain('person_id');
      expect(columns).toContain('event_name');
      expect(columns).toContain('event_source');
      expect(columns).toContain('event_timestamp');
      expect(columns).toContain('properties');
      expect(columns).toContain('session_id');
      expect(columns).toContain('created_at');
    });

    it('should have proper indexes', async () => {
      const indexes = await runSQL(
        `SELECT indexname FROM pg_indexes WHERE tablename = 'unified_event';`
      );

      expect(indexes).toContain('idx_unified_event_person_id');
      expect(indexes).toContain('idx_unified_event_event_name');
      expect(indexes).toContain('idx_unified_event_event_source');
      expect(indexes).toContain('idx_unified_event_event_timestamp');
    });
  });

  describe('Event Insertion', () => {
    it('should insert a web event successfully', async () => {
      const result = await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp, properties, session_id)
         VALUES ('${testPersonId}', 'landing_view', 'web', NOW(), '{"page": "/pricing"}'::jsonb, 'session-123')
         RETURNING event_name, event_source;`
      );

      expect(result).toContain('landing_view');
      expect(result).toContain('web');
    });

    it('should insert an email event successfully', async () => {
      const result = await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp)
         VALUES ('${testPersonId}', 'email.opened', 'email', NOW())
         RETURNING event_name;`
      );

      expect(result).toBe('email.opened');
    });

    it('should insert a stripe event successfully', async () => {
      const result = await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp, properties)
         VALUES ('${testPersonId}', 'purchase_completed', 'stripe', NOW(), '{"amount_cents": 4900}'::jsonb)
         RETURNING event_name;`
      );

      expect(result).toBe('purchase_completed');
    });

    it('should insert a meta event successfully', async () => {
      const result = await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp)
         VALUES ('${testPersonId}', 'ad_clicked', 'meta', NOW())
         RETURNING event_name;`
      );

      expect(result).toBe('ad_clicked');
    });
  });

  describe('Event Querying', () => {
    it('should count events by person_id', async () => {
      const count = await runSQL(
        `SELECT COUNT(*) FROM unified_event WHERE person_id = '${testPersonId}';`
      );

      expect(parseInt(count)).toBeGreaterThan(0);
    });

    it('should filter events by event_name', async () => {
      const count = await runSQL(
        `SELECT COUNT(*) FROM unified_event WHERE person_id = '${testPersonId}' AND event_name = 'landing_view';`
      );

      expect(parseInt(count)).toBeGreaterThan(0);
    });

    it('should filter events by event_source', async () => {
      const count = await runSQL(
        `SELECT COUNT(*) FROM unified_event WHERE person_id = '${testPersonId}' AND event_source = 'web';`
      );

      expect(parseInt(count)).toBeGreaterThan(0);
    });

    it('should filter events by session_id', async () => {
      const count = await runSQL(
        `SELECT COUNT(*) FROM unified_event WHERE session_id = 'session-123';`
      );

      expect(parseInt(count)).toBeGreaterThan(0);
    });
  });

  describe('JSONB Properties', () => {
    it('should store and retrieve JSONB properties', async () => {
      // Insert event with complex properties
      await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp, properties)
         VALUES ('${testPersonId}', 'test_jsonb', 'web', NOW(), '{"nested": {"value": 123}, "array": [1,2,3]}'::jsonb);`
      );

      // Query the properties
      const properties = await runSQL(
        `SELECT properties->>'nested' as nested FROM unified_event WHERE event_name = 'test_jsonb' LIMIT 1;`
      );

      expect(properties).toContain('value');
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should allow null person_id', async () => {
      const result = await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp)
         VALUES (NULL, 'anonymous_event', 'web', NOW())
         RETURNING person_id;`
      );

      expect(result).toBe('');
    });

    it('should set person_id to null when person is deleted (ON DELETE SET NULL)', async () => {
      // Create temp person with unique email
      const tempEmail = `temp-delete-${Date.now()}@test.com`;
      const tempPersonId = await runSQL(
        `INSERT INTO person (email) VALUES ('${tempEmail}') RETURNING id;`
      );

      // Create event for temp person
      const eventId = await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp)
         VALUES ('${tempPersonId}', 'test_delete', 'web', NOW())
         RETURNING id;`
      );

      // Delete person
      await runSQL(`DELETE FROM person WHERE id = '${tempPersonId}';`);

      // Check event still exists but person_id is null
      const personIdAfterDelete = await runSQL(
        `SELECT person_id FROM unified_event WHERE id = '${eventId}';`
      );

      expect(personIdAfterDelete).toBe('');

      // Clean up
      await runSQL(`DELETE FROM unified_event WHERE id = '${eventId}';`);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set created_at', async () => {
      const createdAt = await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp)
         VALUES ('${testPersonId}', 'timestamp_test', 'web', NOW())
         RETURNING created_at;`
      );

      expect(createdAt).toBeTruthy();
      expect(new Date(createdAt)).toBeInstanceOf(Date);
    });

    it('should allow custom event_timestamp', async () => {
      const customTimestamp = '2024-01-15 12:00:00+00';
      const result = await runSQL(
        `INSERT INTO unified_event (person_id, event_name, event_source, event_timestamp)
         VALUES ('${testPersonId}', 'custom_timestamp', 'web', '${customTimestamp}')
         RETURNING event_timestamp;`
      );

      expect(result).toContain('2024-01-15');
    });
  });

  describe('Indexes Performance', () => {
    it('should have GIN index on properties for JSON queries', async () => {
      const hasGinIndex = await runSQL(
        `SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'unified_event'
          AND indexdef LIKE '%gin%properties%'
        );`
      );

      expect(hasGinIndex).toBe('t');
    });

    it('should have composite index for person + event_name + timestamp queries', async () => {
      const hasCompositeIndex = await runSQL(
        `SELECT EXISTS (
          SELECT 1 FROM pg_indexes
          WHERE tablename = 'unified_event'
          AND indexname = 'idx_unified_event_person_name_time'
        );`
      );

      expect(hasCompositeIndex).toBe('t');
    });
  });
});
