/**
 * Slide Deck Generator
 *
 * Generates PowerPoint presentations from report data
 * Exports a 9-slide deck following the PRD structure
 */

import PptxGenJS from 'pptxgenjs';
import type { ReportData } from './generator';

// Re-export for easier mocking in tests
const PptxGenerator = PptxGenJS;
export { PptxGenerator };

export interface SlideGeneratorOptions {
  includeCharts?: boolean;
  brandColor?: string;
  logoUrl?: string;
}

const DEFAULT_OPTIONS: SlideGeneratorOptions = {
  includeCharts: true,
  brandColor: '#3b82f6', // Primary blue
  logoUrl: undefined,
};

/**
 * Generate a PowerPoint presentation from report data
 * Returns a Buffer containing the PPTX file
 */
export async function generateSlides(
  reportData: ReportData,
  options: SlideGeneratorOptions = {}
): Promise<Buffer> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const pptx = new PptxGenJS();

  // Set presentation metadata
  pptx.author = 'GapRadar';
  pptx.company = 'GapRadar';
  pptx.subject = `Market Analysis: ${reportData.summary.nicheName}`;
  pptx.title = `${reportData.summary.nicheName} - Market Gap Analysis`;

  // Define color scheme
  const colors = {
    primary: opts.brandColor || '#3b82f6',
    secondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#ffffff',
    text: '#1e293b',
    textLight: '#64748b',
  };

  // Slide 1: Executive Summary
  addExecutiveSummarySlide(pptx, reportData, colors);

  // Slide 2: Paid Market Snapshot
  addPaidMarketSlide(pptx, reportData, colors, opts);

  // Slide 3: What Customers Actually Say (Reddit)
  addRedditInsightsSlide(pptx, reportData, colors);

  // Slide 4: Platform Existence Gap
  addPlatformGapSlide(pptx, reportData, colors, opts);

  // Slide 5: Gap Opportunities (Ranked)
  addGapOpportunitiesSlide(pptx, reportData, colors);

  // Slide 6: Modeled Economics
  addEconomicsSlide(pptx, reportData, colors, opts);

  // Slide 7: Buildability Assessment
  addBuildabilitySlide(pptx, reportData, colors);

  // Slide 8: UGC Winners Pack
  addUGCSlide(pptx, reportData, colors);

  // Slide 9: Action Plan
  addActionPlanSlide(pptx, reportData, colors);

  // Generate and return buffer
  const buffer = await pptx.write({ outputType: 'nodebuffer' }) as Buffer;
  return buffer;
}

/**
 * Slide 1: Executive Summary
 */
