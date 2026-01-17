/**
 * Demand Brief Email Template
 *
 * React Email template for weekly Demand Brief
 */

import * as React from "react";
import type { DemandSnapshot } from "../send-brief";

interface DemandBriefEmailProps {
  snapshot: DemandSnapshot;
  recipientName?: string;
}

export const DemandBriefEmail: React.FC<DemandBriefEmailProps> = ({
  snapshot,
  recipientName,
}) => {
  const trendEmoji =
    snapshot.trend === "up" ? "▲" : snapshot.trend === "down" ? "▼" : "→";
  const trendColor =
    snapshot.trend === "up" ? "#10b981" : snapshot.trend === "down" ? "#ef4444" : "#6b7280";
  const scoreChange =
    snapshot.demand_score_change > 0
      ? `+${snapshot.demand_score_change}`
      : snapshot.demand_score_change;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={styles.body}>
        <div style={styles.container}>
          {/* Header */}
          <div style={styles.header}>
            <h1 style={styles.logo}>📊 DemandRadar</h1>
            <p style={styles.subtitle}>Your Weekly Demand Brief</p>
          </div>

          {/* Greeting */}
          <div style={styles.section}>
            <p style={styles.greeting}>
              {recipientName ? `Hi ${recipientName},` : "Hi there,"}
            </p>
            <p style={styles.text}>
              Here's what changed in the <strong>{snapshot.offering_name}</strong> market this
              week:
            </p>
          </div>

          {/* Demand Score Section */}
          <div style={styles.scoreCard}>
            <div style={styles.scoreHeader}>
              <div>
                <h2 style={styles.scoreTitle}>DEMAND SCORE</h2>
                <div style={styles.scoreValue}>
                  <span style={styles.scoreLarge}>{snapshot.demand_score}</span>
                  <span style={{ ...styles.scoreTrend, color: trendColor }}>
                    {trendEmoji} {scoreChange}
                  </span>
                </div>
              </div>
            </div>

            <div style={styles.scoreMetrics}>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Opportunity</span>
                <span style={styles.metricValue}>{snapshot.opportunity_score}/100</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>Message Fit</span>
                <span style={styles.metricValue}>{snapshot.message_market_fit_score}/100</span>
              </div>
            </div>

            <div style={styles.whyChanged}>
              <p style={styles.whyChangedTitle}>Why it changed:</p>
              <ul style={styles.list}>
                {snapshot.why_score_changed.map((reason, i) => (
                  <li key={i} style={styles.listItem}>
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* What Changed This Week */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📈 What Changed This Week</h2>

            <table style={styles.table}>
              <tbody>
                <tr>
                  <td style={styles.tableLabel}>🎯 Ads</td>
                  <td style={styles.tableValue}>
                    {snapshot.ad_signals.advertiserCount} advertisers active.{" "}
                    <strong>New angles:</strong> {snapshot.ad_signals.topAngles.slice(0, 3).join(", ")}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>🔍 Search</td>
                  <td style={styles.tableValue}>
                    <strong>Rising:</strong>{" "}
                    {snapshot.search_signals.buyerIntentKeywords
                      .slice(0, 3)
                      .map((kw: any) => kw.keyword)
                      .join(", ")}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>💬 Forums</td>
                  <td style={styles.tableValue}>
                    <strong>Top complaints:</strong>{" "}
                    {snapshot.forum_signals.complaints
                      .slice(0, 2)
                      .map((c: any) => c.text)
                      .join(", ")}
                    . <strong>Top desires:</strong>{" "}
                    {snapshot.forum_signals.desires
                      .slice(0, 2)
                      .map((d: any) => d.text)
                      .join(", ")}
                  </td>
                </tr>
                <tr>
                  <td style={styles.tableLabel}>⚔️ Competitors</td>
                  <td style={styles.tableValue}>
                    {snapshot.competitor_signals.activeCompetitors} active competitors in the
                    market
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* What To Do Next (3 Plays) */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>🎯 What To Do Next (3 Plays)</h2>

            {snapshot.plays.map((play, i) => (
              <div key={i} style={styles.playCard}>
                <div style={styles.playHeader}>
                  <span style={styles.playNumber}>{i + 1}</span>
                  <span style={styles.playType}>
                    {play.type === "product" ? "🛠️ PRODUCT PLAY" : play.type === "offer" ? "💰 OFFER PLAY" : "📣 DISTRIBUTION PLAY"}
                  </span>
                  {play.priority === "high" && (
                    <span style={styles.highPriority}>HIGH PRIORITY</span>
                  )}
                </div>
                <p style={styles.playAction}>{play.action}</p>
                <p style={styles.playEvidence}>💡 {play.evidence}</p>
              </div>
            ))}
          </div>

          {/* Copy You Can Paste */}
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>📋 Copy You Can Paste</h2>

            <div style={styles.copySection}>
              <h3 style={styles.copySubtitle}>AD HOOKS:</h3>
              <ul style={styles.list}>
                {snapshot.ad_hooks.slice(0, 5).map((hook, i) => (
                  <li key={i} style={styles.listItem}>
                    "{hook}"
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.copySection}>
              <h3 style={styles.copySubtitle}>SUBJECT LINES:</h3>
              <ul style={styles.list}>
                {snapshot.subject_lines.slice(0, 5).map((subject, i) => (
                  <li key={i} style={styles.listItem}>
                    "{subject}"
                  </li>
                ))}
              </ul>
            </div>

            <div style={styles.copySection}>
              <h3 style={styles.copySubtitle}>LANDING PAGE PARAGRAPH:</h3>
              <p style={styles.landingCopy}>{snapshot.landing_copy}</p>
            </div>
          </div>

          {/* CTA */}
          <div style={styles.ctaSection}>
            <a href={`https://demandradar.io/dashboard/niches/${snapshot.niche_id}`} style={styles.button}>
              View Full Dashboard →
            </a>
          </div>

          {/* Footer */}
          <div style={styles.footer}>
            <p style={styles.footerText}>
              You're receiving this because you're tracking <strong>{snapshot.offering_name}</strong>.
            </p>
            <p style={styles.footerText}>
              <a href="https://demandradar.io/dashboard/niches" style={styles.link}>
                Manage your niches
              </a>
              {" · "}
              <a href="https://demandradar.io/dashboard/settings" style={styles.link}>
                Settings
              </a>
            </p>
            <p style={styles.footerText}>
              DemandRadar · Weekly Demand Intelligence
            </p>
          </div>
        </div>
      </body>
    </html>
  );
};

// Inline styles for email compatibility
const styles = {
  body: {
    backgroundColor: "#f3f4f6",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    padding: "0",
  },
  header: {
    backgroundColor: "#1f2937",
    color: "#ffffff",
    padding: "32px 24px",
    textAlign: "center" as const,
  },
  logo: {
    margin: "0 0 8px 0",
    fontSize: "24px",
    fontWeight: "bold" as const,
  },
  subtitle: {
    margin: 0,
    fontSize: "14px",
    color: "#9ca3af",
  },
  section: {
    padding: "24px",
  },
  greeting: {
    margin: "0 0 16px 0",
    fontSize: "16px",
    color: "#1f2937",
  },
  text: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.5",
  },
  scoreCard: {
    margin: "24px",
    padding: "24px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "2px solid #e5e7eb",
  },
  scoreHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "16px",
  },
  scoreTitle: {
    margin: "0 0 8px 0",
    fontSize: "12px",
    fontWeight: "bold" as const,
    color: "#6b7280",
    letterSpacing: "0.05em",
  },
  scoreValue: {
    display: "flex",
    alignItems: "baseline",
    gap: "12px",
  },
  scoreLarge: {
    fontSize: "48px",
    fontWeight: "bold" as const,
    color: "#1f2937",
  },
  scoreTrend: {
    fontSize: "20px",
    fontWeight: "bold" as const,
  },
  scoreMetrics: {
    display: "flex",
    gap: "24px",
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
    marginBottom: "16px",
  },
  metricItem: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  },
  metricLabel: {
    fontSize: "12px",
    color: "#6b7280",
  },
  metricValue: {
    fontSize: "18px",
    fontWeight: "bold" as const,
    color: "#1f2937",
  },
  whyChanged: {
    paddingTop: "16px",
    borderTop: "1px solid #e5e7eb",
  },
  whyChangedTitle: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  sectionTitle: {
    margin: "0 0 16px 0",
    fontSize: "20px",
    fontWeight: "bold" as const,
    color: "#1f2937",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
  },
  tableLabel: {
    padding: "12px 8px",
    fontSize: "14px",
    fontWeight: "600" as const,
    color: "#1f2937",
    verticalAlign: "top" as const,
    width: "80px",
  },
  tableValue: {
    padding: "12px 8px",
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.5",
    borderBottom: "1px solid #e5e7eb",
  },
  playCard: {
    padding: "16px",
    marginBottom: "16px",
    backgroundColor: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
  },
  playHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  playNumber: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "24px",
    height: "24px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    borderRadius: "50%",
    fontSize: "12px",
    fontWeight: "bold" as const,
  },
  playType: {
    fontSize: "12px",
    fontWeight: "bold" as const,
    color: "#1f2937",
    letterSpacing: "0.05em",
  },
  highPriority: {
    marginLeft: "auto",
    padding: "2px 8px",
    backgroundColor: "#fef3c7",
    color: "#92400e",
    fontSize: "10px",
    fontWeight: "bold" as const,
    borderRadius: "4px",
  },
  playAction: {
    margin: "0 0 8px 0",
    fontSize: "14px",
    fontWeight: "600" as const,
    color: "#1f2937",
  },
  playEvidence: {
    margin: 0,
    fontSize: "13px",
    color: "#6b7280",
    fontStyle: "italic" as const,
  },
  copySection: {
    marginBottom: "24px",
  },
  copySubtitle: {
    margin: "0 0 12px 0",
    fontSize: "14px",
    fontWeight: "bold" as const,
    color: "#1f2937",
    letterSpacing: "0.05em",
  },
  list: {
    margin: "0",
    paddingLeft: "24px",
  },
  listItem: {
    marginBottom: "8px",
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.5",
  },
  landingCopy: {
    margin: 0,
    padding: "16px",
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.6",
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "4px",
  },
  ctaSection: {
    padding: "24px",
    textAlign: "center" as const,
  },
  button: {
    display: "inline-block",
    padding: "12px 32px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    textDecoration: "none",
    borderRadius: "6px",
    fontWeight: "600" as const,
    fontSize: "14px",
  },
  footer: {
    padding: "24px",
    textAlign: "center" as const,
    borderTop: "1px solid #e5e7eb",
    backgroundColor: "#f9fafb",
  },
  footerText: {
    margin: "8px 0",
    fontSize: "12px",
    color: "#6b7280",
  },
  link: {
    color: "#3b82f6",
    textDecoration: "none",
  },
};

export default DemandBriefEmail;
