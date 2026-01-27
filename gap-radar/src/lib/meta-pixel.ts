/**
 * Meta Pixel (Facebook Pixel) Integration (META-001)
 * ===================================================
 *
 * Initializes and manages Meta Pixel for Facebook advertising tracking.
 *
 * Official docs: https://developers.facebook.com/docs/meta-pixel
 */

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

export interface MetaPixelOptions {
  autoConfig?: boolean;
  debug?: boolean;
}

/**
 * Initialize Meta Pixel
 *
 * Loads the Meta Pixel script and initializes it with the provided pixel ID.
 * Should be called once in the app layout or root component.
 *
 * @param pixelId - Meta Pixel ID (found in Facebook Events Manager)
 * @param options - Configuration options
 *
 * @example
 * // In app/layout.tsx or _app.tsx
 * initMetaPixel(process.env.NEXT_PUBLIC_META_PIXEL_ID);
 */
export function initMetaPixel(
  pixelId: string,
  options: MetaPixelOptions = {}
): void {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  // Check if already initialized
  if (window.fbq) {
    return;
  }

  // Initialize fbq function
  const fbq: any = function () {
    fbq.callMethod
      ? fbq.callMethod.apply(fbq, arguments as any)
      : fbq.queue.push(arguments);
  };

  if (!window.fbq) {
    window.fbq = fbq;
  }

  window.fbq.push = fbq;
  window.fbq.loaded = true;
  window.fbq.version = '2.0';
  window.fbq.queue = [];

  // Load the pixel script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';

  const firstScript = document.getElementsByTagName('script')[0];
  if (firstScript && firstScript.parentNode) {
    firstScript.parentNode.insertBefore(script, firstScript);
  } else {
    document.head.appendChild(script);
  }

  // Initialize the pixel
  window.fbq('init', pixelId, {
    autoConfig: options.autoConfig ?? true,
    debug: options.debug ?? false,
  });

  if (options.debug) {
    console.log('[Meta Pixel] Initialized with ID:', pixelId);
  }
}

/**
 * Send event to Meta Pixel
 *
 * Wrapper around window.fbq for type safety and null checking.
 *
 * @param eventType - Event type ('track', 'trackCustom', etc.)
 * @param eventName - Event name
 * @param parameters - Event parameters
 *
 * @example
 * fbq('track', 'PageView');
 * fbq('track', 'Purchase', { value: 99.99, currency: 'USD' });
 */
export function fbq(
  eventType: 'track' | 'trackCustom' | 'init',
  eventName?: string,
  parameters?: Record<string, any>
): void {
  if (typeof window === 'undefined' || !window.fbq) {
    return; // Skip if not initialized
  }

  if (eventName && parameters) {
    window.fbq(eventType, eventName, parameters);
  } else if (eventName) {
    window.fbq(eventType, eventName);
  } else {
    window.fbq(eventType);
  }
}

/**
 * Track PageView event (META-002)
 *
 * Sends a PageView event to Meta Pixel. Should be called automatically on page navigation.
 *
 * @param properties - Optional page properties
 * @param properties.page - Page path (e.g., '/pricing')
 * @param properties.title - Page title
 * @param properties.referrer - Referrer URL
 *
 * @example
 * // Basic page view
 * trackPageView();
 *
 * // With page path
 * trackPageView({ page: '/dashboard' });
 *
 * // With full properties
 * trackPageView({
 *   page: '/pricing',
 *   title: 'Pricing - GapRadar',
 *   referrer: document.referrer
 * });
 */
export function trackPageView(properties?: {
  page?: string;
  title?: string;
  referrer?: string;
  [key: string]: any;
}): void {
  if (properties && Object.keys(properties).length > 0) {
    fbq('track', 'PageView', properties);
  } else {
    fbq('track', 'PageView');
  }
}

/**
 * Meta Standard Event Mapping Result
 */
export interface MetaEventMapping {
  eventName: string;
  parameters: Record<string, any>;
}