function addExecutiveSummarySlide(pptx: PptxGenJS, data: ReportData, colors: any) {
  const slide = pptx.addSlide({ masterName: undefined });

  // Title
  slide.addText('Executive Summary', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  // Niche name
  slide.addText(data.summary.nicheName, {
    x: 0.5,
    y: 1.0,
    w: 9,
    h: 0.5,
    fontSize: 24,
    color: colors.primary,
  });

  // Opportunity Score - Large Display
  const scoreColor = data.summary.opportunityScore >= 70 ? colors.success :
                     data.summary.opportunityScore >= 50 ? colors.warning : colors.danger;

  slide.addText(Math.round(data.summary.opportunityScore).toString(), {
    x: 1.5,
    y: 2.0,
    w: 2,
    h: 1.5,
    fontSize: 72,
    bold: true,
    color: scoreColor,
    align: 'center',
  });

  slide.addText('Opportunity Score', {
    x: 1.5,
    y: 3.5,
    w: 2,
    h: 0.3,
    fontSize: 14,
    color: colors.textLight,
    align: 'center',
  });

  // Confidence Score
  const confidencePercent = Math.round(data.summary.confidence * 100);
  slide.addText(`${confidencePercent}%`, {
    x: 4.0,
    y: 2.0,
    w: 2,
    h: 1.5,
    fontSize: 72,
    bold: true,
    color: colors.primary,
    align: 'center',
  });

  slide.addText('Confidence', {
    x: 4.0,
    y: 3.5,
    w: 2,
    h: 0.3,
    fontSize: 14,
    color: colors.textLight,
    align: 'center',
  });

  // Top 3 Gaps
  slide.addText('Top Opportunities', {
    x: 6.5,
    y: 2.0,
    w: 3,
    h: 0.4,
    fontSize: 18,
    bold: true,
    color: colors.text,
  });

  data.summary.topGaps.forEach((gap, idx) => {
    slide.addText(`${idx + 1}. ${gap.title}`, {
      x: 6.5,
      y: 2.5 + (idx * 0.4),
      w: 3,
      h: 0.35,
      fontSize: 12,
      color: colors.text,
    });
  });

  // Platform Recommendation
  slide.addText('Platform Recommendation', {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.text,
  });

  slide.addText(`${data.summary.platformRecommendation.platform.toUpperCase()}: ${data.summary.platformRecommendation.reasoning}`, {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.8,
    fontSize: 14,
    color: colors.textLight,
  });
}

/**
 * Slide 2: Paid Market Snapshot
 */
function addPaidMarketSlide(pptx: PptxGenJS, data: ReportData, colors: any, opts: SlideGeneratorOptions) {
  const slide = pptx.addSlide({ masterName: undefined });

  slide.addText('Paid Market Snapshot', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  slide.addText('What\'s Running in Ads', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: colors.textLight,
  });

  // Top Advertisers Table
  if (data.paidMarket.topAdvertisers.length > 0) {
    slide.addText('Top Advertisers', {
      x: 0.5,
      y: 1.5,
      w: 4,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: colors.text,
    });

    const advertiserRows = [
      [
        { text: 'Advertiser', options: { bold: true, color: colors.text } },
        { text: 'Ads', options: { bold: true, color: colors.text } },
        { text: 'Avg Days', options: { bold: true, color: colors.text } },
      ],
      ...data.paidMarket.topAdvertisers.slice(0, 5).map((adv) => [
        { text: adv.name, options: { color: colors.text } },
        { text: adv.adCount.toString(), options: { color: colors.text } },
        { text: adv.avgLongevity.toString(), options: { color: colors.text } },
      ]),
    ];

    slide.addTable(advertiserRows, {
      x: 0.5,
      y: 2.0,
      w: 4,
      h: 2.0,
      fontSize: 11,
      border: { pt: 1, color: colors.secondary },
      fill: { color: colors.background },
    });
  }

  // Top Angles
  if (data.paidMarket.topAngles.length > 0) {
    slide.addText('Top Marketing Angles', {
      x: 5.0,
      y: 1.5,
      w: 4.5,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: colors.text,
    });

    data.paidMarket.topAngles.slice(0, 5).forEach((angle, idx) => {
      slide.addText(`• ${angle.angle} (${angle.frequency}x)`, {
        x: 5.0,
        y: 2.0 + (idx * 0.4),
        w: 4.5,
        h: 0.35,
        fontSize: 11,
        color: colors.text,
      });
    });
  }

  // Longest Running
  if (data.paidMarket.longestRunning.length > 0) {
    slide.addText('Longest Running Ads', {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: colors.text,
    });

    const longestAd = data.paidMarket.longestRunning[0];
    slide.addText(`${longestAd.advertiser}: "${longestAd.creative}" (${longestAd.daysRunning} days)`, {
      x: 0.5,
      y: 5.0,
      w: 9,
      h: 0.5,
      fontSize: 12,
      color: colors.textLight,
    });
  }
}

/**
 * Slide 3: What Customers Actually Say (Reddit)
 */
function addRedditInsightsSlide(pptx: PptxGenJS, data: ReportData, colors: any) {
  const slide = pptx.addSlide({ masterName: undefined });

  slide.addText('What Customers Actually Say', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  slide.addText('Reddit Insights', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: colors.textLight,
  });

  // Top Objections
  slide.addText('Top Objections', {
    x: 0.5,
    y: 1.5,
    w: 4.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.danger,
  });

  data.reddit.topObjections.slice(0, 5).forEach((obj, idx) => {
    slide.addText(`${idx + 1}. ${obj.objection}`, {
      x: 0.5,
      y: 2.0 + (idx * 0.5),
      w: 4.5,
      h: 0.45,
      fontSize: 11,
      color: colors.text,
    });
    slide.addText(`   Frequency: ${obj.frequency} | Intensity: ${Math.round(obj.intensity * 100)}%`, {
      x: 0.5,
      y: 2.25 + (idx * 0.5),
      w: 4.5,
      h: 0.2,
      fontSize: 9,
      color: colors.textLight,
      italic: true,
    });
  });

  // Top Desired Features
  slide.addText('Top Desired Features', {
    x: 5.5,
    y: 1.5,
    w: 4,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.success,
  });

  data.reddit.topDesiredFeatures.slice(0, 5).forEach((feature, idx) => {
    slide.addText(`${idx + 1}. ${feature.feature}`, {
      x: 5.5,
      y: 2.0 + (idx * 0.4),
      w: 4,
      h: 0.35,
      fontSize: 11,
      color: colors.text,
    });
  });

  // Pricing Friction (if any)
  if (data.reddit.pricingFriction.length > 0) {
    slide.addText('Pricing Concerns', {
      x: 0.5,
      y: 4.5,
      w: 9,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: colors.warning,
    });

    const topPricing = data.reddit.pricingFriction[0];
    slide.addText(`"${topPricing.quote.substring(0, 120)}..."`, {
      x: 0.5,
      y: 5.0,
      w: 9,
      h: 0.5,
      fontSize: 10,
      italic: true,
      color: colors.textLight,
    });
  }
}

/**
 * Slide 4: Platform Existence Gap
 */
function addPlatformGapSlide(pptx: PptxGenJS, data: ReportData, colors: any, opts: SlideGeneratorOptions) {
  const slide = pptx.addSlide({ masterName: undefined });

  slide.addText('Platform Existence Gap', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  slide.addText('Market Saturation by Platform', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: colors.textLight,
  });

  // Platform Saturation Scores
  const platforms = [
    { name: 'iOS', score: data.platformGap.ios.saturationScore, y: 2.0 },
    { name: 'Android', score: data.platformGap.android.saturationScore, y: 3.0 },
    { name: 'Web', score: data.platformGap.web.saturationScore, y: 4.0 },
  ];

  platforms.forEach((platform) => {
    const barColor = platform.score < 30 ? colors.success :
                     platform.score < 70 ? colors.warning : colors.danger;

    slide.addText(platform.name, {
      x: 0.5,
      y: platform.y,
      w: 1.5,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: colors.text,
    });

    // Saturation bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 2.5,
      y: platform.y + 0.05,
      w: (platform.score / 100) * 5,
      h: 0.3,
      fill: { color: barColor },
    });

    slide.addText(`${Math.round(platform.score)}%`, {
      x: 8.0,
      y: platform.y,
      w: 1,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: barColor,
      align: 'right',
    });
  });

  // Recommendation
  slide.addText('Recommendation', {
    x: 0.5,
    y: 5.0,
    w: 9,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.text,
  });

  slide.addText(`Launch on ${data.platformGap.recommendation.platform.toUpperCase()}: ${data.platformGap.recommendation.rationale}`, {
    x: 0.5,
    y: 5.5,
    w: 9,
    h: 0.8,
    fontSize: 14,
    color: colors.primary,
  });
}

