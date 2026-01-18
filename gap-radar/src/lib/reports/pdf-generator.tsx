/**
 * PDF Report Generator
 *
 * Generates PDF versions of market analysis reports using @react-pdf/renderer
 *
 * @see PRD §8 - Report Structure (9-page report)
 */

import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
  Font,
} from '@react-pdf/renderer';
import type { ReportData } from './generator';

// Register fonts (using default Helvetica for now)
// In production, you might want to register custom fonts

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#2563eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#1e293b',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 3,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1e40af',
  },
  subsectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#334155',
  },
  text: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
    color: '#334155',
  },
  card: {
    backgroundColor: '#f8fafc',
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  score: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    fontSize: 9,
    fontWeight: 'bold',
    marginRight: 5,
  },
  list: {
    marginLeft: 10,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 4,
    lineHeight: 1.4,
    color: '#475569',
  },
  table: {
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
  },
  tableHeader: {
    backgroundColor: '#f1f5f9',
    fontWeight: 'bold',
    fontSize: 9,
    color: '#1e293b',
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    color: '#475569',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
    color: '#94a3b8',
  },
  disclaimer: {
    fontSize: 8,
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
});

/**
 * Page 1: Executive Summary
 */
const ExecutiveSummaryPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>{data.summary.nicheName}</Text>
      <Text style={styles.subtitle}>Market Gap Analysis Report</Text>
      <Text style={styles.subtitle}>
        Generated on {new Date().toLocaleDateString()}
      </Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Executive Summary</Text>

      <View style={styles.card}>
        <Text style={styles.subsectionTitle}>Opportunity Score</Text>
        <Text style={styles.score}>
          {Math.round(data.summary.opportunityScore)}
        </Text>
        <Text style={styles.text}>
          Confidence: {Math.round(data.summary.confidence * 100)}%
        </Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.subsectionTitle}>Top 3 Market Gaps</Text>
      {data.summary.topGaps.map((gap, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.text}>
            {index + 1}. {gap.title}
          </Text>
          <Text style={styles.text}>
            Type: {gap.type} | Score: {Math.round(gap.score)}
          </Text>
        </View>
      ))}
    </View>

    <View style={styles.section}>
      <Text style={styles.subsectionTitle}>Platform Recommendation</Text>
      <View style={styles.card}>
        <Text style={styles.text}>
          <Text style={{ fontWeight: 'bold' }}>Platform:</Text>{' '}
          {data.summary.platformRecommendation.platform.toUpperCase()}
        </Text>
        <Text style={styles.text}>
          {data.summary.platformRecommendation.reasoning}
        </Text>
      </View>
    </View>

    <View style={styles.footer}>
      <Text>GapRadar Market Analysis Report</Text>
      <Text style={styles.pageNumber}>Page 1 of 9</Text>
    </View>
  </Page>
);

/**
 * Page 2: Paid Market Snapshot
 */
const PaidMarketPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Paid Market Snapshot</Text>
      <Text style={styles.subtitle}>What's Running in Ads</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Advertisers</Text>
      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableCell, { flex: 2 }]}>Advertiser</Text>
          <Text style={styles.tableCell}>Ads</Text>
          <Text style={styles.tableCell}>Avg Days Running</Text>
        </View>
        {data.paidMarket.topAdvertisers.slice(0, 10).map((advertiser, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { flex: 2 }]}>{advertiser.name}</Text>
            <Text style={styles.tableCell}>{advertiser.adCount}</Text>
            <Text style={styles.tableCell}>{advertiser.avgLongevity}</Text>
          </View>
        ))}
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Repeated Angles</Text>
      {data.paidMarket.topAngles.slice(0, 5).map((angle, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.subsectionTitle}>
            {index + 1}. {angle.angle}
          </Text>
          <Text style={styles.text}>Frequency: {angle.frequency}</Text>
        </View>
      ))}
    </View>

    <View style={styles.footer}>
      <Text style={styles.pageNumber}>Page 2 of 9</Text>
    </View>
  </Page>
);

/**
 * Page 3: Reddit Insights
 */
const RedditInsightsPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>What Customers Actually Say</Text>
      <Text style={styles.subtitle}>Reddit Sentiment Analysis</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Objections</Text>
      {data.reddit.topObjections.slice(0, 5).map((objection, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.subsectionTitle}>
            {index + 1}. {objection.objection}
          </Text>
          <Text style={styles.text}>
            Frequency: {objection.frequency} | Intensity:{' '}
            {Math.round(objection.intensity * 100)}%
          </Text>
        </View>
      ))}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Top Desired Features</Text>
      {data.reddit.topDesiredFeatures.slice(0, 5).map((feature, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.subsectionTitle}>
            {index + 1}. {feature.feature}
          </Text>
          <Text style={styles.text}>Mentions: {feature.frequency}</Text>
        </View>
      ))}
    </View>

    <View style={styles.footer}>
      <Text style={styles.pageNumber}>Page 3 of 9</Text>
    </View>
  </Page>
);

/**
 * Page 4: Platform Existence Gap
 */
const PlatformGapPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Platform Existence Gap</Text>
      <Text style={styles.subtitle}>iOS vs Android vs Web Saturation</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Saturation Scores</Text>
      <View style={styles.card}>
        <Text style={styles.text}>
          iOS: {Math.round(data.platformGap.ios.saturationScore)}%
        </Text>
        <Text style={styles.text}>
          Android: {Math.round(data.platformGap.android.saturationScore)}%
        </Text>
        <Text style={styles.text}>
          Web: {Math.round(data.platformGap.web.saturationScore)}%
        </Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recommendation</Text>
      <View style={styles.card}>
        <Text style={styles.subsectionTitle}>
          Launch on: {data.platformGap.recommendation.platform.toUpperCase()}
        </Text>
        <Text style={styles.text}>{data.platformGap.recommendation.rationale}</Text>
      </View>
    </View>

    <View style={styles.footer}>
      <Text style={styles.pageNumber}>Page 4 of 9</Text>
    </View>
  </Page>
);

/**
 * Page 5: Gap Opportunities
 */
const GapOpportunitiesPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Gap Opportunities</Text>
      <Text style={styles.subtitle}>Ranked Market Gaps</Text>
    </View>

    <View style={styles.section}>
      {data.gaps.slice(0, 5).map((gap, index) => (
        <View key={gap.id} style={styles.card}>
          <Text style={styles.subsectionTitle}>
            {index + 1}. {gap.title}
          </Text>
          <Text style={styles.text}>Type: {gap.gap_type}</Text>
          <Text style={styles.text}>Score: {Math.round(gap.opportunity_score || 0)}</Text>
          <Text style={styles.text}>Problem: {gap.problem}</Text>
          <Text style={styles.text}>
            Recommendation: {gap.recommendation || 'See full report'}
          </Text>
        </View>
      ))}
      {data.gaps.length === 0 && (
        <Text style={styles.text}>No gaps identified yet. Complete analysis to generate gaps.</Text>
      )}
    </View>

    <View style={styles.footer}>
      <Text style={styles.pageNumber}>Page 5 of 9</Text>
    </View>
  </Page>
);

/**
 * Page 6: Modeled Economics
 */
const ModeledEconomicsPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Modeled Economics</Text>
      <Text style={styles.subtitle}>CPC, CAC, TAM Estimates</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Cost Estimates</Text>
      <View style={styles.card}>
        <Text style={styles.subsectionTitle}>CPC (Cost Per Click)</Text>
        <Text style={styles.text}>
          Low: ${data.economics.cpc.low} | Expected: ${data.economics.cpc.expected} |
          High: ${data.economics.cpc.high}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.subsectionTitle}>CAC (Customer Acquisition Cost)</Text>
        <Text style={styles.text}>
          Low: ${data.economics.cac.low} | Expected: ${data.economics.cac.expected} |
          High: ${data.economics.cac.high}
        </Text>
      </View>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Budget Scenarios</Text>
      <View style={styles.card}>
        <Text style={styles.subsectionTitle}>$1,000 Spend</Text>
        <Text style={styles.text}>
          Est. Reach: {data.economics.budgetScenarios.spend1k.reach} |
          Conversions: {data.economics.budgetScenarios.spend1k.conversions}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.subsectionTitle}>$10,000 Spend</Text>
        <Text style={styles.text}>
          Est. Reach: {data.economics.budgetScenarios.spend10k.reach} |
          Conversions: {data.economics.budgetScenarios.spend10k.conversions}
        </Text>
      </View>
    </View>

    <View style={styles.disclaimer}>
      <Text>
        Note: These are modeled estimates based on market analysis, not actual performance data.
        Actual results may vary significantly.
      </Text>
    </View>

    <View style={styles.footer}>
      <Text style={styles.pageNumber}>Page 6 of 9</Text>
    </View>
  </Page>
);

