/**
 * @jest-environment node
 */
import { createCheckoutSession, getCheckoutSession } from '@/lib/stripe/checkout';
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
  PLANS: {
    starter: {
      name: 'Starter',
      price: 29,
      priceId: 'price_starter_test',
      runsLimit: 2,
      features: ['2 runs/month'],
    },
    builder: {
      name: 'Builder',
      price: 99,
      priceId: 'price_builder_test',
      runsLimit: 10,
      features: ['10 runs/month'],
    },
  },
}));

describe('Stripe Checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session with correct parameters', async () => {
      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
        customer: 'cus_test_123',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      const result = await createCheckoutSession({
        priceId: 'price_builder_test',
        userId: 'user_123',
        userEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: 'price_builder_test',
            quantity: 1,
          },
        ],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        customer_email: 'test@example.com',
        client_reference_id: 'user_123',
        metadata: {
          userId: 'user_123',
        },
        subscription_data: {
          metadata: {
            userId: 'user_123',
          },
        },
      });

      expect(result).toEqual(mockSession);
    });

    it('should throw error if session creation fails', async () => {
      (stripe.checkout.sessions.create as jest.Mock).mockRejectedValue(
        new Error('Stripe error')
      );

      await expect(
        createCheckoutSession({
          priceId: 'price_builder_test',
          userId: 'user_123',
          userEmail: 'test@example.com',
          successUrl: 'https://example.com/success',
          cancelUrl: 'https://example.com/cancel',
        })
      ).rejects.toThrow('Stripe error');
    });

    it('should handle custom metadata', async () => {
      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      (stripe.checkout.sessions.create as jest.Mock).mockResolvedValue(mockSession);

      await createCheckoutSession({
        priceId: 'price_builder_test',
        userId: 'user_123',
        userEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: {
          plan: 'builder',
          source: 'pricing_page',
        },
      });

      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            userId: 'user_123',
            plan: 'builder',
            source: 'pricing_page',
          }),
        })
      );
    });
  });

  describe('getCheckoutSession', () => {
    it('should retrieve a checkout session by ID', async () => {
      const mockSession: Partial<Stripe.Checkout.Session> = {
        id: 'cs_test_123',
        payment_status: 'paid',
        customer: 'cus_test_123',
      };

      (stripe.checkout.sessions.retrieve as jest.Mock).mockResolvedValue(mockSession);

      const result = await getCheckoutSession('cs_test_123');

      expect(stripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_test_123', {
        expand: ['line_items', 'customer'],
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw error if session not found', async () => {
      (stripe.checkout.sessions.retrieve as jest.Mock).mockRejectedValue(
        new Error('Session not found')
      );

      await expect(getCheckoutSession('cs_invalid')).rejects.toThrow('Session not found');
    });
  });
});
