import {
  getFavoriteSearches,
  addFavoriteSearch,
  removeFavoriteSearch,
  isFavoriteSearch,
} from '@/lib/favorites';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/lib/supabase/client';

describe('Favorite Searches', () => {
  let mockSupabase: any;
  let mockChain: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock chain for fluent API
    mockChain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    };

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn(() => mockChain),
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: 'user-123' } },
          error: null,
        }),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
  });

  describe('getFavoriteSearches', () => {
    it('should return list of favorite searches for authenticated user', async () => {
      const mockFavorites = [
        {
          id: 'fav-1',
          user_id: 'user-123',
          query: 'AI tools for content creators',
          created_at: '2026-01-18T00:00:00.000Z',
        },
        {
          id: 'fav-2',
          user_id: 'user-123',
          query: 'SaaS alternatives',
          created_at: '2026-01-18T00:01:00.000Z',
        },
      ];

      mockChain.order.mockResolvedValue({
        data: mockFavorites,
        error: null,
      });

      const result = await getFavoriteSearches();

      expect(result).toEqual(mockFavorites);
      expect(mockSupabase.from).toHaveBeenCalledWith('favorite_searches');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return empty array when no favorites exist', async () => {
      mockChain.order.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await getFavoriteSearches();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      mockChain.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getFavoriteSearches()).rejects.toThrow('Database error');
    });
  });

  describe('addFavoriteSearch', () => {
    it('should add a new favorite search', async () => {
      const query = 'AI writing assistants';
      const mockFavorite = {
        id: 'fav-new',
        user_id: 'user-123',
        query,
        created_at: '2026-01-18T00:00:00.000Z',
      };

      mockChain.select.mockResolvedValue({
        data: [mockFavorite],
        error: null,
      });

      const result = await addFavoriteSearch(query);

      expect(result).toEqual(mockFavorite);
      expect(mockSupabase.from).toHaveBeenCalledWith('favorite_searches');
      expect(mockChain.insert).toHaveBeenCalledWith({
        query,
      });
      expect(mockChain.select).toHaveBeenCalled();
    });

    it('should throw error when insertion fails', async () => {
      mockChain.select.mockResolvedValue({
        data: null,
        error: { message: 'Insertion failed' },
      });

      await expect(addFavoriteSearch('test query')).rejects.toThrow('Insertion failed');
    });

    it('should trim whitespace from query', async () => {
      const query = '  AI tools  ';
      mockChain.select.mockResolvedValue({
        data: [{
          id: 'fav-1',
          user_id: 'user-123',
          query: 'AI tools',
          created_at: '2026-01-18T00:00:00.000Z',
        }],
        error: null,
      });

      await addFavoriteSearch(query);

      expect(mockChain.insert).toHaveBeenCalledWith({
        query: 'AI tools',
      });
    });
  });

  describe('removeFavoriteSearch', () => {
    it('should remove a favorite search by ID', async () => {
      mockChain.eq.mockResolvedValue({
        error: null,
      });

      await removeFavoriteSearch('fav-123');

      expect(mockSupabase.from).toHaveBeenCalledWith('favorite_searches');
      expect(mockChain.delete).toHaveBeenCalled();
      expect(mockChain.eq).toHaveBeenCalledWith('id', 'fav-123');
    });

    it('should throw error when deletion fails', async () => {
      mockChain.eq.mockResolvedValue({
        error: { message: 'Deletion failed' },
      });

      await expect(removeFavoriteSearch('fav-123')).rejects.toThrow('Deletion failed');
    });
  });

  describe('isFavoriteSearch', () => {
    it('should return true if query is favorited', async () => {
      mockChain.single.mockResolvedValue({
        data: { id: 'fav-1' },
        error: null,
      });

      const result = await isFavoriteSearch('AI tools');

      expect(result).toBe(true);
      expect(mockSupabase.from).toHaveBeenCalledWith('favorite_searches');
      expect(mockChain.eq).toHaveBeenCalledWith('query', 'AI tools');
    });

    it('should return false if query is not favorited', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      });

      const result = await isFavoriteSearch('Non-existent query');

      expect(result).toBe(false);
    });

    it('should be case-sensitive', async () => {
      mockChain.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      });

      const result = await isFavoriteSearch('AI TOOLS');

      expect(result).toBe(false);
      expect(mockChain.eq).toHaveBeenCalledWith('query', 'AI TOOLS');
    });
  });
});
