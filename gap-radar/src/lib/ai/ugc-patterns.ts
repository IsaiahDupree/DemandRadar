/**
 * UGC Pattern Extractor
 *
 * Extracts hook types, formats, proof types, CTAs from UGC content.
 * Uses LLM when available, falls back to heuristics otherwise.
 */

import OpenAI from 'openai';
import { UGCAsset, UGCPatterns } from '../../types';

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

/**
 * Extract patterns from a single UGC asset or batch of assets
 */
export async function extractUGCPatterns(
  assetOrAssets: UGCAsset | UGCAsset[]
): Promise<UGCPatterns | UGCPatterns[]> {
  const isBatch = Array.isArray(assetOrAssets);
  const assets = isBatch ? assetOrAssets : [assetOrAssets];

  if (!process.env.OPENAI_API_KEY) {
    console.warn('OpenAI API key not set, using heuristic pattern extraction');
    const results = assets.map(asset => extractPatternsWithHeuristics(asset));
    return isBatch ? results : results[0];
  }

  try {
    const results = await Promise.all(
      assets.map(asset => extractPatternsWithLLM(asset))
    );
    return isBatch ? results : results[0];
  } catch (error) {
    console.error('LLM pattern extraction error, falling back to heuristics:', error);
    const results = assets.map(asset => extractPatternsWithHeuristics(asset));
    return isBatch ? results : results[0];
  }
}

/**
 * Extract patterns using OpenAI LLM
 */
async function extractPatternsWithLLM(asset: UGCAsset): Promise<UGCPatterns> {
  const caption = asset.caption || '';

  if (!caption) {
    return {
      hookType: 'Unknown',
      format: 'Unknown',
      proofType: 'None',
      ctaStyle: 'None',
      confidence: 0.1,
    };
  }

  const prompt = `Analyze this UGC content and extract pattern information.

CAPTION: "${caption}"

PLATFORM: ${asset.platform}
SOURCE: ${asset.source}

Extract:
1. hook_type: The opening hook strategy (e.g., "POV / Relatable", "Pain point callout", "Curiosity / FOMO", "Authority / Research", "Myth bust", "Feature highlight", "Hack / Productivity", "Use case / Scenario", "Value proposition", "Warning / Save money")
2. format: The content format (e.g., "Before/After", "Demo", "Listicle", "Tutorial", "Review", "Comparison", "Testimonial", "Behind the scenes")
3. proof_type: Type of proof or credibility (e.g., "Results shown", "Social proof", "Authority", "Testing/Research", "Numbers/Stats", "User testimonial", "None")
4. objection_handled: Any objections addressed (e.g., "Pricing", "Quality", "Compatibility", "Ease of use", or null if none)
5. cta_style: Call-to-action style (e.g., "Link in bio", "Comment for link", "Direct command", "Soft suggestion", "None")
6. notes: Any additional patterns or observations (optional)
7. confidence: How confident you are in this analysis (0.0 to 1.0)

Return ONLY valid JSON: { "hook_type": "...", "format": "...", "proof_type": "...", "objection_handled": "..." or null, "cta_style": "...", "notes": "...", "confidence": 0.0-1.0 }`;

  try {
    const response = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return extractPatternsWithHeuristics(asset);
    }

    const parsed = JSON.parse(content);

    return {
      hookType: parsed.hook_type || 'Unknown',
      format: parsed.format || 'Unknown',
      proofType: parsed.proof_type || 'None',
      objectionHandled: parsed.objection_handled || undefined,
      ctaStyle: parsed.cta_style || 'None',
      notes: parsed.notes,
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
    };
  } catch (error) {
    console.error('LLM extraction failed:', error);
    return extractPatternsWithHeuristics(asset);
  }
}

/**
 * Extract patterns using heuristics (fallback when no LLM)
 */
