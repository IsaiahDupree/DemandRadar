/**
 * AI-Powered Targeting Inference
 * 
 * Analyzes ad copy and landing pages to infer likely audience targeting,
 * pain points addressed, and ICP characteristics.
 */

import OpenAI from 'openai';
import { MetaAd } from '../collectors/meta';
import { GoogleAd } from '../collectors/google';

export interface TargetingInference {
  adId: string;
  advertiserName: string;
  adPreview: string;
  
  // Inferred targeting
  inferredAudience: {
    primaryICP: string;
    secondaryICPs: string[];
    businessType: string[];
    companySize: 'solopreneur' | 'small_team' | 'smb' | 'mid_market' | 'enterprise' | 'unknown';
    industryVerticals: string[];
    rolesTitles: string[];
  };
  
  // Pain points & desires
  painPointsAddressed: string[];
  desiresAppealed: string[];
  objectionHandlers: string[];
  
  // Messaging analysis
  messagingAnalysis: {
    primaryAngle: string;
    valueProposition: string;
    differentiator: string;
    urgencyTriggers: string[];
    socialProofElements: string[];
    ctaType: string;
  };
  
  // Copywriting lessons
  copywritingInsights: {
    hookStyle: string;
    toneOfVoice: string;
    readingLevel: 'simple' | 'intermediate' | 'advanced';
    emotionalTriggers: string[];
    persuasionTechniques: string[];
  };
  
  // Relevance to copywriting services ICP
  relevanceScore: number; // 0-100 how relevant this ad is for finding copywriting clients
  relevanceReasoning: string;
  
  // Confidence
  confidence: number; // 0-1
}

export interface TargetingInferenceBatch {
  ads: TargetingInference[];
  summary: {
    totalAdsAnalyzed: number;
    topICPs: { icp: string; count: number }[];
    topPainPoints: { painPoint: string; count: number }[];
    topAngles: { angle: string; count: number }[];
    avgRelevanceScore: number;
    highRelevanceAds: number;
  };
  icpOpportunities: ICPOpportunity[];
}

export interface ICPOpportunity {
  icpName: string;
  adCount: number;
  commonPainPoints: string[];
  commonAngles: string[];
  advertisersTargeting: string[];
  opportunityInsight: string;
  recommendedApproach: string;
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

export function resetOpenAIInstance() {
  openaiInstance = null;
}

const TARGETING_INFERENCE_PROMPT = `You are an expert marketing strategist and copywriter analyst. Your task is to analyze ad creatives and infer:

1. **Target Audience**: Who is this ad trying to reach? Be specific about:
   - Primary ICP (Ideal Customer Profile)
   - Business type (coach, consultant, agency, SaaS, e-commerce, etc.)
   - Company size
   - Industry verticals
   - Job roles/titles

2. **Pain Points & Desires**: What problems does this ad address? What outcomes does it promise?

3. **Messaging Analysis**: Break down the copywriting strategy:
   - Primary angle (speed, cost, quality, ease, results, etc.)
   - Value proposition
   - Differentiator from competitors
   - Urgency triggers used
   - Social proof elements

4. **Copywriting Lessons**: What can we learn from this ad's copy?
   - Hook style
   - Tone of voice
   - Emotional triggers
   - Persuasion techniques (scarcity, authority, social proof, etc.)

5. **Relevance to Copywriting Services**: Rate 0-100 how likely this advertiser's audience needs copywriting services. High scores for:
   - Businesses that sell high-ticket services/products (need sales copy)
   - Businesses building funnels (need landing pages, emails)
   - Course creators, coaches, consultants (need launch copy)
   - Agencies (need white-label copy)
   - SaaS companies (need product copy, onboarding emails)

Return JSON matching the TargetingInference interface.`;

/**
 * Analyze a single ad for targeting inference
 */
export async function inferTargeting(
  ad: MetaAd | GoogleAd
): Promise<TargetingInference | null> {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set');
    return null;
  }

  const adText = ad.source === 'google'
    ? `${ad.headline || ''} ${ad.description || ''}`.trim()
    : `${(ad as MetaAd).headline || ''} ${(ad as MetaAd).creative_text || ''} ${(ad as MetaAd).cta || ''}`.trim();

