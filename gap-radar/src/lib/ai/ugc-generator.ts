/**
 * UGC Recommendations Generator
 * 
 * Generates hooks, scripts, and shot lists based on market data.
 */

import OpenAI from 'openai';
import { Cluster } from './extractor';
import { GapOpportunity } from './gap-generator';

export interface UGCRecommendations {
  hooks: { text: string; type: string }[];
  scripts: { duration: string; outline: string[] }[];
  shot_list: { shot: string; notes: string }[];
  angle_map: { angle: string; priority: 'high' | 'medium' | 'low'; reasoning: string }[];
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

export async function generateUGCRecommendations(
  clusters: Cluster[],
  gaps: GapOpportunity[],
  nicheQuery: string
): Promise<UGCRecommendations> {
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using mock UGC recommendations');
    return generateMockUGCRecommendations(clusters, gaps, nicheQuery);
  }

  const objections = clusters.filter(c => c.cluster_type === 'objection');
  const angles = clusters.filter(c => c.cluster_type === 'angle');

  const prompt = `Create UGC content recommendations for a "${nicheQuery}" product.

TOP USER OBJECTIONS TO ADDRESS:
${objections.slice(0, 5).map(o => `- ${o.label}`).join('\n')}

COMPETITOR ANGLES (what they claim):
${angles.slice(0, 5).map(a => `- ${a.label}`).join('\n')}

TOP GAPS TO EXPLOIT:
${gaps.slice(0, 3).map(g => `- ${g.title}`).join('\n')}

Generate:
1. hooks: 10 video hooks (opening lines) with type (POV, pain point, hack, etc.)
2. scripts: 3 script outlines (15s, 30s, 60s) with timestamp breakdowns
3. shot_list: 6 essential shots to capture with notes
4. angle_map: 5 messaging angles ranked by priority with reasoning

Return JSON: { hooks: [], scripts: [], shot_list: [], angle_map: [] }`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.6,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return generateMockUGCRecommendations(clusters, gaps, nicheQuery);

    const parsed = JSON.parse(content);
    
    return {
      hooks: (parsed.hooks || []).slice(0, 10).map((h: { text?: string; type?: string }) => ({
        text: h.text || '',
        type: h.type || 'general',
      })),
      scripts: (parsed.scripts || []).slice(0, 3).map((s: { duration?: string; outline?: string[] }) => ({
        duration: s.duration || '30s',
        outline: s.outline || [],
      })),
      shot_list: (parsed.shot_list || []).slice(0, 6).map((s: { shot?: string; notes?: string }) => ({
        shot: s.shot || '',
        notes: s.notes || '',
      })),
      angle_map: (parsed.angle_map || []).slice(0, 5).map((a: { angle?: string; priority?: string; reasoning?: string }) => ({
        angle: a.angle || '',
        priority: (a.priority as 'high' | 'medium' | 'low') || 'medium',
        reasoning: a.reasoning || '',
      })),
    };
  } catch (error) {
    console.error('UGC generation error:', error);
    return generateMockUGCRecommendations(clusters, gaps, nicheQuery);
  }
}

function generateMockUGCRecommendations(
  clusters: Cluster[],
  gaps: GapOpportunity[],
  niche: string
): UGCRecommendations {
  const topObjection = clusters.find(c => c.cluster_type === 'objection')?.label || 'quality issues';
  
  return {
    hooks: [
      { text: `POV: You finally found a ${niche.toLowerCase()} that actually works`, type: 'POV / Relatable' },
      { text: `Stop wasting money on ${niche.toLowerCase()} tools that don't work`, type: 'Pain point callout' },
      { text: `The ${niche.toLowerCase()} that designers are gatekeeping`, type: 'Curiosity / FOMO' },
      { text: `I tested 10 ${niche.toLowerCase()} tools so you don't have to`, type: 'Authority / Research' },
      { text: `Why every "free" ${niche.toLowerCase()} is actually a scam`, type: 'Myth bust' },
      { text: `This AI ${niche.toLowerCase()} WITHOUT the usual problems`, type: 'Feature highlight' },
      { text: `${niche} hack that will save you hours every week`, type: 'Hack / Productivity' },
      { text: `The tool I use when I need perfect ${niche.toLowerCase()}`, type: 'Use case / Scenario' },
      { text: `Free ${niche.toLowerCase()} that actually looks professional`, type: 'Value proposition' },
      { text: `Before you pay for another ${niche.toLowerCase()} tool, watch this`, type: 'Warning / Save money' },
    ],
    scripts: [
      {
        duration: '15s',
        outline: [
          '0-3s: Hook - "POV: You found a tool that works"',
          '3-10s: Demo - Show before/after',
          '10-15s: CTA - "Link in bio, first 10 free"',
        ],
      },
      {
        duration: '30s',
        outline: [
          '0-5s: Hook - "I tested 10 tools"',
          '5-15s: Problem - Show 3 tools with bad results',
          '15-25s: Solution - Demo your tool',
          '25-30s: CTA - "Comment LINK"',
        ],
      },
      {
        duration: '60s',
        outline: [
          '0-5s: Hook - "Stop paying $20/month"',
          '5-15s: Establish credibility',
          '15-25s: Compare pricing',
          '25-50s: Full demo with before/after',
          '50-60s: CTA - "Link in bio, no subscription"',
        ],
      },
    ],
    shot_list: [
      { shot: 'Screen recording: Upload file', notes: 'Show drag-and-drop, emphasize simplicity' },
      { shot: 'Screen recording: Processing', notes: 'Keep brief, 2-3 seconds max' },
      { shot: 'Split screen: Before/after', notes: 'Money shot - linger here' },
      { shot: 'Face cam reaction (optional)', notes: 'Genuine surprise works best' },
      { shot: 'Screen recording: Download', notes: 'Show quality if impressive' },
      { shot: 'Competitor comparison', notes: 'Show problems from other tools' },
    ],
    angle_map: [
      { 
        angle: 'Quality focus', 
        priority: 'high', 
        reasoning: `Direct response to #1 objection: ${topObjection}` 
      },
      { 
        angle: 'Transparent pricing', 
        priority: 'high', 
        reasoning: 'Major pain point. Low-hanging fruit.' 
      },
      { 
        angle: 'Speed/convenience', 
        priority: 'medium', 
        reasoning: 'Everyone claims this - need differentiation.' 
      },
      { 
        angle: 'Professional results', 
        priority: 'medium', 
        reasoning: 'Appeals to serious users.' 
      },
      { 
        angle: 'Free tier', 
        priority: 'low', 
        reasoning: 'Generic but worth testing.' 
      },
    ],
  };
}
