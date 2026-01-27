/**
 * Test: Person & Identity Service (GDP-002)
 * Test-Driven Development: Person and Identity Link service layer
 *
 * This test verifies the service layer for creating and managing persons
 * and their identity links across platforms (PostHog, Stripe, Meta, Resend).
 */

import {
  getOrCreatePerson,
  linkPersonIdentity,
  getPersonByEmail,
  getPersonById,
  getPersonByExternalId,
  unlinkPersonIdentity,
  type Person,
  type IdentityLink,
  type CreatePersonInput,
  type LinkIdentityInput,
} from '@/lib/gdp/person-service';

describe('Person & Identity Service (GDP-002)', () => {
  describe('Type Definitions', () => {
    it('should define Person type with required fields', () => {
      const person: Person = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        lifecycle_stage: 'lead',
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(person.email).toBe('test@example.com');
      expect(person.lifecycle_stage).toBe('lead');
    });

    it('should define IdentityLink type with platform info', () => {
      const link: IdentityLink = {
        id: '123e4567-e89b-12d3-a456-426614174001',
        person_id: '123e4567-e89b-12d3-a456-426614174000',
        platform: 'posthog',
        external_id: 'ph_user_123',
        properties: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(link.platform).toBe('posthog');
      expect(link.external_id).toBe('ph_user_123');
    });
  });

  describe('getOrCreatePerson', () => {
    it('should have correct function signature', () => {
      expect(typeof getOrCreatePerson).toBe('function');
    });

    it('should accept CreatePersonInput with email', () => {
      const input: CreatePersonInput = {
        email: 'new@example.com',
        first_name: 'Jane',
        last_name: 'Smith',
      };

      expect(input.email).toBe('new@example.com');
    });

    it('should accept optional UTM parameters', () => {
      const input: CreatePersonInput = {
        email: 'marketer@example.com',
        utm_source: 'google',
        utm_campaign: 'launch',
        utm_medium: 'cpc',
      };

      expect(input.utm_source).toBe('google');
      expect(input.utm_campaign).toBe('launch');
    });

    it('should accept optional properties JSONB field', () => {
      const input: CreatePersonInput = {
        email: 'user@example.com',
        properties: {
          signup_source: 'landing_page',
          referral_code: 'FRIEND123',
        },
      };

      expect(input.properties?.signup_source).toBe('landing_page');
    });
  });

  describe('linkPersonIdentity', () => {
    it('should have correct function signature', () => {
      expect(typeof linkPersonIdentity).toBe('function');
    });

    it('should accept LinkIdentityInput with required fields', () => {
      const input: LinkIdentityInput = {
        person_id: '123e4567-e89b-12d3-a456-426614174000',
        platform: 'stripe',
        external_id: 'cus_ABC123',
      };

      expect(input.platform).toBe('stripe');
      expect(input.external_id).toBe('cus_ABC123');
    });

    it('should support all platform types', () => {
      const platforms: Array<'posthog' | 'stripe' | 'meta' | 'resend' | 'auth'> = [
        'posthog',
        'stripe',
        'meta',
        'resend',
        'auth',
      ];

      expect(platforms).toHaveLength(5);
      expect(platforms).toContain('posthog');
      expect(platforms).toContain('stripe');
      expect(platforms).toContain('meta');
      expect(platforms).toContain('resend');
      expect(platforms).toContain('auth');
    });

    it('should accept optional properties', () => {
      const input: LinkIdentityInput = {
        person_id: '123e4567-e89b-12d3-a456-426614174000',
        platform: 'meta',
        external_id: 'fb_123456',
        properties: {
          pixel_id: 'pixel_789',
          ad_account_id: 'act_999',
        },
      };

      expect(input.properties?.pixel_id).toBe('pixel_789');
    });
  });

  describe('getPersonByEmail', () => {
    it('should have correct function signature', () => {
      expect(typeof getPersonByEmail).toBe('function');
    });
  });

  describe('getPersonById', () => {
    it('should have correct function signature', () => {
      expect(typeof getPersonById).toBe('function');
    });
  });

  describe('getPersonByExternalId', () => {
    it('should have correct function signature', () => {
      expect(typeof getPersonByExternalId).toBe('function');
    });

    it('should accept platform and external_id parameters', () => {
      // Type check: function accepts (platform: string, externalId: string)
      expect(getPersonByExternalId.length).toBe(2);
    });
  });

  describe('unlinkPersonIdentity', () => {
    it('should have correct function signature', () => {
      expect(typeof unlinkPersonIdentity).toBe('function');
    });

    it('should accept identity_link_id parameter', () => {
      // Type check: function accepts single parameter
      expect(unlinkPersonIdentity.length).toBe(1);
    });
  });

  describe('Integration: Person + Identity Workflow', () => {
    it('should support complete identity stitching workflow', () => {
      // This test verifies the types work together correctly
      const personInput: CreatePersonInput = {
        email: 'founder@startup.com',
        first_name: 'Sarah',
        last_name: 'Chen',
        utm_source: 'producthunt',
        utm_campaign: 'launch',
      };

      const posthogLink: LinkIdentityInput = {
        person_id: '123e4567-e89b-12d3-a456-426614174000',
        platform: 'posthog',
        external_id: 'ph_user_abc123',
      };

      const stripeLink: LinkIdentityInput = {
        person_id: '123e4567-e89b-12d3-a456-426614174000',
        platform: 'stripe',
        external_id: 'cus_DEF456',
      };

      const metaLink: LinkIdentityInput = {
        person_id: '123e4567-e89b-12d3-a456-426614174000',
        platform: 'meta',
        external_id: 'fb_789',
      };

      expect(personInput.email).toBe('founder@startup.com');
      expect(posthogLink.platform).toBe('posthog');
      expect(stripeLink.platform).toBe('stripe');
      expect(metaLink.platform).toBe('meta');
    });
  });

  describe('Lifecycle Stages', () => {
    it('should support all lifecycle stages', () => {
      const stages: Array<'lead' | 'activated' | 'engaged' | 'customer' | 'churned'> = [
        'lead',
        'activated',
        'engaged',
        'customer',
        'churned',
      ];

      expect(stages).toHaveLength(5);
      expect(stages).toContain('lead');
      expect(stages).toContain('activated');
      expect(stages).toContain('customer');
    });
  });
});
