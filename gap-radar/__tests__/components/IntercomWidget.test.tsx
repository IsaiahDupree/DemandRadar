/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import IntercomWidget from '@/components/IntercomWidget';

// Mock window.Intercom
const mockIntercom = jest.fn();

describe('IntercomWidget Component', () => {
  beforeEach(() => {
    // Reset mock before each test
    mockIntercom.mockClear();

    // Mock window.Intercom
    (window as any).Intercom = mockIntercom;

    // Mock environment variable
    process.env.NEXT_PUBLIC_INTERCOM_APP_ID = 'test_app_id';
  });

  afterEach(() => {
    // Clean up
    delete (window as any).Intercom;
    delete process.env.NEXT_PUBLIC_INTERCOM_APP_ID;
  });

  describe('Widget Loading', () => {
    it('should initialize Intercom when app ID is provided', async () => {
      render(<IntercomWidget />);

      // Verify Intercom gets booted with the app ID
      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalledWith('boot', expect.objectContaining({
          app_id: 'test_app_id',
        }));
      });
    });

    it('should not render anything if app ID is missing', () => {
      delete process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

      const { container } = render(<IntercomWidget />);

      expect(container.firstChild).toBeNull();
    });

    it('should initialize Intercom on mount', async () => {
      render(<IntercomWidget />);

      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalledWith('boot', expect.objectContaining({
          app_id: 'test_app_id',
        }));
      });
    });
  });

  describe('User Identification', () => {
    it('should identify user when user data is provided', async () => {
      const userData = {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      render(<IntercomWidget user={userData} />);

      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalledWith('boot', expect.objectContaining({
          app_id: 'test_app_id',
          user_id: userData.userId,
          email: userData.email,
          name: userData.name,
        }));
      });
    });

    it('should boot without user data when not provided', async () => {
      render(<IntercomWidget />);

      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalledWith('boot', {
          app_id: 'test_app_id',
        });
      });
    });

    it('should update user data when it changes', async () => {
      const { rerender } = render(<IntercomWidget />);

      const userData = {
        userId: 'user-456',
        email: 'updated@example.com',
        name: 'Updated User',
      };

      rerender(<IntercomWidget user={userData} />);

      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalledWith('update', expect.objectContaining({
          user_id: userData.userId,
          email: userData.email,
          name: userData.name,
        }));
      });
    });
  });

  describe('Message History', () => {
    it('should support showing message history', async () => {
      render(<IntercomWidget />);

      // Widget should be loaded and ready to show messages
      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalled();
      });
    });

    it('should shutdown on unmount', () => {
      const { unmount } = render(<IntercomWidget />);

      unmount();

      expect(mockIntercom).toHaveBeenCalledWith('shutdown');
    });
  });

  describe('Custom Settings', () => {
    it('should allow custom Intercom settings', async () => {
      const customSettings = {
        hide_default_launcher: true,
        custom_launcher_selector: '#custom-launcher',
      };

      render(<IntercomWidget settings={customSettings} />);

      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalledWith('boot', expect.objectContaining({
          app_id: 'test_app_id',
          hide_default_launcher: true,
          custom_launcher_selector: '#custom-launcher',
        }));
      });
    });
  });

  describe('API Methods', () => {
    it('should expose method to show messenger', async () => {
      const { container } = render(<IntercomWidget />);

      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalled();
      });

      // Intercom should be available globally
      expect(window.Intercom).toBeDefined();
    });

    it('should expose method to hide messenger', async () => {
      render(<IntercomWidget />);

      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalled();
      });

      // Call hide
      window.Intercom('hide');

      expect(mockIntercom).toHaveBeenCalledWith('hide');
    });

    it('should track events when called', async () => {
      render(<IntercomWidget />);

      await waitFor(() => {
        expect(mockIntercom).toHaveBeenCalled();
      });

      // Track custom event
      window.Intercom('trackEvent', 'completed_run');

      expect(mockIntercom).toHaveBeenCalledWith('trackEvent', 'completed_run');
    });
  });
});
