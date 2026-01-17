import { NextResponse } from 'next/server';
import { fetchUserAdAccounts, fetchAccountAds } from '@/lib/collectors/meta';

export async function GET() {
  try {
    const accounts = await fetchUserAdAccounts();
    
    if (accounts.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No ad accounts found or META_ACCESS_TOKEN not configured',
        accounts: [],
      });
    }

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error) {
    console.error('Error fetching ad accounts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch ad accounts' },
      { status: 500 }
    );
  }
}
