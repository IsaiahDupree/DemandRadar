-- Strategy Library
-- A curated library of winning ad strategies, formulas, and templates

-- ============================================
-- 1. AD STRATEGIES TABLE
-- Proven ad formulas and frameworks
-- ============================================
CREATE TABLE IF NOT EXISTS ad_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'hook', 'formula', 'format', 'targeting', 'creative'
  
  -- The strategy
  framework TEXT NOT NULL, -- The actual strategy/formula
  example_script TEXT,
  when_to_use TEXT,
  best_for JSONB, -- Array of niches/use cases
  
  -- Effectiveness
  effectiveness_score INT CHECK (effectiveness_score BETWEEN 1 AND 10),
  difficulty VARCHAR(20) CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  
  -- Visual
  icon VARCHAR(50),
  color VARCHAR(20),
  
  -- Metadata
  source VARCHAR(255), -- Where this strategy came from
  source_url TEXT,
  tags JSONB,
  
  -- Stats
  times_used INT DEFAULT 0,
  success_rate DECIMAL(5,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_strategies_category ON ad_strategies(category);
CREATE INDEX idx_strategies_effectiveness ON ad_strategies(effectiveness_score DESC);

-- ============================================
-- 2. WINNING ADS LIBRARY TABLE
-- Curated examples of winning ads
-- ============================================
CREATE TABLE IF NOT EXISTS winning_ads_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ad info
  brand_name VARCHAR(255) NOT NULL,
  niche VARCHAR(255),
  platform VARCHAR(50) CHECK (platform IN ('meta', 'tiktok', 'google', 'youtube', 'linkedin')),
  
  -- Creative
  hook TEXT NOT NULL,
  promise TEXT,
  cta TEXT,
  full_script TEXT,
  
  -- Format
  ad_format VARCHAR(50) CHECK (ad_format IN ('ugc_video', 'talking_head', 'demo', 'testimonial', 'before_after', 'listicle', 'story', 'comparison', 'static_image', 'carousel')),
  video_length VARCHAR(20), -- '15s', '30s', '60s', etc.
  
  -- Strategy links
  strategy_id UUID REFERENCES ad_strategies(id),
  strategy_used VARCHAR(255),
  
  -- Performance indicators (CRITICAL: Filter out low impression ads)
  impression_level VARCHAR(20) CHECK (impression_level IN ('low', 'medium', 'high', 'very_high')) DEFAULT 'medium',
  run_time_days INT,
  estimated_spend VARCHAR(50),
  is_verified_winner BOOLEAN DEFAULT FALSE,
  min_run_days_required INT DEFAULT 7, -- Must run 7+ days to be considered
  
  -- Analysis
  why_it_works TEXT,
  key_elements JSONB,
  emotional_triggers JSONB,
  
  -- Media
  thumbnail_url TEXT,
  video_url TEXT,
  landing_page_url TEXT,
  
  -- Source
  source VARCHAR(100), -- 'meta_ad_library', 'hookd', 'manual', etc.
  ad_library_id VARCHAR(255),
  captured_at TIMESTAMPTZ,
  
  -- Metadata
  tags JSONB,
  is_featured BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_winning_ads_library_niche ON winning_ads_library(niche);
CREATE INDEX idx_winning_ads_library_format ON winning_ads_library(ad_format);
CREATE INDEX idx_winning_ads_library_featured ON winning_ads_library(is_featured, created_at DESC);

-- ============================================
-- 3. NICHE PLAYBOOKS TABLE
-- Complete playbooks for each niche
-- ============================================
CREATE TABLE IF NOT EXISTS niche_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Niche info
  niche VARCHAR(255) UNIQUE NOT NULL,
  niche_display_name VARCHAR(255),
  description TEXT,
  
  -- Market analysis
  market_size VARCHAR(100),
  competition_level VARCHAR(20) CHECK (competition_level IN ('low', 'medium', 'high', 'saturated')),
  growth_trend VARCHAR(20) CHECK (growth_trend IN ('emerging', 'growing', 'mature', 'declining')),
  
  -- Target audience
  target_audience TEXT,
  buyer_persona JSONB,
  pain_points JSONB,
  
  -- Winning strategies
  top_strategies JSONB, -- Array of strategy IDs or names
  recommended_hooks JSONB,
  recommended_formats JSONB,
  
  -- Ad guidance
  ad_spend_recommendation TEXT,
  cac_benchmark VARCHAR(50),
  ltv_benchmark VARCHAR(50),
  
  -- Content
  sample_hooks JSONB,
  sample_ctas JSONB,
  keywords JSONB,
  
  -- Examples
  top_advertisers JSONB,
  example_ads JSONB,
  
  -- Linked data
  opportunity_id UUID REFERENCES niche_opportunities(id),
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playbooks_niche ON niche_playbooks(niche);
CREATE INDEX idx_playbooks_growth ON niche_playbooks(growth_trend);

-- ============================================
-- 4. SEED DATA - Ad Strategies
-- ============================================
INSERT INTO ad_strategies (name, slug, description, category, framework, example_script, when_to_use, best_for, effectiveness_score, difficulty, icon) VALUES

-- HOOK STRATEGIES
('The Pattern Interrupt', 'pattern-interrupt', 'Start with something unexpected to stop the scroll', 'hook',
'Open with a surprising statement, unusual visual, or counterintuitive claim that makes viewers pause and pay attention.',
'WRONG way to start: "Hey guys, check out our new product..."
RIGHT way: "I spent $50,000 on developers before discovering this..." or "Delete your code. Seriously."',
'When competing in a crowded feed where users are scrolling quickly',
'["saas", "tech", "b2b"]',
9, 'beginner', '⚡'),

('Problem Agitation', 'problem-agitation', 'Lead with the pain point your audience feels deeply', 'hook',
'1. State the problem clearly
2. Agitate by describing the frustration/consequences
3. Hint at a solution

Formula: "Struggling with [problem]? You''re not alone. [Agitation]. But what if [hint at solution]?"',
'"Still manually tracking market gaps? You''re probably missing opportunities worth $10K+ every month. Your competitors are using AI to find them first..."',
'When your audience has a clear, painful problem they''re actively trying to solve',
'["saas", "productivity", "marketing"]',
10, 'beginner', '😤'),

('The Curiosity Gap', 'curiosity-gap', 'Create an information gap that viewers need to fill', 'hook',
'Tease valuable information without revealing it fully. Make viewers feel like they NEED to keep watching to learn the secret/method/trick.',
'"The one feature that helped us go from $0 to $100K MRR (and no, it''s not what you think)..."',
'When you have genuinely interesting insights or results to share',
'["saas", "course", "info-product"]',
8, 'intermediate', '🤔'),

('Social Proof Lead', 'social-proof-lead', 'Open with impressive numbers or testimonials', 'hook',
'Lead with your strongest proof point: user numbers, revenue, results, or a powerful testimonial snippet.',
'"10,000 companies switched this month. Here''s why..." or "''This saved my business'' - here''s what happened..."',
'When you have strong metrics or testimonials to showcase',
'["saas", "b2b", "enterprise"]',
9, 'beginner', '📊'),

-- AD FORMULAS
('Problem → Demo → CTA', 'problem-demo-cta', 'The classic SaaS ad formula', 'formula',
'Structure:
1. Hook with problem (0-3s)
2. Quick product demo showing solution (3-20s)
3. Clear CTA with offer (20-30s)

Keep demo focused on ONE key feature that solves the stated problem.',
'[Problem] "Tired of spending hours on manual data entry?"
[Demo] "Watch how [Product] does it in 3 clicks..."
[CTA] "Try free for 14 days. Link in bio."',
'Product demos, feature launches, awareness campaigns',
'["saas", "tool", "productivity"]',
10, 'beginner', '🎬'),

('Before/After Transformation', 'before-after', 'Show the contrast between life before and after your product', 'formula',
'Structure:
1. Show the painful "before" state
2. Introduce your product as the bridge
3. Show the transformed "after" state
4. CTA

Works best with visual products or measurable outcomes.',
'BEFORE: Messy spreadsheets, manual work, frustrated face
TRANSITION: "Then I found [Product]..."
AFTER: Clean dashboard, automated workflow, happy reaction',
'Products with clear, visual transformations or measurable results',
'["design", "productivity", "analytics"]',
9, 'intermediate', '✨'),

('Testimonial Sandwich', 'testimonial-sandwich', 'Wrap your message in social proof', 'formula',
'Structure:
1. Open with testimonial snippet (3s)
2. Explain what the product does (10s)
3. Show more testimonials/results (10s)
4. CTA with urgency (5s)',
'[Testimonial] "This changed everything for our agency..."
[Explain] "Meet [Product] - the tool that helps agencies..."
[More proof] "Join 500+ agencies already using it"
[CTA] "Start free trial"',
'When you have strong testimonials and want to build trust quickly',
'["b2b", "agency", "service"]',
8, 'beginner', '💬'),

('The Explainer', 'explainer', 'Educational content that naturally leads to your product', 'formula',
'Structure:
1. Teach something valuable (problem/tip/insight)
2. Naturally introduce your product as the solution
3. Soft CTA

Position yourself as an expert while showcasing your product.',
'"3 mistakes killing your conversion rate:
1. [Mistake + how product fixes it]
2. [Mistake + how product fixes it]
3. [Mistake + how product fixes it]
We built [Product] to solve all three..."',
'Complex products that need education, thought leadership',
'["saas", "tech", "complex-b2b"]',
7, 'advanced', '📚'),

-- FORMAT STRATEGIES
('UGC Style', 'ugc-style', 'User-generated content aesthetic that feels authentic', 'format',
'Characteristics:
- Shot on phone (or made to look like it)
- Natural lighting
- Casual tone and delivery
- Real person (not polished actor)
- Feels like a recommendation from a friend

Best practices:
- Use real customers or relatable creators
- Keep it conversational
- Include "umms" and natural pauses
- Show real product usage',
'Film vertically on phone, natural background, speak directly to camera like texting a friend about a cool product you found.',
'Trust-building, younger audiences, products that benefit from authenticity',
'["d2c", "saas", "app"]',
10, 'beginner', '📱'),

('Founder Story', 'founder-story', 'The founder shares their journey and why they built the product', 'format',
'Structure:
1. "I used to struggle with [problem]..."
2. "I tried everything - [failed solutions]..."
3. "So I built [Product] to solve it"
4. "Now [impressive result]"
5. "Want the same? [CTA]"

Builds trust through vulnerability and relatability.',
'"I spent 6 months manually analyzing competitors until I burned out. Every tool was either too expensive or too complicated. So I built [Product] in my garage. Now 10,000 marketers use it daily."',
'Early-stage startups, bootstrapped products, building brand connection',
'["saas", "startup", "indie"]',
9, 'intermediate', '👤'),

('Demo Walkthrough', 'demo-walkthrough', 'Screen recording showing exactly how the product works', 'format',
'Best practices:
- Start with the end result
- Show the easiest path
- Use zoom effects on important areas
- Add captions for silent viewing
- Keep under 30 seconds
- End on the "magic moment"',
'[End result first] "This dashboard took 5 minutes to build"
[Walkthrough] "Just connect your data, pick a template, and customize"
[Magic moment] "Automatic insights generated"',
'Feature launches, product education, overcoming complexity objections',
'["saas", "tool", "tech"]',
8, 'intermediate', '🖥️')

ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 5. SEED DATA - Winning Ads Examples
-- ============================================
INSERT INTO winning_ads_library (brand_name, niche, platform, hook, promise, cta, ad_format, strategy_used, why_it_works, key_elements, is_featured) VALUES

('VibeDream.AI', 'no-code-builders', 'meta',
'They didn''t hire a $50K developer. They didn''t spend 6 months learning code.',
'Launched in 5 minutes',
'Try VibeDream free',
'ugc_video', 'Problem Agitation',
'Attacks the two biggest objections (cost and time) immediately. Uses specific numbers ($50K, 6 months, 5 minutes) to create contrast.',
'{"contrast": "expensive vs free", "specificity": "exact numbers", "objection_handling": "preemptive"}',
true),

('Hill Tribe Solutions', 'saas-development', 'meta',
'You have a SaaS Application idea... but it''s been sitting in your head, your notes, or a half-written doc for months, right?',
'Launch in 30 days - guaranteed, or you don''t pay',
'Book a free call',
'talking_head', 'Problem Agitation',
'Calls out the exact situation their target audience is in. The guarantee removes all risk. Relatable language.',
'{"relatability": "describes exact situation", "risk_reversal": "guarantee", "urgency": "30 days"}',
true),

('Notion', 'productivity', 'meta',
'The tool that replaced 5 apps for our team',
'All-in-one workspace for notes, docs, and projects',
'Get started free',
'demo', 'Before/After Transformation',
'Promises simplification. Shows consolidation of tools. Clean, simple demo.',
'{"simplification": "5 apps to 1", "social_proof": "for our team", "low_friction": "free"}',
true),

('Loom', 'video-tools', 'meta',
'Stop typing long emails. Record a quick video instead.',
'Loom lets you record and share video messages in seconds',
'Try Loom free',
'demo', 'Problem → Demo → CTA',
'Identifies a universal pain point (long emails). Shows the alternative is faster. Very short demo.',
'{"universal_pain": "long emails", "speed": "quick/seconds", "behavior_change": "stop typing"}',
false),

('Linear', 'project-management', 'meta',
'Built for speed. Designed for teams who ship fast.',
'The issue tracker built for modern software teams',
'Start building',
'demo', 'The Pattern Interrupt',
'Challenges the slow, clunky status quo. Speed-focused messaging matches product UI. Action-oriented CTA.',
'{"differentiation": "speed", "target_specificity": "teams who ship fast", "product_market_fit": "modern software teams"}',
false)

ON CONFLICT DO NOTHING;

-- ============================================
-- 6. SEED DATA - Niche Playbooks
-- ============================================
INSERT INTO niche_playbooks (niche, niche_display_name, description, market_size, competition_level, growth_trend, target_audience, pain_points, top_strategies, recommended_hooks, recommended_formats) VALUES

('ai-writing-tools', 'AI Writing Tools', 'AI-powered writing assistants for content creation, copywriting, and editing',
'$5B+', 'high', 'growing',
'Content marketers, copywriters, bloggers, marketing teams, solopreneurs',
'["Writer''s block", "Time-consuming content creation", "Inconsistent quality", "Expensive copywriters", "SEO optimization challenges"]',
'["problem-demo-cta", "before-after", "ugc-style"]',
'["Write 10x faster with AI", "Never stare at a blank page again", "The AI that writes like you (but faster)"]',
'["ugc_video", "demo", "before_after"]'),

('no-code-builders', 'No-Code Builders', 'Platforms for building apps and websites without coding',
'$15B+', 'high', 'growing',
'Entrepreneurs, small business owners, product managers, non-technical founders',
'["Can''t afford developers", "Slow development time", "Dependency on tech team", "Idea stuck in head", "Technical complexity"]',
'["problem-agitation", "founder-story", "before-after"]',
'["Launch your app without code", "They didn''t hire a developer", "From idea to app in days, not months"]',
'["ugc_video", "talking_head", "demo"]'),

('crm-vertical', 'Vertical CRMs', 'Industry-specific CRM solutions',
'$2B+', 'medium', 'emerging',
'Small-medium businesses in specific verticals (real estate, healthcare, legal, etc.)',
'["Generic CRMs don''t fit workflow", "Too many unused features", "Poor industry integrations", "Expensive customization"]',
'["problem-demo-cta", "testimonial-sandwich", "explainer"]',
'["Finally, a CRM built for [industry]", "The CRM that speaks your language", "Stop fighting your CRM"]',
'["demo", "testimonial", "comparison"]'),

('automation-tools', 'Automation Tools', 'Workflow automation and integration platforms',
'$10B+', 'high', 'growing',
'Operations managers, marketing teams, agencies, SMBs looking to scale',
'["Manual repetitive tasks", "Tool silos", "No technical skills for automation", "Expensive developers", "Process bottlenecks"]',
'["before-after", "problem-demo-cta", "explainer"]',
'["Automate your busywork", "Connect your tools in minutes", "Stop copying and pasting forever"]',
'["demo", "before_after", "ugc_video"]'),

('analytics-dashboards', 'Analytics Dashboards', 'Business intelligence and data visualization tools',
'$8B+', 'medium', 'growing',
'Data analysts, marketing managers, executives, agencies',
'["Data scattered across tools", "Manual report building", "Can''t get real-time insights", "Technical SQL required", "Ugly spreadsheet reports"]',
'["before-after", "demo-walkthrough", "problem-demo-cta"]',
'["See all your data in one place", "Build dashboards in minutes, not days", "Stop living in spreadsheets"]',
'["demo", "before_after", "comparison"]')

ON CONFLICT (niche) DO NOTHING;

COMMENT ON TABLE ad_strategies IS 'Library of proven ad strategies and formulas';
COMMENT ON TABLE winning_ads_library IS 'Curated examples of winning ads with analysis';
COMMENT ON TABLE niche_playbooks IS 'Complete marketing playbooks for each niche';

-- ============================================
-- 7. REDDIT WINNING SIGNALS TABLE
-- Proven demand signals from Reddit
-- ============================================
CREATE TABLE IF NOT EXISTS reddit_winning_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source info
  subreddit VARCHAR(100) NOT NULL,
  post_title TEXT,
  post_body TEXT,
  permalink TEXT UNIQUE,
  
  -- Engagement (CRITICAL: Filter low engagement)
  upvotes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  
  -- Signal classification
  signal_type VARCHAR(50) CHECK (signal_type IN ('pain_point', 'solution_request', 'alternative_search', 'recommendation', 'complaint', 'general')),
  demand_score INT CHECK (demand_score BETWEEN 0 AND 100),
  is_verified_demand BOOLEAN DEFAULT FALSE,
  
  -- Niche mapping
  niche VARCHAR(255),
  matched_keywords JSONB,
  
  -- Product opportunity
  product_idea TEXT,
  competitor_mentioned VARCHAR(255),
  price_sensitivity BOOLEAN DEFAULT FALSE,
  
  -- Thresholds met
  meets_upvote_threshold BOOLEAN GENERATED ALWAYS AS (upvotes >= 10) STORED,
  meets_comment_threshold BOOLEAN GENERATED ALWAYS AS (comments >= 5) STORED,
  is_winning_signal BOOLEAN GENERATED ALWAYS AS (
    upvotes >= 10 AND 
    comments >= 5 AND 
    signal_type IN ('pain_point', 'solution_request', 'alternative_search', 'complaint') AND
    demand_score >= 40
  ) STORED,
  
  -- Timestamps
  posted_at TIMESTAMPTZ,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reddit_signals_niche ON reddit_winning_signals(niche);
CREATE INDEX idx_reddit_signals_type ON reddit_winning_signals(signal_type);
CREATE INDEX idx_reddit_signals_winning ON reddit_winning_signals(is_winning_signal) WHERE is_winning_signal = TRUE;
CREATE INDEX idx_reddit_signals_demand ON reddit_winning_signals(demand_score DESC);

COMMENT ON TABLE reddit_winning_signals IS 'Proven demand signals from Reddit - filtered for engagement';

-- ============================================
-- 8. REDDIT SIGNAL THRESHOLDS (Reference)
-- ============================================
CREATE TABLE IF NOT EXISTS signal_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(50) NOT NULL, -- 'reddit', 'meta', etc.
  threshold_name VARCHAR(100) NOT NULL,
  threshold_value INT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source, threshold_name)
);

INSERT INTO signal_thresholds (source, threshold_name, threshold_value, description) VALUES
('reddit', 'MIN_UPVOTES', 10, 'Minimum upvotes to be considered'),
('reddit', 'MIN_COMMENTS', 5, 'Minimum comments for engagement'),
('reddit', 'VERIFIED_UPVOTES', 50, '50+ upvotes = verified demand'),
('reddit', 'VERIFIED_COMMENTS', 20, '20+ comments = high engagement'),
('reddit', 'HIGH_DEMAND_SCORE', 70, 'Score threshold for winning ideas'),
('meta', 'MIN_RUN_DAYS', 7, 'Minimum days ad must run'),
('meta', 'VERIFIED_RUN_DAYS', 30, '30+ days = verified winner'),
('meta', 'MIN_IMPRESSION_LEVEL', 2, '1=low, 2=medium, 3=high, 4=very_high')
ON CONFLICT (source, threshold_name) DO NOTHING;

COMMENT ON TABLE signal_thresholds IS 'Configuration for filtering winning signals';
