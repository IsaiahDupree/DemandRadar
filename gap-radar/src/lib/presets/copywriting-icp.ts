/**
 * Copywriting ICP Discovery Preset
 * 
 * Comprehensive keyword configuration for discovering ads targeting
 * businesses that need copywriting services (service-based businesses,
 * agencies, coaches, consultants, SaaS, etc.)
 */

export interface ICPPreset {
  id: string;
  name: string;
  description: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  adjacentKeywords: string[];
  negativeKeywords: string[];
  targetICPs: ICPProfile[];
  subreddits: string[];
}

export interface ICPProfile {
  name: string;
  description: string;
  painPoints: string[];
  buyingSignals: string[];
}

/**
 * Copywriting Services ICP Discovery Preset
 * 
 * This preset is designed to find ads that are targeting businesses
 * who would benefit from copywriting services.
 */
export const COPYWRITING_ICP_PRESET: ICPPreset = {
  id: 'copywriting-icp-discovery',
  name: 'Copywriting Services ICP Discovery',
  description: 'Find ads targeting businesses that need copywriting: service providers, coaches, consultants, agencies, and SaaS companies',
  
  // Primary keywords - direct copywriting/content terms
  primaryKeywords: [
    // Core copywriting services
    'copywriting services',
    'copywriter',
    'sales copy',
    'conversion copywriter',
    'direct response copywriting',
    'email copywriting',
    'landing page copy',
    'website copy',
    'ad copy',
    'sales page copy',
    
    // Email marketing (need copy)
    'email marketing',
    'email sequences',
    'email automation',
    'drip campaigns',
    'newsletter writing',
    'cold email',
    'email outreach',
    
    // Landing pages (need copy)
    'landing page builder',
    'landing page design',
    'high converting landing page',
    'sales funnel',
    'funnel builder',
    
    // Content marketing
    'content marketing',
    'content strategy',
    'blog writing',
    'SEO content',
    'content creation',
  ],

  // Secondary keywords - businesses that need copywriting
  secondaryKeywords: [
    // Coaching & Consulting
    'business coach',
    'life coach',
    'executive coach',
    'coaching business',
    'consulting firm',
    'management consultant',
    'marketing consultant',
    'strategy consultant',
    
    // Agencies
    'marketing agency',
    'digital agency',
    'creative agency',
    'branding agency',
    'advertising agency',
    'PR agency',
    'social media agency',
    'SEO agency',
    'PPC agency',
    'web design agency',
    
    // Service businesses
    'freelancer',
    'solopreneur',
    'service business',
    'professional services',
    'B2B services',
    'client acquisition',
    
    // Course creators & info products
    'online course',
    'course creator',
    'digital products',
    'info products',
    'membership site',
    'online program',
    'webinar',
    
    // SaaS & Tech
    'SaaS marketing',
    'software marketing',
    'product marketing',
    'startup marketing',
    'B2B SaaS',
    
    // E-commerce (need product descriptions)
    'ecommerce copywriting',
    'product descriptions',
    'amazon listings',
    'shopify store',
  ],

  // Adjacent keywords - tools/services these ICPs use
  adjacentKeywords: [
    // CRM & Sales Tools
    'CRM software',
    'sales automation',
    'lead generation',
    'lead magnet',
    'sales pipeline',
    'proposal software',
    'invoicing software',
    'client management',
    
    // Marketing Tools
    'marketing automation',
    'email platform',
    'Mailchimp alternative',
    'ConvertKit',
    'ActiveCampaign',
    'Klaviyo',
    'HubSpot',
    
    // Funnel & Page Builders
    'ClickFunnels',
    'Leadpages',
    'Unbounce',
    'Instapage',
    'Carrd',
    'Webflow',
    
    // Course Platforms
    'Kajabi',
    'Teachable',
    'Thinkific',
    'Podia',
    'Skool',
    
    // Scheduling & Booking
    'Calendly',
    'appointment booking',
    'scheduling software',
    
    // Project Management
    'client portal',
    'project management',
    'freelance tools',
  ],

  // Negative keywords - filter out irrelevant results
  negativeKeywords: [
    'job posting',
    'hiring',
    'career',
    'employment',
    'resume',
    'salary',
    'intern',
    'entry level',
  ],

  // Target ICP profiles with pain points and buying signals
  targetICPs: [
    {
      name: 'Service-Based Business Owner',
      description: 'Coaches, consultants, freelancers who sell expertise',
      painPoints: [
        'Struggling to articulate their value proposition',
        'Website doesn\'t convert visitors to leads',
        'Emails get ignored or low open rates',
        'Can\'t differentiate from competitors',
        'Spending too much time writing content',
        'Sales calls don\'t convert because prospects aren\'t pre-sold',
      ],
      buyingSignals: [
        'Launching new service or program',
        'Rebranding or repositioning',
        'Building a funnel',
        'Starting email marketing',
        'Raising prices',
        'Scaling beyond 1:1 services',
      ],
    },
    {
      name: 'Agency Owner',
      description: 'Marketing, creative, or digital agency owners',
      painPoints: [
        'Need white-label copy for clients',
        'Can\'t scale copy production in-house',
        'Quality inconsistency across writers',
        'Tight deadlines for client deliverables',
        'Clients want strategy + execution',
      ],
      buyingSignals: [
        'Taking on larger clients',
        'Expanding service offerings',
        'Building productized services',
        'Hiring or team scaling',
      ],
    },
    {
      name: 'Course Creator / Info Product Seller',
      description: 'People selling knowledge products online',
      painPoints: [
        'Launch emails don\'t convert',
        'Sales page isn\'t selling',
        'Webinar registration is low',
        'Cart abandonment issues',
        'Can\'t articulate transformation',
      ],
      buyingSignals: [
        'Upcoming launch',
        'Building evergreen funnel',
        'Scaling ads',
        'Adding upsells/downsells',
      ],
    },
    {
      name: 'SaaS / Software Company',
      description: 'B2B or B2C software companies',
      painPoints: [
        'Free trial to paid conversion is low',
        'Feature pages don\'t explain value',
        'Onboarding emails are weak',
        'Churn from poor communication',
        'Competitors have better messaging',
      ],
      buyingSignals: [
        'Product launch',
        'Raising funding',
        'Hiring marketing team',
        'Expanding to new market',
        'Rebranding',
      ],
    },
    {
      name: 'E-commerce Brand',
      description: 'DTC brands selling physical products',
      painPoints: [
        'Product pages don\'t convert',
        'Email flows underperforming',
        'Ad copy fatigue',
        'Can\'t stand out in crowded market',
        'Returns from mismatched expectations',
      ],
      buyingSignals: [
        'Scaling ad spend',
        'Launching new products',
        'Building email list',
        'Expanding to new channels',
      ],
    },
  ],

  // Relevant subreddits for voice-of-customer research
  subreddits: [
    'Entrepreneur',
    'smallbusiness',
    'marketing',
    'digital_marketing',
    'copywriting',
    'freelance',
    'agency',
    'SaaS',
    'startups',
    'ecommerce',
    'dropship',
    'emailmarketing',
    'PPC',
    'content_marketing',
    'socialmedia',
    'webdev',
    'web_design',
    'Blogging',
    'juststart',
    'EntrepreneurRideAlong',
    'sweatystartup',
    'GrowthHacking',
  ],
};

