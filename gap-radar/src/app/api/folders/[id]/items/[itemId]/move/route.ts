import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * POST /api/folders/[id]/items/[itemId]/move
 * Move an item from one folder to another
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
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

    const { id: sourceFolderId, itemId } = await params;
    const { target_folder_id } = await request.json();

    if (!target_folder_id) {
      return NextResponse.json(
        { error: 'target_folder_id is required' },
        { status: 400 }
      );
    }

    // Verify both folders are owned by the user
    const { data: folders, error: foldersError } = await supabase
      .from('folders')
      .select('id')
      .in('id', [sourceFolderId, target_folder_id])
      .eq('user_id', user.id);

    if (foldersError || !folders || folders.length !== 2) {
      return NextResponse.json(
        { error: 'One or both folders not found' },
        { status: 404 }
      );
    }

    // Get the item from source folder to know its type
    const { data: sourceItem, error: sourceError } = await supabase
      .from('folder_items')
      .select('item_type')
      .eq('folder_id', sourceFolderId)
      .eq('item_id', itemId)
      .single();

    if (sourceError || !sourceItem) {
      return NextResponse.json(
        { error: 'Item not found in source folder' },
        { status: 404 }
      );
    }

    // Delete from source folder
    const { error: deleteError } = await supabase
      .from('folder_items')
      .delete()
      .eq('folder_id', sourceFolderId)
      .eq('item_id', itemId);

    if (deleteError) {
      throw deleteError;
    }

    // Add to target folder
    const { data: newItem, error: insertError } = await supabase
      .from('folder_items')
      .insert({
        folder_id: target_folder_id,
        item_id: itemId,
        item_type: sourceItem.item_type,
      })
      .select()
      .single();

    if (insertError) {
      // If insert fails, try to restore to source folder
      await supabase
        .from('folder_items')
        .insert({
          folder_id: sourceFolderId,
          item_id: itemId,
          item_type: sourceItem.item_type,
        });

      throw insertError;
    }

    return NextResponse.json({
      message: 'Item moved successfully',
      item: newItem,
    });
  } catch (error) {
    console.error('Error moving item:', error);
    return NextResponse.json(
      { error: 'Failed to move item' },
      { status: 500 }
    );
  }
}