  if (!adText || adText.length < 10) {
    return null;
  }

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: TARGETING_INFERENCE_PROMPT },
        {
          role: 'user',
          content: `Analyze this ad:

Advertiser: ${ad.advertiser_name}
Ad Copy: ${adText}
${('landing_url' in ad && ad.landing_url) || ('final_url' in ad && ad.final_url) ? `Landing URL: ${'landing_url' in ad ? ad.landing_url : ('final_url' in ad ? ad.final_url : '')}` : ''}

Provide your analysis in JSON format.`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);

    return {
      adId: ad.advertiser_name,
      advertiserName: ad.advertiser_name,
      adPreview: adText.slice(0, 200),
      inferredAudience: {
        primaryICP: parsed.inferredAudience?.primaryICP || parsed.primaryICP || 'Unknown',
        secondaryICPs: parsed.inferredAudience?.secondaryICPs || parsed.secondaryICPs || [],
        businessType: parsed.inferredAudience?.businessType || parsed.businessType || [],
        companySize: parsed.inferredAudience?.companySize || parsed.companySize || 'unknown',
        industryVerticals: parsed.inferredAudience?.industryVerticals || parsed.industryVerticals || [],
        rolesTitles: parsed.inferredAudience?.rolesTitles || parsed.rolesTitles || [],
      },
      painPointsAddressed: parsed.painPointsAddressed || parsed.painPoints || [],
      desiresAppealed: parsed.desiresAppealed || parsed.desires || [],
      objectionHandlers: parsed.objectionHandlers || [],
      messagingAnalysis: {
        primaryAngle: parsed.messagingAnalysis?.primaryAngle || parsed.primaryAngle || '',
        valueProposition: parsed.messagingAnalysis?.valueProposition || parsed.valueProposition || '',
        differentiator: parsed.messagingAnalysis?.differentiator || parsed.differentiator || '',
        urgencyTriggers: parsed.messagingAnalysis?.urgencyTriggers || parsed.urgencyTriggers || [],
        socialProofElements: parsed.messagingAnalysis?.socialProofElements || parsed.socialProof || [],
        ctaType: parsed.messagingAnalysis?.ctaType || parsed.ctaType || '',
      },
      copywritingInsights: {
        hookStyle: parsed.copywritingInsights?.hookStyle || parsed.hookStyle || '',
        toneOfVoice: parsed.copywritingInsights?.toneOfVoice || parsed.toneOfVoice || '',
        readingLevel: parsed.copywritingInsights?.readingLevel || parsed.readingLevel || 'intermediate',
        emotionalTriggers: parsed.copywritingInsights?.emotionalTriggers || parsed.emotionalTriggers || [],
        persuasionTechniques: parsed.copywritingInsights?.persuasionTechniques || parsed.persuasionTechniques || [],
      },
      relevanceScore: parsed.relevanceScore || parsed.relevance || 50,
      relevanceReasoning: parsed.relevanceReasoning || parsed.relevanceExplanation || '',
      confidence: parsed.confidence || 0.7,
    };
  } catch (error) {
    console.error('Targeting inference error:', error);
    return null;
  }
}

/**
 * Batch analyze multiple ads and generate summary insights
 */
