'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initAcquisitionTracking } from '@/lib/tracking/acquisition';
import { initMetaPixel, trackPageView } from '@/lib/meta-pixel';

/**
 * Tracking Provider Component
 *
 * Initializes all tracking systems when the app loads:
 * - User event tracking (internal analytics)
 * - Meta Pixel (Facebook advertising)
 * - Automatic PageView tracking on route changes
 *
 * This should be placed in the root layout.
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize user event tracking
    initAcquisitionTracking();

    // Initialize Meta Pixel (META-001)
    const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
    if (metaPixelId) {
      initMetaPixel(metaPixelId, {
        autoConfig: true,
        debug: process.env.NODE_ENV === 'development',
      });
    }
  }, []);

  // Track page views on route changes (META-002)
  useEffect(() => {
    trackPageView({
      page: pathname,
      title: typeof document !== 'undefined' ? document.title : undefined,
    });
  }, [pathname]);

  return <>{children}</>;
}
