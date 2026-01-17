/**
 * Email Templates
 *
 * React Email templates for all notification emails
 */

import * as React from "react";

// ============================================================================
// Common Styles
// ============================================================================

const commonStyles = {
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
  heading: {
    margin: "0 0 16px 0",
    fontSize: "20px",
    fontWeight: "bold" as const,
    color: "#1f2937",
  },
  text: {
    margin: "0 0 16px 0",
    fontSize: "14px",
    color: "#4b5563",
    lineHeight: "1.6",
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

// ============================================================================
// Welcome Email Template
// ============================================================================

export interface WelcomeEmailProps {
  userName?: string;
  userEmail: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  userName,
  userEmail,
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style={commonStyles.body}>
      <div style={commonStyles.container}>
        <div style={commonStyles.header}>
          <h1 style={commonStyles.logo}>📊 GapRadar</h1>
          <p style={commonStyles.subtitle}>Market Gap Analysis Tool</p>
        </div>

        <div style={commonStyles.section}>
          <h2 style={commonStyles.heading}>
            Welcome to GapRadar! 👋
          </h2>
          <p style={commonStyles.text}>
            {userName ? `Hi ${userName},` : "Hi there,"}
          </p>
          <p style={commonStyles.text}>
            Thanks for signing up! You're now ready to discover untapped market opportunities
            and validate your ideas with real market data.
          </p>

          <div style={{ margin: "24px 0" }}>
            <h3 style={{ ...commonStyles.text, fontWeight: "bold" as const, marginBottom: "12px" }}>
              Here's what you can do:
            </h3>
            <ul style={{ margin: 0, paddingLeft: "24px" }}>
              <li style={commonStyles.text}>
                🔍 Run market gap analyses to find opportunities
              </li>
              <li style={commonStyles.text}>
                📊 Get detailed reports with actionable insights
              </li>
              <li style={commonStyles.text}>
                🎯 Discover pain points and gaps in your market
              </li>
              <li style={commonStyles.text}>
                💡 Get concrete recommendations to build and grow
              </li>
            </ul>
          </div>

          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <a href="https://gapradar.io/dashboard" style={commonStyles.button}>
              Get Started →
            </a>
          </div>

          <p style={commonStyles.text}>
            Need help? Check out our{" "}
            <a href="https://gapradar.io/docs" style={commonStyles.link}>
              documentation
            </a>{" "}
            or reply to this email with any questions.
          </p>
        </div>

        <div style={commonStyles.footer}>
          <p style={commonStyles.footerText}>
            GapRadar · Find Market Gaps, Build Better Products
          </p>
          <p style={commonStyles.footerText}>
            <a href="https://gapradar.io/dashboard/settings" style={commonStyles.link}>
              Settings
            </a>
          </p>
        </div>
      </div>
    </body>
  </html>
);

// ============================================================================
// Report Complete Email Template
// ============================================================================

export interface ReportCompleteEmailProps {
  userName?: string;
  reportId: string;
  searchQuery: string;
  demandScore?: number;
  topGaps?: string[];
}

export const ReportCompleteEmail: React.FC<ReportCompleteEmailProps> = ({
  userName,
  reportId,
  searchQuery,
  demandScore,
  topGaps = [],
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style={commonStyles.body}>
      <div style={commonStyles.container}>
        <div style={commonStyles.header}>
          <h1 style={commonStyles.logo}>📊 GapRadar</h1>
          <p style={commonStyles.subtitle}>Your Analysis is Ready</p>
        </div>

        <div style={commonStyles.section}>
          <h2 style={commonStyles.heading}>
            Your Report is Ready! ✨
          </h2>
          <p style={commonStyles.text}>
            {userName ? `Hi ${userName},` : "Hi there,"}
          </p>
          <p style={commonStyles.text}>
            Your market gap analysis for <strong>"{searchQuery}"</strong> is complete!
          </p>

          {demandScore && (
            <div
              style={{
                margin: "24px 0",
                padding: "20px",
                backgroundColor: "#f9fafb",
                borderRadius: "8px",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#6b7280" }}>
                DEMAND SCORE
              </p>
              <p style={{ margin: 0, fontSize: "48px", fontWeight: "bold", color: "#1f2937" }}>
                {demandScore}
              </p>
            </div>
          )}

          {topGaps.length > 0 && (
            <div style={{ margin: "24px 0" }}>
              <h3 style={{ ...commonStyles.text, fontWeight: "bold" as const, marginBottom: "12px" }}>
                Top Gaps Found:
              </h3>
              <ul style={{ margin: 0, paddingLeft: "24px" }}>
                {topGaps.slice(0, 3).map((gap, i) => (
                  <li key={i} style={commonStyles.text}>
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <a
              href={`https://gapradar.io/dashboard/reports/${reportId}`}
              style={commonStyles.button}
            >
              View Full Report →
            </a>
          </div>
        </div>

        <div style={commonStyles.footer}>
          <p style={commonStyles.footerText}>
            GapRadar · Find Market Gaps, Build Better Products
          </p>
        </div>
      </div>
    </body>
  </html>
);

// ============================================================================
// Subscription Confirmation Email Template
// ============================================================================

export interface SubscriptionEmailProps {
  userName?: string;
  planName: string;
  planPrice: string;
  features: string[];
  isUpgrade?: boolean;
}

export const SubscriptionConfirmationEmail: React.FC<SubscriptionEmailProps> = ({
  userName,
  planName,
  planPrice,
  features,
  isUpgrade = false,
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style={commonStyles.body}>
      <div style={commonStyles.container}>
        <div style={commonStyles.header}>
          <h1 style={commonStyles.logo}>📊 GapRadar</h1>
          <p style={commonStyles.subtitle}>Subscription Confirmed</p>
        </div>

        <div style={commonStyles.section}>
          <h2 style={commonStyles.heading}>
            {isUpgrade ? "Upgrade Complete! 🎉" : "Welcome to GapRadar! 🎉"}
          </h2>
          <p style={commonStyles.text}>
            {userName ? `Hi ${userName},` : "Hi there,"}
          </p>
          <p style={commonStyles.text}>
            {isUpgrade
              ? `You've successfully upgraded to the ${planName} plan.`
              : `Thanks for subscribing to the ${planName} plan!`}
          </p>

          <div
            style={{
              margin: "24px 0",
              padding: "20px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: "bold" }}>
              {planName}
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "24px", fontWeight: "bold", color: "#3b82f6" }}>
              {planPrice}
            </p>
            <ul style={{ margin: 0, paddingLeft: "24px" }}>
              {features.map((feature, i) => (
                <li key={i} style={{ ...commonStyles.text, marginBottom: "8px" }}>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <a href="https://gapradar.io/dashboard" style={commonStyles.button}>
              Go to Dashboard →
            </a>
          </div>

          <p style={commonStyles.text}>
            Questions about your subscription?{" "}
            <a href="https://gapradar.io/dashboard/settings/billing" style={commonStyles.link}>
              Manage your billing
            </a>
          </p>
        </div>

        <div style={commonStyles.footer}>
          <p style={commonStyles.footerText}>
            GapRadar · Find Market Gaps, Build Better Products
          </p>
        </div>
      </div>
    </body>
  </html>
);

// ============================================================================
// Usage Limit Warning Email Template
// ============================================================================

export interface UsageLimitWarningEmailProps {
  userName?: string;
  currentUsage: number;
  monthlyLimit: number;
  percentUsed: number;
  planName: string;
}

export const UsageLimitWarningEmail: React.FC<UsageLimitWarningEmailProps> = ({
  userName,
  currentUsage,
  monthlyLimit,
  percentUsed,
  planName,
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style={commonStyles.body}>
      <div style={commonStyles.container}>
        <div style={commonStyles.header}>
          <h1 style={commonStyles.logo}>📊 GapRadar</h1>
          <p style={commonStyles.subtitle}>Usage Alert</p>
        </div>

        <div style={commonStyles.section}>
          <h2 style={commonStyles.heading}>
            You're approaching your monthly limit
          </h2>
          <p style={commonStyles.text}>
            {userName ? `Hi ${userName},` : "Hi there,"}
          </p>
          <p style={commonStyles.text}>
            You've used <strong>{currentUsage}</strong> of your <strong>{monthlyLimit}</strong>{" "}
            monthly analysis runs on the {planName} plan ({percentUsed}%).
          </p>

          <div
            style={{
              margin: "24px 0",
              padding: "20px",
              backgroundColor: "#fef3c7",
              borderRadius: "8px",
              border: "2px solid #fbbf24",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{
                  height: "20px",
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${percentUsed}%`,
                    backgroundColor: percentUsed >= 90 ? "#ef4444" : "#fbbf24",
                  }}
                />
              </div>
            </div>
            <p style={{ margin: 0, fontSize: "14px", textAlign: "center" }}>
              <strong>{currentUsage}</strong> / {monthlyLimit} runs used
            </p>
          </div>

          <p style={commonStyles.text}>
            {percentUsed >= 90
              ? "You're running low on analysis runs. Consider upgrading to continue analyzing markets without interruption."
              : "Consider upgrading to a higher plan for more monthly runs and additional features."}
          </p>

          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <a href="https://gapradar.io/dashboard/settings/billing" style={commonStyles.button}>
              Upgrade Plan →
            </a>
          </div>
        </div>

        <div style={commonStyles.footer}>
          <p style={commonStyles.footerText}>
            GapRadar · Find Market Gaps, Build Better Products
          </p>
        </div>
      </div>
    </body>
  </html>
);

// ============================================================================
// Report Share Email Template
// ============================================================================

export interface ReportShareEmailProps {
  recipientEmail: string;
  senderName?: string;
  reportTitle: string;
  shareUrl: string;
  message?: string;
  hasPassword: boolean;
}

export const ReportShareEmail: React.FC<ReportShareEmailProps> = ({
  recipientEmail,
  senderName,
  reportTitle,
  shareUrl,
  message,
  hasPassword,
}) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>
    <body style={commonStyles.body}>
      <div style={commonStyles.container}>
        <div style={commonStyles.header}>
          <h1 style={commonStyles.logo}>📊 GapRadar</h1>
          <p style={commonStyles.subtitle}>Shared Report</p>
        </div>

        <div style={commonStyles.section}>
          <h2 style={commonStyles.heading}>
            Someone shared a report with you
          </h2>
          <p style={commonStyles.text}>
            {senderName || "Someone"} shared a GapRadar analysis report with you:
          </p>

          <div
            style={{
              margin: "24px 0",
              padding: "20px",
              backgroundColor: "#f9fafb",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: "bold" }}>
              {reportTitle}
            </h3>
            {message && (
              <p style={{ margin: "12px 0 0 0", fontSize: "14px", color: "#6b7280", fontStyle: "italic" }}>
                "{message}"
              </p>
            )}
          </div>

          {hasPassword && (
            <div
              style={{
                margin: "16px 0",
                padding: "12px",
                backgroundColor: "#fef3c7",
                borderRadius: "6px",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px", color: "#92400e" }}>
                🔒 This report is password protected. The sender should provide you with the password.
              </p>
            </div>
          )}

          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <a href={shareUrl} style={commonStyles.button}>
              View Report →
            </a>
          </div>

          <p style={commonStyles.text}>
            Want to create your own market gap analyses?{" "}
            <a href="https://gapradar.io/signup" style={commonStyles.link}>
              Sign up for GapRadar
            </a>
          </p>
        </div>

        <div style={commonStyles.footer}>
          <p style={commonStyles.footerText}>
            GapRadar · Find Market Gaps, Build Better Products
          </p>
        </div>
      </div>
    </body>
  </html>
);
