/**
 * Tests for Alert Notifications Component (INTEL-012)
 *
 * @jest-environment jsdom
 *
 * Acceptance Criteria:
 * - Badge count displays number of unread alerts
 * - Dropdown list shows alerts
 * - Click to view alert details
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertNotifications } from '@/components/AlertNotifications';
import type { CompetitorAlert } from '@/types';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, onClick }: any) => {
    return <a href={href} onClick={onClick}>{children}</a>;
  };
});

describe('AlertNotifications Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockAlerts: CompetitorAlert[] = [
    {
      id: '1',
      user_id: 'user-123',
      competitor_id: 'comp-1',
      alert_type: 'new_campaign',
      title: 'Competitor X launched 7 new ads',
      description: 'Detected 7 new ad creatives in the last 24 hours',
      data: { count: 7 },
      is_read: false,
      is_dismissed: false,
      created_at: new Date('2026-01-20T10:00:00Z'),
    },
    {
      id: '2',
      user_id: 'user-123',
      competitor_id: 'comp-2',
      alert_type: 'ad_spike',
      title: 'Competitor Y ad volume up 65%',
      description: 'Ad volume increased significantly',
      data: { percent_change: 65 },
      is_read: false,
      is_dismissed: false,
      created_at: new Date('2026-01-19T14:00:00Z'),
    },
    {
      id: '3',
      user_id: 'user-123',
      competitor_id: 'comp-3',
      alert_type: 'campaign_ended',
      title: 'Competitor Z stopped their top campaign',
      description: 'Long-running campaign has ended',
      data: { run_days: 45 },
      is_read: true,
      is_dismissed: false,
      created_at: new Date('2026-01-18T09:00:00Z'),
    },
  ];

  describe('Badge Count', () => {
    it('should display correct count of unread alerts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: mockAlerts }),
      });

      render(<AlertNotifications />);

      await waitFor(() => {
        const badge = screen.getByTestId('alert-badge');
        expect(badge).toHaveTextContent('2'); // 2 unread alerts
      });
    });

    it('should not display badge when there are no unread alerts', async () => {
      const readAlerts = mockAlerts.map(a => ({ ...a, is_read: true }));
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: readAlerts }),
      });

      render(<AlertNotifications />);

      await waitFor(() => {
        expect(screen.queryByTestId('alert-badge')).not.toBeInTheDocument();
      });
    });

    it('should display 0 when there are no alerts', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: [] }),
      });

      render(<AlertNotifications />);

      await waitFor(() => {
        expect(screen.queryByTestId('alert-badge')).not.toBeInTheDocument();
      });
    });
  });

  describe('Dropdown List', () => {
    it('should open dropdown when bell icon is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: mockAlerts }),
      });

      render(<AlertNotifications />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-badge')).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /alerts/i });
      await user.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText('Competitor X launched 7 new ads')).toBeInTheDocument();
        expect(screen.getByText('Competitor Y ad volume up 65%')).toBeInTheDocument();
      });
    });

    it('should display alerts in chronological order (newest first)', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: mockAlerts }),
      });

      render(<AlertNotifications />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-badge')).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /alerts/i });
      await user.click(bellButton);

      await waitFor(() => {
        const alertTitles = screen.getAllByTestId(/^alert-item-/);
        expect(alertTitles[0]).toHaveTextContent('Competitor X launched 7 new ads');
        expect(alertTitles[1]).toHaveTextContent('Competitor Y ad volume up 65%');
      });
    });

    it('should show empty state when no alerts exist', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: [] }),
      });

      render(<AlertNotifications />);

      const bellButton = screen.getByRole('button', { name: /alerts/i });
      await user.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
      });
    });

    it('should visually distinguish read vs unread alerts', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: mockAlerts }),
      });

      render(<AlertNotifications />);

      const bellButton = screen.getByRole('button', { name: /alerts/i });
      await user.click(bellButton);

      await waitFor(() => {
        const unreadAlert = screen.getByTestId('alert-item-1');
        const readAlert = screen.getByTestId('alert-item-3');

        expect(unreadAlert.className).toContain('font-semibold');
        expect(readAlert.className).not.toContain('font-semibold');
      });
    });
  });

  describe('Click to View', () => {
    it('should mark alert as read when clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ alerts: mockAlerts }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true }),
        });

      render(<AlertNotifications />);

      await waitFor(() => {
        expect(screen.getByTestId('alert-badge')).toBeInTheDocument();
      });

      const bellButton = screen.getByRole('button', { name: /alerts/i });
      await user.click(bellButton);

      await waitFor(() => {
        const alert = screen.getByTestId('alert-item-1');
        fireEvent.click(alert);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/competitors/alerts/1'),
          expect.objectContaining({
            method: 'PATCH',
            body: JSON.stringify({ is_read: true }),
          })
        );
      });
    });

    it('should navigate to competitor detail when alert is clicked', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ alerts: mockAlerts }),
      });

      render(<AlertNotifications />);

      const bellButton = screen.getByRole('button', { name: /alerts/i });
      await user.click(bellButton);

      await waitFor(() => {
        const alert = screen.getByTestId('alert-item-1');
        const link = alert.closest('a');
        expect(link).toHaveAttribute('href', '/dashboard/competitors/comp-1');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<AlertNotifications />);

      await waitFor(() => {
        const bellButton = screen.getByRole('button', { name: /alerts/i });
        expect(bellButton).toBeInTheDocument();
      });

      // Should not crash and should still be clickable
      const bellButton = screen.getByRole('button', { name: /alerts/i });
      await user.click(bellButton);

      await waitFor(() => {
        expect(screen.getByText(/no alerts/i)).toBeInTheDocument();
      });
    });
  });
});
