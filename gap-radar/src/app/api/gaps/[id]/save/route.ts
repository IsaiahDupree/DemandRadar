import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: gapId } = await params;

    // Insert saved gap
    const { data, error } = await supabase
      .from('saved_gaps')
      .insert({
        user_id: user.id,
        gap_opportunity_id: gapId,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (already saved)
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'Gap already saved' },
          { status: 200 }
        );
      }
      throw error;
    }

    return NextResponse.json({ data, message: 'Gap saved successfully' });
  } catch (error) {
    console.error('Error saving gap:', error);
    return NextResponse.json(
      { error: 'Failed to save gap' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: gapId } = await params;

    // Delete saved gap
    const { error } = await supabase
      .from('saved_gaps')
      .delete()
      .eq('user_id', user.id)
      .eq('gap_opportunity_id', gapId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Gap removed from saved' });
  } catch (error) {
    console.error('Error removing saved gap:', error);
    return NextResponse.json(
      { error: 'Failed to remove saved gap' },
      { status: 500 }
    );
  }
}
