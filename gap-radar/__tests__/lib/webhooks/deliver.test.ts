/**
 * @jest-environment node
 */

import {
  signWebhookPayload,
  verifyWebhookSignature,
  deliverWebhook,
  triggerWebhooks,
} from '@/lib/webhooks/deliver';
import { createClient } from '@/lib/supabase/server';
import { WebhookEventType } from '@/types';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn();

describe('Webhook Delivery', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabase = {
      from: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      contains: jest.fn(() =>
        Promise.resolve({
          data: [],
          error: null,
        })
      ),
      rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('signWebhookPayload', () => {
    it('should generate consistent HMAC signature', () => {
      const payload = JSON.stringify({ test: 'data' });
      const secret = 'test-secret';

      const signature1 = signWebhookPayload(payload, secret);
      const signature2 = signWebhookPayload(payload, secret);

      expect(signature1).toBe(signature2);
      expect(signature1).toHaveLength(64); // SHA256 hex = 64 chars
    });

    it('should generate different signatures for different payloads', () => {
      const secret = 'test-secret';
      const sig1 = signWebhookPayload('payload1', secret);
      const sig2 = signWebhookPayload('payload2', secret);

      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different secrets', () => {
      const payload = 'test-payload';
      const sig1 = signWebhookPayload(payload, 'secret1');
      const sig2 = signWebhookPayload(payload, 'secret2');

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should verify valid signature', () => {
      const payload = 'test-payload';
      const secret = 'test-secret';
      const signature = signWebhookPayload(payload, secret);

      const isValid = verifyWebhookSignature(payload, signature, secret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const payload = 'test-payload';
      const secret = 'test-secret';
      const wrongSignature = signWebhookPayload(payload, 'wrong-secret');

      const isValid = verifyWebhookSignature(payload, wrongSignature, secret);
      expect(isValid).toBe(false);
    });

    it('should reject tampered payload', () => {
      const payload = 'test-payload';
      const secret = 'test-secret';
      const signature = signWebhookPayload(payload, secret);

      const isValid = verifyWebhookSignature('tampered-payload', signature, secret);
      expect(isValid).toBe(false);
    });
  });

  describe('deliverWebhook', () => {
    it('should successfully deliver webhook with correct headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn(() => Promise.resolve('OK')),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await deliverWebhook(
        'webhook-123',
        'https://example.com/webhook',
        'test-secret',
        'run.completed',
        { runId: 'run-456', status: 'complete' }
      );

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-Webhook-Event': 'run.completed',
            'User-Agent': 'GapRadar-Webhooks/1.0',
          }),
        })
      );

      // Verify signature header was set
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(fetchCall.headers['X-Webhook-Signature']).toBeDefined();
      expect(fetchCall.headers['X-Webhook-Signature']).toHaveLength(64);
    });

    it('should handle failed delivery', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: jest.fn(() => Promise.resolve('Internal Server Error')),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await deliverWebhook(
        'webhook-123',
        'https://example.com/webhook',
        'test-secret',
        'run.failed',
        { runId: 'run-456', error: 'Test error' }
      );

      expect(result.success).toBe(false);
      expect(result.statusCode).toBe(500);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_webhook_failure', {
        webhook_id: 'webhook-123',
      });
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await deliverWebhook(
        'webhook-123',
        'https://example.com/webhook',
        'test-secret',
        'run.completed',
        { runId: 'run-456' }
      );

      expect(result.success).toBe(false);
      expect(result.errorMessage).toContain('Network error');
    });

    it('should log delivery to database', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn(() => Promise.resolve('OK')),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await deliverWebhook(
        'webhook-123',
        'https://example.com/webhook',
        'test-secret',
        'gap.discovered',
        { gapId: 'gap-789', title: 'Test Gap' }
      );

      expect(mockSupabase.from).toHaveBeenCalledWith('webhook_deliveries');
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          webhook_config_id: 'webhook-123',
          event_type: 'gap.discovered',
          status: 'success',
          status_code: 200,
        })
      );
    });
  });

  describe('triggerWebhooks', () => {
    it('should trigger all matching webhooks', async () => {
      const mockWebhooks = [
        {
          id: 'webhook-1',
          url: 'https://example.com/webhook1',
          secret: 'secret-1',
          events: ['run.completed', 'gap.discovered'],
        },
        {
          id: 'webhook-2',
          url: 'https://example.com/webhook2',
          secret: 'secret-2',
          events: ['run.completed'],
        },
      ];

      mockSupabase.contains.mockResolvedValue({
        data: mockWebhooks,
        error: null,
      });

      const mockResponse = {
        ok: true,
        status: 200,
        text: jest.fn(() => Promise.resolve('OK')),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await triggerWebhooks('user-123', 'run.completed', {
        runId: 'run-456',
        status: 'complete',
      });

      expect(mockSupabase.contains).toHaveBeenCalledWith('events', ['run.completed']);
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook1',
        expect.any(Object)
      );
      expect(global.fetch).toHaveBeenCalledWith(
        'https://example.com/webhook2',
        expect.any(Object)
      );
    });

    it('should handle case when no webhooks match', async () => {
      mockSupabase.contains.mockResolvedValue({
        data: [],
        error: null,
      });

      await triggerWebhooks('user-123', 'run.started', { runId: 'run-456' });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.contains.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      await expect(
        triggerWebhooks('user-123', 'run.completed', { runId: 'run-456' })
      ).resolves.not.toThrow();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
