/**
 * Tests for cross-platform app deduplication
 *
 * Feature: COLL-011 - Cross-Platform Deduplication
 *
 * Goal: Recognize the same app across iOS, Android, and web platforms
 * and merge them into a single unified entry showing multi-platform presence.
 */

import { deduplicateApps, type UnifiedApp } from '@/lib/collectors/dedup';
import type { AppStoreResult } from '@/lib/collectors/appstore';

describe('Cross-Platform Deduplication (COLL-011)', () => {
  it('should merge the same app found on iOS and Android', () => {
    const apps: AppStoreResult[] = [
      {
        platform: 'ios',
        app_name: 'Notion - Notes, Tasks, Wikis',
        app_id: '1232456789',
        developer: 'Notion Labs, Inc',
        rating: 4.8,
        review_count: 50000,
        description: 'All-in-one workspace for notes and tasks',
        category: 'Productivity',
        price: 'Free',
      },
      {
        platform: 'android',
        app_name: 'Notion: Notes, Tasks, AI',
        app_id: 'notion.id',
        developer: 'Notion Labs, Inc.',
        rating: 4.7,
        review_count: 45000,
        description: 'All-in-one workspace for your notes, tasks, wikis',
        category: 'Productivity',
        price: '0',
      },
    ];

    const result = deduplicateApps(apps);

    expect(result).toHaveLength(1);
    expect(result[0].name).toContain('Notion');
    expect(result[0].platforms).toEqual(['ios', 'android']);
    expect(result[0].developer).toBe('Notion Labs, Inc');
  });

  it('should merge the same app across iOS, Android, and web', () => {
    const apps: AppStoreResult[] = [
      {
        platform: 'ios',
        app_name: 'Canva: Design, Photo & Video',
        app_id: '897446215',
        developer: 'Canva Pty Ltd',
        rating: 4.8,
        review_count: 120000,
        description: 'Design tool for graphics, presentations, and more',
        category: 'Graphics & Design',
        price: 'Free',
      },
      {
        platform: 'android',
        app_name: 'Canva: Design, Art & AI Editor',
        app_id: 'com.canva.editor',
        developer: 'Canva',
        rating: 4.6,
        review_count: 2500000,
        description: 'Graphic design made easy with templates',
        category: 'Art & Design',
        price: 'Free',
      },
      {
        platform: 'web',
        app_name: 'Canva.com',
        app_id: 'canva.com',
        developer: 'Canva',
        rating: 4.7,
        review_count: 15000,
        description: 'Online design tool - create graphics, videos, logos',
        category: 'Design Tool',
        price: 'Free',
      },
    ];

    const result = deduplicateApps(apps);

    expect(result).toHaveLength(1);
    expect(result[0].name).toContain('Canva');
    expect(result[0].platforms).toContain('ios');
    expect(result[0].platforms).toContain('android');
    expect(result[0].platforms).toContain('web');
    expect(result[0].totalReviews).toBeGreaterThan(2600000);
  });

  it('should keep different apps as separate entries', () => {
    const apps: AppStoreResult[] = [
      {
        platform: 'ios',
        app_name: 'Trello: organize anything!',
        app_id: '461504587',
        developer: 'Trello, Inc.',
        rating: 4.6,
        review_count: 85000,
        description: 'Project management tool',
        category: 'Productivity',
        price: 'Free',
      },
      {
        platform: 'ios',
        app_name: 'Asana: Work in one place',
        app_id: '489969512',
        developer: 'Asana, Inc.',
        rating: 4.7,
        review_count: 92000,
        description: 'Team collaboration platform',
        category: 'Productivity',
        price: 'Free',
      },
    ];

    const result = deduplicateApps(apps);

    expect(result).toHaveLength(2);
    expect(result.find(a => a.name.includes('Trello'))).toBeDefined();
    expect(result.find(a => a.name.includes('Asana'))).toBeDefined();
  });

  it('should handle apps with slight name variations', () => {
    const apps: AppStoreResult[] = [
      {
        platform: 'ios',
        app_name: 'Spotify: Music and Podcasts',
        app_id: '324684580',
        developer: 'Spotify AB',
        rating: 4.8,
        review_count: 4500000,
        description: 'Music streaming service',
        category: 'Music',
        price: 'Free',
      },
      {
        platform: 'android',
        app_name: 'Spotify - Music and Podcasts',
        app_id: 'com.spotify.music',
        developer: 'Spotify AB',
        rating: 4.4,
        review_count: 15000000,
        description: 'Stream music and podcasts',
        category: 'Music & Audio',
        price: 'Free',
      },
    ];

    const result = deduplicateApps(apps);

    expect(result).toHaveLength(1);
    expect(result[0].name).toContain('Spotify');
    expect(result[0].platforms).toEqual(['ios', 'android']);
  });

  it('should merge platform-specific data correctly', () => {
    const apps: AppStoreResult[] = [
      {
        platform: 'ios',
        app_name: 'Slack',
        app_id: '618783545',
        developer: 'Slack Technologies',
        rating: 4.7,
        review_count: 150000,
        description: 'Team communication',
        category: 'Business',
        price: 'Free',
      },
      {
        platform: 'android',
        app_name: 'Slack',
        app_id: 'com.Slack',
        developer: 'Slack Technologies Inc.',
        rating: 4.5,
        review_count: 1200000,
        description: 'Team collaboration app',
        category: 'Business',
        price: 'Free',
      },
    ];

    const result = deduplicateApps(apps);

    expect(result).toHaveLength(1);

    const unified = result[0];

    // Should have platform-specific IDs
    expect(unified.platformIds.ios).toBe('618783545');
    expect(unified.platformIds.android).toBe('com.Slack');

    // Should aggregate review counts
    expect(unified.totalReviews).toBe(1350000);

    // Should use highest rating
    expect(unified.rating).toBe(4.7);
  });

  it('should handle apps with no matches', () => {
    const apps: AppStoreResult[] = [
      {
        platform: 'ios',
        app_name: 'UniqueApp iOS Only',
        app_id: '111111111',
        developer: 'Dev A',
        rating: 4.5,
        review_count: 1000,
        description: 'iOS exclusive',
        category: 'Utilities',
        price: 'Free',
      },
    ];

    const result = deduplicateApps(apps);

    expect(result).toHaveLength(1);
    expect(result[0].platforms).toEqual(['ios']);
    expect(result[0].totalReviews).toBe(1000);
  });

  it('should normalize app names for matching', () => {
    const apps: AppStoreResult[] = [
      {
        platform: 'ios',
        app_name: 'WhatsApp Messenger',
        app_id: '310633997',
        developer: 'WhatsApp Inc.',
        rating: 4.6,
        review_count: 5800000,
        description: 'Simple. Secure. Reliable messaging.',
        category: 'Social Networking',
        price: 'Free',
      },
      {
        platform: 'android',
        app_name: 'WhatsApp',
        app_id: 'com.whatsapp',
        developer: 'WhatsApp LLC',
        rating: 4.2,
        review_count: 100000000,
        description: 'Simple. Secure. Reliable messaging',
        category: 'Communication',
        price: 'Free',
      },
    ];

    const result = deduplicateApps(apps);

    expect(result).toHaveLength(1);
    expect(result[0].platforms).toEqual(['ios', 'android']);
  });
});
