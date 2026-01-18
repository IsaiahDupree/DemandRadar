// Mock OpenAI before importing the module
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

import { extractNicheData, NicheConfig } from '@/lib/ai/niche-extractor';

describe('Niche Extractor', () => {
  beforeEach(() => {
    mockCreate.mockClear();
  });

  describe('extractNicheData', () => {
    it('should extract offering name from description', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                offeringName: 'AI Content Generator',
                category: 'AI Tools',
                nicheTags: ['ai', 'content', 'marketing'],
                customerProfile: {
                  type: 'B2C',
                  segment: 'creators',
                  pricePoint: 'mid',
                },
                competitors: ['Jasper', 'Copy.ai', 'Writesonic'],
                keywords: ['ai content generator', 'best ai writing tool', 'ai content creation'],
                geo: 'US',
              }),
            },
          },
        ],
      });

      const result = await extractNicheData('AI-powered content generator for creators');

      expect(result.offeringName).toBe('AI Content Generator');
    });

    it('should infer category and tags', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                offeringName: 'Fitness Tracker App',
                category: 'Health & Fitness',
                nicheTags: ['fitness', 'health', 'tracking', 'mobile'],
                customerProfile: {
                  type: 'B2C',
                  segment: 'consumers',
                  pricePoint: 'low',
                },
                competitors: ['MyFitnessPal', 'Fitbit', 'Strava'],
                keywords: ['fitness tracker', 'workout app', 'calorie counter'],
                geo: 'US',
              }),
            },
          },
        ],
      });

      const result = await extractNicheData('Mobile app for tracking workouts and nutrition');

      expect(result.category).toBe('Health & Fitness');
      expect(result.nicheTags).toContain('fitness');
      expect(result.nicheTags.length).toBeGreaterThanOrEqual(3);
    });

    it('should auto-detect competitors', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                offeringName: 'Email Marketing Tool',
                category: 'Marketing Software',
                nicheTags: ['email', 'marketing', 'automation', 'saas'],
                customerProfile: {
                  type: 'B2B',
                  segment: 'SMBs',
                  pricePoint: 'mid',
                },
                competitors: [
                  'Mailchimp',
                  'ConvertKit',
                  'ActiveCampaign',
                  'SendGrid',
                  'Klaviyo',
                ],
                keywords: ['email marketing', 'email automation', 'newsletter software'],
                geo: 'US',
              }),
            },
          },
        ],
      });

      const result = await extractNicheData('Email marketing automation for small businesses');

      expect(result.competitors).toBeDefined();
      expect(result.competitors.length).toBeGreaterThanOrEqual(3);
      expect(result.competitors).toContain('Mailchimp');
    });

    it('should generate relevant keywords', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                offeringName: 'Project Management Tool',
                category: 'Productivity',
                nicheTags: ['project management', 'collaboration', 'saas'],
                customerProfile: {
                  type: 'B2B',
                  segment: 'teams',
                  pricePoint: 'mid',
                },
                competitors: ['Asana', 'Monday.com', 'Trello', 'ClickUp'],
                keywords: [
                  'project management software',
                  'team collaboration tool',
                  'task management',
                  'best project management',
                  'project tracking',
                  'agile project management',
                  'project management app',
                  'work management software',
                ],
                geo: 'US',
              }),
            },
          },
        ],
      });

      const result = await extractNicheData('Project management and team collaboration software');

      expect(result.keywords).toBeDefined();
      expect(result.keywords.length).toBeGreaterThanOrEqual(5);
      expect(result.keywords.some(k => k.includes('project management'))).toBe(true);
    });

    it('should identify B2B vs B2C correctly', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                offeringName: 'CRM for Sales Teams',
                category: 'Business Software',
                nicheTags: ['crm', 'sales', 'b2b', 'saas'],
                customerProfile: {
                  type: 'B2B',
                  segment: 'sales teams',
                  pricePoint: 'high',
                },
                competitors: ['Salesforce', 'HubSpot', 'Pipedrive'],
                keywords: ['crm software', 'sales crm', 'customer management'],
                geo: 'US',
              }),
            },
          },
        ],
      });

      const result = await extractNicheData('CRM software for enterprise sales teams');

      expect(result.customerProfile.type).toBe('B2B');
    });

    it('should determine price point from description', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                offeringName: 'Enterprise Analytics Platform',
                category: 'Business Intelligence',
                nicheTags: ['analytics', 'enterprise', 'data'],
                customerProfile: {
                  type: 'B2B',
                  segment: 'enterprises',
                  pricePoint: 'high',
                },
                competitors: ['Tableau', 'Looker', 'Power BI'],
                keywords: ['enterprise analytics', 'business intelligence'],
                geo: 'US',
              }),
            },
          },
        ],
      });

      const result = await extractNicheData('Enterprise-grade analytics platform');

      expect(result.customerProfile.pricePoint).toBe('high');
    });

    it('should handle missing OpenAI response gracefully', async () => {
      mockCreate.mockResolvedValue({
        choices: [],
      });

      const result = await extractNicheData('Test offering');

      // Should return fallback data
      expect(result).toBeDefined();
      expect(result.offeringName).toBeDefined();
      expect(result.category).toBeDefined();
      expect(result.competitors).toBeDefined();
      expect(result.keywords).toBeDefined();
    });

    it('should handle OpenAI errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API error'));

      const result = await extractNicheData('Test offering');

      // Should return fallback data
      expect(result).toBeDefined();
      expect(result.offeringName).toBeDefined();
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should return valid NicheConfig structure', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({
                offeringName: 'Test Offering',
                category: 'Test Category',
                nicheTags: ['test', 'tags'],
                customerProfile: {
                  type: 'B2C',
                  segment: 'consumers',
                  pricePoint: 'low',
                },
                competitors: ['Competitor1', 'Competitor2'],
                keywords: ['keyword1', 'keyword2'],
                geo: 'US',
              }),
            },
          },
        ],
      });

      const result = await extractNicheData('Test offering description');

      // Validate structure
      expect(result).toHaveProperty('offeringName');
      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('nicheTags');
      expect(result).toHaveProperty('customerProfile');
      expect(result).toHaveProperty('competitors');
      expect(result).toHaveProperty('keywords');
      expect(result).toHaveProperty('geo');

      expect(result.customerProfile).toHaveProperty('type');
      expect(result.customerProfile).toHaveProperty('segment');
      expect(result.customerProfile).toHaveProperty('pricePoint');

      expect(['B2B', 'B2C']).toContain(result.customerProfile.type);
      expect(['low', 'mid', 'high']).toContain(result.customerProfile.pricePoint);
    });
  });
});
