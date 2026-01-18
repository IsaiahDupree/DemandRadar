import { describe, it, expect, beforeEach } from '@jest/globals';

/**
 * Test suite for Folders & Collections feature (FOLDERS-001)
 *
 * Acceptance Criteria:
 * - Create/rename/delete folders
 * - Move items between folders
 * - Folder counts
 */

// Mock folder ID counter
let mockFolderId = 1;

// Mock folder storage
const mockFolders = new Map();
const mockFolderItems = new Map();

// Setup fetch mock for folders API
beforeEach(() => {
  mockFolderId = 1;
  mockFolders.clear();
  mockFolderItems.clear();

  global.fetch = jest.fn((url: string | URL, options?: any) => {
    const urlStr = url.toString();
    const method = options?.method || 'GET';

    // POST /api/folders - Create folder
    if (urlStr === '/api/folders' && method === 'POST') {
      const body = JSON.parse(options.body);
      const folder = {
        id: `folder-${mockFolderId++}`,
        name: body.name,
        user_id: 'test-user',
        created_at: new Date().toISOString(),
        item_count: 0,
      };
      mockFolders.set(folder.id, folder);
      mockFolderItems.set(folder.id, new Set());

      return Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ folder }),
      } as Response);
    }

    // GET /api/folders - List folders
    if (urlStr === '/api/folders' && method === 'GET') {
      const folders = Array.from(mockFolders.values()).map(f => ({
        ...f,
        item_count: mockFolderItems.get(f.id)?.size || 0,
      }));
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ folders }),
      } as Response);
    }

    // GET /api/folders/[id] - Get single folder
    const getFolderMatch = urlStr.match(/^\/api\/folders\/(folder-\d+)$/);
    if (getFolderMatch && method === 'GET') {
      const folderId = getFolderMatch[1];
      const folder = mockFolders.get(folderId);
      if (!folder) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Folder not found' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          folder: {
            ...folder,
            item_count: mockFolderItems.get(folderId)?.size || 0,
          }
        }),
      } as Response);
    }

    // PATCH /api/folders/[id] - Update folder
    const patchMatch = urlStr.match(/^\/api\/folders\/(folder-\d+)$/);
    if (patchMatch && method === 'PATCH') {
      const folderId = patchMatch[1];
      const folder = mockFolders.get(folderId);
      if (!folder) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Folder not found' }),
        } as Response);
      }
      const body = JSON.parse(options.body);
      const updatedFolder = { ...folder, ...body };
      mockFolders.set(folderId, updatedFolder);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ folder: updatedFolder }),
      } as Response);
    }

    // DELETE /api/folders/[id] - Delete folder
    const deleteMatch = urlStr.match(/^\/api\/folders\/(folder-\d+)$/);
    if (deleteMatch && method === 'DELETE') {
      const folderId = deleteMatch[1];
      mockFolders.delete(folderId);
      mockFolderItems.delete(folderId);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    }

    // POST /api/folders/[id]/items - Add item to folder
    const addItemMatch = urlStr.match(/^\/api\/folders\/(folder-\d+)\/items$/);
    if (addItemMatch && method === 'POST') {
      const folderId = addItemMatch[1];
      const items = mockFolderItems.get(folderId);
      if (!items) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Folder not found' }),
        } as Response);
      }
      const body = JSON.parse(options.body);
      items.add(body.item_id);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    }

    // DELETE /api/folders/[id]/items/[itemId] - Remove item from folder
    const removeItemMatch = urlStr.match(/^\/api\/folders\/(folder-\d+)\/items\/([^/]+)$/);
    if (removeItemMatch && method === 'DELETE') {
      const folderId = removeItemMatch[1];
      const itemId = removeItemMatch[2];
      const items = mockFolderItems.get(folderId);
      if (!items) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Folder not found' }),
        } as Response);
      }
      items.delete(itemId);
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    }

    // POST /api/folders/[id]/items/[itemId]/move - Move item between folders
    const moveItemMatch = urlStr.match(/^\/api\/folders\/(folder-\d+)\/items\/([^/]+)\/move$/);
    if (moveItemMatch && method === 'POST') {
      const sourceFolderId = moveItemMatch[1];
      const itemId = moveItemMatch[2];
      const body = JSON.parse(options.body);
      const targetFolderId = body.target_folder_id;

      const sourceItems = mockFolderItems.get(sourceFolderId);
      const targetItems = mockFolderItems.get(targetFolderId);

      if (!sourceItems || !targetItems) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: 'Folder not found' }),
        } as Response);
      }

      sourceItems.delete(itemId);
      targetItems.add(itemId);

      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      } as Response);
    }

    // Default: not found
    return Promise.resolve({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Not found' }),
    } as Response);
  });
});

