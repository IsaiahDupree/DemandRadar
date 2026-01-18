import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * DELETE /api/folders/[id]/items/[itemId]
 * Remove an item from a folder
 */
export async function DELETE(
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

    const { id: folderId, itemId } = await params;

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

    // Remove item from folder
    const { error } = await supabase
      .from('folder_items')
      .delete()
      .eq('folder_id', folderId)
      .eq('item_id', itemId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ message: 'Item removed from folder' });
  } catch (error) {
    console.error('Error removing item from folder:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from folder' },
      { status: 500 }
    );
  }
}
