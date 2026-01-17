import { NextRequest, NextResponse } from 'next/server';
import { 
  collectAllSignals, 
  collectAllNicheSignals,
  generateBuildRecommendations 
} from '@/lib/demand-intelligence/signal-collector';

/**
 * POST /api/demand/collect
 * 
 * Trigger signal collection for a niche or all watched niches
 * 
 * Body:
 * - niche: string (optional - if not provided, collects for all watched niches)
 * - generate_recommendations: boolean (optional - generate build recommendations)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { niche, generate_recommendations = false } = body;

    let result;

    if (niche) {
      // Collect for specific niche
      result = await collectAllSignals(niche);
      
      // Optionally generate recommendations
      let recommendation = null;
      if (generate_recommendations) {
        recommendation = await generateBuildRecommendations(niche);
      }

      return NextResponse.json({
        success: true,
        niche,
        signals_collected: result.totalSignals,
        pain_points: result.painPoints.length,
        ad_signals: result.adSpend.length,
        recommendation,
      });
    } else {
      // Collect for all watched niches
      await collectAllNicheSignals();
      
      return NextResponse.json({
        success: true,
        message: 'Signal collection started for all watched niches',
      });
    }
  } catch (error) {
    console.error('Error in signal collection:', error);
    return NextResponse.json(
      { error: 'Failed to collect signals', details: String(error) },
      { status: 500 }
    );
  }
}
