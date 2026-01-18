/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ExpertPicksPage from '@/app/dashboard/expert-picks/page';
import { createClient } from '@/lib/supabase/client';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Star: () => <div data-testid="icon-star" />,
  BookOpen: () => <div data-testid="icon-book-open" />,
  Trophy: () => <div data-testid="icon-trophy" />,
  Target: () => <div data-testid="icon-target" />,
  Copy: () => <div data-testid="icon-copy" />,
  ExternalLink: () => <div data-testid="icon-external-link" />,
  TrendingUp: () => <div data-testid="icon-trending-up" />,
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Expert Picks Page', () => {
  const mockStrategies = [
    {
      id: '1',
      name: 'Problem Agitation',
      slug: 'problem-agitation',
      description: 'Lead with the pain point your audience feels deeply',
      category: 'hook',
      framework: 'State problem, agitate, hint at solution',
      effectiveness_score: 10,
      difficulty: 'beginner',
      icon: '😤',
      times_used: 1250,
    },
    {
      id: '2',
      name: 'Pattern Interrupt',
      slug: 'pattern-interrupt',
      description: 'Start with something unexpected to stop the scroll',
      category: 'hook',
      framework: 'Open with surprising statement or visual',
      effectiveness_score: 9,
      difficulty: 'beginner',
      icon: '⚡',
      times_used: 980,
    },
  ];

  const mockWinningAds = [
    {
      id: '1',
      brand_name: 'VibeDream.AI',
      niche: 'no-code-builders',
      hook: 'They didn\'t hire a $50K developer',
      ad_format: 'ugc_video',
      is_featured: true,
      why_it_works: 'Attacks the two biggest objections immediately',
    },
  ];

  const mockPlaybooks = [
    {
      id: '1',
      niche: 'ai-writing-tools',
      niche_display_name: 'AI Writing Tools',
      description: 'AI-powered writing assistants',
      market_size: '$5B+',
      competition_level: 'high',
      growth_trend: 'growing',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the expert picks page with header', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
      limit: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<ExpertPicksPage />);

    await waitFor(() => {
      expect(screen.getByText('Expert Picks')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Curated collections of winning strategies/i)
    ).toBeInTheDocument();
  });

  it('should display strategy cards', async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'ad_strategies') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockStrategies, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<ExpertPicksPage />);

    await waitFor(() => {
      expect(screen.getByText('Problem Agitation')).toBeInTheDocument();
    });

    expect(screen.getByText('Pattern Interrupt')).toBeInTheDocument();
    expect(screen.getByText(/Lead with the pain point/i)).toBeInTheDocument();
  });

  it('should display winning ads section', async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'winning_ads_library') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockWinningAds, error: null }),
          };
        }
        if (table === 'ad_strategies') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockStrategies, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<ExpertPicksPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Expert Picks')).toBeInTheDocument();
    });

    // Verify Winning Ads tab exists
    const winningAdsTab = screen.getByRole('tab', { name: /Winning Ads/i });
    expect(winningAdsTab).toBeInTheDocument();
  });

  it('should display niche playbooks', async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'niche_playbooks') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: mockPlaybooks, error: null }),
          };
        }
        if (table === 'ad_strategies') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockStrategies, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<ExpertPicksPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('Expert Picks')).toBeInTheDocument();
    });

    // Verify Niche Playbooks tab exists
    const playbooksTab = screen.getByRole('tab', { name: /Niche Playbooks/i });
    expect(playbooksTab).toBeInTheDocument();
  });

  it('should show empty state when no collections', async () => {
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<ExpertPicksPage />);

    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('should filter strategies by category', async () => {
    const mockSupabase = {
      from: jest.fn((table: string) => {
        if (table === 'ad_strategies') {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockStrategies, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);

    render(<ExpertPicksPage />);

    await waitFor(() => {
      expect(screen.getByText('Problem Agitation')).toBeInTheDocument();
    });

    // Check for category filter buttons
    const filterButtons = screen.getAllByRole('button');
    expect(filterButtons.length).toBeGreaterThan(0);
  });
});
