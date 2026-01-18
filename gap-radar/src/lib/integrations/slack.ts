/**
 * Slack Integration (INTEG-001)
 *
 * Send run completion and gap alerts to Slack channels
 *
 * Features:
 * - OAuth authentication
 * - Channel selection
 * - Rich message templates
 */

export interface SlackConfig {
  workspaceId: string;
  accessToken: string;
  channelId: string;
  channelName: string;
}

export interface SlackAttachment {
  color?: string;
  fallback?: string;
  fields?: Array<{
    title: string;
    value: string;
    short?: boolean;
  }>;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export interface SlackMessage {
  text: string;
  channel?: string;
  attachments?: SlackAttachment[];
  username?: string;
  icon_emoji?: string;
}

export interface SendResult {
  success: boolean;
  error?: string;
}

/**
 * Send a notification to Slack
 */
export async function sendSlackNotification(
  config: SlackConfig,
  message: SlackMessage
): Promise<SendResult> {
  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        channel: message.channel || config.channelId,
        text: message.text,
        attachments: message.attachments,
        username: message.username,
        icon_emoji: message.icon_emoji,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.error || 'Unknown Slack API error',
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format run completion message
 */
export function formatRunCompleteMessage(runData: {
  id: string;
  nicheQuery: string;
  opportunityScore: number;
  confidence: number;
  gapCount: number;
  reportUrl: string;
}): SlackMessage {
  const { nicheQuery, opportunityScore, confidence, gapCount, reportUrl } = runData;

  // Determine color based on opportunity score
  let color = '#95a5a6'; // gray
  if (opportunityScore >= 80) {
    color = '#27ae60'; // green
  } else if (opportunityScore >= 60) {
    color = '#f39c12'; // orange
  } else if (opportunityScore >= 40) {
    color = '#e74c3c'; // red
  }

  const gapText = gapCount === 0 ? 'no gaps' : gapCount === 1 ? '1 gap' : `${gapCount} gaps`;

  return {
    text: `✅ Run complete for *${nicheQuery}*`,
    attachments: [
      {
        color,
        fallback: `Run complete: ${nicheQuery} - Opportunity: ${opportunityScore}/100`,
        fields: [
          {
            title: 'Opportunity Score',
            value: `${opportunityScore}/100`,
            short: true,
          },
          {
            title: 'Confidence',
            value: `${Math.round(confidence * 100)}%`,
            short: true,
          },
          {
            title: 'Gaps Found',
            value: gapText,
            short: true,
          },
          {
            title: 'Report',
            value: `<${reportUrl}|View Full Report →>`,
            short: false,
          },
        ],
        footer: 'GapRadar',
        footer_icon: 'https://gapradar.com/icon.png',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * Format gap alert message
 */
export function formatGapAlertMessage(gapData: {
  id: string;
  title: string;
  gapType: 'product' | 'offer' | 'positioning' | 'trust' | 'pricing';
  opportunityScore: number;
  evidence: {
    adCount: number;
    redditMentions: number;
  };
  recommendation: string;
}): SlackMessage {
  const { title, gapType, opportunityScore, evidence, recommendation } = gapData;

  // Color by gap type
  const typeColors: Record<typeof gapType, string> = {
    product: '#3498db',
    offer: '#9b59b6',
    positioning: '#1abc9c',
    trust: '#e67e22',
    pricing: '#2ecc71',
  };

  const color = typeColors[gapType] || '#95a5a6';

  const typeEmojis: Record<typeof gapType, string> = {
    product: '📦',
    offer: '🎁',
    positioning: '🎯',
    trust: '🤝',
    pricing: '💰',
  };

  const emoji = typeEmojis[gapType] || '🔍';

  return {
    text: `${emoji} *New Gap Alert:* ${title}`,
    attachments: [
      {
        color,
        fallback: `Gap Alert: ${title} - Opportunity: ${opportunityScore}`,
        fields: [
          {
            title: 'Gap Type',
            value: gapType.charAt(0).toUpperCase() + gapType.slice(1),
            short: true,
          },
          {
            title: 'Opportunity',
            value: `${opportunityScore}/100`,
            short: true,
          },
          {
            title: 'Evidence',
            value: `${evidence.adCount} ads, ${evidence.redditMentions} Reddit mentions`,
            short: false,
          },
          {
            title: 'Recommendation',
            value: recommendation,
            short: false,
          },
        ],
        footer: 'GapRadar Gap Alert',
        footer_icon: 'https://gapradar.com/icon.png',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

/**
 * OAuth URL generator (for future implementation)
 */
export function getSlackOAuthUrl(clientId: string, redirectUri: string): string {
  const scopes = [
    'chat:write',
    'chat:write.public',
    'channels:read',
    'groups:read',
  ].join(',');

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scopes,
    redirect_uri: redirectUri,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

/**
 * Exchange OAuth code for access token (for future implementation)
 */
export async function exchangeOAuthCode(
  clientId: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<{
  success: boolean;
  accessToken?: string;
  workspaceId?: string;
  error?: string;
}> {
  try {
    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      return {
        success: false,
        error: data.error || 'OAuth exchange failed',
      };
    }

    return {
      success: true,
      accessToken: data.access_token,
      workspaceId: data.team?.id,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
