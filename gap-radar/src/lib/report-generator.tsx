/**
 * PDF Report Generator
 *
 * Uses @react-pdf/renderer to generate professional PDF reports
 * from DemandRadar analysis data
 */

import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 30,
    borderBottom: '2 solid #2563eb',
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 20,
    marginBottom: 12,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 6,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 15,
    marginBottom: 8,
  },
  text: {
    fontSize: 11,
    color: '#374151',
    marginBottom: 6,
  },
  boldText: {
    fontWeight: 'bold',
  },
  scoreCard: {
    backgroundColor: '#f9fafb',
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  gapCard: {
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 4,
    border: '1 solid #d1d5db',
  },
  gapTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
  },
  gapProblem: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  gapRec: {
    fontSize: 10,
    color: '#374151',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 3,
    marginTop: 6,
  },
  table: {
    display: 'flex',
    width: '100%',
    marginTop: 10,
    marginBottom: 15,
  },
  tableRow: {
    display: 'flex',
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    fontWeight: 'bold',
    fontSize: 10,
    color: '#374151',
  },
  tableCell: {
    flex: 1,
    fontSize: 10,
    color: '#6b7280',
    paddingHorizontal: 6,
  },
  badge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  flexRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f9fafb',
    padding: 10,
    marginRight: 8,
    borderRadius: 4,
    border: '1 solid #e5e7eb',
  },
  statLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
});

interface ReportData {
  run: {
    id: string;
    niche_query: string;
    status: string;
    created_at: string;
    finished_at: string | null;
  };
  scores: {
    saturation: number;
    longevity: number;
    dissatisfaction: number;
    misalignment: number;
    opportunity: number;
    confidence: number;
  };
  summary: {
    totalAds: number;
    totalMentions: number;
    totalGaps: number;
    totalConcepts: number;
    uniqueAdvertisers: number;
    topObjections: number;
  };
  marketSnapshot: {
    topAdvertisers: { name: string; adCount: number }[];
    topAngles: { label: string; frequency: number }[];
    longestRunningAds: { advertiser: string; headline: string; daysRunning: number }[];
  };
  painMap: {
    topObjections: { label: string; frequency: number; intensity: number }[];
    topFeatures: { label: string; frequency: number }[];
    pricingFriction: string[];
    trustIssues: string[];
  };
  gaps: {
    id: string;
    type: string;
    title: string;
    problem: string;
    recommendation: string;
    score: number;
    confidence: number;
  }[];
  concepts: {
    id: string;
    name: string;
    oneLiner: string;
    platform: string;
    industry: string;
    businessModel: string;
    difficulty: number;
    opportunityScore: number;
  }[];
  ugc: {
    hooks: { text: string; type: string }[];
    scripts: { duration: string; outline: string[] }[];
    shotList: { shot: string; description: string }[];
    angleMap: { angle: string; priority: number; examples: string[] }[];
  } | null;
  economics: {
    conceptId: string;
    name: string;
    cpc: { low: number; expected: number; high: number };
    cac: { low: number; expected: number; high: number };
    tam: { low: number; expected: number; high: number };
  }[];
  buildability: {
    conceptId: string;
    name: string;
    implementationDifficulty: number;
    buildDifficulty: number;
    distributionDifficulty: number;
    humanTouchLevel: string;
    autonomousSuitability: string;
  }[];
}

