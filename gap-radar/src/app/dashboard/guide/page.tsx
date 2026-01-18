"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Video, Lightbulb, ArrowRight, Play, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function GuidePage() {
  const tutorials = [
    {
      id: 1,
      title: "Getting Started Tutorial",
      description: "Learn how to run your first analysis and understand the results",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "5:23",
    },
    {
      id: 2,
      title: "Understanding Market Gaps",
      description: "How to identify and prioritize the best opportunities",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "8:15",
    },
    {
      id: 3,
      title: "Advanced Analysis Techniques",
      description: "Tips for getting the most out of your reports",
      embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      duration: "12:40",
    },
  ];

  const bestPractices = [
    {
      title: "Be Specific with Your Niche",
      description: "Instead of 'fitness apps', try 'AI-powered meal planning apps for bodybuilders'",
      tips: [
        "Use specific keywords and qualifiers",
        "Include the target audience in your query",
        "Mention specific features or use cases",
      ],
    },
    {
      title: "Review Multiple Reports",
      description: "Compare related niches to identify patterns and broader opportunities",
      tips: [
        "Run analyses for adjacent markets",
        "Look for common pain points across niches",
        "Identify gaps that appear in multiple reports",
      ],
    },
    {
      title: "Validate with Real Data",
      description: "Use the ad and Reddit data to validate assumptions before building",
      tips: [
        "Check how long competitors have been running ads",
        "Read actual user complaints in the Reddit mentions",
        "Look for repeated patterns in multiple sources",
      ],
    },
    {
      title: "Focus on High-Confidence Gaps",
      description: "Start with gaps that have strong evidence from multiple sources",
      tips: [
        "Prioritize gaps with 70+ confidence scores",
        "Look for misalignments between ads and user feedback",
        "Choose gaps with clear, actionable recommendations",
      ],
    },
  ];

  const features = [
    {
      title: "How to Run Your First Analysis",
      icon: <BookOpen className="h-5 w-5" />,
      steps: [
        "Click 'New Run' from your dashboard",
        "Enter your niche in natural language (e.g., 'productivity tools for remote teams')",
        "Optionally add competitor names or specific keywords",
        "Wait 3-5 minutes for the analysis to complete",
        "Review your comprehensive report with gaps, ads, and Reddit insights",
      ],
    },
    {
      title: "Understanding Your Report",
      icon: <CheckCircle2 className="h-5 w-5" />,
      steps: [
        "Executive Summary: Overall opportunity score and top gaps at a glance",
        "Market Reality: What competitors are advertising and their key messages",
        "User Feedback: Real complaints and desired features from Reddit",
        "Gap Opportunities: Ranked list of product/market misalignments",
        "Recommendations: Actionable '3% better' improvements you can implement",
      ],
    },
    {
      title: "Working with Gaps",
      icon: <Lightbulb className="h-5 w-5" />,
      steps: [
        "Gaps are ranked by opportunity score (0-100)",
        "Each gap shows evidence from ads AND Reddit data",
        "Confidence score indicates data quality (higher is better)",
        "Filter by gap type: product, pricing, positioning, trust, or offer",
        "Export gaps to CSV for sharing with your team",
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Success Guide</h1>
          <p className="text-muted-foreground">
            Feature explainers, best practices, and video tutorials to help you get the most out of GapRadar
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            Back to Dashboard
          </Link>
        </Button>
      </div>

      {/* Getting Started Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Getting Started</h2>
          <p className="text-muted-foreground">
            Learn how to use GapRadar to find and validate market opportunities
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {feature.icon}
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-3">
                  {feature.steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Badge variant="outline" className="mt-0.5 h-5 w-5 shrink-0 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-muted-foreground">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Best Practices Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Best Practices</h2>
          <p className="text-muted-foreground">
            Tips and strategies from successful GapRadar users
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {bestPractices.map((practice) => (
            <Card key={practice.title}>
              <CardHeader>
                <CardTitle className="text-lg">{practice.title}</CardTitle>
                <CardDescription>{practice.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {practice.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <span className="text-muted-foreground">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Video Tutorials Section */}
      <section>
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Video Tutorials</h2>
          <p className="text-muted-foreground">
            Watch step-by-step guides to master GapRadar
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {tutorials.map((tutorial) => (
            <Card key={tutorial.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Video className="h-3 w-3" />
                    {tutorial.duration}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative aspect-video rounded-md overflow-hidden bg-muted">
                  <iframe
                    src={tutorial.embedUrl}
                    title={tutorial.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{tutorial.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tutorial.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Need More Help?</CardTitle>
          <CardDescription>
            Additional resources and support options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <BookOpen className="h-5 w-5 mt-0.5 text-primary" />
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Documentation</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Detailed guides on every feature and API endpoint
              </p>
              <Button variant="outline" size="sm">
                View Docs
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <Play className="h-5 w-5 mt-0.5 text-primary" />
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Example Reports</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Browse sample analyses across different niches
              </p>
              <Button variant="outline" size="sm">
                View Examples
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <Lightbulb className="h-5 w-5 mt-0.5 text-primary" />
            <div className="flex-1">
              <h4 className="font-semibold mb-1">Contact Support</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Get help from our team via email or chat
              </p>
              <Button variant="outline" size="sm">
                Get Support
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