/**
 * Get all search terms for the copywriting ICP preset
 */
export function getCopywritingSearchTerms(options?: {
  includePrimary?: boolean;
  includeSecondary?: boolean;
  includeAdjacent?: boolean;
  maxTerms?: number;
}): string[] {
  const {
    includePrimary = true,
    includeSecondary = true,
    includeAdjacent = true,
    maxTerms = 50,
  } = options || {};

  const terms: string[] = [];

  if (includePrimary) {
    terms.push(...COPYWRITING_ICP_PRESET.primaryKeywords);
  }
  if (includeSecondary) {
    terms.push(...COPYWRITING_ICP_PRESET.secondaryKeywords);
  }
  if (includeAdjacent) {
    terms.push(...COPYWRITING_ICP_PRESET.adjacentKeywords);
  }

  // Dedupe and limit
  const unique = [...new Set(terms)];
  return unique.slice(0, maxTerms);
}

/**
 * Get subreddits for copywriting ICP research
 */
export function getCopywritingSubreddits(): string[] {
  return COPYWRITING_ICP_PRESET.subreddits;
}

/**
 * Get ICP profiles with pain points and buying signals
 */
export function getCopywritingICPProfiles(): ICPProfile[] {
  return COPYWRITING_ICP_PRESET.targetICPs;
}
