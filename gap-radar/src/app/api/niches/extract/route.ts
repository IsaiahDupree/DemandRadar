import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * POST /api/niches/extract
 * Extract niche configuration from user's offering description
 */
export async function POST(request: NextRequest) {
  try {
    const { offering } = await request.json();

    if (!offering || typeof offering !== "string") {
      return NextResponse.json(
        { error: "Offering description is required" },
        { status: 400 }
      );
    }

    // Use OpenAI to extract structured niche data
    const extraction = await extractNicheData(offering);

    return NextResponse.json(extraction);
  } catch (error) {
    console.error("Niche extraction error:", error);
    return NextResponse.json(
      { error: "Failed to extract niche data" },
      { status: 500 }
    );
  }
}

async function extractNicheData(offering: string) {
  const systemPrompt = `You are a market research assistant that extracts structured niche data from user descriptions.

Given a description of what someone sells, extract:
- offering_name: Short name for the product/service
- category: General category (e.g., "Design Tools", "SaaS", "Education", "Local Services")
- niche_tags: 3-5 specific tags describing the niche
- customer_type: Either "B2C" or "B2B"
- customer_segment: Who the customers are (e.g., "creators", "agencies", "SMBs", "consumers")
- price_point: "low" ($0-50/mo), "mid" ($50-200/mo), or "high" ($200+/mo)
- competitors: 5-10 direct competitors (real company names)
- keywords: 8-15 keywords to track (primary terms + adjacent terms)

Return ONLY valid JSON in this exact format:
{
  "offeringName": "string",
  "category": "string",
  "nicheTags": ["string"],
  "customerProfile": {
    "type": "B2C" | "B2B",
    "segment": "string",
    "pricePoint": "low" | "mid" | "high"
  },
  "competitors": ["string"],
  "keywords": ["string"],
  "geo": "US"
}`;

  const userPrompt = `Extract niche data from this offering description:

"${offering}"

Return structured JSON only.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    return parsed;
  } catch (error) {
    console.error("OpenAI extraction error:", error);

    // Fallback: return mock data based on the offering
    return {
      offeringName: offering.split(" ").slice(0, 3).join(" "),
      category: "Software",
      nicheTags: ["startup", "tool", "software"],
      customerProfile: {
        type: "B2C",
        segment: "creators",
        pricePoint: "mid",
      },
      competitors: ["Competitor1", "Competitor2", "Competitor3"],
      keywords: [
        offering.toLowerCase(),
        "best " + offering.toLowerCase(),
        offering.toLowerCase() + " alternative",
        offering.toLowerCase() + " tool",
        offering.toLowerCase() + " software",
      ],
      geo: "US",
    };
  }
}