/**
 * Page 7: Buildability Assessment
 */
const BuildabilityPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Buildability Assessment</Text>
      <Text style={styles.subtitle}>Implementation Feasibility</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Difficulty Metrics</Text>
      <View style={styles.card}>
        <Text style={styles.text}>
          Implementation Difficulty: {data.buildability.implementationDifficulty}/100
        </Text>
        <Text style={styles.text}>Time to MVP: {data.buildability.timeToMVP}</Text>
        <Text style={styles.text}>
          Human Touch Required: {data.buildability.humanTouchLevel}
        </Text>
        <Text style={styles.text}>
          Autonomous Coding Suitability: {data.buildability.autonomousSuitability}
        </Text>
      </View>
    </View>

    {data.buildability.riskFlags.length > 0 && (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Risk Flags</Text>
        {data.buildability.riskFlags.map((flag, index) => (
          <Text key={index} style={styles.listItem}>
            • {flag}
          </Text>
        ))}
      </View>
    )}

    <View style={styles.footer}>
      <Text style={styles.pageNumber}>Page 7 of 9</Text>
    </View>
  </Page>
);

/**
 * Page 8: UGC Winners Pack
 */
const UGCWinnersPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>UGC Winners Pack</Text>
      <Text style={styles.subtitle}>Creative Insights</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recommended Hooks</Text>
      {data.ugc.recommendations.hooks.slice(0, 5).map((hook, index) => (
        <Text key={index} style={styles.listItem}>
          • {hook}
        </Text>
      ))}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Script Blueprints</Text>
      {data.ugc.recommendations.scripts.map((script, index) => (
        <Text key={index} style={styles.listItem}>
          • {script}
        </Text>
      ))}
    </View>

    <View style={styles.footer}>
      <Text style={styles.pageNumber}>Page 8 of 9</Text>
    </View>
  </Page>
);

/**
 * Page 9: Action Plan
 */
const ActionPlanPage = ({ data }: { data: ReportData }) => (
  <Page size="A4" style={styles.page}>
    <View style={styles.header}>
      <Text style={styles.title}>Action Plan</Text>
      <Text style={styles.subtitle}>Next Steps</Text>
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>7-Day Quick Wins</Text>
      {data.actionPlan.sevenDayWins.map((win, index) => (
        <Text key={index} style={styles.listItem}>
          • {win}
        </Text>
      ))}
    </View>

    <View style={styles.section}>
      <Text style={styles.sectionTitle}>30-Day Roadmap</Text>
      {data.actionPlan.thirtyDayRoadmap.map((week, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.subsectionTitle}>Week {week.week}</Text>
          {week.tasks.map((task, taskIndex) => (
            <Text key={taskIndex} style={styles.listItem}>
              • {task}
            </Text>
          ))}
        </View>
      ))}
    </View>

    <View style={styles.footer}>
      <Text>End of Report</Text>
      <Text style={styles.pageNumber}>Page 9 of 9</Text>
    </View>
  </Page>
);

/**
 * Complete PDF Document
 */
const ReportDocument = ({ data }: { data: ReportData }) => (
  <Document>
    <ExecutiveSummaryPage data={data} />
    <PaidMarketPage data={data} />
    <RedditInsightsPage data={data} />
    <PlatformGapPage data={data} />
    <GapOpportunitiesPage data={data} />
    <ModeledEconomicsPage data={data} />
    <BuildabilityPage data={data} />
    <UGCWinnersPage data={data} />
    <ActionPlanPage data={data} />
  </Document>
);

/**
 * Generate PDF buffer from report data
 */
export async function generatePDF(reportData: ReportData): Promise<Buffer> {
  const doc = <ReportDocument data={reportData} />;
  const asPdf = pdf(doc);
  const blob = await asPdf.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
