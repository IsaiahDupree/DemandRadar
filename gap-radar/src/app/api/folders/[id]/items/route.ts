import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/folders/[id]/items
 * List all items in a folder
 */
export async function GET(
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

    const { id: folderId } = await params;

    // Verify folder ownership
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Fetch items
    const { data: items, error } = await supabase
      .from('folder_items')
      .select('*')
      .eq('folder_id', folderId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching folder items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folder items' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/folders/[id]/items
 * Add an item to a folder
 */
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

    const { id: folderId } = await params;
    const { item_id, item_type } = await request.json();

    // Validate inputs
    if (!item_id || !item_type) {
      return NextResponse.json(
        { error: 'item_id and item_type are required' },
        { status: 400 }
      );
    }

    const validTypes = ['gap', 'report', 'concept', 'run'];
    if (!validTypes.includes(item_type)) {
      return NextResponse.json(
        { error: `item_type must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify folder ownership
    const { data: folder, error: folderError } = await supabase
      .from('folders')
      .select('id')
      .eq('id', folderId)
      .eq('user_id', user.id)
      .single();

    if (folderError || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    // Add item to folder
    const { data: item, error } = await supabase
      .from('folder_items')
      .insert({
        folder_id: folderId,
        item_id,
        item_type,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (item already in folder)
      if (error.code === '23505') {
        return NextResponse.json(
          { message: 'Item already in this folder' },
          { status: 200 }
        );
      }
      throw error;
    }

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error) {
    console.error('Error adding item to folder:', error);
    return NextResponse.json(
      { error: 'Failed to add item to folder' },
      { status: 500 }
    );
  }
}
