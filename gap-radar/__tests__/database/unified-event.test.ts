/**
 * Tests for unified_event table (GDP-003: Unified Events Table)
 *
 * Tests the Growth Data Plane unified_event table which normalizes events
 * from web, app, email, stripe, booking, and meta sources.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

describe('GDP-003: Unified Events Table', () => {
  let testPersonId: string;

  beforeAll(async () => {
    // Create a test person for our events
    const { data: person, error } = await supabase
      .from('person')
      .insert({
        email: 'test-unified-events@gapradar.test',
        first_name: 'Test',
        last_name: 'User'
      })
      .select('id')
      .single();

    if (error) throw error;
    testPersonId = person.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testPersonId) {
      await supabase.from('person').delete().eq('id', testPersonId);
    }
  });

  describe('Table Structure', () => {
    it('should have unified_event table with required columns', async () => {
      // Query the table schema
      const { data, error } = await supabase
        .from('unified_event')
        .select('*')
        .limit(0);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Event Insertion', () => {
    it('should insert a web event successfully', async () => {
      const eventData = {
        person_id: testPersonId,
        event_name: 'landing_view',
        event_source: 'web',
        event_timestamp: new Date().toISOString(),
        properties: {
          page: '/pricing',
          referrer: 'https://google.com'
        },
        session_id: 'test-session-123',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'brand'
      };

      const { data, error } = await supabase
        .from('unified_event')
        .insert(eventData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.event_name).toBe('landing_view');
      expect(data.event_source).toBe('web');
      expect(data.person_id).toBe(testPersonId);
    });

    it('should insert an email event successfully', async () => {
      const eventData = {
        person_id: testPersonId,
        event_name: 'email.opened',
        event_source: 'email',
        event_timestamp: new Date().toISOString(),
        properties: {
          email_id: 'msg_123',
          template: 'welcome'
        }
      };

      const { data, error } = await supabase
        .from('unified_event')
        .insert(eventData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.event_name).toBe('email.opened');
      expect(data.event_source).toBe('email');
    });

    it('should insert a stripe event successfully', async () => {
      const eventData = {
        person_id: testPersonId,
        event_name: 'purchase_completed',
        event_source: 'stripe',
        event_timestamp: new Date().toISOString(),
        properties: {
          amount_cents: 4900,
          currency: 'USD',
          plan: 'pro'
        }
      };

      const { data, error } = await supabase
        .from('unified_event')
        .insert(eventData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.event_name).toBe('purchase_completed');
      expect(data.event_source).toBe('stripe');
    });

    it('should insert a meta event successfully', async () => {
      const eventData = {
        person_id: testPersonId,
        event_name: 'ad_clicked',
        event_source: 'meta',
        event_timestamp: new Date().toISOString(),
        properties: {
          ad_id: '123456789',
          campaign_id: 'camp_123'
        }
      };

      const { data, error } = await supabase
        .from('unified_event')
        .insert(eventData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.event_name).toBe('ad_clicked');
      expect(data.event_source).toBe('meta');
    });
  });

  describe('Event Querying', () => {
    it('should query events by person_id', async () => {
      const { data, error } = await supabase
        .from('unified_event')
        .select('*')
        .eq('person_id', testPersonId)
        .order('event_timestamp', { ascending: false });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should query events by event_name', async () => {
      const { data, error } = await supabase
        .from('unified_event')
        .select('*')
        .eq('person_id', testPersonId)
        .eq('event_name', 'landing_view');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].event_name).toBe('landing_view');
    });

    it('should query events by event_source', async () => {
      const { data, error } = await supabase
        .from('unified_event')
        .select('*')
        .eq('person_id', testPersonId)
        .eq('event_source', 'web');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].event_source).toBe('web');
    });

    it('should query events by session_id', async () => {
      const { data, error } = await supabase
        .from('unified_event')
        .select('*')
        .eq('session_id', 'test-session-123');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.length).toBeGreaterThan(0);
    });
  });

  describe('Event Properties', () => {
    it('should store and retrieve JSONB properties correctly', async () => {
      const complexProperties = {
        nested: {
          data: {
            value: 123
          }
        },
        array: [1, 2, 3],
        string: 'test'
      };

      const { data, error } = await supabase
        .from('unified_event')
        .insert({
          person_id: testPersonId,
          event_name: 'test_event',
          event_source: 'web',
          event_timestamp: new Date().toISOString(),
          properties: complexProperties
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.properties).toEqual(complexProperties);
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should allow null person_id', async () => {
      const { data, error } = await supabase
        .from('unified_event')
        .insert({
          person_id: null,
          event_name: 'anonymous_event',
          event_source: 'web',
          event_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.person_id).toBeNull();

      // Clean up
      await supabase.from('unified_event').delete().eq('id', data.id);
    });

    it('should set person_id to null when person is deleted', async () => {
      // Create a temporary person
      const { data: tempPerson } = await supabase
        .from('person')
        .insert({
          email: 'temp-delete@test.com'
        })
        .select('id')
        .single();

      // Create an event for this person
      const { data: event } = await supabase
        .from('unified_event')
        .insert({
          person_id: tempPerson!.id,
          event_name: 'test_delete',
          event_source: 'web',
          event_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      // Delete the person
      await supabase.from('person').delete().eq('id', tempPerson!.id);

      // Check that event still exists but person_id is null
      const { data: updatedEvent } = await supabase
        .from('unified_event')
        .select('*')
        .eq('id', event!.id)
        .single();

      expect(updatedEvent).toBeDefined();
      expect(updatedEvent!.person_id).toBeNull();

      // Clean up
      await supabase.from('unified_event').delete().eq('id', event!.id);
    });
  });

  describe('Timestamps', () => {
    it('should automatically set created_at timestamp', async () => {
      const { data, error } = await supabase
        .from('unified_event')
        .insert({
          person_id: testPersonId,
          event_name: 'timestamp_test',
          event_source: 'web',
          event_timestamp: new Date().toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data.created_at).toBeDefined();
      expect(new Date(data.created_at)).toBeInstanceOf(Date);

      // Clean up
      await supabase.from('unified_event').delete().eq('id', data.id);
    });

    it('should allow custom event_timestamp', async () => {
      const customTimestamp = new Date('2024-01-15T12:00:00Z');

      const { data, error } = await supabase
        .from('unified_event')
        .insert({
          person_id: testPersonId,
          event_name: 'custom_timestamp_test',
          event_source: 'web',
          event_timestamp: customTimestamp.toISOString()
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(new Date(data.event_timestamp).getTime()).toBe(customTimestamp.getTime());

      // Clean up
      await supabase.from('unified_event').delete().eq('id', data.id);
    });
  });
});
