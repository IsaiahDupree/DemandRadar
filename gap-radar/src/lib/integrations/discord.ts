/**
 * Discord Integration (INTEG-002)
 *
 * Send run completion and gap alerts to Discord channels via webhooks
 *
 * Features:
 * - Webhook setup
 * - Channel selection (via webhook URL)
 * - Rich embeds
 */

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
}

export interface DiscordWebhookOptions {
  username?: string;
  avatarUrl?: string;
}

export interface SendResult {
  success: boolean;
  error?: string;
}

/**
 * Send a notification to Discord via webhook
 *
 * @param webhookUrl - Discord webhook URL
 * @param embed - Rich embed object
 * @param options - Optional webhook customization
 */
export async function sendDiscordNotification(
  webhookUrl: string,
  embed: DiscordEmbed,
  options?: DiscordWebhookOptions
): Promise<SendResult> {
  // Validate webhook URL
  if (!webhookUrl || webhookUrl.trim() === '') {
    throw new Error('Discord webhook URL is required');
  }

  try {
    // Prepare webhook payload
    const payload: any = {
      embeds: [embed],
    };

    if (options?.username) {
      payload.username = options.username;
    }

    if (options?.avatarUrl) {
      payload.avatar_url = options.avatarUrl;
    }

    // Send to Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Failed to send Discord notification: ${response.status} ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    // Re-throw with a consistent error message
    if (error instanceof Error && error.message.includes('Failed to send Discord notification')) {
      throw error;
    }
    throw new Error(`Failed to send Discord notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Format run completion data as Discord embed
 *
 * @param runData - Run completion data
 */
export function formatRunCompletionEmbed(runData: {
  id: string;
  niche_query: string;
  status: string;
  created_at: string;
  finished_at?: string;
  opportunityScore?: number;
  confidence?: number;
  totalGaps?: number;
  totalAds?: number;
  totalMentions?: number;
  error?: string;
}): DiscordEmbed {
  const isSuccess = runData.status === 'complete';
  const isFailed = runData.status === 'failed';

  // Determine embed color based on status
  let color = 0x95a5a6; // Gray (default)
  if (isSuccess) {
    color = 0x00ff00; // Green for success
  } else if (isFailed) {
    color = 0xff0000; // Red for failure
  }

  // Build embed
  const embed: DiscordEmbed = {
    title: `Run ${isSuccess ? 'Complete' : isFailed ? 'Failed' : 'Running'}: ${runData.niche_query}`,
    color,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'GapRadar',
    },
  };

  // Add fields based on status
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [];

  if (isSuccess && runData.opportunityScore !== undefined) {
    fields.push({
      name: 'Opportunity Score',
      value: `${runData.opportunityScore}/100`,
      inline: true,
    });
  }

  if (isSuccess && runData.confidence !== undefined) {
    fields.push({
      name: 'Confidence',
      value: `${Math.round(runData.confidence * 100)}%`,
      inline: true,
    });
  }

  if (isSuccess && runData.totalGaps !== undefined) {
    fields.push({
      name: 'Gaps Found',
      value: `${runData.totalGaps}`,
      inline: true,
    });
  }

  if (isSuccess && runData.totalAds !== undefined) {
    fields.push({
      name: 'Ads Analyzed',
      value: `${runData.totalAds}`,
      inline: true,
    });
  }

  if (isSuccess && runData.totalMentions !== undefined) {
    fields.push({
      name: 'Reddit Mentions',
      value: `${runData.totalMentions}`,
      inline: true,
    });
  }

  if (isFailed && runData.error) {
    fields.push({
      name: 'Error',
      value: runData.error,
      inline: false,
    });
  }

  fields.push({
    name: 'Run ID',
    value: runData.id,
    inline: false,
  });

  if (runData.finished_at) {
    const duration = new Date(runData.finished_at).getTime() - new Date(runData.created_at).getTime();
    const durationMinutes = Math.round(duration / 1000 / 60);
    fields.push({
      name: 'Duration',
      value: `${durationMinutes} minutes`,
      inline: true,
    });
  }

  embed.fields = fields;

  return embed;
}

/**
 * Format gap alert data as Discord embed
 *
 * @param gapData - Gap alert data
 */
export function formatGapAlertEmbed(gapData: {
  id: string;
  runId: string;
  nicheQuery: string;
  type: string;
  title: string;
  problem: string;
  recommendation: string;
  score: number;
  confidence: number;
}): DiscordEmbed {
  // Orange color for alerts
  const color = 0xffa500;

  const embed: DiscordEmbed = {
    title: `New Gap Identified: ${gapData.title}`,
    description: gapData.problem,
    color,
    timestamp: new Date().toISOString(),
    footer: {
      text: 'GapRadar',
    },
    fields: [
      {
        name: 'Gap Type',
        value: gapData.type,
        inline: true,
      },
      {
        name: 'Score',
        value: `${gapData.score}/100`,
        inline: true,
      },
      {
        name: 'Confidence',
        value: `${Math.round(gapData.confidence * 100)}%`,
        inline: true,
      },
      {
        name: 'Niche',
        value: gapData.nicheQuery,
        inline: false,
      },
      {
        name: 'Recommendation',
        value: gapData.recommendation,
        inline: false,
      },
      {
        name: 'Gap ID',
        value: gapData.id,
        inline: true,
      },
      {
        name: 'Run ID',
        value: gapData.runId,
        inline: true,
      },
    ],
  };

  return embed;
}
