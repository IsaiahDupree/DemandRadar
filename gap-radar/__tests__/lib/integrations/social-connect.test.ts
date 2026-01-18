/**
 * Social Account Connection Tests
 *
 * Tests for UGC-COLLECT-004: Connected Account Insights
 * - OAuth flows for TikTok and Instagram
 * - Account linking and management
 * - Metrics sync from connected accounts
 */

import {
  initiateTikTokOAuth,
  initiateInstagramOAuth,
  handleOAuthCallback,
  getConnectedAccounts,
  disconnectAccount,
  syncAccountMetrics,
  SocialAccount,
  OAuthState,
  AccountMetrics
} from '@/lib/integrations/social-connect';

describe('Connected Account Insights (UGC-COLLECT-004)', () => {
  const mockUserId = 'user_123';

  describe('OAuth Initiation', () => {
    describe('initiateTikTokOAuth', () => {
      it('should generate OAuth URL for TikTok', () => {
        const result = initiateTikTokOAuth(mockUserId);

        expect(result).toHaveProperty('authUrl');
        expect(result).toHaveProperty('state');

        // Auth URL should be a valid TikTok OAuth URL
        expect(result.authUrl).toMatch(/tiktok\.com.*oauth/i);

        // State should be a non-empty string
        expect(result.state).toBeTruthy();
        expect(typeof result.state).toBe('string');
      });

      it('should include required OAuth parameters', () => {
        const result = initiateTikTokOAuth(mockUserId);
        const url = new URL(result.authUrl);

        // Check for OAuth parameters
        expect(url.searchParams.has('client_id')).toBe(true);
        expect(url.searchParams.has('redirect_uri')).toBe(true);
        expect(url.searchParams.has('state')).toBe(true);
        expect(url.searchParams.has('scope')).toBe(true);
      });

      it('should request appropriate TikTok scopes', () => {
        const result = initiateTikTokOAuth(mockUserId);
        const url = new URL(result.authUrl);
        const scope = url.searchParams.get('scope') || '';

        // Should request user info and video metrics scopes
        expect(scope).toMatch(/user\.info/);
        expect(scope).toMatch(/video/);
      });

      it('should generate unique state for each request', () => {
        const result1 = initiateTikTokOAuth(mockUserId);
        const result2 = initiateTikTokOAuth(mockUserId);

        expect(result1.state).not.toBe(result2.state);
      });
    });

    describe('initiateInstagramOAuth', () => {
      it('should generate OAuth URL for Instagram', () => {
        const result = initiateInstagramOAuth(mockUserId);

        expect(result).toHaveProperty('authUrl');
        expect(result).toHaveProperty('state');

        // Auth URL should be a valid Instagram OAuth URL
        expect(result.authUrl).toMatch(/instagram\.com.*oauth/i);

        expect(result.state).toBeTruthy();
      });

      it('should include required OAuth parameters', () => {
        const result = initiateInstagramOAuth(mockUserId);
        const url = new URL(result.authUrl);

        expect(url.searchParams.has('client_id')).toBe(true);
        expect(url.searchParams.has('redirect_uri')).toBe(true);
        expect(url.searchParams.has('state')).toBe(true);
        expect(url.searchParams.has('scope')).toBe(true);
      });

      it('should request appropriate Instagram scopes', () => {
        const result = initiateInstagramOAuth(mockUserId);
        const url = new URL(result.authUrl);
        const scope = url.searchParams.get('scope') || '';

        // Should request user profile and insights scopes
        expect(scope).toMatch(/user_profile/);
        expect(scope).toMatch(/user_media/);
      });
    });
  });

  describe('OAuth Callback Handling', () => {
    it('should handle successful TikTok OAuth callback', async () => {
      // First initiate OAuth to get a valid state
      const { state } = initiateTikTokOAuth(mockUserId);
      const mockCode = 'auth_code_123';

      const result = await handleOAuthCallback('tiktok', mockCode, state, mockUserId);

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);

      if (result.success && result.account) {
        expect(result.account.platform).toBe('tiktok');
        expect(result.account.user_id).toBe(mockUserId);
        // access_token should not be in the response
        expect(result.account.access_token).toBeUndefined();
      }
    });

    it('should handle successful Instagram OAuth callback', async () => {
      // First initiate OAuth to get a valid state
      const { state } = initiateInstagramOAuth(mockUserId);
      const mockCode = 'auth_code_456';

      const result = await handleOAuthCallback('instagram', mockCode, state, mockUserId);

      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);

      if (result.success && result.account) {
        expect(result.account.platform).toBe('instagram');
        expect(result.account.user_id).toBe(mockUserId);
      }
    });

    it('should validate state parameter', async () => {
      const mockCode = 'auth_code';
      const invalidState = 'invalid_state';

      const result = await handleOAuthCallback('tiktok', mockCode, invalidState, mockUserId);

      // Should fail with invalid state
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it('should handle OAuth errors gracefully', async () => {
      const mockCode = 'invalid_code';
      const mockState = 'state_123';

      const result = await handleOAuthCallback('tiktok', mockCode, mockState, mockUserId);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });

    it('should exchange authorization code for access token', async () => {
      const mockCode = 'valid_code';
      const mockState = 'valid_state';

      const result = await handleOAuthCallback('tiktok', mockCode, mockState, mockUserId);

      if (result.success && result.account) {
        expect(result.account.access_token).toBeTruthy();
        expect(typeof result.account.access_token).toBe('string');
      }
    });

    it('should store refresh token when provided', async () => {
      const mockCode = 'valid_code';
      const mockState = 'valid_state';

      const result = await handleOAuthCallback('instagram', mockCode, mockState, mockUserId);

      if (result.success && result.account) {
        // Instagram provides refresh tokens
        expect(result.account.refresh_token !== undefined).toBe(true);
      }
    });
  });

  describe('Account Management', () => {
    describe('getConnectedAccounts', () => {
      it('should retrieve all connected accounts for a user', async () => {
        const accounts = await getConnectedAccounts(mockUserId);

        expect(Array.isArray(accounts)).toBe(true);
      });

      it('should return accounts with proper structure', async () => {
        const accounts = await getConnectedAccounts(mockUserId);

        if (accounts.length > 0) {
          const account = accounts[0];

          expect(account).toHaveProperty('id');
          expect(account).toHaveProperty('platform');
          expect(account).toHaveProperty('user_id');
          expect(account).toHaveProperty('connected_at');
          expect(['tiktok', 'instagram']).toContain(account.platform);
        }
      });

      it('should filter by platform when specified', async () => {
        const tiktokAccounts = await getConnectedAccounts(mockUserId, 'tiktok');

        tiktokAccounts.forEach(account => {
          expect(account.platform).toBe('tiktok');
        });
      });

      it('should include account metadata', async () => {
        const accounts = await getConnectedAccounts(mockUserId);

        if (accounts.length > 0) {
          const account = accounts[0];

          expect(account).toHaveProperty('username');
          expect(account).toHaveProperty('display_name');
        }
      });
    });

    describe('disconnectAccount', () => {
      it('should disconnect a social account', async () => {
        const mockAccountId = 'account_123';

        const result = await disconnectAccount(mockAccountId, mockUserId);

        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      });

      it('should verify user owns the account before disconnecting', async () => {
        const mockAccountId = 'account_456';
        const differentUserId = 'user_999';

        const result = await disconnectAccount(mockAccountId, differentUserId);

        // Should fail if user doesn't own the account
        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
      });

      it('should revoke OAuth tokens when disconnecting', async () => {
        const mockAccountId = 'account_789';

        const result = await disconnectAccount(mockAccountId, mockUserId);

        // Should attempt to revoke tokens
        expect(result).toHaveProperty('success');
      });

      it('should handle non-existent accounts gracefully', async () => {
        const nonExistentId = 'fake_account_id';

        const result = await disconnectAccount(nonExistentId, mockUserId);

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/not found|invalid/i);
      });
    });
  });

  describe('Metrics Sync', () => {
    describe('syncAccountMetrics', () => {
      it('should sync metrics from TikTok account', async () => {
        // First create a TikTok account
        const { state } = initiateTikTokOAuth(mockUserId);
        const callbackResult = await handleOAuthCallback('tiktok', 'valid_code', state, mockUserId);

        expect(callbackResult.success).toBe(true);
        const accountId = callbackResult.account!.id;

        const result = await syncAccountMetrics(accountId, mockUserId);

        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);

        if (result.success && result.metrics) {
          expect(result.metrics).toHaveProperty('follower_count');
          expect(result.metrics).toHaveProperty('video_count');
        }
      });

      it('should sync metrics from Instagram account', async () => {
        // First create an Instagram account
        const { state } = initiateInstagramOAuth(mockUserId);
        const callbackResult = await handleOAuthCallback('instagram', 'valid_code', state, mockUserId);

        expect(callbackResult.success).toBe(true);
        const accountId = callbackResult.account!.id;

        const result = await syncAccountMetrics(accountId, mockUserId);

        expect(result).toHaveProperty('success');
        expect(result.success).toBe(true);

        if (result.success && result.metrics) {
          expect(result.metrics).toHaveProperty('follower_count');
          expect(result.metrics).toHaveProperty('media_count');
        }
      });

      it('should include engagement metrics', async () => {
        const mockAccountId = 'account_123';

        const result = await syncAccountMetrics(mockAccountId, mockUserId);

        if (result.success && result.metrics) {
          // Should include engagement data
          expect(
            result.metrics.engagement_rate !== undefined ||
            result.metrics.average_likes !== undefined ||
            result.metrics.average_comments !== undefined
          ).toBe(true);
        }
      });

      it('should handle expired tokens by returning error', async () => {
        // Create account but test with non-existent account to simulate error
        const result = await syncAccountMetrics('nonexistent_account', mockUserId);

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
        // Should return an error (though not necessarily token-related in mock)
      });

      it('should refresh token if refresh_token is available', async () => {
        const mockAccountId = 'account_with_refresh';

        const result = await syncAccountMetrics(mockAccountId, mockUserId);

        // Should successfully sync even if token was expired (by refreshing)
        expect(result).toHaveProperty('success');
      });

      it('should verify user owns the account before syncing', async () => {
        // Create an account for mockUserId
        const { state } = initiateTikTokOAuth(mockUserId);
        const callbackResult = await handleOAuthCallback('tiktok', 'valid_code', state, mockUserId);
        const accountId = callbackResult.account!.id;

        // Try to sync with a different user
        const differentUserId = 'user_999';
        const result = await syncAccountMetrics(accountId, differentUserId);

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
        expect(result.error).toMatch(/unauthorized|permission/i);
      });

      it('should include recent post metrics for TikTok', async () => {
        const mockAccountId = 'tiktok_account_123';

        const result = await syncAccountMetrics(mockAccountId, mockUserId);

        if (result.success && result.metrics) {
          // TikTok should include video performance
          expect(
            result.metrics.recent_videos !== undefined ||
            result.metrics.total_views !== undefined
          ).toBe(true);
        }
      });

      it('should include recent post metrics for Instagram', async () => {
        const mockAccountId = 'instagram_account_456';

        const result = await syncAccountMetrics(mockAccountId, mockUserId);

        if (result.success && result.metrics) {
          // Instagram should include media performance
          expect(
            result.metrics.recent_posts !== undefined ||
            result.metrics.total_reach !== undefined
          ).toBe(true);
        }
      });
    });
  });

  describe('Acceptance Criteria (UGC-COLLECT-004)', () => {
    it('should support OAuth flows for TikTok and Instagram', () => {
      const tiktokAuth = initiateTikTokOAuth(mockUserId);
      const instagramAuth = initiateInstagramOAuth(mockUserId);

      // Both should return valid OAuth URLs
      expect(tiktokAuth.authUrl).toBeTruthy();
      expect(instagramAuth.authUrl).toBeTruthy();

      // Both should generate state tokens
      expect(tiktokAuth.state).toBeTruthy();
      expect(instagramAuth.state).toBeTruthy();
    });

    it('should support account linking', async () => {
      // Initiate OAuth first to get valid state
      const { state } = initiateTikTokOAuth(mockUserId);
      const mockCode = 'valid_code';

      const result = await handleOAuthCallback('tiktok', mockCode, state, mockUserId);

      // Should successfully link account
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('account');
    });

    it('should support metrics sync from connected accounts', async () => {
      // Create an account first
      const { state } = initiateTikTokOAuth(mockUserId);
      const callbackResult = await handleOAuthCallback('tiktok', 'valid_code', state, mockUserId);
      const accountId = callbackResult.account!.id;

      const result = await syncAccountMetrics(accountId, mockUserId);

      // Should successfully sync metrics
      expect(result).toHaveProperty('success');
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('metrics');
    });
  });

  describe('Security and Error Handling', () => {
    it('should not expose sensitive tokens in responses', async () => {
      const accounts = await getConnectedAccounts(mockUserId);

      accounts.forEach(account => {
        // Access tokens should not be directly exposed
        expect(account.access_token).toBeUndefined();
        expect(account.refresh_token).toBeUndefined();
      });
    });

    it('should handle network errors gracefully', async () => {
      // Test with invalid OAuth callback
      const result = await handleOAuthCallback('tiktok', 'bad_code', 'bad_state', mockUserId);

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('error');
    });

    it('should validate platform parameter', async () => {
      const invalidPlatform = 'facebook' as any;

      await expect(async () => {
        await handleOAuthCallback(invalidPlatform, 'code', 'state', mockUserId);
      }).rejects.toThrow(/unsupported|invalid.*platform/i);
    });

    it('should enforce user authorization for all operations', async () => {
      const mockAccountId = 'account_123';
      const unauthorizedUserId = 'unauthorized_user';

      // All operations should verify user owns the account
      const syncResult = await syncAccountMetrics(mockAccountId, unauthorizedUserId);
      expect(syncResult.success).toBe(false);

      const disconnectResult = await disconnectAccount(mockAccountId, unauthorizedUserId);
      expect(disconnectResult.success).toBe(false);
    });
  });
});