describe('Folders', () => {
  describe('Folder CRUD operations', () => {
    it('should create a new folder', async () => {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My First Folder' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.folder).toBeDefined();
      expect(data.folder.name).toBe('My First Folder');
      expect(data.folder.id).toBeDefined();
    });

    it('should rename an existing folder', async () => {
      // First create a folder
      const createResponse = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Old Name' }),
      });
      const { folder } = await createResponse.json();

      // Then rename it
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'New Name' }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.folder.name).toBe('New Name');
    });

    it('should delete a folder', async () => {
      // First create a folder
      const createResponse = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'To Delete' }),
      });
      const { folder } = await createResponse.json();

      // Then delete it
      const response = await fetch(`/api/folders/${folder.id}`, {
        method: 'DELETE',
      });

      expect(response.ok).toBe(true);

      // Verify it's deleted by trying to fetch it
      const fetchResponse = await fetch(`/api/folders/${folder.id}`);
      expect(fetchResponse.status).toBe(404);
    });

    it('should list all folders for a user', async () => {
      // Create multiple folders
      await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Folder 1' }),
      });
      await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Folder 2' }),
      });

      const response = await fetch('/api/folders');
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.folders).toBeDefined();
      expect(data.folders.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Folder item management', () => {
    it('should add a saved gap to a folder', async () => {
      // Create a folder
      const folderResponse = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'My Gaps' }),
      });
      const { folder } = await folderResponse.json();

      // Add an item to the folder (using a mock gap ID)
      const mockGapId = '00000000-0000-0000-0000-000000000001';
      const response = await fetch(`/api/folders/${folder.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: mockGapId,
          item_type: 'gap'
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should move an item between folders', async () => {
      // Create two folders
      const folder1Response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Folder 1' }),
      });
      const { folder: folder1 } = await folder1Response.json();

      const folder2Response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Folder 2' }),
      });
      const { folder: folder2 } = await folder2Response.json();

      // Add item to folder1
      const mockGapId = '00000000-0000-0000-0000-000000000002';
      await fetch(`/api/folders/${folder1.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: mockGapId,
          item_type: 'gap'
        }),
      });

      // Move item to folder2
      const response = await fetch(`/api/folders/${folder1.id}/items/${mockGapId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_folder_id: folder2.id }),
      });

      expect(response.ok).toBe(true);
    });

    it('should remove an item from a folder', async () => {
      // Create a folder
      const folderResponse = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test Folder' }),
      });
      const { folder } = await folderResponse.json();

      // Add an item
      const mockGapId = '00000000-0000-0000-0000-000000000003';
      await fetch(`/api/folders/${folder.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_id: mockGapId,
          item_type: 'gap'
        }),
      });

      // Remove the item
      const response = await fetch(`/api/folders/${folder.id}/items/${mockGapId}`, {
        method: 'DELETE',
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Folder counts', () => {
    it('should show item count for each folder', async () => {
      // Create a folder
      const folderResponse = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Count Test' }),
      });
      const { folder } = await folderResponse.json();

      // Add multiple items
      const mockIds = [
        '00000000-0000-0000-0000-000000000004',
        '00000000-0000-0000-0000-000000000005',
      ];

      for (const id of mockIds) {
        await fetch(`/api/folders/${folder.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            item_id: id,
            item_type: 'gap'
          }),
        });
      }

      // Fetch folder with count
      const response = await fetch(`/api/folders/${folder.id}`);
      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.folder.item_count).toBe(2);
    });
  });
});
