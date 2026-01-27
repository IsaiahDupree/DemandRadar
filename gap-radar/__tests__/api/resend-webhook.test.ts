/**
 * Tests for Resend Webhook Edge Function (GDP-004)
 *
 * Feature: GDP-004 - Resend Webhook Edge Function
 * Description: Verify Svix signature, store email events, map tags to person_id
 */

// Mock dependencies BEFORE importing the route
jest.mock('@/lib/supabase/service');
jest.mock('svix', () => ({
  Webhook: jest.fn(),
}));

import { POST } from '@/app/api/webhooks/resend/route';
import { createServiceClient } from '@/lib/supabase/service';
import { Webhook } from 'svix';

describe('Resend Webhook Handler (GDP-004)', () => {
  let mockSupabase: any;
  let mockWebhook: any;

  beforeEach(() => {
    // Set environment variable
    process.env.RESEND_WEBHOOK_SECRET = 'test_webhook_secret';

    // Reset mocks
    jest.clearAllMocks();

    // Track all from() calls
    const fromCalls: string[] = [];

    // Create chainable mock for Supabase
    mockSupabase = {
      from: jest.fn((table: string) => {
        fromCalls.push(table);
        return mockSupabase;
      }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      _fromCalls: fromCalls, // Store for assertions
    };

    mockWebhook = {
      verify: jest.fn(),
    };

    (createServiceClient as jest.Mock).mockReturnValue(mockSupabase);
    (Webhook as jest.Mock).mockReturnValue(mockWebhook);
  });

  describe('Signature Verification', () => {
    it('should reject webhook with missing signature headers', async () => {
      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'email.delivered',
          data: {},
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Missing signature headers');
    });

    it('should reject webhook with invalid signature', async () => {
      mockWebhook.verify.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'invalid_signature',
        },
        body: JSON.stringify({
          type: 'email.delivered',
          data: {},
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toContain('Invalid signature');
    });

    it('should accept webhook with valid signature', async () => {
      const payload = {
        type: 'email.delivered',
        created_at: '2026-01-26T10:00:00.000Z',
        data: {
          email_id: 'msg_456',
          to: 'user@example.com',
          from: 'noreply@gapradar.com',
          subject: 'Welcome to GapRadar',
          tags: {
            person_id: '123e4567-e89b-12d3-a456-426614174000',
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);
      mockSupabase.single.mockResolvedValue({
        data: { id: '123e4567-e89b-12d3-a456-426614174000' },
        error: null,
      });
      mockSupabase.insert.mockResolvedValue({ data: {}, error: null });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockWebhook.verify).toHaveBeenCalled();
    });
  });

  describe('Email Event Storage', () => {
    it('should store email.delivered event with person mapping', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const payload = {
        type: 'email.delivered',
        created_at: '2026-01-26T10:00:00.000Z',
        data: {
          email_id: 'msg_456',
          to: 'user@example.com',
          from: 'noreply@gapradar.com',
          subject: 'Welcome to GapRadar',
          tags: {
            person_id: personId,
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);
      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockResolvedValue({ data: {}, error: null });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('person');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should store email.opened event', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const payload = {
        type: 'email.opened',
        created_at: '2026-01-26T10:05:00.000Z',
        data: {
          email_id: 'msg_456',
          to: 'user@example.com',
          tags: {
            person_id: personId,
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);
      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockResolvedValue({ data: {}, error: null });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should store email.clicked event with clicked_url', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const payload = {
        type: 'email.clicked',
        created_at: '2026-01-26T10:10:00.000Z',
        data: {
          email_id: 'msg_456',
          to: 'user@example.com',
          click: {
            link: 'https://gapradar.com/dashboard',
          },
          tags: {
            person_id: personId,
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);
      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockResolvedValue({ data: {}, error: null });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should store email.bounced event', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const payload = {
        type: 'email.bounced',
        created_at: '2026-01-26T10:15:00.000Z',
        data: {
          email_id: 'msg_456',
          to: 'user@example.com',
          tags: {
            person_id: personId,
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);
      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockResolvedValue({ data: {}, error: null });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Email Event Tracking (GDP-005)', () => {
    it('should create email_message and email_event for delivered event', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const emailId = 'msg_456';
      const payload = {
        type: 'email.delivered',
        created_at: '2026-01-26T10:00:00.000Z',
        data: {
          email_id: emailId,
          to: 'user@example.com',
          from: 'noreply@gapradar.com',
          subject: 'Welcome to GapRadar',
          tags: {
            person_id: personId,
            template_key: 'welcome_email',
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);

      // Set up multiple responses for different queries
      let singleCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        singleCallCount++;
        if (singleCallCount === 1) {
          // First call: person lookup
          return Promise.resolve({ data: { id: personId }, error: null });
        } else if (singleCallCount === 2) {
          // Second call: email_message lookup (not found)
          return Promise.resolve({ data: null, error: { message: 'Not found' } });
        } else {
          // Third call: after email_message insert with select('id')
          return Promise.resolve({ data: { id: 'email_msg_123' }, error: null });
        }
      });

      mockSupabase.insert.mockReturnThis();

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      // Verify email_message was created/updated
      expect(mockSupabase._fromCalls).toContain('email_message');

      // Verify email_event was created
      expect(mockSupabase._fromCalls).toContain('email_event');
    });

    it('should update email_message status on opened event', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const emailId = 'msg_456';
      const emailMessageId = 'email_msg_123';
      const payload = {
        type: 'email.opened',
        created_at: '2026-01-26T10:05:00.000Z',
        data: {
          email_id: emailId,
          to: 'user@example.com',
          tags: {
            person_id: personId,
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);

      let singleCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        singleCallCount++;
        if (singleCallCount === 1) {
          // First call: person lookup
          return Promise.resolve({ data: { id: personId }, error: null });
        } else if (singleCallCount === 2) {
          // Second call: email_message lookup (found)
          return Promise.resolve({ data: { id: emailMessageId }, error: null });
        } else {
          // Third call: get open_count
          return Promise.resolve({ data: { open_count: 0 }, error: null });
        }
      });

      mockSupabase.insert.mockReturnThis();
      mockSupabase.update.mockReturnThis();

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      // Verify email_message status was updated
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase._fromCalls).toContain('email_message');
      expect(mockSupabase._fromCalls).toContain('email_event');
    });

    it('should track clicked event with clicked_url in email_event', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const emailId = 'msg_456';
      const emailMessageId = 'email_msg_123';
      const clickedUrl = 'https://gapradar.com/dashboard';
      const payload = {
        type: 'email.clicked',
        created_at: '2026-01-26T10:10:00.000Z',
        data: {
          email_id: emailId,
          to: 'user@example.com',
          click: {
            link: clickedUrl,
          },
          tags: {
            person_id: personId,
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);

      let singleCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        singleCallCount++;
        if (singleCallCount === 1) {
          // First call: person lookup
          return Promise.resolve({ data: { id: personId }, error: null });
        } else if (singleCallCount === 2) {
          // Second call: email_message lookup (found)
          return Promise.resolve({ data: { id: emailMessageId }, error: null });
        } else {
          // Third call: get click_count
          return Promise.resolve({ data: { click_count: 0, first_clicked_at: null }, error: null });
        }
      });

      mockSupabase.insert.mockReturnThis();
      mockSupabase.update.mockReturnThis();

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      // Verify email_event was created with clicked_url
      expect(mockSupabase._fromCalls).toContain('email_event');
      expect(mockSupabase.insert).toHaveBeenCalled();
    });

    it('should update email_message status on bounced event', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const emailId = 'msg_456';
      const emailMessageId = 'email_msg_123';
      const payload = {
        type: 'email.bounced',
        created_at: '2026-01-26T10:15:00.000Z',
        data: {
          email_id: emailId,
          to: 'user@example.com',
          bounce: {
            message: 'Mailbox does not exist',
          },
          tags: {
            person_id: personId,
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);

      let singleCallCount = 0;
      mockSupabase.single.mockImplementation(() => {
        singleCallCount++;
        if (singleCallCount === 1) {
          // First call: person lookup
          return Promise.resolve({ data: { id: personId }, error: null });
        } else {
          // Second call: email_message lookup (found)
          return Promise.resolve({ data: { id: emailMessageId }, error: null });
        }
      });

      mockSupabase.insert.mockReturnThis();
      mockSupabase.update.mockReturnThis();

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      // Verify email_message status was updated to bounced
      expect(mockSupabase.update).toHaveBeenCalled();
      expect(mockSupabase._fromCalls).toContain('email_message');
      expect(mockSupabase._fromCalls).toContain('email_event');
    });
  });

  describe('Person ID Mapping', () => {
    it('should get person_id from tags', async () => {
      const personId = '123e4567-e89b-12d3-a456-426614174000';
      const payload = {
        type: 'email.delivered',
        created_at: '2026-01-26T10:00:00.000Z',
        data: {
          email_id: 'msg_456',
          to: 'user@example.com',
          tags: {
            person_id: personId,
          },
        },
      };

      mockWebhook.verify.mockReturnValue(payload);
      mockSupabase.single.mockResolvedValue({
        data: { id: personId },
        error: null,
      });
      mockSupabase.insert.mockResolvedValue({ data: {}, error: null });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', personId);
    });

    it('should fallback to email lookup if person_id not in tags', async () => {
      const payload = {
        type: 'email.delivered',
        created_at: '2026-01-26T10:00:00.000Z',
        data: {
          email_id: 'msg_456',
          to: 'user@example.com',
          tags: {},
        },
      };

      mockWebhook.verify.mockReturnValue(payload);
      mockSupabase.single.mockResolvedValue({
        data: { id: '123e4567-e89b-12d3-a456-426614174000' },
        error: null,
      });
      mockSupabase.insert.mockResolvedValue({ data: {}, error: null });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      await POST(request);

      expect(mockSupabase.eq).toHaveBeenCalledWith('email', 'user@example.com');
    });

    it('should handle missing person gracefully', async () => {
      const payload = {
        type: 'email.delivered',
        created_at: '2026-01-26T10:00:00.000Z',
        data: {
          email_id: 'msg_456',
          to: 'unknown@example.com',
          tags: {},
        },
      };

      mockWebhook.verify.mockReturnValue(payload);
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Person not found' },
      });

      const request = new Request('http://localhost:3000/api/webhooks/resend', {
        method: 'POST',
        headers: {
          'svix-id': 'msg_123',
          'svix-timestamp': '1234567890',
          'svix-signature': 'valid_signature',
        },
        body: JSON.stringify(payload),
      });

      const response = await POST(request);

      // Should still return 200 to acknowledge receipt
      expect(response.status).toBe(200);
    });
  });
});
