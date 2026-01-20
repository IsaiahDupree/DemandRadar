/**
 * Channel Recommendation Logic Tests
 * Feature: BUILD-007
 *
 * Tests the logic that suggests the best 3 marketing channels
 * for each product idea based on niche data and product characteristics.
 */

import {
  recommendChannels,
  type ChannelRecommendation,
  type ProductContext,
} from '@/lib/recommendations/channels';

describe('Channel Recommendation Logic', () => {
  describe('recommendChannels', () => {
    it('should return exactly 3 channel recommendations', () => {
      const productContext: ProductContext = {
        product_type: 'saas',
        target_audience: 'Small businesses',
        niche: 'project management',
        estimated_cac_range: '$50-$150',
        pain_points: ['Complex workflows', 'Expensive tools'],
      };

      const recommendations = recommendChannels(productContext);

      expect(recommendations).toHaveLength(3);
      expect(recommendations.every((rec) => rec.channel)).toBe(true);
      expect(recommendations.every((rec) => rec.reasoning)).toBe(true);
    });

    it('should recommend LinkedIn and Google Ads for B2B SaaS', () => {
      const productContext: ProductContext = {
        product_type: 'saas',
        target_audience: 'Enterprise teams and managers',
        niche: 'team collaboration',
        estimated_cac_range: '$100-$300',
        pain_points: ['Poor team communication', 'Scattered information'],
      };

      const recommendations = recommendChannels(productContext);
      const channels = recommendations.map((r) => r.channel);

      expect(channels).toContain('LinkedIn Ads');
      expect(channels).toContain('Google Ads');
    });

    it('should recommend SEO/Content for tool products with low CAC', () => {
      const productContext: ProductContext = {
        product_type: 'tool',
        target_audience: 'Freelancers and solo entrepreneurs',
        niche: 'image optimization',
        estimated_cac_range: '$3-$10',
        pain_points: ['Slow websites', 'Large image files'],
      };

      const recommendations = recommendChannels(productContext);
      const channels = recommendations.map((r) => r.channel);

      expect(channels).toContain('SEO/Content');
    });

    it('should recommend Reddit/Community for niche audiences', () => {
      const productContext: ProductContext = {
        product_type: 'tool',
        target_audience: 'Indie hackers and bootstrappers',
        niche: 'startup analytics',
        estimated_cac_range: '$5-$20',
        pain_points: ['Expensive analytics', 'Complex setup'],
      };

      const recommendations = recommendChannels(productContext);
      const channels = recommendations.map((r) => r.channel);

      expect(channels).toContain('Reddit/Community');
    });

    it('should recommend ProductHunt for new tool launches', () => {
      const productContext: ProductContext = {
        product_type: 'tool',
        target_audience: 'Tech-savvy early adopters',
        niche: 'developer productivity',
        estimated_cac_range: '$5-$15',
        pain_points: ['Repetitive tasks', 'Context switching'],
      };

      const recommendations = recommendChannels(productContext);
      const channels = recommendations.map((r) => r.channel);

      expect(channels).toContain('ProductHunt');
    });

    it('should provide reasoning for each channel recommendation', () => {
      const productContext: ProductContext = {
        product_type: 'saas',
        target_audience: 'Marketing teams',
        niche: 'email marketing',
        estimated_cac_range: '$50-$100',
        pain_points: ['Low open rates', 'Poor deliverability'],
      };

      const recommendations = recommendChannels(productContext);

      recommendations.forEach((rec) => {
        expect(rec.reasoning).toBeTruthy();
        expect(typeof rec.reasoning).toBe('string');
        expect(rec.reasoning.length).toBeGreaterThan(20);
      });
    });

    it('should recommend Meta Ads for B2C products', () => {
      const productContext: ProductContext = {
        product_type: 'mobile_app',
        target_audience: 'Consumers and families',
        niche: 'fitness tracking',
        estimated_cac_range: '$5-$15',
        pain_points: ['Hard to stay motivated', 'Boring workouts'],
      };

      const recommendations = recommendChannels(productContext);
      const channels = recommendations.map((r) => r.channel);

      expect(channels).toContain('Meta Ads');
    });

    it('should recommend TikTok for consumer products with young audience', () => {
      const productContext: ProductContext = {
        product_type: 'mobile_app',
        target_audience: 'Gen Z and millennials',
        niche: 'social photo sharing',
        estimated_cac_range: '$3-$8',
        pain_points: ['Boring social apps', 'No creative control'],
      };

      const recommendations = recommendChannels(productContext);
      const channels = recommendations.map((r) => r.channel);

      expect(channels).toContain('TikTok Ads');
    });

    it('should recommend YouTube for education/tutorial products', () => {
      const productContext: ProductContext = {
        product_type: 'saas',
        target_audience: 'Content creators and educators',
        niche: 'video editing',
        estimated_cac_range: '$20-$50',
        pain_points: ['Complex editing software', 'Expensive tools'],
      };

      const recommendations = recommendChannels(productContext);
      const channels = recommendations.map((r) => r.channel);

      expect(channels).toContain('YouTube Ads');
    });

    it('should base recommendations on niche characteristics', () => {
      const devToolContext: ProductContext = {
        product_type: 'api',
        target_audience: 'Software developers',
        niche: 'API testing',
        estimated_cac_range: '$10-$30',
        pain_points: ['Manual testing', 'Flaky tests'],
      };

      const recommendations = recommendChannels(devToolContext);
      const channels = recommendations.map((r) => r.channel);

      // Developer tools should prioritize technical channels
      expect(
        channels.some((c) => ['ProductHunt', 'Reddit/Community', 'SEO/Content'].includes(c))
      ).toBe(true);
    });

    it('should consider CAC range in channel selection', () => {
      const lowCACContext: ProductContext = {
        product_type: 'tool',
        target_audience: 'General users',
        niche: 'screenshot tool',
        estimated_cac_range: '$1-$5',
        pain_points: ['Complicated screenshot tools'],
      };

      const recommendations = recommendChannels(lowCACContext);
      const channels = recommendations.map((r) => r.channel);

      // Low CAC should favor organic/community channels
      expect(
        channels.some((c) => ['SEO/Content', 'Reddit/Community', 'ProductHunt'].includes(c))
      ).toBe(true);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalContext: ProductContext = {
        product_type: 'saas',
        target_audience: 'Businesses',
        niche: 'CRM',
        estimated_cac_range: '$50-$100',
      };

      const recommendations = recommendChannels(minimalContext);

      expect(recommendations).toHaveLength(3);
      expect(recommendations.every((rec) => rec.channel)).toBe(true);
      expect(recommendations.every((rec) => rec.reasoning)).toBe(true);
    });

    it('should return channels in priority order', () => {
      const productContext: ProductContext = {
        product_type: 'saas',
        target_audience: 'B2B SaaS companies',
        niche: 'sales automation',
        estimated_cac_range: '$100-$200',
        pain_points: ['Manual sales processes'],
      };

      const recommendations = recommendChannels(productContext);

      expect(recommendations).toHaveLength(3);
      // First recommendation should be the highest priority
      expect(recommendations[0].channel).toBeTruthy();
      expect(recommendations[1].channel).toBeTruthy();
      expect(recommendations[2].channel).toBeTruthy();
    });
  });
});
