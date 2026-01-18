/**
 * Tests for Ad Concept Generator (AI-006)
 *
 * Generates 3 ad test concepts based on gap opportunities
 *
 * Acceptance Criteria:
 * - 3 concepts generated
 * - Headlines and copy included
 * - Tied to evidence
 */

import { generateAdConcepts, type AdConcept } from '@/lib/ai/ad-concepts';
import type { GapOpportunity } from '@/lib/ai/gap-generator';

describe('Ad Concept Generator (AI-006)', () => {
  const mockGaps: GapOpportunity[] = [
    {
      gap_type: 'product',
      title: 'Missing mobile app integration',
      problem: 'Users complain they cannot sync with their mobile calendar app',
      evidence_ads: [
        { id: 'ad-1', snippet: 'Sync with Google Calendar and Outlook' },
        { id: 'ad-2', snippet: 'Never miss a meeting with seamless calendar sync' },
      ],
      evidence_reddit: [
        { id: 'reddit-1', snippet: 'Wish it synced with my phone calendar' },
        { id: 'reddit-2', snippet: 'No mobile sync is a dealbreaker for me' },
        { id: 'reddit-3', snippet: 'I want my tasks to show up in my calendar app' },
      ],
      recommendation: 'Add native calendar sync for iOS and Android',
      opportunity_score: 85,
      confidence: 0.9,
    },
    {
      gap_type: 'pricing',
      title: 'Pricing transparency issues',
      problem: 'Users are frustrated by hidden fees and unclear pricing',
      evidence_ads: [
        { id: 'ad-3', snippet: 'Transparent pricing, no hidden fees' },
        { id: 'ad-4', snippet: 'See exactly what you pay - no surprises' },
      ],
      evidence_reddit: [
        { id: 'reddit-4', snippet: "Got charged extra fees I didn't expect" },
        { id: 'reddit-5', snippet: 'Pricing page is so confusing' },
      ],
      recommendation: 'Create clear pricing tiers with all fees visible upfront',
      opportunity_score: 78,
      confidence: 0.85,
    },
    {
      gap_type: 'trust',
      title: 'Lack of social proof',
      problem: 'No testimonials or case studies visible on landing page',
      evidence_ads: [
        { id: 'ad-5', snippet: 'Trusted by 10,000+ companies' },
        { id: 'ad-6', snippet: 'See why teams love us' },
      ],
      evidence_reddit: [
        { id: 'reddit-6', snippet: "Is this legit? Can't find any reviews" },
      ],
      recommendation: 'Add customer testimonials and trust badges',
      opportunity_score: 65,
      confidence: 0.75,
    },
  ];

  it('should generate exactly 3 ad concepts', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    expect(concepts).toHaveLength(3);
  });

  it('should include headline for each concept', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    concepts.forEach((concept) => {
      expect(concept.headline).toBeTruthy();
      expect(typeof concept.headline).toBe('string');
      expect(concept.headline.length).toBeGreaterThan(10);
      expect(concept.headline.length).toBeLessThan(100);
    });
  });

  it('should include body copy for each concept', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    concepts.forEach((concept) => {
      expect(concept.bodyCopy).toBeTruthy();
      expect(typeof concept.bodyCopy).toBe('string');
      expect(concept.bodyCopy.length).toBeGreaterThan(20);
    });
  });

  it('should include CTA for each concept', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    concepts.forEach((concept) => {
      expect(concept.cta).toBeTruthy();
      expect(typeof concept.cta).toBe('string');
      expect(concept.cta.length).toBeGreaterThan(3);
      expect(concept.cta.length).toBeLessThan(30);
    });
  });

  it('should tie concepts to specific gaps', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    concepts.forEach((concept) => {
      expect(concept.gapId).toBeDefined();
      expect(concept.rationale).toBeTruthy();
      expect(typeof concept.rationale).toBe('string');
    });
  });

  it('should reference evidence in the concepts', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    // At least one concept should reference the evidence
    const allText = concepts.map(c => `${c.headline} ${c.bodyCopy}`).join(' ').toLowerCase();

    // Check for evidence from top gap
    const hasEvidenceReference =
      allText.includes('sync') ||
      allText.includes('calendar') ||
      allText.includes('mobile') ||
      allText.includes('meeting');

    expect(hasEvidenceReference).toBe(true);
  });

  it('should include target audience for each concept', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    concepts.forEach((concept) => {
      expect(concept.targetAudience).toBeTruthy();
      expect(typeof concept.targetAudience).toBe('string');
    });
  });

  it('should include angle/hook for each concept', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    concepts.forEach((concept) => {
      expect(concept.angle).toBeTruthy();
      expect(typeof concept.angle).toBe('string');
    });
  });

  it('should prioritize high-scoring gaps', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    // First concept should address the highest scoring gap
    expect(concepts[0].gapId).toBeDefined();

    // The rationale should explain why this gap was chosen
    expect(concepts[0].rationale).toContain('score');
  });

  it('should handle empty gaps array gracefully', async () => {
    const concepts = await generateAdConcepts([], 'productivity app');

    expect(concepts).toBeDefined();
    expect(Array.isArray(concepts)).toBe(true);
    // Should still generate generic concepts
    expect(concepts.length).toBeGreaterThan(0);
  });

  it('should include niche context in concepts', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'AI writing assistant');

    const allText = concepts.map(c => `${c.headline} ${c.bodyCopy} ${c.targetAudience}`).join(' ').toLowerCase();

    // Should reference the niche
    const hasNicheContext =
      allText.includes('ai') ||
      allText.includes('writing') ||
      allText.includes('content');

    expect(hasNicheContext).toBe(true);
  });

  it('should generate diverse angles across the 3 concepts', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    const angles = concepts.map(c => c.angle);

    // All angles should be unique
    const uniqueAngles = new Set(angles);
    expect(uniqueAngles.size).toBe(3);
  });

  it('should include expected impact for each concept', async () => {
    const concepts = await generateAdConcepts(mockGaps, 'productivity app');

    concepts.forEach((concept) => {
      expect(concept.expectedImpact).toBeTruthy();
      expect(typeof concept.expectedImpact).toBe('string');
    });
  });
});
