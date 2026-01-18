/**
 * @jest-environment node
 */
import {
  getSubscription,
  cancelSubscription,
  updateSubscription,
  listCustomerSubscriptions,
} from '@/lib/stripe/subscriptions';
import { stripe } from '@/lib/stripe';
import Stripe from 'stripe';

jest.mock('@/lib/stripe', () => ({
  stripe: {
    subscriptions: {
      retrieve: jest.fn(),
      update: jest.fn(),
      cancel: jest.fn(),
      list: jest.fn(),
    },
  },
}));

describe('Stripe Subscriptions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSubscription', () => {
    it('should retrieve a subscription by ID', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_test_123',
        status: 'active',
        customer: 'cus_test_123',
      };

      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await getSubscription('sub_test_123');

      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123', {
        expand: ['customer', 'default_payment_method'],
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should throw error if subscription not found', async () => {
      (stripe.subscriptions.retrieve as jest.Mock).mockRejectedValue(
        new Error('Subscription not found')
      );

      await expect(getSubscription('sub_invalid')).rejects.toThrow('Subscription not found');
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel a subscription immediately', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_test_123',
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
      };

      (stripe.subscriptions.cancel as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await cancelSubscription('sub_test_123');

      expect(stripe.subscriptions.cancel).toHaveBeenCalledWith('sub_test_123');
      expect(result).toEqual(mockSubscription);
      expect(result.status).toBe('canceled');
    });

    it('should cancel a subscription at period end', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_test_123',
        status: 'active',
        cancel_at_period_end: true,
      };

      (stripe.subscriptions.update as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await cancelSubscription('sub_test_123', { atPeriodEnd: true });

      expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_test_123', {
        cancel_at_period_end: true,
      });
      expect(result.cancel_at_period_end).toBe(true);
    });

    it('should throw error if cancellation fails', async () => {
      (stripe.subscriptions.cancel as jest.Mock).mockRejectedValue(
        new Error('Cancellation failed')
      );

      await expect(cancelSubscription('sub_invalid')).rejects.toThrow('Cancellation failed');
    });
  });

  describe('updateSubscription', () => {
    it('should update subscription price', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_test_123',
        status: 'active',
        items: {
          data: [
            {
              id: 'si_test_123',
              price: {
                id: 'price_builder_new',
              } as Stripe.Price,
            } as Stripe.SubscriptionItem,
          ],
        } as Stripe.ApiList<Stripe.SubscriptionItem>,
      };

      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
        id: 'sub_test_123',
        items: {
          data: [{ id: 'si_test_123' }],
        },
      });
      (stripe.subscriptions.update as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await updateSubscription('sub_test_123', {
        newPriceId: 'price_builder_new',
      });

      expect(stripe.subscriptions.retrieve).toHaveBeenCalledWith('sub_test_123');
      expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_test_123', {
        items: [
          {
            id: 'si_test_123',
            price: 'price_builder_new',
          },
        ],
        proration_behavior: 'create_prorations',
      });
      expect(result).toEqual(mockSubscription);
    });

    it('should update subscription metadata', async () => {
      const mockSubscription: Partial<Stripe.Subscription> = {
        id: 'sub_test_123',
        metadata: {
          plan: 'builder',
          custom_field: 'value',
        },
      };

      (stripe.subscriptions.update as jest.Mock).mockResolvedValue(mockSubscription);

      const result = await updateSubscription('sub_test_123', {
        metadata: {
          plan: 'builder',
          custom_field: 'value',
        },
      });

      expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_test_123', {
        metadata: {
          plan: 'builder',
          custom_field: 'value',
        },
      });
      expect(result.metadata).toEqual({
        plan: 'builder',
        custom_field: 'value',
      });
    });

    it('should throw error if update fails', async () => {
      (stripe.subscriptions.retrieve as jest.Mock).mockResolvedValue({
        items: { data: [{ id: 'si_test' }] },
      });
      (stripe.subscriptions.update as jest.Mock).mockRejectedValue(
        new Error('Update failed')
      );

      await expect(
        updateSubscription('sub_invalid', { newPriceId: 'price_new' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('listCustomerSubscriptions', () => {
    it('should list all subscriptions for a customer', async () => {
      const mockSubscriptions: Partial<Stripe.ApiList<Stripe.Subscription>> = {
        data: [
          {
            id: 'sub_1',
            status: 'active',
          } as Stripe.Subscription,
          {
            id: 'sub_2',
            status: 'active',
          } as Stripe.Subscription,
        ],
        has_more: false,
      };

      (stripe.subscriptions.list as jest.Mock).mockResolvedValue(mockSubscriptions);

      const result = await listCustomerSubscriptions('cus_test_123');

      expect(stripe.subscriptions.list).toHaveBeenCalledWith({
        customer: 'cus_test_123',
        status: 'all',
        expand: ['data.default_payment_method'],
      });
      expect(result.data).toHaveLength(2);
      expect(result.data[0].id).toBe('sub_1');
    });

    it('should filter active subscriptions', async () => {
      const mockSubscriptions: Partial<Stripe.ApiList<Stripe.Subscription>> = {
        data: [
          {
            id: 'sub_1',
            status: 'active',
          } as Stripe.Subscription,
        ],
        has_more: false,
      };

      (stripe.subscriptions.list as jest.Mock).mockResolvedValue(mockSubscriptions);

      const result = await listCustomerSubscriptions('cus_test_123', { status: 'active' });

      expect(stripe.subscriptions.list).toHaveBeenCalledWith({
        customer: 'cus_test_123',
        status: 'active',
        expand: ['data.default_payment_method'],
      });
      expect(result.data).toHaveLength(1);
    });

    it('should handle pagination', async () => {
      const mockSubscriptions: Partial<Stripe.ApiList<Stripe.Subscription>> = {
        data: [
          {
            id: 'sub_1',
            status: 'active',
          } as Stripe.Subscription,
        ],
        has_more: true,
      };

      (stripe.subscriptions.list as jest.Mock).mockResolvedValue(mockSubscriptions);

      const result = await listCustomerSubscriptions('cus_test_123', { limit: 10 });

      expect(stripe.subscriptions.list).toHaveBeenCalledWith({
        customer: 'cus_test_123',
        status: 'all',
        expand: ['data.default_payment_method'],
        limit: 10,
      });
      expect(result.has_more).toBe(true);
    });

    it('should throw error if list fails', async () => {
      (stripe.subscriptions.list as jest.Mock).mockRejectedValue(
        new Error('List failed')
      );

      await expect(listCustomerSubscriptions('cus_invalid')).rejects.toThrow('List failed');
    });
  });
});
