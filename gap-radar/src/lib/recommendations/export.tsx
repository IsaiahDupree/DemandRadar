/**
 * Build Recommendation Export
 * Feature: BUILD-008
 *
 * Export recommendations as PDF or Markdown briefs.
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import type { BuildRecommendation } from './generator';

// Define styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    lineHeight: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#2563eb',
  },
  subsectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    color: '#1a1a1a',
  },
  text: {
    fontSize: 11,
    marginBottom: 8,
    color: '#333',
  },
  bulletPoint: {
    fontSize: 11,
    marginBottom: 4,
    marginLeft: 16,
    color: '#333',
  },
  confidenceBox: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 8,
  },
  confidenceScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    marginTop: 16,
    marginBottom: 16,
  },
  personaBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 4,
    marginBottom: 12,
  },
  riskBox: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 4,
    marginTop: 8,
  },
});

/**
 * Export a build recommendation as PDF
 */
export async function exportRecommendationAsPDF(
  recommendation: BuildRecommendation
): Promise<Buffer> {
  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View>
          <Text style={styles.title}>{recommendation.product_name}</Text>
          <Text style={styles.tagline}>{recommendation.tagline}</Text>
        </View>

        {/* Product Overview */}
        <View>
          <Text style={styles.sectionTitle}>Product Overview</Text>
          <Text style={styles.text}>{recommendation.product_idea}</Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Type:</Text> {recommendation.product_type}
          </Text>
        </View>

        {/* Target Audience */}
        <View>
          <Text style={styles.sectionTitle}>Target Audience</Text>
          <Text style={styles.text}>{recommendation.target_audience}</Text>
        </View>

        {/* Target Persona */}
        <View style={styles.personaBox}>
          <Text style={styles.subsectionTitle}>Target Persona</Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Name:</Text> {recommendation.target_persona.name}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Role:</Text> {recommendation.target_persona.role}
          </Text>

          {recommendation.target_persona.pain_points.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Pain Points:</Text>
              {recommendation.target_persona.pain_points.map((pain, idx) => (
                <Text key={idx} style={styles.bulletPoint}>• {pain}</Text>
              ))}
            </>
          )}

          {recommendation.target_persona.goals.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Goals:</Text>
              {recommendation.target_persona.goals.map((goal, idx) => (
                <Text key={idx} style={styles.bulletPoint}>• {goal}</Text>
              ))}
            </>
          )}
        </View>

        {/* Pain Points Addressed */}
        {recommendation.pain_points.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Pain Points This Solves</Text>
            {recommendation.pain_points.map((pain, idx) => (
              <Text key={idx} style={styles.bulletPoint}>• {pain}</Text>
            ))}
          </View>
        )}

        {/* Market Insights */}
        <View>
          <Text style={styles.sectionTitle}>Market Insights</Text>

          {recommendation.competitor_ads.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Competitor Ads:</Text>
              {recommendation.competitor_ads.map((ad, idx) => (
                <Text key={idx} style={styles.bulletPoint}>
                  • {ad.advertiser}: "{ad.hook}"
                </Text>
              ))}
            </>
          )}

          {recommendation.search_queries.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Relevant Search Queries:</Text>
              {recommendation.search_queries.map((query, idx) => (
                <Text key={idx} style={styles.bulletPoint}>• {query}</Text>
              ))}
            </>
          )}

          {recommendation.content_gaps.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Content Gaps:</Text>
              {recommendation.content_gaps.map((gap, idx) => (
                <Text key={idx} style={styles.bulletPoint}>• {gap}</Text>
              ))}
            </>
          )}
        </View>

        {/* Marketing Strategy */}
        <View>
          <Text style={styles.sectionTitle}>Marketing Strategy</Text>

          {recommendation.recommended_hooks.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Recommended Hooks:</Text>
              {recommendation.recommended_hooks.map((hook, idx) => (
                <Text key={idx} style={styles.bulletPoint}>• "{hook}"</Text>
              ))}
            </>
          )}

          {recommendation.recommended_channels.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Recommended Channels:</Text>
              {recommendation.recommended_channels.map((channel, idx) => (
                <Text key={idx} style={styles.bulletPoint}>• {channel}</Text>
              ))}
            </>
          )}
        </View>

        {/* Pricing & Economics */}
        <View>
          <Text style={styles.sectionTitle}>Pricing & Economics</Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Pricing Suggestion:</Text> {recommendation.pricing_suggestion}
          </Text>
          <Text style={styles.text}>
            <Text style={{ fontWeight: 'bold' }}>Estimated CAC Range:</Text> {recommendation.estimated_cac_range}
          </Text>
        </View>

        {/* Confidence Assessment */}
        <View style={styles.confidenceBox}>
          <Text style={styles.subsectionTitle}>Confidence Assessment</Text>
          <Text style={styles.confidenceScore}>
            Confidence Score: {recommendation.confidence_score}/100
          </Text>
          <Text style={styles.text}>{recommendation.reasoning}</Text>
        </View>

        {/* Risks */}
        {recommendation.risks.length > 0 && (
          <View style={styles.riskBox}>
            <Text style={styles.subsectionTitle}>Risks & Considerations</Text>
            {recommendation.risks.map((risk, idx) => (
              <Text key={idx} style={styles.bulletPoint}>• {risk}</Text>
            ))}
          </View>
        )}

        {/* Footer */}
        <View style={styles.divider} />
        <Text style={{ fontSize: 9, color: '#999', textAlign: 'center' }}>
          Generated by GapRadar - Market Gap Analysis Platform
        </Text>
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Export a build recommendation as Markdown
 */
