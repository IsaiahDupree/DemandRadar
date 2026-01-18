/**
 * @jest-environment node
 */
import {
  getWhiteLabelConfig,
  setWhiteLabelConfig,
  deleteWhiteLabelConfig,
  canUseWhiteLabel,
  applyWhiteLabelToReport,
} from '@/lib/reports/white-label';

// Mock Supabase
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockSingle = jest.fn();
const mockInsert = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpsert = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: mockFrom,
  })),
}));

// Mock subscription permissions
jest.mock('@/lib/subscription/permissions', () => ({
  getUserSubscription: jest.fn(),
}));

import { getUserSubscription } from '@/lib/subscription/permissions';

describe('White Label Reports', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('canUseWhiteLabel', () => {
    it('should allow white-label for Studio plan users', async () => {
      const mockSupabase = { from: mockFrom } as any;
      (getUserSubscription as jest.Mock).mockResolvedValue({
        tier: 'studio',
        status: 'active',
      });

      const result = await canUseWhiteLabel(mockSupabase, 'user-123');

      expect(result.allowed).toBe(true);
    });

    it('should deny white-label for non-Studio plan users', async () => {
      const mockSupabase = { from: mockFrom } as any;
      (getUserSubscription as jest.Mock).mockResolvedValue({
        tier: 'agency',
        status: 'active',
      });

      const result = await canUseWhiteLabel(mockSupabase, 'user-123');

      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Studio plan');
    });

    it('should deny white-label for inactive subscriptions', async () => {
      const mockSupabase = { from: mockFrom } as any;
      (getUserSubscription as jest.Mock).mockResolvedValue({
        tier: 'studio',
        status: 'canceled',
      });

      const result = await canUseWhiteLabel(mockSupabase, 'user-123');

      expect(result.allowed).toBe(false);
    });
  });

  describe('getWhiteLabelConfig', () => {
    it('should retrieve white-label config for user', async () => {
      const mockSupabase = { from: mockFrom } as any;

      const mockConfig = {
        id: 'config-123',
        user_id: 'user-123',
        company_name: 'Acme Corp',
        logo_url: 'https://example.com/logo.png',
        primary_color: '#FF5733',
        secondary_color: '#333333',
        remove_branding: true,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-15T00:00:00Z',
      };

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: mockConfig, error: null });

      const result = await getWhiteLabelConfig(mockSupabase, 'user-123');

      expect(result.success).toBe(true);
      expect(result.config).toEqual({
        companyName: 'Acme Corp',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#FF5733',
        secondaryColor: '#333333',
        removeBranding: true,
      });
    });

    it('should return null config when none exists', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: null, error: null });

      const result = await getWhiteLabelConfig(mockSupabase, 'user-123');

      expect(result.success).toBe(true);
      expect(result.config).toBeNull();
    });

    it('should handle database errors', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ select: mockSelect });
      mockSelect.mockReturnValue({ eq: mockEq });
      mockEq.mockReturnValue({ single: mockSingle });
      mockSingle.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      const result = await getWhiteLabelConfig(mockSupabase, 'user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve white-label configuration');
    });
  });

  describe('setWhiteLabelConfig', () => {
    it('should create white-label config for eligible user', async () => {
      const mockSupabase = { from: mockFrom } as any;

      (getUserSubscription as jest.Mock).mockResolvedValue({
        tier: 'studio',
        status: 'active',
      });

      mockFrom.mockReturnValue({ upsert: mockUpsert });
      mockUpsert.mockResolvedValue({ error: null });

      const config = {
        companyName: 'Acme Corp',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#FF5733',
        secondaryColor: '#333333',
        removeBranding: true,
      };

      const result = await setWhiteLabelConfig(mockSupabase, 'user-123', config);

      expect(result.success).toBe(true);
      expect(mockUpsert).toHaveBeenCalledWith({
        user_id: 'user-123',
        company_name: 'Acme Corp',
        logo_url: 'https://example.com/logo.png',
        primary_color: '#FF5733',
        secondary_color: '#333333',
        remove_branding: true,
      });
    });

    it('should reject config for non-Studio users', async () => {
      const mockSupabase = { from: mockFrom } as any;

      (getUserSubscription as jest.Mock).mockResolvedValue({
        tier: 'agency',
        status: 'active',
      });

      const config = {
        companyName: 'Acme Corp',
      };

      const result = await setWhiteLabelConfig(mockSupabase, 'user-123', config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Studio plan');
      expect(mockUpsert).not.toHaveBeenCalled();
    });

    it('should handle partial config updates', async () => {
      const mockSupabase = { from: mockFrom } as any;

      (getUserSubscription as jest.Mock).mockResolvedValue({
        tier: 'studio',
        status: 'active',
      });

      mockFrom.mockReturnValue({ upsert: mockUpsert });
      mockUpsert.mockResolvedValue({ error: null });

      const partialConfig = {
        primaryColor: '#FF5733',
      };

      const result = await setWhiteLabelConfig(mockSupabase, 'user-123', partialConfig);

      expect(result.success).toBe(true);
    });
  });

  describe('deleteWhiteLabelConfig', () => {
    it('should delete white-label config', async () => {
      const mockSupabase = { from: mockFrom } as any;

      mockFrom.mockReturnValue({ delete: mockDelete });
      mockDelete.mockReturnValue({ eq: mockEq });
      mockEq.mockResolvedValue({ error: null });

      const result = await deleteWhiteLabelConfig(mockSupabase, 'user-123');

      expect(result.success).toBe(true);
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('applyWhiteLabelToReport', () => {
    it('should apply white-label config to report data', () => {
      const reportData = {
        branding: {
          companyName: 'DemandRadar',
          logoUrl: '/demandradar-logo.png',
          primaryColor: '#3B82F6',
        },
        content: 'Report content here',
      };

      const whiteLabel = {
        companyName: 'Acme Corp',
        logoUrl: 'https://example.com/logo.png',
        primaryColor: '#FF5733',
        secondaryColor: '#333333',
        removeBranding: true,
      };

      const result = applyWhiteLabelToReport(reportData, whiteLabel);

      expect(result.branding.companyName).toBe('Acme Corp');
      expect(result.branding.logoUrl).toBe('https://example.com/logo.png');
      expect(result.branding.primaryColor).toBe('#FF5733');
    });

    it('should preserve DemandRadar branding when removeBranding is false', () => {
      const reportData = {
        branding: {
          companyName: 'DemandRadar',
          logoUrl: '/demandradar-logo.png',
        },
        footer: 'Generated by DemandRadar',
      };

      const whiteLabel = {
        companyName: 'Acme Corp',
        removeBranding: false,
      };

      const result = applyWhiteLabelToReport(reportData, whiteLabel);

      // Should add company name but keep DemandRadar attribution
      expect(result.footer).toContain('DemandRadar');
    });

    it('should remove DemandRadar branding when removeBranding is true', () => {
      const reportData = {
        branding: {
          companyName: 'DemandRadar',
        },
        footer: 'Generated by DemandRadar',
      };

      const whiteLabel = {
        companyName: 'Acme Corp',
        removeBranding: true,
      };

      const result = applyWhiteLabelToReport(reportData, whiteLabel);

      expect(result.branding.companyName).toBe('Acme Corp');
      expect(result.footer).not.toContain('DemandRadar');
    });

    it('should return original report data when no white-label config', () => {
      const reportData = {
        branding: {
          companyName: 'DemandRadar',
        },
      };

      const result = applyWhiteLabelToReport(reportData, null);

      expect(result).toEqual(reportData);
    });
  });
});
