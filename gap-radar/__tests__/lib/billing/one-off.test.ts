/**
 * @jest-environment node
 */
import {
  createOneOffCheckoutSession,
  getOneOffReportTypes,
  unlockReportForUser,
  isReportUnlocked,
} from '@/lib/billing/one-off';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: jest.fn(),
        retrieve: jest.fn(),
      },
    },
  },
}));

// Mock Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

describe('One-off Report Purchase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOneOffReportTypes', () => {
    it('should return all report types with pricing', () => {
      const types = getOneOffReportTypes();

      expect(types).toHaveLength(3);
      expect(types[0]).toEqual({
        id: 'vetted_idea_pack',
        name: 'Vetted Idea Pack',
        description: 'Light run with 1-3 gaps, quick MVP, and platform recommendation',
        price: 4900, // $49.00 in cents
        runType: 'light',
      });
      expect(types[1]).toEqual({
        id: 'full_dossier',
        name: 'Full Dossier',
        description: 'Deep run with 3 ad concepts, MVP spec, and TAM/CAC model',
        price: 14900, // $149.00 in cents
        runType: 'deep',
      });
      expect(types[2]).toEqual({
        id: 'agency_ready',
        name: 'Agency-ready',
        description: 'Deep run with landing page, 10 ad angles, objection handling, and backlog',
        price: 39900, // $399.00 in cents
        runType: 'deep',
      });
    });
  });

  describe('createOneOffCheckoutSession', () => {
    it('should create a payment checkout session for one-off purchase', async () => {
      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        payment_status: 'unpaid',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await createOneOffCheckoutSession({
        reportType: 'vetted_idea_pack',
        userId: 'user-123',
        userEmail: 'test@example.com',
        nicheQuery: 'AI tools for content creators',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Vetted Idea Pack',
                description: 'Light run with 1-3 gaps, quick MVP, and platform recommendation',
              },
              unit_amount: 4900,
            },
            quantity: 1,
          },
        ],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        customer_email: 'test@example.com',
        client_reference_id: 'user-123',
        metadata: {
          userId: 'user-123',
          reportType: 'vetted_idea_pack',
          nicheQuery: 'AI tools for content creators',
          runType: 'light',
          purchaseType: 'one_off_report',
        },
      });

      expect(result).toEqual(mockSession);
    });

    it('should create session for full dossier', async () => {
      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/pay/cs_test_456',
        payment_status: 'unpaid',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await createOneOffCheckoutSession({
        reportType: 'full_dossier',
        userId: 'user-123',
        userEmail: 'test@example.com',
        nicheQuery: 'SaaS for SMBs',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'payment',
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                unit_amount: 14900,
              }),
            }),
          ],
          metadata: expect.objectContaining({
            reportType: 'full_dossier',
            runType: 'deep',
          }),
        })
      );

      expect(result).toEqual(mockSession);
    });

    it('should throw error for invalid report type', async () => {
      await expect(
        createOneOffCheckoutSession({
          reportType: 'invalid_type',
          userId: 'user-123',
          userEmail: 'test@example.com',
          nicheQuery: 'Test',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Invalid report type');
    });
  });

  describe('unlockReportForUser', () => {
    it('should unlock a report after successful payment', async () => {
      mockFrom.mockReturnValue({ insert: mockInsert });
      mockInsert.mockResolvedValue({ data: null, error: null });

      await unlockReportForUser({
        userId: 'user-123',
        runId: 'run-456',
        reportType: 'vetted_idea_pack',
        paymentIntentId: 'pi_test_123',
      });

      expect(mockFrom).toHaveBeenCalledWith('one_off_purchases');
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        run_id: 'run-456',
        report_type: 'vetted_idea_pack',
        payment_intent_id: 'pi_test_123',
        purchased_at: expect.any(String),
      });
    });

    it('should throw error if database insert fails', async () => {
      mockFrom.mockReturnValue({ insert: mockInsert });
      mockInsert.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        unlockReportForUser({
          userId: 'user-123',
          runId: 'run-456',
          reportType: 'vetted_idea_pack',
          paymentIntentId: 'pi_test_123',
        })
      ).rejects.toThrow('Database error');
    });
  });

  describe('isReportUnlocked', () => {
    it('should return true if user has purchased the report', async () => {
      const selectEq = jest.fn();
      const eqUserId = jest.fn();

      selectEq.mockReturnValue({ eq: eqUserId });
      eqUserId.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: {
          id: 'purchase-123',
          user_id: 'user-123',
          run_id: 'run-456',
        },
        error: null,
      });

      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: selectEq }) });

      const result = await isReportUnlocked('user-123', 'run-456');

      expect(result).toBe(true);
    });

    it('should return false if user has not purchased the report', async () => {
      const selectEq = jest.fn();
      const eqUserId = jest.fn();

      selectEq.mockReturnValue({ eq: eqUserId });
      eqUserId.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Not found', code: 'PGRST116' },
      });

      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: selectEq }) });

      const result = await isReportUnlocked('user-123', 'run-456');

      expect(result).toBe(false);
    });

    it('should throw error if database query fails', async () => {
      const selectEq = jest.fn();
      const eqUserId = jest.fn();

      selectEq.mockReturnValue({ eq: eqUserId });
      eqUserId.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'ERROR' },
      });

      mockFrom.mockReturnValue({ select: jest.fn().mockReturnValue({ eq: selectEq }) });

      await expect(isReportUnlocked('user-123', 'run-456')).rejects.toThrow(
        'Database error'
      );
    });
  });
});