/**
 * Map GapRadar Event to Meta Standard Event (META-003)
 *
 * Converts GapRadar internal events to Meta Pixel standard events
 * according to the mapping table defined in PRD_META_PIXEL_TRACKING.md
 *
 * @param gapRadarEvent - GapRadar event name
 * @param properties - Event properties from GapRadar tracker
 * @returns Meta event mapping or null if no mapping exists
 *
 * Mapping Table:
 * - landing_view → PageView
 * - signup_start → Lead
 * - signup_complete → CompleteRegistration
 * - run_created → InitiateCheckout
 * - run_completed → ViewContent
 * - checkout_started → AddToCart
 * - purchase_completed → Purchase
 *
 * @example
 * const mapping = mapToMetaEvent('purchase_completed', {
 *   orderId: 'order-123',
 *   value: 99,
 *   currency: 'USD',
 *   plan: 'premium'
 * });
 * // Returns: {
 * //   eventName: 'Purchase',
 * //   parameters: { value: 99, currency: 'USD', content_ids: ['order-123'], content_name: 'premium' }
 * // }
 */
export function mapToMetaEvent(
  gapRadarEvent: string,
  properties: Record<string, any>
): MetaEventMapping | null {
  switch (gapRadarEvent) {
    case 'landing_view':
      return {
        eventName: 'PageView',
        parameters: {},
      };

    case 'signup_start':
      return {
        eventName: 'Lead',
        parameters: {},
      };

    case 'signup_complete':
      return {
        eventName: 'CompleteRegistration',
        parameters: {
          content_name: 'User Registration',
          status: 'completed',
        },
      };

    case 'run_created':
      return {
        eventName: 'InitiateCheckout',
        parameters: {
          content_ids: [properties.runId],
          num_items: 1,
          content_name: properties.query,
        },
      };

    case 'run_completed':
      return {
        eventName: 'ViewContent',
        parameters: {
          content_type: 'market_analysis',
          content_ids: [properties.runId],
          content_name: properties.query,
        },
      };

    case 'checkout_started':
      return {
        eventName: 'AddToCart',
        parameters: {
          value: properties.value,
          currency: properties.currency || 'USD',
          content_name: properties.plan,
        },
      };

    case 'purchase_completed':
      return {
        eventName: 'Purchase',
        parameters: {
          value: properties.value,
          currency: properties.currency || 'USD',
          content_ids: [properties.orderId],
          content_name: properties.plan,
        },
      };

    default:
      // Return null for unmapped events (custom events)
      return null;
  }
}

/**
 * Track Meta Event (META-003)
 *
 * Maps a GapRadar event to a Meta standard event and sends it to Meta Pixel.
 * This is a convenience function that combines mapToMetaEvent and fbq.
 *
 * @param gapRadarEvent - GapRadar event name
 * @param properties - Event properties from GapRadar tracker
 *
 * @example
 * // Track a purchase
 * trackMetaEvent('purchase_completed', {
 *   orderId: 'order-123',
 *   value: 99,
 *   currency: 'USD',
 *   plan: 'premium'
 * });
 *
 * @example
 * // Track signup start
 * trackMetaEvent('signup_start', {});
 *
 * @example
 * // Track run creation
 * trackMetaEvent('run_created', {
 *   runId: 'run-456',
 *   query: 'AI chatbots'
 * });
 */
export function trackMetaEvent(
  gapRadarEvent: string,
  properties: Record<string, any>
): void {
  if (typeof window === 'undefined') {
    return; // Skip on server-side
  }

  const mapping = mapToMetaEvent(gapRadarEvent, properties);

  if (mapping) {
    fbq('track', mapping.eventName, mapping.parameters);
  }
}

/**
 * Generate Event ID for Deduplication (META-005)
 *
 * Creates a unique event ID that can be used by both Meta Pixel (browser)
 * and Conversions API (server) to prevent duplicate event counting.
 *
 * Format: EventName_timestamp_randomString
 *
 * @param eventName - The name of the event (e.g., 'Purchase', 'Lead')
 * @returns A unique event ID string
 *
 * @example
 * const eventId = generateEventId('Purchase');
 * // Returns: "Purchase_1234567890_abc123xyz"
 *
 * // Use the same ID for both Pixel and CAPI
 * trackWithDeduplication('Purchase', { value: 99 }, eventId);
 * await sendCAPIWithDeduplication({ event_name: 'Purchase', event_id: eventId, ... });
 */
export function generateEventId(eventName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substr(2, 9);
  return `${eventName}_${timestamp}_${randomString}`;
}

