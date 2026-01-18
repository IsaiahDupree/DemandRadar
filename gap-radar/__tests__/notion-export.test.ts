/**
 * Notion Export Tests
 *
 * Tests for EXPORT-002: Notion Export feature
 * Ensures reports can be exported directly to Notion workspace
 */

import { exportToNotion, formatReportForNotion } from '@/lib/reports/notion-export';

// Mock Notion client
jest.mock('@notionhq/client', () => ({
  Client: jest.fn().mockImplementation(() => ({
    pages: {
      create: jest.fn().mockResolvedValue({
        id: 'mock-page-id',
        url: 'https://notion.so/mock-page-id',
      }),
    },
    blocks: {
      children: {
        append: jest.fn().mockResolvedValue({}),
      },
    },
  })),
}));

describe('Notion Export', () => {
  const mockReportData = {
    run: {
      id: 'test-run-id',
      niche_query: 'AI productivity tools',
      status: 'complete',
      created_at: '2026-01-18T00:00:00Z',
      finished_at: '2026-01-18T00:10:00Z',
    },
    scores: {
      saturation: 65,
      longevity: 72,
      dissatisfaction: 58,
      misalignment: 45,
      opportunity: 75,
      confidence: 0.85,
    },
    summary: {
      totalAds: 145,
      totalMentions: 89,
      totalGaps: 12,
      totalConcepts: 5,
      uniqueAdvertisers: 34,
      topObjections: 8,
    },
    marketSnapshot: {
      topAdvertisers: [
        { name: 'Notion', adCount: 23 },
        { name: 'ClickUp', adCount: 18 },
      ],
      topAngles: [
        { label: 'All-in-one workspace', frequency: 15 },
        { label: 'Collaboration made easy', frequency: 12 },
      ],
      longestRunningAds: [
        { advertiser: 'Notion', headline: 'Your wiki, docs & projects', daysRunning: 180 },
      ],
    },
    painMap: {
      topObjections: [
        { label: 'Too expensive', frequency: 25, intensity: 0.8 },
        { label: 'Steep learning curve', frequency: 20, intensity: 0.7 },
      ],
      topFeatures: [
        { label: 'Better mobile app', frequency: 30 },
        { label: 'Offline mode', frequency: 25 },
      ],
      pricingFriction: ['Price increased without notice'],
      trustIssues: ['Poor customer support response time'],
    },
    gaps: [
      {
        id: 'gap-1',
        type: 'product',
        title: 'Mobile experience gap',
        problem: 'Users complain about poor mobile UX',
        recommendation: 'Build mobile-first alternative',
        score: 82,
        confidence: 0.75,
      },
    ],
    concepts: [
      {
        id: 'concept-1',
        name: 'MobileFirst Workspace',
        oneLiner: 'Productivity tool built for mobile',
        platform: 'mobile',
        industry: 'Productivity',
        businessModel: 'b2c',
        difficulty: 6,
        opportunityScore: 78,
      },
    ],
    ugc: null,
    economics: [],
    buildability: [],
    actionPlan: null,
  };

  describe('formatReportForNotion', () => {
    it('should format report data into Notion blocks structure', () => {
      const blocks = formatReportForNotion(mockReportData);

      expect(blocks).toBeDefined();
      expect(Array.isArray(blocks)).toBe(true);
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should include title heading with niche query', () => {
      const blocks = formatReportForNotion(mockReportData);

      const titleBlock = blocks.find(
        (block: any) => block.type === 'heading_1' && block.heading_1?.rich_text?.[0]?.text?.content?.includes('AI productivity tools')
      );

      expect(titleBlock).toBeDefined();
    });

    it('should include executive summary section', () => {
      const blocks = formatReportForNotion(mockReportData);

      const summaryHeading = blocks.find(
        (block: any) => block.type === 'heading_2' && block.heading_2?.rich_text?.[0]?.text?.content?.includes('Executive Summary')
      );

      expect(summaryHeading).toBeDefined();
    });

    it('should include opportunity score', () => {
      const blocks = formatReportForNotion(mockReportData);

      const scoreBlock = blocks.find(
        (block: any) => block.paragraph?.rich_text?.some((text: any) => text.text?.content?.includes('75'))
      );

      expect(scoreBlock).toBeDefined();
    });

    it('should format top gaps as bullet list', () => {
      const blocks = formatReportForNotion(mockReportData);

      const gapBullet = blocks.find(
        (block: any) => block.type === 'bulleted_list_item' && block.bulleted_list_item?.rich_text?.[0]?.text?.content?.includes('Mobile experience gap')
      );

      expect(gapBullet).toBeDefined();
    });

    it('should include market snapshot data', () => {
      const blocks = formatReportForNotion(mockReportData);

      const marketHeading = blocks.find(
        (block: any) => block.type === 'heading_2' && block.heading_2?.rich_text?.[0]?.text?.content?.includes('Market Snapshot')
      );

      expect(marketHeading).toBeDefined();
    });

    it('should handle missing UGC data gracefully', () => {
      expect(() => formatReportForNotion(mockReportData)).not.toThrow();
    });
  });

  describe('exportToNotion', () => {
    it('should export report to Notion and return page URL', async () => {
      const result = await exportToNotion(mockReportData, {
        apiKey: 'test-api-key',
        databaseId: 'test-database-id',
      });

      expect(result).toBeDefined();
      expect(result.pageId).toBe('mock-page-id');
      expect(result.pageUrl).toBe('https://notion.so/mock-page-id');
      expect(result.success).toBe(true);
    });

    it('should throw error if API key is missing', async () => {
      await expect(
        exportToNotion(mockReportData, {
          apiKey: '',
          databaseId: 'test-database-id',
        })
      ).rejects.toThrow('Notion API key is required');
    });

    it('should handle Notion API errors gracefully', async () => {
      const { Client } = require('@notionhq/client');
      Client.mockImplementationOnce(() => ({
        pages: {
          create: jest.fn().mockRejectedValue(new Error('Notion API error')),
        },
      }));

      await expect(
        exportToNotion(mockReportData, {
          apiKey: 'test-api-key',
          databaseId: 'test-database-id',
        })
      ).rejects.toThrow('Failed to export to Notion');
    });
  });
});
