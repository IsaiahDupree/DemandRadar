import {
  createNiche,
  getNiche,
  listUserNiches,
  updateNiche,
  deleteNiche,
  type UserNiche,
} from '@/lib/niches';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Niche CRUD Operations', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
      order: jest.fn().mockReturnThis(),
      auth: {
        getUser: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockResolvedValue(mockSupabase);
  });

  describe('createNiche', () => {
    it('should create a new niche for the user', async () => {
      const userId = 'user-123';
      const nicheData = {
        offering_name: 'AI Marketing Tools',
        category: 'Marketing',
        niche_tags: ['AI', 'marketing', 'automation'],
        customer_profile: {
          type: 'B2B',
          segment: 'marketer',
          price_point: 'mid',
        },
        competitors: ['HubSpot', 'Marketo'],
        keywords: ['ai marketing', 'marketing automation'],
        geo: 'US',
      };

      const mockCreatedNiche = {
        id: 'niche-123',
        user_id: userId,
        ...nicheData,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedNiche,
        error: null,
      });

      const result = await createNiche(nicheData);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_niches');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        user_id: userId,
        ...nicheData,
      });
      expect(result).toEqual(mockCreatedNiche);
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const nicheData = {
        offering_name: 'Test Niche',
        category: 'Test',
      };

      await expect(createNiche(nicheData)).rejects.toThrow('User not authenticated');
    });

    it('should handle database errors', async () => {
      const userId = 'user-123';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database error'),
      });

      const nicheData = {
        offering_name: 'Test Niche',
        category: 'Test',
      };

      await expect(createNiche(nicheData)).rejects.toThrow('Database error');
    });
  });

  describe('getNiche', () => {
    it('should retrieve a niche by ID', async () => {
      const nicheId = 'niche-123';
      const mockNiche = {
        id: nicheId,
        user_id: 'user-123',
        offering_name: 'AI Marketing Tools',
        category: 'Marketing',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockNiche,
        error: null,
      });

      const result = await getNiche(nicheId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_niches');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', nicheId);
      expect(result).toEqual(mockNiche);
    });

    it('should return null if niche not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found error
      });

      const result = await getNiche('non-existent-id');

      expect(result).toBeNull();
    });

    it('should throw error for other database errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Database connection failed'),
      });

      await expect(getNiche('niche-123')).rejects.toThrow('Database connection failed');
    });
  });

  describe('listUserNiches', () => {
    it('should list all niches for a user', async () => {
      const userId = 'user-123';
      const mockNiches = [
        {
          id: 'niche-1',
          user_id: userId,
          offering_name: 'AI Marketing Tools',
          category: 'Marketing',
          is_active: true,
          created_at: '2026-01-01T00:00:00Z',
        },
        {
          id: 'niche-2',
          user_id: userId,
          offering_name: 'SaaS Analytics',
          category: 'Analytics',
          is_active: true,
          created_at: '2026-01-02T00:00:00Z',
        },
      ];

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.order.mockResolvedValue({
        data: mockNiches,
        error: null,
      });

      const result = await listUserNiches();

      expect(mockSupabase.from).toHaveBeenCalledWith('user_niches');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
      expect(result).toEqual(mockNiches);
    });

    it('should filter by active status when specified', async () => {
      const userId = 'user-123';
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: userId } },
        error: null,
      });

      mockSupabase.order.mockResolvedValue({
        data: [],
        error: null,
      });

      await listUserNiches({ activeOnly: true });

      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should throw error if user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(listUserNiches()).rejects.toThrow('User not authenticated');
    });
  });

  describe('updateNiche', () => {
    it('should update a niche', async () => {
      const nicheId = 'niche-123';
      const updates = {
        offering_name: 'Updated AI Marketing Tools',
        keywords: ['new', 'keywords'],
      };

      const mockUpdatedNiche = {
        id: nicheId,
        user_id: 'user-123',
        ...updates,
        updated_at: new Date().toISOString(),
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedNiche,
        error: null,
      });

      const result = await updateNiche(nicheId, updates);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_niches');
      expect(mockSupabase.update).toHaveBeenCalledWith(updates);
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', nicheId);
      expect(result).toEqual(mockUpdatedNiche);
    });

    it('should handle update errors', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: new Error('Update failed'),
      });

      await expect(updateNiche('niche-123', { offering_name: 'New Name' })).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('deleteNiche', () => {
    it('should delete a niche', async () => {
      const nicheId = 'niche-123';

      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: null,
      });

      await deleteNiche(nicheId);

      expect(mockSupabase.from).toHaveBeenCalledWith('user_niches');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', nicheId);
    });

    it('should handle delete errors', async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: new Error('Delete failed'),
      });

      await expect(deleteNiche('niche-123')).rejects.toThrow('Delete failed');
    });
  });
});
