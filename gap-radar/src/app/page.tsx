'use client';

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NLPSearch } from "@/components/landing/NLPSearch";
import { TrendingTopics } from "@/components/landing/TrendingTopics";
import { Features } from "@/components/landing/Features";
import { Sparkles, ArrowRight, BarChart3, Users, Zap } from "lucide-react";
import { trackLandingView, trackCTAClick } from "@/lib/analytics/landing";
import { isAuthenticated, buildSignupURL, buildCreateRunURL, storePendingQuery } from "@/lib/auth/redirect";

export default function Home() {
  const router = useRouter();

  // Track landing page view
  useEffect(() => {
    trackLandingView();
  }, []);

  // Handle topic click from trending section
  const handleTopicClick = (topic: string) => {
    if (isAuthenticated()) {
      router.push(buildCreateRunURL(topic));
    } else {
      storePendingQuery(topic);
      router.push(buildSignupURL(topic));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl">DemandRadar</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => trackCTAClick('sign_in', 'nav')}
              >
                Sign In
              </Link>
              <Button asChild size="sm">
                <Link href="/signup" onClick={() => trackCTAClick('get_started', 'nav')}>
                  Get Started Free
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            AI-Powered Market Intelligence
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
            Find Market Gaps<br />
            <span className="text-primary">Before Your Competitors</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Analyze thousands of ads and Reddit discussions to discover what customers really want—and what competitors are missing.
          </p>
          
          {/* NLP Search */}
          <NLPSearch />
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Ads Analyzed Daily</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">100K+</div>
              <div className="text-sm text-muted-foreground">Reddit Discussions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">2 min</div>
              <div className="text-sm text-muted-foreground">Average Analysis Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Topics Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              🔥 Trending Right Now
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real-time market opportunities detected from Reddit, ProductHunt, and social platforms. Click any topic to analyze.
            </p>
          </div>
          
          <TrendingTopics onTopicClick={handleTopicClick} />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Everything You Need to Validate Ideas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From data collection to actionable insights—all powered by AI.
            </p>
          </div>
          
          <Features />
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground">
              Three steps to market clarity
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Enter Your Niche</h3>
              <p className="text-muted-foreground">
                Type any market, product idea, or competitor. Our AI understands natural language.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">AI Analyzes Data</h3>
              <p className="text-muted-foreground">
                We scan Meta Ads, Google, Reddit, TikTok, and more to extract patterns and pain points.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">Get Actionable Insights</h3>
              <p className="text-muted-foreground">
                Receive gap opportunities, product ideas, and UGC playbooks with confidence scores.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Trusted by 1,000+ entrepreneurs</span>
          </div>
          
          <blockquote className="text-2xl font-medium mb-6 italic">
            "DemandRadar helped me find a $50K/mo opportunity in a market I thought was saturated. The gap analysis was spot-on."
          </blockquote>
          
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600" />
            <div className="text-left">
              <div className="font-medium">Sarah Chen</div>
              <div className="text-sm text-muted-foreground">Founder, TaskFlow AI</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 rounded-3xl p-12 text-center border">
            <Zap className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">
              Start Finding Market Gaps Today
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
              3 free analyses per month. No credit card required.
            </p>
            <div className="flex gap-4 justify-center">
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/signup" onClick={() => trackCTAClick('get_started', 'cta-footer')}>
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-xl">
                <Link href="/login" onClick={() => trackCTAClick('sign_in', 'cta-footer')}>
                  Sign In
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold">DemandRadar</span>
          </div>
          <div className="text-sm text-muted-foreground">
            © 2025 DemandRadar. All rights reserved.
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="mailto:support@demandradar.app" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
