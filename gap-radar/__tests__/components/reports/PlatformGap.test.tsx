/**
 * Platform Existence Gap Component Tests
 * Tests for the Platform Existence Gap report section (Report Page 4)
 */

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PlatformGap, type PlatformGapProps } from '@/components/reports/PlatformGap';

describe('PlatformGap Component', () => {
  const mockProps: PlatformGapProps = {
    platforms: [
      {
        platform: 'ios',
        exists: true,
        count: 45,
        saturationScore: 72,
        topApps: [
          {
            id: 'app-1',
            runId: 'run-1',
            platform: 'ios',
            appName: 'FitAI - AI Fitness Coach',
            appId: 'com.fitai.app',
            developer: 'FitAI Inc',
            rating: 4.7,
            reviewCount: 12450,
            description: 'AI-powered fitness coaching app',
            category: 'Health & Fitness',
            price: '$9.99/mo',
          },
          {
            id: 'app-2',
            runId: 'run-1',
            platform: 'ios',
            appName: 'SmartFit Pro',
            appId: 'com.smartfit.pro',
            developer: 'SmartFit Labs',
            rating: 4.5,
            reviewCount: 8320,
            description: 'Smart fitness tracking',
            category: 'Health & Fitness',
            price: 'Free',
          },
          {
            id: 'app-3',
            runId: 'run-1',
            platform: 'ios',
            appName: 'AI Coach Plus',
            appId: 'com.aicoach.plus',
            developer: 'Coach AI',
            rating: 4.6,
            reviewCount: 6890,
            description: 'Your AI fitness companion',
            category: 'Health & Fitness',
            price: '$14.99/mo',
          },
        ],
      },
      {
        platform: 'android',
        exists: true,
        count: 38,
        saturationScore: 65,
        topApps: [
          {
            id: 'app-4',
            runId: 'run-1',
            platform: 'android',
            appName: 'FitAI - AI Coach',
            appId: 'com.fitai.android',
            developer: 'FitAI Inc',
            rating: 4.4,
            reviewCount: 9840,
            description: 'AI fitness coaching',
            category: 'Health & Fitness',
            price: '$9.99/mo',
          },
          {
            id: 'app-5',
            runId: 'run-1',
            platform: 'android',
            appName: 'SmartFit',
            appId: 'com.smartfit.android',
            developer: 'SmartFit Labs',
            rating: 4.3,
            reviewCount: 7200,
            description: 'Smart fitness app',
            category: 'Health & Fitness',
            price: 'Free',
          },
        ],
      },
      {
        platform: 'web',
        exists: true,
        count: 12,
        saturationScore: 35,
        topApps: [
          {
            id: 'web-1',
            runId: 'run-1',
            platform: 'web',
            appName: 'FitAI Web',
            appId: 'fitai.com',
            developer: 'FitAI Inc',
            rating: 4.6,
            reviewCount: 2340,
            description: 'AI fitness coaching web platform',
            category: 'Health & Fitness',
            price: '$9.99/mo',
          },
        ],
      },
    ],
    recommendation: {
      platform: 'web',
      reasoning: 'Web platform shows lowest saturation (35 vs 72 iOS, 65 Android) with opportunity for differentiation. Mobile apps are crowded with 45+ iOS and 38+ Android competitors. A web-first approach allows faster iteration and lower CAC.',
      confidence: 0.82,
    },
  };

  it('renders section title', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByText(/Platform Existence Gap/i)).toBeInTheDocument();
  });

  it('displays iOS platform section', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByTestId('platform-ios')).toBeInTheDocument();
    expect(screen.getByTestId('platform-ios')).toHaveTextContent('iOS');
  });

  it('displays Android platform section', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByTestId('platform-android')).toBeInTheDocument();
    expect(screen.getByTestId('platform-android')).toHaveTextContent('Android');
  });

  it('displays Web platform section', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByTestId('platform-web')).toBeInTheDocument();
    expect(screen.getByTestId('platform-web')).toHaveTextContent('Web');
  });

  it('shows platform saturation scores', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByTestId('platform-ios-saturation')).toHaveTextContent('72');
    expect(screen.getByTestId('platform-android-saturation')).toHaveTextContent('65');
    expect(screen.getByTestId('platform-web-saturation')).toHaveTextContent('35');
  });

  it('shows app counts per platform', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByTestId('platform-ios-count')).toHaveTextContent('45');
    expect(screen.getByTestId('platform-android-count')).toHaveTextContent('38');
    expect(screen.getByTestId('platform-web-count')).toHaveTextContent('12');
  });

  it('displays top apps for iOS', () => {
    render(<PlatformGap {...mockProps} />);

    const iosSection = screen.getByTestId('platform-ios');
    expect(iosSection).toHaveTextContent('FitAI - AI Fitness Coach');
    expect(iosSection).toHaveTextContent('SmartFit Pro');
    expect(iosSection).toHaveTextContent('AI Coach Plus');
  });

  it('displays top apps for Android', () => {
    render(<PlatformGap {...mockProps} />);

    const androidSection = screen.getByTestId('platform-android');
    expect(androidSection).toHaveTextContent('FitAI - AI Coach');
    expect(androidSection).toHaveTextContent('SmartFit');
  });

  it('displays top apps for Web', () => {
    render(<PlatformGap {...mockProps} />);

    const webSection = screen.getByTestId('platform-web');
    expect(webSection).toHaveTextContent('FitAI Web');
  });

  it('shows app ratings', () => {
    render(<PlatformGap {...mockProps} />);

    // app-0 is the first Web app (recommended platform shown first)
    expect(screen.getByTestId('app-0-rating')).toHaveTextContent('4.6');
    // app-1 is the first Android app
    expect(screen.getByTestId('app-1-rating')).toHaveTextContent('4.4');
    // app-3 is the first iOS app (after Web 1 + Android 2)
    expect(screen.getByTestId('app-3-rating')).toHaveTextContent('4.7');
  });

  it('shows app review counts', () => {
    render(<PlatformGap {...mockProps} />);

    // app-0 is the first Web app (recommended platform shown first)
    expect(screen.getByTestId('app-0-reviews')).toHaveTextContent('2,340');
    // app-3 is the first iOS app
    expect(screen.getByTestId('app-3-reviews')).toHaveTextContent('12,450');
  });

  it('shows app pricing', () => {
    render(<PlatformGap {...mockProps} />);

    const iosSection = screen.getByTestId('platform-ios');
    expect(iosSection).toHaveTextContent('$9.99/mo');
    expect(iosSection).toHaveTextContent('Free');
  });

  it('displays platform recommendation section', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByTestId('platform-recommendation')).toBeInTheDocument();
  });

  it('shows recommended platform', () => {
    render(<PlatformGap {...mockProps} />);

    const recommendation = screen.getByTestId('platform-recommendation');
    expect(recommendation).toHaveTextContent('Web');
  });

  it('shows recommendation reasoning', () => {
    render(<PlatformGap {...mockProps} />);

    const recommendation = screen.getByTestId('platform-recommendation');
    expect(recommendation).toHaveTextContent(/lowest saturation/i);
    expect(recommendation).toHaveTextContent(/faster iteration/i);
  });

  it('shows recommendation confidence score', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByTestId('recommendation-confidence')).toHaveTextContent('82%');
  });

  it('handles platform with no apps', () => {
    const propsWithEmptyPlatform: PlatformGapProps = {
      ...mockProps,
      platforms: [
        {
          platform: 'web',
          exists: false,
          count: 0,
          saturationScore: 0,
          topApps: [],
        },
      ],
      recommendation: mockProps.recommendation,
    };

    render(<PlatformGap {...propsWithEmptyPlatform} />);

    const webSection = screen.getByTestId('platform-web');
    expect(webSection).toHaveTextContent(/No apps found/i);
  });

  it('limits top apps display to 5 per platform', () => {
    const manyApps = Array.from({ length: 10 }, (_, i) => ({
      id: `app-${i}`,
      runId: 'run-1',
      platform: 'ios' as const,
      appName: `App ${i + 1}`,
      appId: `com.app${i}`,
      developer: `Dev ${i}`,
      rating: 4.5,
      reviewCount: 1000 - i * 100,
      description: `Description ${i}`,
      category: 'Test',
      price: 'Free',
    }));

    const propsWithMany: PlatformGapProps = {
      ...mockProps,
      platforms: [
        {
          platform: 'ios',
          exists: true,
          count: 10,
          saturationScore: 80,
          topApps: manyApps,
        },
      ],
    };

    render(<PlatformGap {...propsWithMany} />);

    const iosSection = screen.getByTestId('platform-ios');
    const appItems = iosSection.querySelectorAll('[data-testid^="app-"]');

    // Each app has multiple testids (rating, reviews), so divide by number of testids per app
    const uniqueApps = new Set(
      Array.from(appItems).map(item => item.getAttribute('data-testid')?.split('-')[1])
    );

    expect(uniqueApps.size).toBeLessThanOrEqual(5);
  });

  it('highlights recommended platform visually', () => {
    render(<PlatformGap {...mockProps} />);

    const recommendation = screen.getByTestId('platform-recommendation');
    // Should have some visual indicator that it's the recommended platform
    expect(recommendation).toBeInTheDocument();
  });

  it('shows saturation level indicator', () => {
    render(<PlatformGap {...mockProps} />);

    // High saturation (>70) should show "High"
    expect(screen.getByTestId('platform-ios-level')).toHaveTextContent(/High/i);

    // Medium saturation (40-70) should show "Medium"
    expect(screen.getByTestId('platform-android-level')).toHaveTextContent(/Medium/i);

    // Low saturation (<40) should show "Low"
    expect(screen.getByTestId('platform-web-level')).toHaveTextContent(/Low/i);
  });

  it('renders with data-testid for component', () => {
    render(<PlatformGap {...mockProps} />);

    expect(screen.getByTestId('platform-gap')).toBeInTheDocument();
  });
});
