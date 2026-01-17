/**
 * Action Plan Generator
 *
 * Generates actionable 7-day and 30-day plans based on market analysis.
 */

import OpenAI from 'openai';
import { GapOpportunity } from './gap-generator';
import { ConceptIdea } from './concept-generator';

export interface ActionPlan {
  sevenDay: ActionItem[];
  thirtyDay: ActionItem[];
  quickWins: string[];
  keyRisks: string[];
  nextSteps: string;
}

export interface ActionItem {
  day: number;
  task: string;
  category: 'research' | 'build' | 'marketing' | 'content' | 'validation';
  effort: 'low' | 'medium' | 'high';
  resources?: string[];
  deliverable?: string;
  priority: 'critical' | 'high' | 'medium';
}

let openaiInstance: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// For testing: reset the OpenAI instance
export function resetOpenAIInstance() {
  openaiInstance = null;
}

export async function generateActionPlan(
  gaps: GapOpportunity[],
  concepts: ConceptIdea[],
  nicheQuery: string
): Promise<ActionPlan> {

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock action plan');
    return generateMockActionPlan(gaps, concepts, nicheQuery);
  }

  // Get top concept if available
  const topConcept = concepts.length > 0 ? concepts[0] : null;
  const topGaps = gaps.slice(0, 3);

  const prompt = `Based on this market analysis for "${nicheQuery}", create a detailed action plan.

TOP MARKET GAPS:
${topGaps.map((g, i) => `${i + 1}. ${g.title} (Score: ${g.opportunity_score}/100)
   Problem: ${g.problem}
   Recommendation: ${g.recommendation}`).join('\n\n')}

${topConcept ? `RECOMMENDED CONCEPT:
Name: ${topConcept.name}
Description: ${topConcept.one_liner}
Platform: ${topConcept.platform_recommendation}
Business Model: ${topConcept.business_model}
MVP Must-Haves: ${topConcept.mvp_spec.must_haves.join(', ')}
` : ''}

Create TWO action plans:

1. **7-DAY QUICK START** (Days 1-7):
   - Focus on validation and initial setup
   - Daily tasks that move from research to first prototype/landing page
   - Include specific, actionable items
   - Each day should build on the previous

2. **30-DAY COMPREHENSIVE PLAN** (Weeks 1-4):
   - Full MVP development and initial marketing
   - Weekly milestones
   - Include validation checkpoints
   - Scale from validation to initial customers

For each task include:
- day: number (1-7 for quick start, 1-30 for comprehensive)
- task: specific action item
- category: research | build | marketing | content | validation
- effort: low | medium | high
- resources: optional list of tools/resources needed
- deliverable: what you'll have completed
- priority: critical | high | medium

Also provide:
- quickWins: 3-5 quick wins that can be achieved in first week
- keyRisks: 3-5 potential risks to watch out for
- nextSteps: Summary of what comes after day 30

Return JSON following this structure:
{
  "sevenDay": [{ day, task, category, effort, resources, deliverable, priority }, ...],
  "thirtyDay": [{ day, task, category, effort, resources, deliverable, priority }, ...],
  "quickWins": ["...", ...],
  "keyRisks": ["...", ...],
  "nextSteps": "..."
}`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a startup advisor helping founders create actionable launch plans. Be specific, realistic, and focus on validation before building.'
        },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and normalize the response
    const actionPlan: ActionPlan = {
      sevenDay: result.sevenDay || [],
      thirtyDay: result.thirtyDay || [],
      quickWins: result.quickWins || [],
      keyRisks: result.keyRisks || [],
      nextSteps: result.nextSteps || 'Continue iterating based on customer feedback.',
    };

    return actionPlan;

  } catch (error) {
    console.error('Error generating action plan:', error);
    return generateMockActionPlan(gaps, concepts, nicheQuery);
  }
}

/**
 * Generate mock action plan for testing without API key
 */
