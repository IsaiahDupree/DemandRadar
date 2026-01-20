/**
 * Tests for Hook Generation from Ads
 * Feature: BUILD-003
 */

import {
  generateHooks,
  type WinningAd,
  type GeneratedHook,
  type HookType,
} from '@/lib/recommendations/hooks';

describe('generateHooks', () => {
  it('should generate 5 hooks from winning ad patterns', () => {
    const winningAds: WinningAd[] = [
      {
        advertiser: 'Jasper',
        headline: 'Write 10x faster with AI',
        primary_text: 'Stop spending hours writing. Let AI do the heavy lifting.',
        run_days: 120,
      },
      {
        advertiser: 'Copy.ai',
        headline: 'Never struggle with copy again',
        primary_text: 'Create high-converting copy in seconds, not hours.',
        run_days: 90,
      },
      {
        advertiser: 'Writesonic',
        headline: 'The AI writing tool your competitors are using',
        primary_text: 'Get ahead with the same AI tool used by 10,000+ marketers.',
        run_days: 60,
      },
    ];

    const productIdea = 'An AI-powered blog writing tool for content marketers';

    const hooks = generateHooks(winningAds, productIdea);

    expect(hooks).toHaveLength(5);
  });

  it('should categorize hooks by type', () => {
    const winningAds: WinningAd[] = [
      {
        advertiser: 'Test',
        headline: 'Save 10 hours per week',
        primary_text: 'Stop wasting time on manual tasks',
        run_days: 100,
      },
    ];

    const productIdea = 'A productivity tool';

    const hooks = generateHooks(winningAds, productIdea);

    const validTypes: HookType[] = [
      'pain-agitation',
      'social-proof',
      'time-save',
      'outcome',
      'curiosity',
      'comparison',
      'how-to',
    ];

    hooks.forEach((hook) => {
      expect(validTypes).toContain(hook.type);
    });
  });

  it('should include hook text and reasoning', () => {
    const winningAds: WinningAd[] = [
      {
        advertiser: 'Example',
        headline: 'Get results in minutes',
        primary_text: 'Fast and easy solution',
        run_days: 50,
      },
    ];

    const productIdea = 'A tool for solving problems';

    const hooks = generateHooks(winningAds, productIdea);

    hooks.forEach((hook) => {
      expect(hook.text).toBeTruthy();
      expect(typeof hook.text).toBe('string');
      expect(hook.text.length).toBeGreaterThan(5);

      expect(hook.type).toBeTruthy();
      expect(typeof hook.type).toBe('string');

      expect(hook.reasoning).toBeTruthy();
      expect(typeof hook.reasoning).toBe('string');
    });
  });

  it('should extract patterns from long-running ads', () => {
    const winningAds: WinningAd[] = [
      {
        advertiser: 'LongRunner',
        headline: 'Join 50,000+ users',
        primary_text: 'The most trusted solution',
        run_days: 200, // Long-running = proven
      },
      {
        advertiser: 'ShortRunner',
        headline: 'New tool just launched',
        primary_text: 'Try our new solution',
        run_days: 10, // Short run = less proven
      },
    ];

    const productIdea = 'A SaaS tool';

    const hooks = generateHooks(winningAds, productIdea);

    // Should prioritize patterns from long-running ads
    expect(hooks.length).toBeGreaterThan(0);
  });

  it('should handle empty winning ads array', () => {
    const winningAds: WinningAd[] = [];
    const productIdea = 'A new product';

    const hooks = generateHooks(winningAds, productIdea);

    // Should still generate hooks (using defaults or AI)
    expect(hooks).toHaveLength(5);
    hooks.forEach((hook) => {
      expect(hook.text).toBeTruthy();
      expect(hook.type).toBeTruthy();
    });
  });

  it('should adapt hooks to the product idea', () => {
    const winningAds: WinningAd[] = [
      {
        advertiser: 'Generic',
        headline: 'Save time and money',
        primary_text: 'Best solution ever',
        run_days: 100,
      },
    ];

    const productIdea1 = 'Email marketing automation tool';
    const productIdea2 = 'Video editing software';

    const hooks1 = generateHooks(winningAds, productIdea1);
    const hooks2 = generateHooks(winningAds, productIdea2);

    // Hooks should be contextual to the product
    const allHooks1Text = hooks1.map((h) => h.text.toLowerCase()).join(' ');
    const allHooks2Text = hooks2.map((h) => h.text.toLowerCase()).join(' ');

    // At least one hook should reference the domain
    expect(
      allHooks1Text.includes('email') ||
        allHooks1Text.includes('marketing') ||
        allHooks1Text.includes('campaign')
    ).toBe(true);

    expect(
      allHooks2Text.includes('video') ||
        allHooks2Text.includes('edit') ||
        allHooks2Text.includes('content')
    ).toBe(true);
  });

  it('should provide reasoning for each hook', () => {
    const winningAds: WinningAd[] = [
      {
        advertiser: 'Test',
        headline: 'Transform your workflow',
        primary_text: 'Get more done',
        run_days: 75,
      },
    ];

    const productIdea = 'Productivity app';

    const hooks = generateHooks(winningAds, productIdea);

    hooks.forEach((hook) => {
      expect(hook.reasoning).toBeTruthy();
      expect(hook.reasoning.length).toBeGreaterThan(10);
    });
  });

  it('should include various hook types in the set', () => {
    const winningAds: WinningAd[] = [
      {
        advertiser: 'A',
        headline: 'Stop wasting time',
        primary_text: 'Pain point message',
        run_days: 100,
      },
      {
        advertiser: 'B',
        headline: 'Join 10,000+ users',
        primary_text: 'Social proof message',
        run_days: 90,
      },
      {
        advertiser: 'C',
        headline: 'Save 5 hours per week',
        primary_text: 'Time save message',
        run_days: 80,
      },
    ];

    const productIdea = 'Business tool';

    const hooks = generateHooks(winningAds, productIdea);

    const hookTypes = hooks.map((h) => h.type);
    const uniqueTypes = new Set(hookTypes);

    // Should have variety of hook types
    expect(uniqueTypes.size).toBeGreaterThanOrEqual(3);
  });
});