export function exportRecommendationAsMarkdown(
  recommendation: BuildRecommendation
): string {
  const sections: string[] = [];

  // Header
  sections.push(`# ${recommendation.product_name}`);
  sections.push('');
  sections.push(`*${recommendation.tagline}*`);
  sections.push('');
  sections.push('---');
  sections.push('');

  // Product Overview
  sections.push('## Product Overview');
  sections.push('');
  sections.push(recommendation.product_idea);
  sections.push('');
  sections.push(`**Type:** ${recommendation.product_type}`);
  sections.push('');

  // Target Audience
  sections.push('## Target Audience');
  sections.push('');
  sections.push(recommendation.target_audience);
  sections.push('');

  // Target Persona
  sections.push('## Target Persona');
  sections.push('');
  sections.push(`**Name:** ${recommendation.target_persona.name}`);
  sections.push(`**Role:** ${recommendation.target_persona.role}`);
  sections.push('');

  if (recommendation.target_persona.pain_points.length > 0) {
    sections.push('**Pain Points:**');
    recommendation.target_persona.pain_points.forEach(pain => {
      sections.push(`- ${pain}`);
    });
    sections.push('');
  }

  if (recommendation.target_persona.goals.length > 0) {
    sections.push('**Goals:**');
    recommendation.target_persona.goals.forEach(goal => {
      sections.push(`- ${goal}`);
    });
    sections.push('');
  }

  // Pain Points This Solves
  if (recommendation.pain_points.length > 0) {
    sections.push('## Pain Points');
    sections.push('');
    sections.push('This product addresses the following pain points:');
    sections.push('');
    recommendation.pain_points.forEach(pain => {
      sections.push(`- ${pain}`);
    });
    sections.push('');
  }

  // Market Insights
  sections.push('## Market Insights');
  sections.push('');

  if (recommendation.competitor_ads.length > 0) {
    sections.push('### Competitor Ads');
    sections.push('');
    recommendation.competitor_ads.forEach(ad => {
      sections.push(`- **${ad.advertiser}**: "${ad.hook}"`);
    });
    sections.push('');
  }

  if (recommendation.search_queries.length > 0) {
    sections.push('### Relevant Search Queries');
    sections.push('');
    recommendation.search_queries.forEach(query => {
      sections.push(`- ${query}`);
    });
    sections.push('');
  }

  if (recommendation.content_gaps.length > 0) {
    sections.push('### Content Gaps');
    sections.push('');
    recommendation.content_gaps.forEach(gap => {
      sections.push(`- ${gap}`);
    });
    sections.push('');
  }

  // Marketing Strategy
  sections.push('## Marketing Strategy');
  sections.push('');

  if (recommendation.recommended_hooks.length > 0) {
    sections.push('### Recommended Hooks');
    sections.push('');
    recommendation.recommended_hooks.forEach(hook => {
      sections.push(`- "${hook}"`);
    });
    sections.push('');
  }

  if (recommendation.recommended_channels.length > 0) {
    sections.push('### Recommended Channels');
    sections.push('');
    recommendation.recommended_channels.forEach(channel => {
      sections.push(`- ${channel}`);
    });
    sections.push('');
  }

  // Pricing & Economics
  sections.push('## Pricing & Economics');
  sections.push('');
  sections.push(`**Pricing Suggestion:** ${recommendation.pricing_suggestion}`);
  sections.push('');
  sections.push(`**Estimated CAC Range:** ${recommendation.estimated_cac_range}`);
  sections.push('');

  // Confidence Assessment
  sections.push('## Confidence Assessment');
  sections.push('');
  sections.push(`**Confidence Score:** ${recommendation.confidence_score}/100`);
  sections.push('');
  sections.push(recommendation.reasoning);
  sections.push('');

  // Risks
  if (recommendation.risks.length > 0) {
    sections.push('## Risks & Considerations');
    sections.push('');
    recommendation.risks.forEach(risk => {
      sections.push(`- ${risk}`);
    });
    sections.push('');
  }

  // Footer
  sections.push('---');
  sections.push('');
  sections.push('*Generated by GapRadar - Market Gap Analysis Platform*');

  return sections.join('\n');
}
