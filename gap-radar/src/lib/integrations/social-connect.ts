/**
 * Social Account Connection
 *
 * OAuth integration for connecting user's TikTok and Instagram accounts
 * to sync insights and metrics from their own content.
 *
 * Note: Requires app approval from TikTok and Instagram.
 * MVP uses mock data for development.
 */

import crypto from 'crypto';

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: 'tiktok' | 'instagram';
  platform_user_id?: string;
  username?: string;
  display_name?: string;
  profile_image_url?: string;
  access_token?: string; // Never exposed in API responses
  refresh_token?: string; // Never exposed in API responses
  token_expires_at?: string;
  connected_at: string;
  last_synced_at?: string;
}

export interface OAuthState {
  authUrl: string;
  state: string;
}

export interface AccountMetrics {
  follower_count?: number;
  following_count?: number;
  video_count?: number;
  media_count?: number;
  total_views?: number;
  total_likes?: number;
  total_reach?: number;
  engagement_rate?: number;
  average_likes?: number;
  average_comments?: number;
  average_shares?: number;
  recent_videos?: Array<{
    id: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
  }>;
  recent_posts?: Array<{
    id: string;
    likes: number;
    comments: number;
    reach?: number;
  }>;
  synced_at: string;
}

export interface OAuthCallbackResult {
  success: boolean;
  account?: SocialAccount;
  error?: string;
}

export interface MetricsSyncResult {
  success: boolean;
  metrics?: AccountMetrics;
  error?: string;
}

export interface DisconnectResult {
  success: boolean;
  error?: string;
}

// In-memory state store for OAuth flows (in production, use Redis or DB)
const oauthStateStore = new Map<string, { userId: string; platform: string; createdAt: number }>();

// Mock connected accounts store (in production, use Supabase)
const connectedAccountsStore = new Map<string, SocialAccount>();

/**
 * Initiate TikTok OAuth flow
 */
export function initiateTikTokOAuth(userId: string): OAuthState {
  const clientId = process.env.TIKTOK_CLIENT_ID || 'mock_tiktok_client_id';
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || 'https://demandradar.app/api/oauth/tiktok/callback';

  // Generate secure state token
  const state = crypto.randomBytes(32).toString('hex');

  // Store state for verification
  oauthStateStore.set(state, {
    userId,
    platform: 'tiktok',
    createdAt: Date.now(),
  });

  // Build OAuth URL
  const scopes = [
    'user.info.basic',
    'user.info.profile',
    'user.info.stats',
    'video.list',
    'video.insights',
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(','),
    response_type: 'code',
  });

  const authUrl = `https://www.tiktok.com/v2/auth/authorize?${params.toString()}`;

  return { authUrl, state };
}

/**
 * Initiate Instagram OAuth flow
 */
export function initiateInstagramOAuth(userId: string): OAuthState {
  const clientId = process.env.INSTAGRAM_CLIENT_ID || 'mock_instagram_client_id';
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI || 'https://demandradar.app/api/oauth/instagram/callback';

  // Generate secure state token
  const state = crypto.randomBytes(32).toString('hex');

  // Store state for verification
  oauthStateStore.set(state, {
    userId,
    platform: 'instagram',
    createdAt: Date.now(),
  });

  // Build OAuth URL
  const scopes = [
    'user_profile',
    'user_media',
    'instagram_basic',
    'instagram_manage_insights',
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: scopes.join(','),
    response_type: 'code',
  });

  const authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;

  return { authUrl, state };
}

/**
 * Handle OAuth callback and exchange code for tokens
 */
export async function handleOAuthCallback(
  platform: 'tiktok' | 'instagram',
  code: string,
  state: string,
  userId: string
): Promise<OAuthCallbackResult> {
  // Validate platform
  if (!['tiktok', 'instagram'].includes(platform)) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Verify state token
  const storedState = oauthStateStore.get(state);

  if (!storedState || storedState.userId !== userId || storedState.platform !== platform) {
    return {
      success: false,
      error: 'Invalid or expired state token',
    };
  }

  // Clean up state
  oauthStateStore.delete(state);

  // Exchange authorization code for access token
  try {
    const tokenData = await exchangeCodeForToken(platform, code);

    // Create account record
    const account: SocialAccount = {
      id: `${platform}_${userId}_${Date.now()}`,
      user_id: userId,
      platform,
      platform_user_id: tokenData.platform_user_id,
      username: tokenData.username,
      display_name: tokenData.display_name,
      profile_image_url: tokenData.profile_image_url,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_expires_at: tokenData.expires_at,
      connected_at: new Date().toISOString(),
    };

    // Store account (in production, save to Supabase)
    connectedAccountsStore.set(account.id, account);

    // Return account without sensitive tokens
    const { access_token, refresh_token, ...safeAccount } = account;

    return {
      success: true,
      account: safeAccount,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to exchange authorization code',
    };
  }
}

/**
 * Get connected accounts for a user
 */
export async function getConnectedAccounts(
  userId: string,
  platform?: 'tiktok' | 'instagram'
): Promise<SocialAccount[]> {
  // In production, query from Supabase
  const accounts = Array.from(connectedAccountsStore.values())
    .filter(account => account.user_id === userId)
    .filter(account => !platform || account.platform === platform);

  // Remove sensitive tokens from response
  return accounts.map(({ access_token, refresh_token, ...safeAccount }) => safeAccount);
}

