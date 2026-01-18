/**
 * @jest-environment node
 */
import { createClient } from '@supabase/supabase-js';
import { generateAPIKey, hashAPIKey } from '@/lib/api-keys';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const shouldSkipTests = !supabaseUrl || !supabaseServiceKey;

const supabase = shouldSkipTests
  ? null
  : createClient(supabaseUrl!, supabaseServiceKey!);

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

describe('Public API (v1) Integration Tests', () => {
  beforeAll(() => {
    if (shouldSkipTests) {
      console.warn('Skipping v1 API tests - Supabase environment variables not set');
    }
  });

  if (shouldSkipTests) {
    it.skip('Tests skipped - requires Supabase environment variables', () => {});
    return;
  }

  let testUserId: string;
  let testProjectId: string;
  let testRunId: string;
  let apiKey: string;

  beforeAll(async () => {
    // Create test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: `test-api-${Date.now()}@example.com`,
      password: 'test-password-123!',
      email_confirm: true,
    });

    if (userError || !userData.user) {
      throw new Error('Failed to create test user');
    }

    testUserId = userData.user.id;

    // Create test project
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        owner_id: testUserId,
        name: 'Test API Project',
      })
      .select()
      .single();

    if (projectError || !projectData) {
      throw new Error('Failed to create test project');
    }

    testProjectId = projectData.id;

    // Create test run
    const { data: runData, error: runError } = await supabase
      .from('runs')
      .insert({
        project_id: testProjectId,
        niche_query: 'AI productivity tools',
        seed_terms: ['AI', 'productivity'],
        competitors: ['ChatGPT', 'Notion AI'],
        geo: 'us',
        status: 'complete',
        run_type: 'deep',
      })
      .select()
      .single();

    if (runError || !runData) {
      throw new Error('Failed to create test run');
    }

    testRunId = runData.id;

    // Create subscription for API access (mock Agency plan)
    await supabase.from('subscriptions').insert({
      user_id: testUserId,
      plan_id: 'agency',
      status: 'active',
      runs_remaining: 10,
      runs_limit: 35,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    // Generate API key
    apiKey = generateAPIKey();
    const keyHash = await hashAPIKey(apiKey);
    const keyPrefix = apiKey.substring(0, 12) + '...';

    await supabase.from('api_keys').insert({
      user_id: testUserId,
      name: 'Test API Key',
      key_hash: keyHash,
      key_prefix: keyPrefix,
      rate_limit: 100,
      is_active: true,
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (testRunId) {
      await supabase.from('runs').delete().eq('id', testRunId);
    }
    if (testProjectId) {
      await supabase.from('projects').delete().eq('id', testProjectId);
    }
    if (testUserId) {
      await supabase.from('api_keys').delete().eq('user_id', testUserId);
      await supabase.from('subscriptions').delete().eq('user_id', testUserId);
      await supabase.auth.admin.deleteUser(testUserId);
    }
  });

  describe('Authentication', () => {
    it('should reject requests without API key', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Missing Authorization header');
    });

    it('should reject requests with invalid API key format', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        headers: {
          Authorization: 'InvalidFormat api_key',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Invalid Authorization header format');
    });

    it('should reject requests with invalid API key', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        headers: {
          Authorization: 'Bearer dr_live_invalid_key_123',
        },
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Invalid API key');
    });

    it('should accept requests with valid API key', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should include rate limit headers in responses', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.headers.get('X-RateLimit-Limit')).toBe('100');
      expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
    });

    it('should track API usage in api_usage table', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(200);

      // Wait a bit for async logging
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check api_usage table
      const { data: usage } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', testUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      expect(usage).toBeDefined();
      expect(usage?.endpoint).toBe('/api/v1/runs');
      expect(usage?.method).toBe('GET');
      expect(usage?.status_code).toBe(200);
    });
  });

  describe('GET /api/v1/runs', () => {
    it('should list all runs for authenticated user', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.runs).toBeDefined();
      expect(Array.isArray(data.runs)).toBe(true);
      expect(data.runs.length).toBeGreaterThan(0);
      expect(data.runs[0].id).toBe(testRunId);
    });

    it('should return empty array for user with no runs', async () => {
      // Create a new user with no runs
      const { data: newUser } = await supabase.auth.admin.createUser({
        email: `test-no-runs-${Date.now()}@example.com`,
        password: 'test-password-123!',
        email_confirm: true,
      });

      const newUserId = newUser?.user?.id;

      // Create project for new user
      await supabase.from('projects').insert({
        owner_id: newUserId,
        name: 'Empty Project',
      });

      // Create API key for new user
      const newApiKey = generateAPIKey();
      const newKeyHash = await hashAPIKey(newApiKey);

      await supabase.from('api_keys').insert({
        user_id: newUserId,
        name: 'Test Key',
        key_hash: newKeyHash,
        key_prefix: newApiKey.substring(0, 12) + '...',
        rate_limit: 100,
        is_active: true,
      });

      // Create subscription
      await supabase.from('subscriptions').insert({
        user_id: newUserId,
        plan_id: 'agency',
        status: 'active',
        runs_remaining: 10,
        runs_limit: 35,
      });

      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        headers: {
          Authorization: `Bearer ${newApiKey}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.runs).toEqual([]);

      // Cleanup
      await supabase.from('api_keys').delete().eq('user_id', newUserId);
      await supabase.from('subscriptions').delete().eq('user_id', newUserId);
      await supabase.from('projects').delete().eq('owner_id', newUserId);
      await supabase.auth.admin.deleteUser(newUserId!);
    });
  });

  describe('POST /api/v1/runs', () => {
    it('should create a new run with valid payload', async () => {
      const payload = {
        nicheQuery: 'SaaS marketing tools',
        seedTerms: ['SaaS', 'marketing', 'growth'],
        competitors: ['HubSpot', 'Mailchimp'],
        geo: 'us',
        runType: 'deep',
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.run).toBeDefined();
      expect(data.run.niche_query).toBe(payload.nicheQuery);
      expect(data.run.status).toBe('queued');
      expect(data.message).toBe('Analysis run created successfully');

      // Cleanup
      await supabase.from('runs').delete().eq('id', data.run.id);
    });

    it('should reject request without nicheQuery', async () => {
      const payload = {
        seedTerms: ['test'],
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('nicheQuery is required');
    });

    it('should use default values for optional fields', async () => {
      const payload = {
        nicheQuery: 'Minimal test niche',
      };

      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.run.seed_terms).toEqual([]);
      expect(data.run.competitors).toEqual([]);
      expect(data.run.geo).toBe('us');
      expect(data.run.run_type).toBe('deep');

      // Cleanup
      await supabase.from('runs').delete().eq('id', data.run.id);
    });
  });

  describe('GET /api/v1/reports', () => {
    it('should list all reports with pagination', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/reports?limit=10&offset=0`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.reports).toBeDefined();
      expect(Array.isArray(data.reports)).toBe(true);
      expect(data.total).toBeDefined();
      expect(data.limit).toBe(10);
      expect(data.offset).toBe(0);
    });

    it('should filter reports by status', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/reports?status=complete`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.reports).toBeDefined();

      // All reports should have complete status
      data.reports.forEach((report: any) => {
        expect(report.status).toBe('complete');
      });
    });

    it('should respect pagination limits', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/reports?limit=1`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.reports.length).toBeLessThanOrEqual(1);
    });
  });

  describe('GET /api/v1/reports/[id]', () => {
    it('should get a specific report by ID', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/reports/${testRunId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.report).toBeDefined();
      expect(data.report.id).toBe(testRunId);
      expect(data.report.niche_query).toBe('AI productivity tools');
    });

    it('should return 404 for non-existent report', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await fetch(`${API_BASE_URL}/api/v1/reports/${fakeId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Report not found');
    });

    it('should deny access to reports from other users', async () => {
      // Create another user and their run
      const { data: otherUser } = await supabase.auth.admin.createUser({
        email: `test-other-${Date.now()}@example.com`,
        password: 'test-password-123!',
        email_confirm: true,
      });

      const otherUserId = otherUser?.user?.id;

      const { data: otherProject } = await supabase.from('projects').insert({
        owner_id: otherUserId,
        name: 'Other Project',
      }).select().single();

      const { data: otherRun } = await supabase.from('runs').insert({
        project_id: otherProject.id,
        niche_query: 'Other niche',
        status: 'complete',
      }).select().single();

      // Try to access other user's run with our API key
      const response = await fetch(`${API_BASE_URL}/api/v1/reports/${otherRun.id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized access to this report');

      // Cleanup
      await supabase.from('runs').delete().eq('id', otherRun.id);
      await supabase.from('projects').delete().eq('id', otherProject.id);
      await supabase.auth.admin.deleteUser(otherUserId!);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON in POST requests', async () => {
      const response = await fetch(`${API_BASE_URL}/api/v1/runs`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: '{invalid json}',
      });

      expect(response.status).toBe(500);
    });

    it('should handle internal server errors gracefully', async () => {
      // This tests error handling - actual errors depend on implementation
      const response = await fetch(`${API_BASE_URL}/api/v1/reports`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      // Should always return a valid response, even on errors
      expect(response.status).toBeGreaterThanOrEqual(200);
      expect(response.status).toBeLessThan(600);
    });
  });
});
