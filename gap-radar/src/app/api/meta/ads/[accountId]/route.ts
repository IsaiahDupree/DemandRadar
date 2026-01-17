import { NextRequest, NextResponse } from 'next/server';
import { fetchAccountAds } from '@/lib/collectors/meta';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ accountId: string }> }
) {
  try {
    const { accountId } = await params;
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID required' },
        { status: 400 }
      );
    }

    const ads = await fetchAccountAds(accountId);

    return NextResponse.json({
      success: true,
      accountId,
      count: ads.length,
      ads,
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ads' },
      { status: 500 }
    );
  }
}