// PDF Document Component
function ReportPDF({ data }: { data: ReportData }) {
  const formattedDate = new Date(data.run.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>DemandRadar Market Analysis</Text>
          <Text style={styles.subtitle}>Niche: {data.run.niche_query}</Text>
          <Text style={styles.subtitle}>Generated: {formattedDate}</Text>
          <Text style={styles.subtitle}>Run ID: {data.run.id.slice(0, 8)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>

        {/* Scores Grid */}
        <View style={{ marginBottom: 20 }}>
          <View style={styles.flexRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Opportunity Score</Text>
              <Text style={styles.statValue}>{data.scores.opportunity}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Market Saturation</Text>
              <Text style={styles.statValue}>{data.scores.saturation}</Text>
            </View>
            <View style={[styles.statBox, { marginRight: 0 }]}>
              <Text style={styles.statLabel}>Confidence</Text>
              <Text style={styles.statValue}>{Math.round(data.scores.confidence * 100)}%</Text>
            </View>
          </View>
          <View style={styles.flexRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Ad Longevity</Text>
              <Text style={styles.statValue}>{data.scores.longevity}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Dissatisfaction</Text>
              <Text style={styles.statValue}>{data.scores.dissatisfaction}</Text>
            </View>
            <View style={[styles.statBox, { marginRight: 0 }]}>
              <Text style={styles.statLabel}>Misalignment</Text>
              <Text style={styles.statValue}>{data.scores.misalignment}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Data Collection Summary</Text>
        <View style={styles.flexRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Ads Analyzed</Text>
            <Text style={styles.statValue}>{data.summary.totalAds}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Reddit Mentions</Text>
            <Text style={styles.statValue}>{data.summary.totalMentions}</Text>
          </View>
          <View style={[styles.statBox, { marginRight: 0 }]}>
            <Text style={styles.statLabel}>Gap Opportunities</Text>
            <Text style={styles.statValue}>{data.summary.totalGaps}</Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>Top 3 Gap Opportunities</Text>
        {data.gaps.slice(0, 3).map((gap, index) => (
          <View key={gap.id} style={styles.gapCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#2563eb', marginRight: 8 }}>
                #{index + 1}
              </Text>
              <Text style={styles.gapTitle}>{gap.title}</Text>
            </View>
            <Text style={styles.gapProblem}>{gap.problem}</Text>
            <Text style={styles.gapRec}>💡 {gap.recommendation}</Text>
            <View style={{ flexDirection: 'row', marginTop: 6, gap: 10 }}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                Score: <Text style={{ fontWeight: 'bold' }}>{gap.score}</Text>
              </Text>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                Confidence: <Text style={{ fontWeight: 'bold' }}>{Math.round(gap.confidence * 100)}%</Text>
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          DemandRadar • Market Gap Analysis Tool • Generated {formattedDate}
        </Text>
      </Page>

      {/* Page 2: Market Snapshot */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Market Snapshot</Text>

        <Text style={styles.subsectionTitle}>Top Advertisers</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, { flex: 0.5 }]}>Rank</Text>
            <Text style={[styles.tableCell, { flex: 2 }]}>Advertiser</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Ad Count</Text>
            <Text style={[styles.tableCell, { flex: 1 }]}>Market Share</Text>
          </View>
          {data.marketSnapshot.topAdvertisers.slice(0, 10).map((advertiser, index) => {
            const marketShare = ((advertiser.adCount / data.summary.totalAds) * 100).toFixed(1);
            return (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 0.5, fontWeight: 'bold' }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{advertiser.name}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{advertiser.adCount}</Text>
                <Text style={[styles.tableCell, { flex: 1 }]}>{marketShare}%</Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.subsectionTitle}>Common Marketing Angles</Text>
        {data.marketSnapshot.topAngles.slice(0, 5).map((angle, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{angle.label}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>{angle.frequency} ads</Text>
            </View>
            <View style={{ height: 8, backgroundColor: '#e5e7eb', borderRadius: 2 }}>
              <View style={{
                height: 8,
                backgroundColor: '#2563eb',
                borderRadius: 2,
                width: `${(angle.frequency / data.marketSnapshot.topAngles[0].frequency) * 100}%`
              }} />
            </View>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Longest Running Ads</Text>
        {data.marketSnapshot.longestRunningAds.slice(0, 5).map((ad, index) => (
          <View key={index} style={{ marginBottom: 10, padding: 8, backgroundColor: '#f9fafb', borderRadius: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginBottom: 3 }}>{ad.advertiser}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginBottom: 4 }}>
              {ad.headline || 'No headline available'}
            </Text>
            <Text style={{ fontSize: 9, color: '#2563eb', fontWeight: 'bold' }}>
              Running for {ad.daysRunning} days
            </Text>
          </View>
        ))}

        <Text style={styles.footer}>
          DemandRadar • Market Gap Analysis Tool • Page 2
        </Text>
      </Page>

      {/* Page 3: Pain Map */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>User Pain Map</Text>

        <Text style={styles.subsectionTitle}>Top User Objections</Text>
        {data.painMap.topObjections.slice(0, 5).map((objection, index) => (
          <View key={index} style={{ marginBottom: 10, padding: 10, backgroundColor: '#fef2f2', borderRadius: 4, border: '1 solid #fecaca' }}>
            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#991b1b', marginBottom: 4 }}>
              {objection.label}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                Frequency: <Text style={{ fontWeight: 'bold' }}>{objection.frequency}</Text>
              </Text>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                Intensity: <Text style={{ fontWeight: 'bold' }}>{objection.intensity}</Text>
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.subsectionTitle}>Top Feature Requests</Text>
        {data.painMap.topFeatures.slice(0, 5).map((feature, index) => (
          <View key={index} style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{feature.label}</Text>
              <Text style={{ fontSize: 10, color: '#6b7280' }}>{feature.frequency} requests</Text>
            </View>
          </View>
        ))}

        {data.painMap.pricingFriction.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Pricing Friction Points</Text>
            {data.painMap.pricingFriction.slice(0, 5).map((issue, index) => (
              <Text key={index} style={{ fontSize: 10, color: '#6b7280', marginBottom: 4, marginLeft: 10 }}>
                • {issue}
              </Text>
            ))}
          </>
        )}

        {data.painMap.trustIssues.length > 0 && (
          <>
            <Text style={styles.subsectionTitle}>Trust & Credibility Concerns</Text>
            {data.painMap.trustIssues.slice(0, 5).map((issue, index) => (
              <Text key={index} style={{ fontSize: 10, color: '#6b7280', marginBottom: 4, marginLeft: 10 }}>
                • {issue}
              </Text>
            ))}
          </>
        )}

        <Text style={styles.footer}>
          DemandRadar • Market Gap Analysis Tool • Page 3
        </Text>
      </Page>

      {/* Page 4: All Gap Opportunities */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Detailed Gap Opportunities</Text>

        {data.gaps.map((gap, index) => (
          <View key={gap.id} style={styles.gapCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#2563eb', marginRight: 8 }}>
                #{index + 1}
              </Text>
              <Text style={styles.gapTitle}>{gap.title}</Text>
            </View>
            <View style={styles.badge}>
              <Text>{gap.type.toUpperCase()}</Text>
            </View>
            <Text style={styles.gapProblem}>{gap.problem}</Text>
            <Text style={styles.gapRec}>💡 {gap.recommendation}</Text>
            <View style={{ flexDirection: 'row', marginTop: 6, gap: 10 }}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                Opportunity Score: <Text style={{ fontWeight: 'bold' }}>{gap.score}</Text>
              </Text>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>
                Confidence: <Text style={{ fontWeight: 'bold' }}>{Math.round(gap.confidence * 100)}%</Text>
              </Text>
            </View>
          </View>
        ))}

        <Text style={styles.footer}>
          DemandRadar • Market Gap Analysis Tool • Page 4
        </Text>
      </Page>

      {/* Page 5: Product Concepts & Economics */}
      {data.concepts.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>Product Concepts</Text>

          {data.concepts.map((concept, index) => {
            const economics = data.economics.find(e => e.conceptId === concept.id);
            const buildability = data.buildability.find(b => b.conceptId === concept.id);

            return (
              <View key={concept.id} style={{ marginBottom: 15, padding: 12, backgroundColor: '#f9fafb', borderRadius: 4, border: '1 solid #e5e7eb' }}>
                <Text style={{ fontSize: 13, fontWeight: 'bold', color: '#1f2937', marginBottom: 4 }}>
                  {index + 1}. {concept.name}
                </Text>
                <Text style={{ fontSize: 10, color: '#6b7280', marginBottom: 8 }}>{concept.oneLiner}</Text>

                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                  <View style={styles.badge}>
                    <Text>{concept.platform}</Text>
                  </View>
                  <View style={styles.badge}>
                    <Text>{concept.businessModel}</Text>
                  </View>
                </View>

                {economics && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>Economics:</Text>
                    <Text style={{ fontSize: 8, color: '#6b7280' }}>
                      CPC: ${economics.cpc.low}-${economics.cpc.expected} •
                      CAC: ${economics.cac.low}-${economics.cac.expected} •
                      TAM: ${economics.tam.low}M-${economics.tam.expected}M
                    </Text>
                  </View>
                )}

                {buildability && (
                  <View style={{ marginTop: 4 }}>
                    <Text style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>Buildability:</Text>
                    <Text style={{ fontSize: 8, color: '#6b7280' }}>
                      Implementation Difficulty: {buildability.implementationDifficulty}/10 •
                      Human Touch: {buildability.humanTouchLevel}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          <Text style={styles.footer}>
            DemandRadar • Market Gap Analysis Tool • Page 5
          </Text>
        </Page>
      )}

      {/* Page 6: UGC Pack */}
      {data.ugc && data.ugc.hooks.length > 0 && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.sectionTitle}>UGC Winners Pack</Text>

          <Text style={styles.subsectionTitle}>Top 10 Hooks</Text>
          {data.ugc.hooks.slice(0, 10).map((hook, index) => (
            <View key={index} style={{ marginBottom: 8, padding: 8, backgroundColor: '#eff6ff', borderRadius: 4 }}>
              <Text style={{ fontSize: 10, color: '#1e40af' }}>{hook.text}</Text>
              <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 2 }}>Type: {hook.type}</Text>
            </View>
          ))}

          {data.ugc.scripts.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Script Outlines</Text>
              {data.ugc.scripts.slice(0, 3).map((script, index) => (
                <View key={index} style={{ marginBottom: 10, padding: 8, backgroundColor: '#f9fafb', borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                    Script {index + 1} ({script.duration})
                  </Text>
                  {script.outline.slice(0, 3).map((step, stepIndex) => (
                    <Text key={stepIndex} style={{ fontSize: 9, color: '#6b7280', marginBottom: 2, marginLeft: 8 }}>
                      • {step}
                    </Text>
                  ))}
                </View>
              ))}
            </>
          )}

          <Text style={styles.footer}>
            DemandRadar • Market Gap Analysis Tool • Page 6
          </Text>
        </Page>
      )}
    </Document>
  );
}

/**
 * Generate PDF report from report data
 */
export async function generateReportPDF(reportData: ReportData): Promise<Blob> {
  const blob = await pdf(ReportPDF({ data: reportData })).toBlob();
  return blob;
}

/**
 * Generate standardized filename for PDF report
 */
export function getReportFilename(nicheQuery: string): string {
  const sanitizedNiche = nicheQuery
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const date = new Date().toISOString().split('T')[0];

  return `demandradar-${sanitizedNiche}-${date}.pdf`;
}
