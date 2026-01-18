import { NextRequest, NextResponse } from "next/server";
import { extractNicheData } from "@/lib/ai/niche-extractor";

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

    // Use AI to extract structured niche data
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
