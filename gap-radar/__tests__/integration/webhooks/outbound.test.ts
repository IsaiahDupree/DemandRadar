/**
 * @jest-environment node
 */

// Polyfill for Response.json (Node.js < 18.2.0 compatibility)
if (!Response.json) {
  Response.json = function (data: any, init?: ResponseInit) {
    return new Response(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  };
}

import { GET, POST, PATCH, DELETE } from '@/app/api/webhooks/outbound/route';
import { createClient } from '@/lib/supabase/server';
import { WebhookConfig, WebhookEventType } from '@/types';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(() =>
    Promise.resolve({
      get: jest.fn((key: string) => {
        if (key === 'authorization') return 'Bearer test_token';
        return null;
      }),
    })
  ),
}));

describe('Outbound Webhook Configuration API', () => {
  let mockSupabase: any;
  const mockUserId = 'user-123';

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      auth: {
        getUser: jest.fn(() =>
          Promise.resolve({
            data: { user: { id: mockUserId } },
            error: null,
          })
        ),
      },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      delete: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      single: jest.fn(() =>
        Promise.resolve({
          data: null,
          error: null,
        })
      ),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('GET /api/webhooks/outbound', () => {
    it('should return all webhook configs for authenticated user', async () => {
      const mockWebhooks: WebhookConfig[] = [
        {
          id: 'webhook-1',
          userId: mockUserId,
          url: 'https://example.com/webhook',
          secret: 'secret-123',
          isActive: true,
          events: ['run.completed', 'gap.discovered'],
          name: 'Test Webhook',
          successCount: 10,
          failureCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockSupabase.from.mockReturnValue(mockSupabase);
      mockSupabase.select.mockReturnValue(mockSupabase);
      mockSupabase.eq.mockResolvedValue({
        data: mockWebhooks,
        error: null,
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.webhooks).toHaveLength(1);
      expect(json.webhooks[0].url).toBe('https://example.com/webhook');
      expect(mockSupabase.from).toHaveBeenCalledWith('webhook_configs');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should return 401 if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      });

      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(401);
      expect(json.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/webhooks/outbound', () => {
    it('should create a new webhook config', async () => {
      const newWebhook = {
        url: 'https://example.com/webhook',
        events: ['run.completed', 'gap.discovered'] as WebhookEventType[],
        name: 'New Webhook',
        description: 'Test webhook for run events',
      };

      const createdWebhook: WebhookConfig = {
        id: 'webhook-new',
        userId: mockUserId,
        secret: 'generated-secret',
        isActive: true,
        successCount: 0,
        failureCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...newWebhook,
      };

      mockSupabase.single.mockResolvedValue({
        data: createdWebhook,
        error: null,
      });

      const request = new Request('http://localhost/api/webhooks/outbound', {
        method: 'POST',
        body: JSON.stringify(newWebhook),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(201);
      expect(json.webhook.url).toBe(newWebhook.url);
      expect(json.webhook.secret).toBeDefined();
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidWebhook = {
        events: ['run.completed'],
        // Missing required 'url' field
      };

      const request = new Request('http://localhost/api/webhooks/outbound', {
        method: 'POST',
        body: JSON.stringify(invalidWebhook),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toBeDefined();
    });

    it('should validate URL format', async () => {
      const invalidWebhook = {
        url: 'not-a-url',
        events: ['run.completed'],
      };

      const request = new Request('http://localhost/api/webhooks/outbound', {
        method: 'POST',
        body: JSON.stringify(invalidWebhook),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('URL');
    });

    it('should validate event types', async () => {
      const invalidWebhook = {
        url: 'https://example.com/webhook',
        events: ['invalid.event'],
      };

      const request = new Request('http://localhost/api/webhooks/outbound', {
        method: 'POST',
        body: JSON.stringify(invalidWebhook),
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const json = await response.json();

      expect(response.status).toBe(400);
      expect(json.error).toContain('event');
    });
  });

  describe('PATCH /api/webhooks/outbound', () => {
    it('should update webhook config', async () => {
      const webhookId = 'webhook-1';
      const updates = {
        url: 'https://new-url.com/webhook',
        isActive: false,
      };

      const request = new Request('http://localhost/api/webhooks/outbound', {
        method: 'PATCH',
        body: JSON.stringify({ id: webhookId, ...updates }),
        headers: { 'Content-Type': 'application/json' },
      });

      mockSupabase.single.mockResolvedValue({
        data: { id: webhookId, ...updates },
        error: null,
      });

      const response = await PATCH(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.webhook.url).toBe(updates.url);
      expect(json.webhook.isActive).toBe(false);
      expect(mockSupabase.update).toHaveBeenCalled();
    });
  });

  describe('DELETE /api/webhooks/outbound', () => {
    it('should delete webhook config', async () => {
      const webhookId = 'webhook-1';

      const request = new Request(
        `http://localhost/api/webhooks/outbound?id=${webhookId}`,
        {
          method: 'DELETE',
        }
      );

      // Mock the delete chain properly
      const deleteChain = {
        eq: jest.fn(() => ({
          eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      };

      mockSupabase.delete.mockReturnValue(deleteChain);

      const response = await DELETE(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.success).toBe(true);
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith('id', webhookId);
    });
  });
});