export async function inferTargetingBatch(
  ads: (MetaAd | GoogleAd)[],
  options?: {
    maxAds?: number;
    minRelevanceScore?: number;
  }
): Promise<TargetingInferenceBatch> {
  const { maxAds = 30, minRelevanceScore = 0 } = options || {};

  // Analyze ads (limit to prevent API overuse)
  const adsToAnalyze = ads.slice(0, maxAds);
  const results: TargetingInference[] = [];

  // Process in batches of 5 to avoid rate limits
  for (let i = 0; i < adsToAnalyze.length; i += 5) {
    const batch = adsToAnalyze.slice(i, i + 5);
    const batchResults = await Promise.all(batch.map(ad => inferTargeting(ad)));
    results.push(...batchResults.filter((r): r is TargetingInference => r !== null));
    
    // Small delay between batches
    if (i + 5 < adsToAnalyze.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Filter by relevance if specified
  const filteredResults = minRelevanceScore > 0
    ? results.filter(r => r.relevanceScore >= minRelevanceScore)
    : results;

  // Generate summary
  const summary = generateSummary(filteredResults);
  
  // Generate ICP opportunities
  const icpOpportunities = await generateICPOpportunities(filteredResults);

  return {
    ads: filteredResults,
    summary,
    icpOpportunities,
  };
}

function generateSummary(ads: TargetingInference[]): TargetingInferenceBatch['summary'] {
  // Count ICPs
  const icpCounts = new Map<string, number>();
  ads.forEach(ad => {
    icpCounts.set(ad.inferredAudience.primaryICP, (icpCounts.get(ad.inferredAudience.primaryICP) || 0) + 1);
  });

  // Count pain points
  const painPointCounts = new Map<string, number>();
  ads.forEach(ad => {
    ad.painPointsAddressed.forEach(pp => {
      painPointCounts.set(pp, (painPointCounts.get(pp) || 0) + 1);
    });
  });

  // Count angles
  const angleCounts = new Map<string, number>();
  ads.forEach(ad => {
    if (ad.messagingAnalysis.primaryAngle) {
      angleCounts.set(ad.messagingAnalysis.primaryAngle, (angleCounts.get(ad.messagingAnalysis.primaryAngle) || 0) + 1);
    }
  });

  const sortByCount = <T extends { count: number }>(arr: T[]) => 
    arr.sort((a, b) => b.count - a.count);

  return {
    totalAdsAnalyzed: ads.length,
    topICPs: sortByCount(
      Array.from(icpCounts.entries()).map(([icp, count]) => ({ icp, count }))
    ).slice(0, 10),
    topPainPoints: sortByCount(
      Array.from(painPointCounts.entries()).map(([painPoint, count]) => ({ painPoint, count }))
    ).slice(0, 10),
    topAngles: sortByCount(
      Array.from(angleCounts.entries()).map(([angle, count]) => ({ angle, count }))
    ).slice(0, 10),
    avgRelevanceScore: ads.length > 0
      ? Math.round(ads.reduce((sum, ad) => sum + ad.relevanceScore, 0) / ads.length)
      : 0,
    highRelevanceAds: ads.filter(ad => ad.relevanceScore >= 70).length,
  };
}

async function generateICPOpportunities(
  ads: TargetingInference[]
): Promise<ICPOpportunity[]> {
  if (!process.env.OPENAI_API_KEY || ads.length === 0) {
    return generateMockICPOpportunities(ads);
  }

  // Group ads by primary ICP
  const icpGroups = new Map<string, TargetingInference[]>();
  ads.forEach(ad => {
    const icp = ad.inferredAudience.primaryICP;
    if (!icpGroups.has(icp)) {
      icpGroups.set(icp, []);
    }
    icpGroups.get(icp)!.push(ad);
  });

  // Generate opportunities for top ICPs
  const opportunities: ICPOpportunity[] = [];
  const topICPs = Array.from(icpGroups.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5);

  for (const [icpName, icpAds] of topICPs) {
    const commonPainPoints = getMostCommon(icpAds.flatMap(a => a.painPointsAddressed), 5);
    const commonAngles = getMostCommon(icpAds.map(a => a.messagingAnalysis.primaryAngle).filter(Boolean), 3);
    const advertisers = [...new Set(icpAds.map(a => a.advertiserName))].slice(0, 5);

    try {
      const response = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a copywriting business development strategist. Given information about an ICP being targeted by advertisers, provide actionable insights for a copywriting service provider.',
          },
          {
            role: 'user',
            content: `ICP: ${icpName}
Number of ads targeting this ICP: ${icpAds.length}
Common pain points addressed: ${commonPainPoints.join(', ')}
Common angles used: ${commonAngles.join(', ')}
Advertisers in this space: ${advertisers.join(', ')}

Provide:
1. opportunityInsight: A brief insight about why this ICP is a good opportunity for copywriting services (1-2 sentences)
2. recommendedApproach: How a copywriter should approach/pitch this ICP (1-2 sentences)

Return JSON: { "opportunityInsight": "...", "recommendedApproach": "..." }`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const content = response.choices[0]?.message?.content;
      const parsed = content ? JSON.parse(content) : {};

      opportunities.push({
        icpName,
        adCount: icpAds.length,
        commonPainPoints,
        commonAngles,
        advertisersTargeting: advertisers,
        opportunityInsight: parsed.opportunityInsight || `${icpAds.length} advertisers are targeting this ICP, indicating active demand.`,
        recommendedApproach: parsed.recommendedApproach || 'Position your copywriting services around the common pain points identified.',
      });
    } catch (error) {
      console.error('Error generating ICP opportunity:', error);
      opportunities.push({
        icpName,
        adCount: icpAds.length,
        commonPainPoints,
        commonAngles,
        advertisersTargeting: advertisers,
        opportunityInsight: `${icpAds.length} advertisers are targeting this ICP, indicating active demand.`,
        recommendedApproach: 'Position your copywriting services around the common pain points identified.',
      });
    }
  }

  return opportunities;
}

function getMostCommon(items: string[], limit: number): string[] {
  const counts = new Map<string, number>();
  items.forEach(item => {
    if (item) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
  });
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([item]) => item);
}

function generateMockICPOpportunities(ads: TargetingInference[]): ICPOpportunity[] {
  return [
    {
      icpName: 'Business Coaches',
      adCount: 15,
      commonPainPoints: ['Client acquisition', 'Standing out in crowded market', 'Converting discovery calls'],
      commonAngles: ['Results-focused', 'Transformation stories', 'Authority positioning'],
      advertisersTargeting: ['CoachFoundation', 'ScaleYourCoaching', 'CoachingSuccess'],
      opportunityInsight: 'Coaches are actively spending on ads but many struggle with messaging. They need help articulating their unique methodology.',
      recommendedApproach: 'Offer "signature program" copy packages that help coaches differentiate. Focus on sales page + email sequence bundles.',
    },
    {
      icpName: 'Marketing Agencies',
      adCount: 12,
      commonPainPoints: ['Client retention', 'Scaling deliverables', 'Proving ROI'],
      commonAngles: ['White-label solutions', 'Efficiency', 'Quality at scale'],
      advertisersTargeting: ['AgencyAnalytics', 'Vendasta', 'GoHighLevel'],
      opportunityInsight: 'Agencies need consistent, quality copy for clients but struggle to hire in-house. White-label opportunities are significant.',
      recommendedApproach: 'Position as a white-label copy partner. Offer retainer packages with fast turnaround for agency clients.',
    },
  ];
}