/**
 * Track Event with Deduplication (META-005)
 *
 * Sends an event to Meta Pixel with an event ID for deduplication.
 * The same event ID should be used when sending the event to CAPI
 * to prevent Meta from counting the event twice.
 *
 * @param eventName - Meta standard event name
 * @param parameters - Event parameters
 * @param eventId - Optional event ID (will be generated if not provided)
 * @returns The event ID used (either provided or generated)
 *
 * @example
 * // Generate event ID and use for both Pixel and CAPI
 * const eventId = generateEventId('Purchase');
 * trackWithDeduplication('Purchase', { value: 99, currency: 'USD' }, eventId);
 *
 * @example
 * // Auto-generate event ID
 * const eventId = trackWithDeduplication('Lead', {});
 * // Use returned eventId for CAPI call
 */
export function trackWithDeduplication(
  eventName: string,
  parameters: Record<string, any>,
  eventId?: string
): string {
  if (typeof window === 'undefined' || !window.fbq) {
    return eventId || generateEventId(eventName);
  }

  const finalEventId = eventId || generateEventId(eventName);

  window.fbq('track', eventName, parameters, { eventID: finalEventId });

  return finalEventId;
}

/**
 * Conversion value rules for value-based optimization
 * Stores default values for events when not explicitly provided
 */
const conversionValueRules: Record<string, { value: number; currency: string }> = {};

/**
 * Set Conversion Value for Event (META-008)
 *
 * Sets a default conversion value for a specific event type to enable
 * value-based optimization in Meta ads. This value will be used when
 * the event is tracked without an explicit value parameter.
 *
 * Use this to assign estimated values to non-purchase events like
 * Lead, CompleteRegistration, etc. for better ad optimization.
 *
 * @param eventName - Meta standard event name (e.g., 'Lead', 'CompleteRegistration')
 * @param value - The estimated value of this conversion in the specified currency
 * @param currency - Currency code (defaults to 'USD')
 *
 * @example
 * // Set Lead value to $25
 * setConversionValue('Lead', 25.00);
 *
 * // Set CompleteRegistration value to €50
 * setConversionValue('CompleteRegistration', 50.00, 'EUR');
 *
 * // Now when tracking these events, the value will be included automatically
 * trackWithAdvancedMatching('Lead', {}); // Will include value: 25.00, currency: 'USD'
 */
export function setConversionValue(
  eventName: string,
  value: number,
  currency: string = 'USD'
): void {
  // Validate value is a valid number
  if (isNaN(value) || !isFinite(value)) {
    if (typeof window !== 'undefined' && console?.warn) {
      console.warn(`[Meta Pixel] Invalid conversion value for ${eventName}:`, value);
    }
    return;
  }

  conversionValueRules[eventName] = { value, currency };
}

/**
 * Purchase Value Parameters
 */
export interface PurchaseValueParams {
  value: number;
  currency?: string;
  transaction_id?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  num_items?: number;
  [key: string]: any;
}

/**
 * Track Purchase with Value (META-008)
 *
 * Tracks a Purchase event with full value parameters for conversion optimization.
 * This is the primary event for revenue tracking and ROAS optimization.
 *
 * @param params - Purchase parameters including value, currency, and optional metadata
 *
 * @example
 * // Basic purchase
 * trackPurchaseWithValue({
 *   value: 99.99,
 *   currency: 'USD',
 *   content_ids: ['premium-plan'],
 *   content_name: 'Premium Plan'
 * });
 *
 * @example
 * // Purchase with transaction ID for deduplication
 * trackPurchaseWithValue({
 *   value: 199.99,
 *   currency: 'USD',
 *   transaction_id: 'order-12345',
 *   content_ids: ['enterprise-plan'],
 *   content_name: 'Enterprise Plan',
 *   num_items: 1
 * });
 */
export function trackPurchaseWithValue(params: PurchaseValueParams): void {
  if (typeof window === 'undefined' || !window.fbq) {
    return;
  }

  // Default to USD if currency not provided
  const purchaseParams = {
    ...params,
    currency: params.currency || 'USD',
  };

  window.fbq('track', 'Purchase', purchaseParams);
}

/**
 * Advanced Matching User Data
 */
export interface AdvancedMatchingData {
  em?: string; // Email (should be hashed on server, plain here for Pixel)
  fn?: string; // First name
  ln?: string; // Last name
  ph?: string; // Phone number
  ge?: string; // Gender (m/f)
  db?: string; // Date of birth (YYYYMMDD)
  ct?: string; // City
  st?: string; // State/Province
  zp?: string; // Zip/Postal code
  country?: string; // Country code
  [key: string]: any;
}

