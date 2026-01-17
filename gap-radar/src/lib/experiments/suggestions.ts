/**
 * Experiment Suggestions
 *
 * Generate weekly experiment suggestions based on demand signals
 * and track results
 */

import OpenAI from 'openai';

export type ExperimentType = 'copy' | 'angle' | 'offer' | 'pricing' | 'feature' | 'targeting';

export interface ExperimentSuggestion {
  type: ExperimentType;
  title: string;
  hypothesis: string;
  setup: string;
  success_metrics: string[];
  estimated_effort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  evidence: string;
}

export interface DemandSnapshot {
  demand_score: number;
  ad_signals: {
    top_angles: string[];
    top_offers: string[];
  };
  forum_signals: {
    top_complaints: string[];
    top_desires: string[];
  };
  competitor_signals: {
    pricing_changes: any[];
    feature_changes: any[];
  };
}

/**
 * Generate experiment suggestions based on demand signals
 */
export async function generateExperimentSuggestions(
  nicheName: string,
  snapshot: DemandSnapshot
): Promise<ExperimentSuggestion[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  if (!process.env.OPENAI_API_KEY) {
    return generateMockExperiments(nicheName);
  }

  const prompt = `You are a growth marketing expert analyzing demand signals for "${nicheName}".

Based on these signals:
- Demand Score: ${snapshot.demand_score}/100
- Top Ad Angles: ${snapshot.ad_signals.top_angles.slice(0, 3).join(', ')}
- Top Complaints: ${snapshot.forum_signals.top_complaints.slice(0, 3).join(', ')}
- Top Desires: ${snapshot.forum_signals.top_desires.slice(0, 3).join(', ')}
- Recent Competitor Changes: ${snapshot.competitor_signals.feature_changes.length} feature updates, ${snapshot.competitor_signals.pricing_changes.length} pricing changes

Generate 5 specific, actionable experiments to test this week. Each experiment should:
1. Have a clear hypothesis
2. Be testable within 1 week
3. Have measurable success metrics
4. Be prioritized by potential impact

Return a JSON array of experiments with this structure:
{
  "type": "copy" | "angle" | "offer" | "pricing" | "feature" | "targeting",
  "title": "Short descriptive title",
  "hypothesis": "If we do X, we believe Y will happen because Z",
  "setup": "Step-by-step how to set up this test",
  "success_metrics": ["Metric 1 > X%", "Metric 2 < Y"],
  "estimated_effort": "low" | "medium" | "high",
  "priority": 1-10,
  "evidence": "What data supports this experiment"
}

Focus on experiments that:
- Address user pain points
- Test messaging angles competitors use
- Capitalize on emerging trends
- Are low-effort, high-impact`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a growth marketing expert who generates data-driven experiment suggestions. Always return valid JSON arrays.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return generateMockExperiments(nicheName);
    }

    const parsed = JSON.parse(content);
    const experiments = parsed.experiments || [];

    return experiments.slice(0, 5);
  } catch (error) {
    console.error('Error generating experiments:', error);
    return generateMockExperiments(nicheName);
  }
}

/**
 * Generate mock experiments for testing
 */
function generateMockExperiments(nicheName: string): ExperimentSuggestion[] {
  return [
    {
      type: 'copy',
      title: 'Test pain-focused hook vs benefit hook',
      hypothesis:
        'If we test pain-point hooks, we believe CTR will increase by 15% because users are actively seeking solutions to their problems',
      setup:
        '1. Create 2 ad variants with same creative but different hooks\n2. Split traffic 50/50\n3. Run for 7 days with $50/day budget\n4. Track CTR and CPC',
      success_metrics: ['CTR > 2%', 'CPC < $1.50', 'Engagement rate > 3%'],
      estimated_effort: 'low',
      priority: 9,
      evidence:
        'Top complaint mentions "too expensive" and "hard to use" - pain-focused messaging may resonate',
    },
    {
      type: 'angle',
      title: 'Test "time-saving" angle against competitors',
      hypothesis:
        'If we emphasize time-saving benefits, conversions will improve by 20% because this is an underserved angle in the market',
      setup:
        '1. Create landing page variant highlighting time savings\n2. Update ad copy to match\n3. A/B test for 1 week\n4. Measure conversion rate',
      success_metrics: ['Conversion rate > 5%', 'Time on page > 2 min'],
      estimated_effort: 'medium',
      priority: 8,
      evidence: 'Only 1 of top 5 competitors mentions time-saving as primary benefit',
    },
    {
      type: 'offer',
      title: 'Test free trial vs money-back guarantee',
      hypothesis:
        'If we offer 14-day free trial instead of money-back guarantee, signups will increase 30% because lower perceived risk',
      setup:
        '1. Update pricing page with free trial CTA\n2. Set up trial flow in product\n3. Track signup rate and trial-to-paid conversion\n4. Run for 7 days',
      success_metrics: ['Signups > +25%', 'Trial→Paid > 40%'],
      estimated_effort: 'high',
      priority: 7,
      evidence: 'Top desire is "try before buying" - appears in 40% of user requests',
    },
    {
      type: 'targeting',
      title: 'Test targeting "frustrated X users" segment',
      hypothesis:
        'If we target users frustrated with current solutions, CPA will drop 25% due to higher intent',
      setup:
        '1. Create lookalike audience from churned competitor users\n2. Design ads addressing specific frustrations\n3. Run campaign for 7 days\n4. Compare CPA to broad targeting',
      success_metrics: ['CPA < $50', 'Conversion rate > 4%'],
      estimated_effort: 'low',
      priority: 8,
      evidence: 'High negative sentiment about competitors in Reddit mentions',
    },
    {
      type: 'pricing',
      title: 'Test $29/mo vs $9/mo entry tier',
      hypothesis:
        'If we introduce lower-priced tier, total revenue will increase 15% through volume despite lower ARPU',
      setup:
        '1. Create new pricing tier with limited features\n2. Update pricing page\n3. Track sign-ups by tier\n4. Calculate revenue impact after 7 days',
      success_metrics: [
        'Total signups > +40%',
        'Revenue per cohort > baseline',
        'Upgrade rate from low→mid tier > 20%',
      ],
      estimated_effort: 'medium',
      priority: 6,
      evidence: 'Pricing complaints mention "too expensive for beginners" frequently',
    },
  ];
}