/**
 * Slide 5: Gap Opportunities (Ranked)
 */
function addGapOpportunitiesSlide(pptx: PptxGenJS, data: ReportData, colors: any) {
  const slide = pptx.addSlide({ masterName: undefined });

  slide.addText('Gap Opportunities', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  slide.addText('Ranked Market Gaps', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: colors.textLight,
  });

  // Display top gaps
  const topGaps = data.summary.topGaps.slice(0, 5);

  topGaps.forEach((gap, idx) => {
    const yPos = 1.8 + (idx * 0.9);

    // Gap number badge
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.5,
      y: yPos,
      w: 0.5,
      h: 0.5,
      fill: { color: colors.primary },
    });

    slide.addText((idx + 1).toString(), {
      x: 0.5,
      y: yPos,
      w: 0.5,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: colors.background,
      align: 'center',
      valign: 'middle',
    });

    // Gap title
    slide.addText(gap.title, {
      x: 1.2,
      y: yPos,
      w: 6,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: colors.text,
    });

    // Gap type and score
    slide.addText(`Type: ${gap.type} | Score: ${Math.round(gap.score)}`, {
      x: 1.2,
      y: yPos + 0.4,
      w: 6,
      h: 0.3,
      fontSize: 11,
      color: colors.textLight,
    });

    // Score indicator
    const scoreColor = gap.score >= 70 ? colors.success :
                       gap.score >= 50 ? colors.warning : colors.danger;

    slide.addText(Math.round(gap.score).toString(), {
      x: 8.0,
      y: yPos + 0.1,
      w: 1.5,
      h: 0.4,
      fontSize: 16,
      bold: true,
      color: scoreColor,
      align: 'right',
    });
  });
}