function generateMockActionPlan(
  gaps: GapOpportunity[],
  concepts: ConceptIdea[],
  nicheQuery: string
): ActionPlan {
  const hasGaps = gaps.length > 0;
  const hasConcepts = concepts.length > 0;
  const topConcept = hasConcepts ? concepts[0] : null;

  return {
    sevenDay: [
      {
        day: 1,
        task: `Research top 10 competitors in ${nicheQuery} space`,
        category: 'research',
        effort: 'medium',
        resources: ['Google', 'Product Hunt', 'App Store search'],
        deliverable: 'Competitor analysis spreadsheet',
        priority: 'critical',
      },
      {
        day: 2,
        task: hasGaps
          ? `Interview 5 potential users about: ${gaps[0]?.title || 'main pain points'}`
          : 'Interview 5 potential users about pain points',
        category: 'validation',
        effort: 'high',
        resources: ['User interview script', 'Reddit', 'Twitter DMs'],
        deliverable: 'Interview notes and insights',
        priority: 'critical',
      },
      {
        day: 3,
        task: topConcept
          ? `Create landing page for "${topConcept.name}"`
          : `Create landing page for ${nicheQuery} solution`,
        category: 'build',
        effort: 'medium',
        resources: ['Carrd', 'Webflow', 'or Framer'],
        deliverable: 'Live landing page with email capture',
        priority: 'high',
      },
      {
        day: 4,
        task: 'Write problem-solution blog post',
        category: 'content',
        effort: 'medium',
        resources: ['Medium', 'Dev.to', 'Personal blog'],
        deliverable: 'Published article',
        priority: 'medium',
      },
      {
        day: 5,
        task: 'Set up analytics and email capture',
        category: 'marketing',
        effort: 'low',
        resources: ['Google Analytics', 'ConvertKit/Mailchimp'],
        deliverable: 'Working analytics tracking',
        priority: 'high',
      },
      {
        day: 6,
        task: 'Share landing page in 5 relevant communities',
        category: 'marketing',
        effort: 'medium',
        resources: ['Reddit', 'Facebook Groups', 'Slack communities'],
        deliverable: '50+ landing page visits',
        priority: 'high',
      },
      {
        day: 7,
        task: 'Review results and decide: pivot, persevere, or stop',
        category: 'validation',
        effort: 'low',
        deliverable: 'Go/no-go decision',
        priority: 'critical',
      },
    ],
    thirtyDay: [
      // Week 1: Validation
      {
        day: 1,
        task: 'Complete market research and competitor analysis',
        category: 'research',
        effort: 'high',
        priority: 'critical',
      },
      {
        day: 3,
        task: 'Conduct 10 user interviews',
        category: 'validation',
        effort: 'high',
        priority: 'critical',
      },
      {
        day: 5,
        task: 'Launch landing page and start collecting emails',
        category: 'build',
        effort: 'medium',
        priority: 'critical',
      },
      {
        day: 7,
        task: 'Write and publish first content piece',
        category: 'content',
        effort: 'medium',
        priority: 'high',
      },
      // Week 2: MVP Planning
      {
        day: 10,
        task: topConcept
          ? `Finalize MVP spec based on ${topConcept.mvp_spec.must_haves.length} must-have features`
          : 'Finalize MVP specification',
        category: 'build',
        effort: 'medium',
        priority: 'critical',
      },
      {
        day: 12,
        task: 'Set up development environment and tools',
        category: 'build',
        effort: 'medium',
        priority: 'high',
      },
      {
        day: 14,
        task: 'Start building core feature #1',
        category: 'build',
        effort: 'high',
        priority: 'critical',
      },
      // Week 3: Build & Test
      {
        day: 17,
        task: 'Complete core features and internal testing',
        category: 'build',
        effort: 'high',
        priority: 'critical',
      },
      {
        day: 19,
        task: 'Invite 5 beta testers from email list',
        category: 'validation',
        effort: 'medium',
        priority: 'high',
      },
      {
        day: 21,
        task: 'Create product demo video',
        category: 'content',
        effort: 'medium',
        priority: 'medium',
      },
      // Week 4: Launch Prep
      {
        day: 24,
        task: 'Incorporate beta feedback and polish UI',
        category: 'build',
        effort: 'high',
        priority: 'high',
      },
      {
        day: 26,
        task: 'Prepare launch materials (posts, graphics, press kit)',
        category: 'marketing',
        effort: 'medium',
        priority: 'high',
      },
      {
        day: 28,
        task: 'Set up payment processing and onboarding flow',
        category: 'build',
        effort: 'medium',
        priority: 'critical',
      },
      {
        day: 30,
        task: 'Soft launch to waitlist and Product Hunt',
        category: 'marketing',
        effort: 'high',
        priority: 'critical',
      },
    ],
    quickWins: [
      'Create landing page in one day to start collecting interested users',
      hasGaps
        ? `Position solution around top pain point: "${gaps[0]?.title || 'user needs'}"`
        : 'Position solution around validated user pain points',
      'Share progress daily on Twitter/LinkedIn to build audience',
      'Use no-code tools to validate before writing code',
      'Interview users before building to ensure product-market fit',
    ],
    keyRisks: [
      'Building features users don\'t want - validate with interviews first',
      'Spending too long perfecting MVP - ship early and iterate',
      hasGaps && gaps[0]?.confidence < 0.5
        ? 'Market opportunity may be less certain - gather more data'
        : 'Market may be more saturated than data suggests - check thoroughly',
      'Underestimating distribution difficulty - plan marketing from day 1',
      'Running out of motivation - set weekly milestones and celebrate progress',
    ],
    nextSteps: `After day 30, focus on:
1. Customer acquisition: Scale what's working from soft launch
2. Product iteration: Use feedback to improve core value proposition
3. Revenue optimization: Test pricing and conversion funnels
${topConcept
  ? `4. Platform expansion: Consider adding ${topConcept.platform_recommendation === 'mobile' ? 'web' : 'mobile'} version
5. Team building: Hire for ${topConcept.mvp_spec.must_haves[0] || 'key capabilities'}`
  : '4. Consider expanding to additional platforms\n5. Build team based on traction'}`,
  };
}
