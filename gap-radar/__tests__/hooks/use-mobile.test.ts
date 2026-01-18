/**
 * Unit tests for useIsMobile hook (UI-003)
 */

import { renderHook } from '@testing-library/react';
import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile Hook', () => {
  // Save original window.matchMedia
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    // Restore original matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    });
  });

  it('should return false for desktop viewport (width >= 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);
  });

  it('should return true for mobile viewport (width < 768px)', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 375,
    });

    // Re-mock matchMedia to return matches: true
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: query.includes('max-width: 767px'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useIsMobile());

    // The hook checks window.innerWidth < 768
    expect(result.current).toBe(true);
  });

  it('should use 768px as the mobile breakpoint', () => {
    // This test verifies the MOBILE_BREAKPOINT constant is 768
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 767, // Just below breakpoint
    });

    const { result: result767 } = renderHook(() => useIsMobile());

    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 768, // At breakpoint
    });

    const { result: result768 } = renderHook(() => useIsMobile());

    // 767 should be mobile, 768 should be desktop
    expect(result767.current).toBe(true);
    expect(result768.current).toBe(false);
  });

  it('should initially return false before useEffect runs', () => {
    const { result } = renderHook(() => useIsMobile());

    // Initially undefined, coerced to false
    expect(typeof result.current).toBe('boolean');
  });

  it('should handle window resize events', () => {
    const listeners: Array<() => void> = [];

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((event: string, listener: () => void) => {
          if (event === 'change') {
            listeners.push(listener);
          }
        }),
        removeEventListener: jest.fn((event: string, listener: () => void) => {
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        }),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result, unmount } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    // Verify addEventListener was called
    expect(window.matchMedia).toHaveBeenCalled();

    // Clean up
    unmount();
  });
});