/**
 * Slide 6: Modeled Economics
 */
function addEconomicsSlide(pptx: PptxGenJS, data: ReportData, colors: any, opts: SlideGeneratorOptions) {
  const slide = pptx.addSlide({ masterName: undefined });

  slide.addText('Modeled Economics', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  slide.addText('CPC, CAC, and TAM Estimates', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: colors.textLight,
  });

  // CPC
  slide.addText('Cost Per Click (CPC)', {
    x: 0.5,
    y: 1.8,
    w: 3,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: colors.text,
  });

  slide.addText(`$${data.economics.cpc.expected.toFixed(2)}`, {
    x: 0.5,
    y: 2.3,
    w: 3,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: colors.primary,
  });

  slide.addText(`Range: $${data.economics.cpc.low.toFixed(2)} - $${data.economics.cpc.high.toFixed(2)}`, {
    x: 0.5,
    y: 2.9,
    w: 3,
    h: 0.3,
    fontSize: 10,
    color: colors.textLight,
  });

  // CAC
  slide.addText('Customer Acquisition Cost (CAC)', {
    x: 4.0,
    y: 1.8,
    w: 3,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: colors.text,
  });

  slide.addText(`$${data.economics.cac.expected.toFixed(0)}`, {
    x: 4.0,
    y: 2.3,
    w: 3,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: colors.primary,
  });

  slide.addText(`Range: $${data.economics.cac.low.toFixed(0)} - $${data.economics.cac.high.toFixed(0)}`, {
    x: 4.0,
    y: 2.9,
    w: 3,
    h: 0.3,
    fontSize: 10,
    color: colors.textLight,
  });

  // TAM
  slide.addText('Total Addressable Market (TAM)', {
    x: 7.5,
    y: 1.8,
    w: 2,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: colors.text,
  });

  const tamM = (data.economics.tam.expected / 1000000).toFixed(1);
  slide.addText(`$${tamM}M`, {
    x: 7.5,
    y: 2.3,
    w: 2,
    h: 0.6,
    fontSize: 28,
    bold: true,
    color: colors.success,
  });

  // Budget Scenarios
  slide.addText('Budget Scenarios', {
    x: 0.5,
    y: 3.8,
    w: 9,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.text,
  });

  const scenarioRows = [
    [
      { text: 'Spend', options: { bold: true, color: colors.text } },
      { text: 'Reach', options: { bold: true, color: colors.text } },
      { text: 'Conversions', options: { bold: true, color: colors.text } },
    ],
    [
      { text: '$1,000', options: { color: colors.text } },
      { text: data.economics.budgetScenarios.spend1k.reach.toString(), options: { color: colors.text } },
      { text: data.economics.budgetScenarios.spend1k.conversions.toString(), options: { color: colors.text } },
    ],
    [
      { text: '$10,000', options: { color: colors.text } },
      { text: data.economics.budgetScenarios.spend10k.reach.toString(), options: { color: colors.text } },
      { text: data.economics.budgetScenarios.spend10k.conversions.toString(), options: { color: colors.text } },
    ],
  ];

  slide.addTable(scenarioRows, {
    x: 0.5,
    y: 4.3,
    w: 9,
    h: 1.5,
    fontSize: 12,
    border: { pt: 1, color: colors.secondary },
    fill: { color: colors.background },
  });
}

