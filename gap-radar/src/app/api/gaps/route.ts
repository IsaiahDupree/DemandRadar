import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/gaps
 * Create a new gap opportunity from Chrome extension
 */
export async function POST(request: Request) {
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

    const body = await request.json();
    const { url, title, selectedText, timestamp, metadata } = body;

    // Validate required fields
    if (!url || !title) {
      return NextResponse.json(
        { error: 'URL and title are required' },
        { status: 400 }
      );
    }

    // Create a new gap opportunity (saved from Chrome extension)
    // For now, we'll save to a 'chrome_saved_gaps' table or 'saved_gaps' table
    const { data, error } = await supabase
      .from('saved_gaps')
      .insert({
        user_id: user.id,
        url,
        title,
        selected_text: selectedText,
        metadata: metadata || {},
        source: 'chrome_extension',
        created_at: timestamp || new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating gap:', error);
      throw error;
    }

    return NextResponse.json({
      data,
      message: 'Gap saved successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/gaps:', error);
    return NextResponse.json(
      { error: 'Failed to save gap' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/gaps
 * Get all saved gaps for the authenticated user
 */
export async function GET(request: Request) {
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

    // Get saved gaps
    const { data, error } = await supabase
      .from('saved_gaps')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gaps:', error);
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in GET /api/gaps:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gaps' },
      { status: 500 }
    );
  }
}
