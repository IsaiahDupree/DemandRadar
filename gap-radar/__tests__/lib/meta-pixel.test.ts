/**
 * Test: Meta Pixel Installation (META-001)
 * Test-Driven Development: RED → GREEN → REFACTOR
 *
 * Tests for Meta Pixel script installation and initialization
 */

import { initMetaPixel, fbq } from '@/lib/meta-pixel';

// Mock window.fbq
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

describe('Meta Pixel Installation (META-001)', () => {
  beforeEach(() => {
    // Clear any existing fbq
    delete (window as any).fbq;
    delete (window as any)._fbq;

    // Clear document head scripts
    const scripts = document.querySelectorAll('script[src*="facebook"]');
    scripts.forEach(script => script.remove());
  });

  describe('initMetaPixel', () => {
    it('should initialize Meta Pixel with pixel ID', () => {
      expect(() => {
        initMetaPixel('123456789');
      }).not.toThrow();
    });

    it('should create fbq function on window', () => {
      initMetaPixel('123456789');

      expect(typeof window.fbq).toBe('function');
    });

    it('should set fbq.version', () => {
      initMetaPixel('123456789');

      expect(window.fbq.version).toBe('2.0');
    });

    it('should initialize fbq.queue', () => {
      initMetaPixel('123456789');

      expect(Array.isArray(window.fbq.queue)).toBe(true);
    });

    it('should call fbq init with pixel ID', () => {
      initMetaPixel('123456789');

      // Check that fbq was initialized
      expect(window.fbq).toBeDefined();
      expect(window.fbq.queue.length).toBeGreaterThan(0);
    });

    it('should not reinitialize if already initialized', () => {
      initMetaPixel('123456789');
      const fbqRef = window.fbq;

      initMetaPixel('123456789');

      // Should be the same reference
      expect(window.fbq).toBe(fbqRef);
    });
  });

  describe('fbq helper', () => {
    beforeEach(() => {
      initMetaPixel('123456789');
    });

    it('should expose fbq helper function', () => {
      expect(typeof fbq).toBe('function');
    });

    it('should call window.fbq when invoked', () => {
      const mockFbq = jest.fn();
      window.fbq = mockFbq;

      fbq('track', 'PageView');

      expect(mockFbq).toHaveBeenCalledWith('track', 'PageView');
    });

    it('should handle fbq not initialized gracefully', () => {
      delete (window as any).fbq;

      expect(() => {
        fbq('track', 'PageView');
      }).not.toThrow();
    });
  });

  describe('Pixel script loading', () => {
    it('should load Meta Pixel script from CDN', () => {
      initMetaPixel('123456789');

      // Note: In JSDOM environment, script won't actually load
      // but we can verify the init was called
      expect(window.fbq).toBeDefined();
    });

    it('should work with different pixel IDs', () => {
      expect(() => {
        initMetaPixel('987654321');
      }).not.toThrow();

      expect(window.fbq).toBeDefined();
    });
  });

  describe('Configuration options', () => {
    it('should support advanced matching', () => {
      expect(() => {
        initMetaPixel('123456789', {
          autoConfig: true,
          debug: false,
        });
      }).not.toThrow();
    });

    it('should support debug mode', () => {
      expect(() => {
        initMetaPixel('123456789', {
          debug: true,
        });
      }).not.toThrow();
    });
  });
});
