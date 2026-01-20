import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PATCH /api/competitors/alerts/[id]
 *
 * Update an alert (mark as read or dismissed)
 *
 * Body:
 * - is_read: boolean - mark alert as read/unread
 * - is_dismissed: boolean - dismiss the alert
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { is_read, is_dismissed } = body;

    // Validate that at least one field is provided
    if (is_read === undefined && is_dismissed === undefined) {
      return NextResponse.json(
        { error: 'At least one field (is_read or is_dismissed) must be provided' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: any = {};
    if (is_read !== undefined) {
      updates.is_read = is_read;
    }
    if (is_dismissed !== undefined) {
      updates.is_dismissed = is_dismissed;
    }

    // Update the alert
    const { data: alert, error } = await supabase
      .from('competitor_alerts')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', user.id) // Ensure user owns this alert
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(alert);
  } catch (error: any) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update alert' },
      { status: 500 }
    );
  }
}