/**
 * Track Event with Advanced Matching (META-008)
 *
 * Tracks an event with advanced matching parameters to improve event match quality
 * and attribution. Advanced matching helps Meta connect events to users more accurately,
 * especially for users not logged into Facebook.
 *
 * @param eventName - Meta standard event name
 * @param parameters - Event parameters
 * @param userData - User data for advanced matching (optional)
 *
 * @example
 * // Track Lead with advanced matching
 * trackWithAdvancedMatching('Lead', {}, {
 *   em: 'customer@example.com',
 *   fn: 'John',
 *   ln: 'Doe',
 *   ct: 'San Francisco',
 *   st: 'CA',
 *   country: 'US'
 * });
 *
 * @example
 * // Track Purchase with user data
 * trackWithAdvancedMatching('Purchase', {
 *   value: 99.99,
 *   currency: 'USD'
 * }, {
 *   em: 'buyer@example.com'
 * });
 */
export function trackWithAdvancedMatching(
  eventName: string,
  parameters: Record<string, any> = {},
  userData: AdvancedMatchingData = {}
): void {
  if (typeof window === 'undefined' || !window.fbq) {
    return;
  }

  // Check if there's a conversion value rule for this event
  const valueRule = conversionValueRules[eventName];

  // Merge parameters with conversion value rule (explicit value takes precedence)
  let finalParameters = { ...parameters };

  if (valueRule && !parameters.value) {
    finalParameters = {
      value: valueRule.value,
      currency: valueRule.currency,
      ...parameters,
    };
  }

  window.fbq('track', eventName, finalParameters, userData);
}

/**
 * Predicted LTV Parameters
 */
export interface PredictedLTVParams {
  user_id: string;
  predicted_ltv: number;
  currency?: string;
  subscription_tier?: string;
  [key: string]: any;
}

/**
 * Track Predicted Lifetime Value (META-008)
 *
 * Tracks predicted customer lifetime value for new users to enable
 * value-based lookalike audience creation and optimization.
 *
 * This is a custom event that helps Meta optimize for high-value customers
 * based on your predicted LTV models.
 *
 * @param params - LTV parameters including user ID and predicted value
 *
 * @example
 * // Track predicted LTV for new signup
 * trackPredictedLTV({
 *   user_id: 'user-123',
 *   predicted_ltv: 500.00,
 *   currency: 'USD',
 *   subscription_tier: 'premium'
 * });
 */
export function trackPredictedLTV(params: PredictedLTVParams): void {
  if (typeof window === 'undefined' || !window.fbq) {
    return;
  }

  const ltvParams = {
    ...params,
    currency: params.currency || 'USD',
  };

  window.fbq('trackCustom', 'PredictedLTV', ltvParams);
}

/**
 * CAPI Event Request (for deduplication)
 */
export interface CAPIEventRequest {
  event_name: string;
  event_id?: string;
  user_data: {
    email?: string;
    phone?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: Record<string, any>;
  event_source_url: string;
}

/**
 * Send Event to CAPI with Deduplication (META-005)
 *
 * Sends an event to the Meta Conversions API with an event ID for deduplication.
 * Use the same event ID that was used with trackWithDeduplication() to prevent
 * Meta from counting the event twice.
 *
 * @param event - The event data to send to CAPI
 * @returns Promise with the API response
 *
 * @example
 * // Full deduplication flow
 * const eventId = generateEventId('Purchase');
 *
 * // Track in browser
 * trackWithDeduplication('Purchase', { value: 99, currency: 'USD' }, eventId);
 *
 * // Track on server
 * await sendCAPIWithDeduplication({
 *   event_name: 'Purchase',
 *   event_id: eventId,
 *   user_data: { email: 'customer@example.com' },
 *   custom_data: { value: 99, currency: 'USD' },
 *   event_source_url: 'https://gapradar.com/checkout'
 * });
 */
export async function sendCAPIWithDeduplication(
  event: CAPIEventRequest
): Promise<any> {
  // Generate event_id if not provided
  if (!event.event_id) {
    event.event_id = generateEventId(event.event_name);
  }

  // Send to CAPI endpoint
  const response = await fetch('/api/meta-capi', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  return response.json();
}