/**
 * Slide 7: Buildability Assessment
 */
function addBuildabilitySlide(pptx: PptxGenJS, data: ReportData, colors: any) {
  const slide = pptx.addSlide({ masterName: undefined });

  slide.addText('Buildability Assessment', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  slide.addText('Implementation Feasibility', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: colors.textLight,
  });

  // Implementation Difficulty
  slide.addText('Implementation Difficulty', {
    x: 0.5,
    y: 1.8,
    w: 4,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: colors.text,
  });

  const difficultyColor = data.buildability.implementationDifficulty < 40 ? colors.success :
                          data.buildability.implementationDifficulty < 70 ? colors.warning : colors.danger;

  slide.addShape(pptx.ShapeType.rect, {
    x: 0.5,
    y: 2.3,
    w: (data.buildability.implementationDifficulty / 100) * 4,
    h: 0.4,
    fill: { color: difficultyColor },
  });

  slide.addText(`${Math.round(data.buildability.implementationDifficulty)}/100`, {
    x: 5.0,
    y: 2.3,
    w: 1.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: difficultyColor,
  });

  // Time to MVP
  slide.addText('Time to MVP', {
    x: 0.5,
    y: 3.2,
    w: 3,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: colors.text,
  });

  const mvpMap: Record<string, string> = { S: 'Small (weeks)', M: 'Medium (months)', L: 'Large (quarters)' };
  slide.addText(mvpMap[data.buildability.timeToMVP] || 'Medium', {
    x: 0.5,
    y: 3.7,
    w: 3,
    h: 0.4,
    fontSize: 12,
    color: colors.primary,
  });

  // Human Touch Level
  slide.addText('Human Touch Level', {
    x: 4.5,
    y: 3.2,
    w: 3,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: colors.text,
  });

  slide.addText(data.buildability.humanTouchLevel.toUpperCase(), {
    x: 4.5,
    y: 3.7,
    w: 3,
    h: 0.4,
    fontSize: 12,
    color: colors.primary,
  });

  // Autonomous Suitability
  slide.addText('Autonomous Suitability', {
    x: 0.5,
    y: 4.4,
    w: 3,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: colors.text,
  });

  slide.addText(data.buildability.autonomousSuitability.toUpperCase(), {
    x: 0.5,
    y: 4.9,
    w: 3,
    h: 0.4,
    fontSize: 12,
    color: colors.success,
  });

  // Risk Flags
  if (data.buildability.riskFlags.length > 0) {
    slide.addText('Risk Flags', {
      x: 4.5,
      y: 4.4,
      w: 5,
      h: 0.4,
      fontSize: 14,
      bold: true,
      color: colors.danger,
    });

    data.buildability.riskFlags.forEach((flag, idx) => {
      slide.addText(`• ${flag}`, {
        x: 4.5,
        y: 4.9 + (idx * 0.3),
        w: 5,
        h: 0.25,
        fontSize: 10,
        color: colors.textLight,
      });
    });
  }
}

/**
 * Slide 8: UGC Winners Pack
 */
