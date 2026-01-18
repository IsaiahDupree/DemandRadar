/**
 * Notion Export
 *
 * Export GapRadar reports directly to Notion workspace
 * Implements EXPORT-002: Notion Export feature
 */

import { Client } from '@notionhq/client';

export interface NotionExportOptions {
  apiKey: string;
  databaseId?: string;
}

export interface NotionExportResult {
  success: boolean;
  pageId: string;
  pageUrl: string;
  error?: string;
}

/**
 * Format report data into Notion blocks structure
 */
export function formatReportForNotion(reportData: any): any[] {
  const blocks: any[] = [];

  // Title heading
  blocks.push({
    object: 'block',
    type: 'heading_1',
    heading_1: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `Market Analysis: ${reportData.run.niche_query}`,
          },
        },
      ],
    },
  });

  // Metadata
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `Generated: ${new Date(reportData.run.created_at).toLocaleDateString()}`,
          },
          annotations: {
            italic: true,
            color: 'gray',
          },
        },
      ],
    },
  });

  // Executive Summary Section
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Executive Summary',
          },
        },
      ],
    },
  });

  // Opportunity Score
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `Opportunity Score: ${reportData.scores.opportunity}/100`,
          },
          annotations: {
            bold: true,
          },
        },
      ],
    },
  });

  // Confidence
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `Confidence: ${Math.round(reportData.scores.confidence * 100)}%`,
          },
        },
      ],
    },
  });

  // Key Metrics
  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: `Total Ads Analyzed: ${reportData.summary.totalAds} | Reddit Mentions: ${reportData.summary.totalMentions} | Gaps Found: ${reportData.summary.totalGaps}`,
          },
        },
      ],
    },
  });

  // Top Gaps
  if (reportData.gaps && reportData.gaps.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Top Gaps',
            },
          },
        ],
      },
    });

    reportData.gaps.slice(0, 5).forEach((gap: any) => {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `${gap.title} (Score: ${gap.score}/100)`,
              },
              annotations: {
                bold: true,
              },
            },
          ],
        },
      });

      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `Problem: ${gap.problem}`,
              },
            },
          ],
        },
      });

      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `Recommendation: ${gap.recommendation}`,
              },
            },
          ],
        },
      });
    });
  }

  // Market Snapshot Section
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Market Snapshot',
          },
        },
      ],
    },
  });

  // Top Advertisers
  if (reportData.marketSnapshot?.topAdvertisers?.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Top Advertisers',
            },
          },
        ],
      },
    });

    reportData.marketSnapshot.topAdvertisers.slice(0, 5).forEach((advertiser: any) => {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `${advertiser.name} - ${advertiser.adCount} ads`,
              },
            },
          ],
        },
      });
    });
  }

  // Top Angles
  if (reportData.marketSnapshot?.topAngles?.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Top Marketing Angles',
            },
          },
        ],
      },
    });

    reportData.marketSnapshot.topAngles.slice(0, 5).forEach((angle: any) => {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `${angle.label} (${angle.frequency} occurrences)`,
              },
            },
          ],
        },
      });
    });
  }

  // Pain Map Section
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Customer Pain Points',
          },
        },
      ],
    },
  });

  // Top Objections
  if (reportData.painMap?.topObjections?.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Top Objections',
            },
          },
        ],
      },
    });

    reportData.painMap.topObjections.slice(0, 5).forEach((objection: any) => {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `${objection.label} (Frequency: ${objection.frequency}, Intensity: ${objection.intensity.toFixed(2)})`,
              },
            },
          ],
        },
      });
    });
  }

  // Top Desired Features
  if (reportData.painMap?.topFeatures?.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Most Requested Features',
            },
          },
        ],
      },
    });

    reportData.painMap.topFeatures.slice(0, 5).forEach((feature: any) => {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `${feature.label} (${feature.frequency} requests)`,
              },
            },
          ],
        },
      });
    });
  }

  // Concepts Section
  if (reportData.concepts && reportData.concepts.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Concept Ideas',
            },
          },
        ],
      },
    });

    reportData.concepts.slice(0, 3).forEach((concept: any) => {
      blocks.push({
        object: 'block',
        type: 'heading_3',
        heading_3: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: concept.name,
              },
            },
          ],
        },
      });

      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: concept.oneLiner,
              },
            },
          ],
        },
      });

      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: `Platform: ${concept.platform} | Industry: ${concept.industry} | Model: ${concept.businessModel}`,
              },
              annotations: {
                italic: true,
              },
            },
          ],
        },
      });
    });
  }

  // Footer
  blocks.push({
    object: 'block',
    type: 'divider',
    divider: {},
  });

  blocks.push({
    object: 'block',
    type: 'paragraph',
    paragraph: {
      rich_text: [
        {
          type: 'text',
          text: {
            content: 'Generated by GapRadar - Market Gap Analysis Tool',
          },
          annotations: {
            italic: true,
            color: 'gray',
          },
        },
      ],
    },
  });

  return blocks;
}

/**
 * Export report to Notion
 */
export async function exportToNotion(
  reportData: any,
  options: NotionExportOptions
): Promise<NotionExportResult> {
  try {
    // Validate inputs
    if (!options.apiKey || options.apiKey.trim() === '') {
      throw new Error('Notion API key is required');
    }

    // Initialize Notion client
    const notion = new Client({ auth: options.apiKey });

    // Format report as Notion blocks
    const blocks = formatReportForNotion(reportData);

    // Create page properties
    const pageProperties: any = {
      title: {
        title: [
          {
            text: {
              content: `GapRadar: ${reportData.run.niche_query}`,
            },
          },
        ],
      },
    };

    // Create page (either in database or as standalone page)
    let response;
    if (options.databaseId) {
      response = await notion.pages.create({
        parent: { database_id: options.databaseId },
        properties: pageProperties,
      });
    } else {
      // Create as standalone page in workspace
      response = await notion.pages.create({
        parent: { type: 'page_id', page_id: process.env.NOTION_PARENT_PAGE_ID || '' },
        properties: pageProperties,
      });
    }

    // Add content blocks to the page
    // Notion API limits blocks per request to 100, so we need to batch
    const maxBlocksPerRequest = 100;
    for (let i = 0; i < blocks.length; i += maxBlocksPerRequest) {
      const batch = blocks.slice(i, i + maxBlocksPerRequest);
      await notion.blocks.children.append({
        block_id: response.id,
        children: batch,
      });
    }

    return {
      success: true,
      pageId: response.id,
      pageUrl: (response as any).url || `https://notion.so/${response.id.replace(/-/g, '')}`,
    };
  } catch (error) {
    console.error('Notion export error:', error);
    throw new Error(`Failed to export to Notion: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
