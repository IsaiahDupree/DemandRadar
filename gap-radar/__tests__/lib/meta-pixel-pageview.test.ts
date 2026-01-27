/**
 * Test: Meta Pixel PageView Tracking (META-002)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for automatic PageView event tracking with Meta Pixel
 */

import { initMetaPixel, trackPageView } from '@/lib/meta-pixel';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

describe('Meta Pixel PageView Tracking (META-002)', () => {
  beforeEach(() => {
    // Clear any existing fbq
    delete (window as any).fbq;
    delete (window as any)._fbq;

    // Initialize Meta Pixel
    initMetaPixel('123456789');
  });

  describe('trackPageView', () => {
    it('should track PageView event', () => {
      const mockFbq = jest.fn();
      window.fbq = mockFbq;

      trackPageView();

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView');
    });

    it('should track PageView with page path', () => {
      const mockFbq = jest.fn();
      window.fbq = mockFbq;

      trackPageView({ page: '/pricing' });

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView', { page: '/pricing' });
    });

    it('should track PageView with page title', () => {
      const mockFbq = jest.fn();
      window.fbq = mockFbq;

      trackPageView({
        page: '/dashboard',
        title: 'Dashboard - GapRadar'
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView', {
        page: '/dashboard',
        title: 'Dashboard - GapRadar'
      });
    });

    it('should handle fbq not initialized', () => {
      delete (window as any).fbq;

      expect(() => {
        trackPageView();
      }).not.toThrow();
    });

    it('should work in server-side rendering context', () => {
      // Simulate SSR (no window)
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        trackPageView();
      }).not.toThrow();

      // Restore window
      (global as any).window = originalWindow;
    });
  });

  describe('Automatic page tracking', () => {
    it('should track page on mount', () => {
      const mockFbq = jest.fn();
      window.fbq = mockFbq;

      // Simulate component mounting and calling trackPageView
      trackPageView();

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView');
    });

    it('should track different pages', () => {
      const mockFbq = jest.fn();
      window.fbq = mockFbq;

      // Track home page
      trackPageView({ page: '/' });

      // Track pricing page
      trackPageView({ page: '/pricing' });

      // Track dashboard
      trackPageView({ page: '/dashboard' });

      expect(mockFbq).toHaveBeenCalledTimes(3);
      expect(mockFbq).toHaveBeenNthCalledWith(1, 'track', 'PageView', { page: '/' });
      expect(mockFbq).toHaveBeenNthCalledWith(2, 'track', 'PageView', { page: '/pricing' });
      expect(mockFbq).toHaveBeenNthCalledWith(3, 'track', 'PageView', { page: '/dashboard' });
    });
  });

  describe('PageView properties', () => {
    it('should include referrer', () => {
      const mockFbq = jest.fn();
      window.fbq = mockFbq;

      trackPageView({
        page: '/dashboard',
        referrer: 'https://google.com'
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView', {
        page: '/dashboard',
        referrer: 'https://google.com'
      });
    });

    it('should include custom properties', () => {
      const mockFbq = jest.fn();
      window.fbq = mockFbq;

      trackPageView({
        page: '/pricing',
        plan: 'pro',
        utm_source: 'facebook'
      });

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView', {
        page: '/pricing',
        plan: 'pro',
        utm_source: 'facebook'
      });
    });
  });
});