function addUGCSlide(pptx: PptxGenJS, data: ReportData, colors: any) {
  const slide = pptx.addSlide({ masterName: undefined });

  slide.addText('UGC Winners Pack', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  slide.addText('Content Strategy & Creative Patterns', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: colors.textLight,
  });

  // Recommended Hooks
  slide.addText('Top Hooks', {
    x: 0.5,
    y: 1.8,
    w: 9,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.text,
  });

  data.ugc.recommendations.hooks.slice(0, 5).forEach((hook, idx) => {
    slide.addText(`${idx + 1}. ${hook}`, {
      x: 0.5,
      y: 2.3 + (idx * 0.35),
      w: 9,
      h: 0.3,
      fontSize: 11,
      color: colors.text,
    });
  });

  // Script Blueprints
  slide.addText('Script Blueprints', {
    x: 0.5,
    y: 4.3,
    w: 4.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.text,
  });

  data.ugc.recommendations.scripts.slice(0, 3).forEach((script, idx) => {
    slide.addText(`• ${script}`, {
      x: 0.5,
      y: 4.8 + (idx * 0.35),
      w: 4.5,
      h: 0.3,
      fontSize: 10,
      color: colors.textLight,
    });
  });

  // Shot List Preview
  slide.addText('Shot List Preview', {
    x: 5.5,
    y: 4.3,
    w: 4,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.text,
  });

  data.ugc.recommendations.shotList.slice(0, 3).forEach((shot, idx) => {
    slide.addText(`• ${shot}`, {
      x: 5.5,
      y: 4.8 + (idx * 0.35),
      w: 4,
      h: 0.3,
      fontSize: 10,
      color: colors.textLight,
    });
  });
}

/**
 * Slide 9: Action Plan
 */
function addActionPlanSlide(pptx: PptxGenJS, data: ReportData, colors: any) {
  const slide = pptx.addSlide({ masterName: undefined });

  slide.addText('Action Plan', {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.6,
    fontSize: 32,
    bold: true,
    color: colors.text,
  });

  slide.addText('Next Steps & Quick Wins', {
    x: 0.5,
    y: 0.9,
    w: 9,
    h: 0.3,
    fontSize: 16,
    color: colors.textLight,
  });

  // 7-Day Wins
  slide.addText('7-Day Quick Wins', {
    x: 0.5,
    y: 1.6,
    w: 4.5,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.success,
  });

  data.actionPlan.sevenDayWins.forEach((win, idx) => {
    slide.addText(`✓ ${win}`, {
      x: 0.5,
      y: 2.1 + (idx * 0.4),
      w: 4.5,
      h: 0.35,
      fontSize: 11,
      color: colors.text,
    });
  });

  // Ad Test Concepts
  slide.addText('Ad Test Concepts', {
    x: 5.5,
    y: 1.6,
    w: 4,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.primary,
  });

  data.actionPlan.adTestConcepts.slice(0, 3).forEach((concept, idx) => {
    slide.addText(`${idx + 1}. ${concept.concept}`, {
      x: 5.5,
      y: 2.1 + (idx * 0.5),
      w: 4,
      h: 0.25,
      fontSize: 11,
      bold: true,
      color: colors.text,
    });
    slide.addText(`   CTA: ${concept.cta}`, {
      x: 5.5,
      y: 2.35 + (idx * 0.5),
      w: 4,
      h: 0.2,
      fontSize: 9,
      color: colors.textLight,
    });
  });

  // Landing Page Structure
  slide.addText('Landing Page Structure', {
    x: 0.5,
    y: 4.3,
    w: 9,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: colors.text,
  });

  slide.addText(`Hero: ${data.actionPlan.landingPageStructure.hero}`, {
    x: 0.5,
    y: 4.8,
    w: 9,
    h: 0.3,
    fontSize: 11,
    color: colors.text,
  });

  slide.addText(`CTA: ${data.actionPlan.landingPageStructure.cta}`, {
    x: 0.5,
    y: 5.2,
    w: 9,
    h: 0.3,
    fontSize: 11,
    color: colors.primary,
  });

  // Top Keywords
  slide.addText(`Keywords: ${data.actionPlan.topKeywords.slice(0, 5).join(', ')}`, {
    x: 0.5,
    y: 5.7,
    w: 9,
    h: 0.3,
    fontSize: 10,
    color: colors.textLight,
  });
}