/**
 * Disconnect a social account
 */
export async function disconnectAccount(
  accountId: string,
  userId: string
): Promise<DisconnectResult> {
  const account = connectedAccountsStore.get(accountId);

  if (!account) {
    return {
      success: false,
      error: 'Account not found',
    };
  }

  // Verify user owns the account
  if (account.user_id !== userId) {
    return {
      success: false,
      error: 'Unauthorized: You do not own this account',
    };
  }

  try {
    // Revoke OAuth tokens
    if (account.access_token) {
      await revokeOAuthToken(account.platform, account.access_token);
    }

    // Remove from store (in production, delete from Supabase)
    connectedAccountsStore.delete(accountId);

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect account',
    };
  }
}

/**
 * Sync metrics from a connected account
 */
export async function syncAccountMetrics(
  accountId: string,
  userId: string
): Promise<MetricsSyncResult> {
  const account = connectedAccountsStore.get(accountId);

  if (!account) {
    return {
      success: false,
      error: 'Account not found',
    };
  }

  // Verify user owns the account
  if (account.user_id !== userId) {
    return {
      success: false,
      error: 'Unauthorized: Permission denied',
    };
  }

  // Check if token is expired
  if (account.token_expires_at && new Date(account.token_expires_at) < new Date()) {
    // Try to refresh token
    if (account.refresh_token) {
      try {
        const newToken = await refreshAccessToken(account.platform, account.refresh_token);
        account.access_token = newToken.access_token;
        account.token_expires_at = newToken.expires_at;
        connectedAccountsStore.set(accountId, account);
      } catch (error) {
        return {
          success: false,
          error: 'Token expired and refresh failed',
        };
      }
    } else {
      return {
        success: false,
        error: 'Token expired - please reconnect your account',
      };
    }
  }

  try {
    // Fetch metrics from platform API
    const metrics = await fetchPlatformMetrics(account.platform, account.access_token!);

    // Update last_synced_at
    account.last_synced_at = new Date().toISOString();
    connectedAccountsStore.set(accountId, account);

    return {
      success: true,
      metrics,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to sync metrics',
    };
  }
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(
  platform: 'tiktok' | 'instagram',
  code: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  platform_user_id?: string;
  username?: string;
  display_name?: string;
  profile_image_url?: string;
}> {
  // In production, make actual API calls
  // For now, return mock data

  if (code === 'invalid_code') {
    throw new Error('Invalid authorization code');
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

  return {
    access_token: `mock_access_token_${platform}_${code}`,
    refresh_token: platform === 'instagram' ? `mock_refresh_token_${code}` : undefined,
    expires_at: expiresAt.toISOString(),
    platform_user_id: `${platform}_user_123`,
    username: `${platform}_creator`,
    display_name: `${platform === 'tiktok' ? 'TikTok' : 'Instagram'} Creator`,
    profile_image_url: `https://example.com/${platform}/avatar.jpg`,
  };
}

/**
 * Refresh an expired access token
 */
async function refreshAccessToken(
  platform: 'tiktok' | 'instagram',
  refreshToken: string
): Promise<{
  access_token: string;
  expires_at: string;
}> {
  // In production, make actual API call to refresh token

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

  return {
    access_token: `refreshed_token_${platform}_${Date.now()}`,
    expires_at: expiresAt.toISOString(),
  };
}

/**
 * Revoke OAuth token
 */
async function revokeOAuthToken(
  platform: 'tiktok' | 'instagram',
  accessToken: string
): Promise<void> {
  // In production, make API call to revoke token
  // For now, just log
  console.log(`Revoking ${platform} token: ${accessToken.substring(0, 10)}...`);
}

/**
 * Fetch metrics from platform API
 */
async function fetchPlatformMetrics(
  platform: 'tiktok' | 'instagram',
  accessToken: string
): Promise<AccountMetrics> {
  // In production, make actual API calls
  // For now, return mock data

  if (platform === 'tiktok') {
    return {
      follower_count: 15234,
      following_count: 342,
      video_count: 87,
      total_views: 1250000,
      total_likes: 85000,
      engagement_rate: 6.8,
      average_likes: 977,
      average_comments: 123,
      average_shares: 45,
      recent_videos: [
        {
          id: 'video_1',
          views: 45000,
          likes: 3200,
          comments: 456,
          shares: 234,
        },
        {
          id: 'video_2',
          views: 32000,
          likes: 2100,
          comments: 289,
          shares: 167,
        },
        {
          id: 'video_3',
          views: 28000,
          likes: 1800,
          comments: 198,
          shares: 134,
        },
      ],
      synced_at: new Date().toISOString(),
    };
  }

  // Instagram metrics
  return {
    follower_count: 12500,
    following_count: 450,
    media_count: 124,
    total_reach: 850000,
    total_likes: 62000,
    engagement_rate: 4.96,
    average_likes: 500,
    average_comments: 78,
    recent_posts: [
      {
        id: 'post_1',
        likes: 1250,
        comments: 145,
        reach: 8900,
      },
      {
        id: 'post_2',
        likes: 980,
        comments: 98,
        reach: 7200,
      },
      {
        id: 'post_3',
        likes: 850,
        comments: 76,
        reach: 6100,
      },
    ],
    synced_at: new Date().toISOString(),
  };
}