function extractPatternsWithHeuristics(asset: UGCAsset): UGCPatterns {
  const caption = asset.caption?.toLowerCase() || '';

  if (!caption) {
    return {
      hookType: 'Unknown',
      format: 'Unknown',
      proofType: 'None',
      ctaStyle: 'None',
      confidence: 0.1,
    };
  }

  // Detect hook type
  let hookType = 'General';
  let hookConfidence = 0.5;

  if (caption.startsWith('pov:') || caption.includes('pov:')) {
    hookType = 'POV / Relatable';
    hookConfidence = 0.9;
  } else if (caption.match(/stop (wasting|paying|using|trying)/)) {
    hookType = 'Pain point callout';
    hookConfidence = 0.85;
  } else if (caption.match(/finally found|discovered|secret|gatekeeping/)) {
    hookType = 'Curiosity / FOMO';
    hookConfidence = 0.8;
  } else if (caption.match(/i tested|i tried|i compared/)) {
    hookType = 'Authority / Research';
    hookConfidence = 0.85;
  } else if (caption.match(/myth|truth about|reality of|actually/)) {
    hookType = 'Myth bust';
    hookConfidence = 0.8;
  } else if (caption.match(/without|no subscription|no credit card|free/)) {
    hookType = 'Feature highlight';
    hookConfidence = 0.75;
  } else if (caption.match(/hack|trick|tip|shortcut/)) {
    hookType = 'Hack / Productivity';
    hookConfidence = 0.8;
  } else if (caption.match(/when (you|i)|use this (when|for)/)) {
    hookType = 'Use case / Scenario';
    hookConfidence = 0.7;
  } else if (caption.match(/\$\d+|free|cheap|affordable|better than/)) {
    hookType = 'Value proposition';
    hookConfidence = 0.7;
  } else if (caption.match(/before you|warning|careful|watch out/)) {
    hookType = 'Warning / Save money';
    hookConfidence = 0.75;
  }

  // Detect format
  let format = 'Unknown';
  let formatConfidence = 0.5;

  if (caption.match(/before (vs|and|&) after|vs\.|comparison/)) {
    format = 'Before/After';
    formatConfidence = 0.9;
  } else if (caption.match(/watch|demo|showing|see how/)) {
    format = 'Demo';
    formatConfidence = 0.8;
  } else if (caption.match(/\d+\s+\w*\s*(ways|tools|tips|tricks|things|steps|methods|hacks|ideas)/)) {
    format = 'Listicle';
    formatConfidence = 0.9;
  } else if (caption.match(/how to|tutorial|guide|step by step/)) {
    format = 'Tutorial';
    formatConfidence = 0.85;
  } else if (caption.match(/review|rating|my thoughts|honest/)) {
    format = 'Review';
    formatConfidence = 0.8;
  } else if (caption.match(/vs |versus|compared to/)) {
    format = 'Comparison';
    formatConfidence = 0.85;
  } else if (caption.match(/testimonial|customer|client said/)) {
    format = 'Testimonial';
    formatConfidence = 0.8;
  } else if (caption.match(/behind the scenes|making of|process/)) {
    format = 'Behind the scenes';
    formatConfidence = 0.75;
  } else {
    format = 'General';
    formatConfidence = 0.4;
  }

  // Detect proof type
  let proofType = 'None';

  if (caption.match(/\d+%|\d+x|increase|result|outcome/)) {
    proofType = 'Numbers/Stats';
  } else if (caption.match(/users love|customers|reviews|testimonial/)) {
    proofType = 'Social proof';
  } else if (caption.match(/expert|professional|certified|years of/)) {
    proofType = 'Authority';
  } else if (caption.match(/tested|research|study|data shows/)) {
    proofType = 'Testing/Research';
  } else if (caption.match(/before (and|&|vs) after|results shown/)) {
    proofType = 'Results shown';
  }

  // Detect objection handling
  let objectionHandled: string | undefined;

  if (caption.match(/works on (mac|windows|both|all)|compatible with/)) {
    objectionHandled = 'Compatibility';
  } else if (caption.match(/no subscription|one-time|free|cheap|\$\d+/)) {
    objectionHandled = 'Pricing';
  } else if (caption.match(/easy|simple|no (coding|technical|learning)|beginner/)) {
    objectionHandled = 'Ease of use';
  } else if (caption.match(/high quality|professional|premium|best/)) {
    objectionHandled = 'Quality';
  }

  // Detect CTA style
  let ctaStyle = 'None';

  if (caption.match(/link in bio/)) {
    ctaStyle = 'Link in bio';
  } else if (caption.match(/comment (link|below|for)|dm me/)) {
    ctaStyle = 'Comment for link';
  } else if (caption.match(/click|tap|try|download|get|visit|check out/)) {
    ctaStyle = 'Direct command';
  } else if (caption.match(/might want|consider|worth checking/)) {
    ctaStyle = 'Soft suggestion';
  }

  // Calculate overall confidence based on what we detected
  const detectedFeatures = [
    hookConfidence,
    formatConfidence,
    proofType !== 'None' ? 0.8 : 0.3,
    objectionHandled ? 0.8 : 0.3,
    ctaStyle !== 'None' ? 0.8 : 0.3,
  ];

  const avgConfidence = detectedFeatures.reduce((sum, val) => sum + val, 0) / detectedFeatures.length;
  const confidence = Math.min(0.85, avgConfidence); // Cap heuristic confidence at 0.85

  return {
    hookType,
    format,
    proofType,
    objectionHandled,
    ctaStyle,
    confidence,
  };
}

/**
 * Batch extract and store patterns for a run
 */
export async function extractAndStorePatternsForRun(
  runId: string,
  assets: UGCAsset[]
): Promise<void> {
  if (assets.length === 0) {
    return;
  }

  console.log(`Extracting patterns for ${assets.length} UGC assets...`);

  const patterns = await extractUGCPatterns(assets) as UGCPatterns[];

  // Here you would store to database
  // For now, just log the patterns
  console.log(`Extracted ${patterns.length} patterns`);
  console.log('Sample patterns:', patterns.slice(0, 3));

  // TODO: Insert into ugc_patterns table
  // const { createClient } = await import('@supabase/supabase-js');
  // const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  //
  // const records = assets.map((asset, i) => ({
  //   ugc_asset_id: asset.id,
  //   hook_type: patterns[i].hookType,
  //   format: patterns[i].format,
  //   proof_type: patterns[i].proofType,
  //   objection_handled: patterns[i].objectionHandled,
  //   cta_style: patterns[i].ctaStyle,
  //   notes: patterns[i].notes,
  //   confidence: patterns[i].confidence,
  // }));
  //
  // await supabase.from('ugc_patterns').insert(records);
}
