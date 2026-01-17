"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Video,
  Film,
  Target,
  Copy,
  Download,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

interface UGCPackProps {
  ugc: {
    hooks: { text: string; type: string }[];
    scripts: { duration: string; outline: string[] }[];
    shotList: { shot: string; description: string }[];
    angleMap: { angle: string; priority: number; examples: string[] }[];
  } | null;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleCopy}
      className="h-8"
    >
      {copied ? (
        <>
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Copied
        </>
      ) : (
        <>
          <Copy className="h-3 w-3 mr-1" />
          Copy
        </>
      )}
    </Button>
  );
}

function HookCard({ hook, index }: { hook: { text: string; type: string }; index: number }) {
  return (
    <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
              {index + 1}
            </div>
            <Badge variant="outline">{hook.type}</Badge>
          </div>
          <p className="text-sm font-medium leading-relaxed">{hook.text}</p>
        </div>
        <CopyButton text={hook.text} />
      </div>
    </div>
  );
}

function ScriptCard({ script, index }: { script: { duration: string; outline: string[] }; index: number }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
              {index + 1}
            </div>
            <div>
              <CardTitle className="text-base">Script #{index + 1}</CardTitle>
              <CardDescription>{script.duration}</CardDescription>
            </div>
          </div>
          <Badge variant="secondary">
            <Film className="h-3 w-3 mr-1" />
            {script.duration}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {script.outline.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="text-sm font-medium text-primary mt-0.5">{i + 1}.</span>
              <span className="text-sm flex-1">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function ShotListItem({ shot, index }: { shot: { shot: string; description: string }; index: number }) {
  return (
    <div className="flex items-start gap-4 p-4 border rounded-lg">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-sm shrink-0">
        {index + 1}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold mb-1">{shot.shot}</h4>
        <p className="text-sm text-muted-foreground">{shot.description}</p>
      </div>
    </div>
  );
}

function AngleCard({ angle }: { angle: { angle: string; priority: number; examples: string[] } }) {
  const getPriorityBadge = (priority: number) => {
    if (priority >= 80) return { label: "High Priority", color: "bg-red-500/10 text-red-600" };
    if (priority >= 50) return { label: "Medium Priority", color: "bg-yellow-500/10 text-yellow-600" };
    return { label: "Low Priority", color: "bg-blue-500/10 text-blue-600" };
  };

  const priorityBadge = getPriorityBadge(angle.priority);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{angle.angle}</CardTitle>
          <Badge className={priorityBadge.color}>
            {priorityBadge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-2">Example Hooks:</p>
          {angle.examples.map((example, i) => (
            <div key={i} className="flex items-start gap-2 text-sm">
              <span className="text-primary mt-0.5">→</span>
              <span className="flex-1">{example}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function UGCPack({ ugc }: UGCPackProps) {
  if (!ugc || (ugc.hooks.length === 0 && ugc.scripts.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>UGC Winners Pack</CardTitle>
          <CardDescription>
            No UGC recommendations available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            UGC data will be generated after analysis completes
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleDownloadAll = () => {
    let content = "# UGC Winners Pack\n\n";

    if (ugc.hooks.length > 0) {
      content += "## Hooks\n\n";
      ugc.hooks.forEach((hook, i) => {
        content += `${i + 1}. [${hook.type}] ${hook.text}\n`;
      });
      content += "\n";
    }

    if (ugc.scripts.length > 0) {
      content += "## Scripts\n\n";
      ugc.scripts.forEach((script, i) => {
        content += `### Script ${i + 1} (${script.duration})\n`;
        script.outline.forEach((step, j) => {
          content += `${j + 1}. ${step}\n`;
        });
        content += "\n";
      });
    }

    if (ugc.shotList.length > 0) {
      content += "## Shot List\n\n";
      ugc.shotList.forEach((shot, i) => {
        content += `${i + 1}. **${shot.shot}**\n   ${shot.description}\n\n`;
      });
    }

    if (ugc.angleMap.length > 0) {
      content += "## Angle Mapping\n\n";
      ugc.angleMap.forEach((angle) => {
        content += `### ${angle.angle} (Priority: ${angle.priority})\n`;
        angle.examples.forEach((example) => {
          content += `- ${example}\n`;
        });
        content += "\n";
      });
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ugc-winners-pack.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header with Download */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">UGC Winners Pack</h3>
                <p className="text-sm text-muted-foreground">
                  Ready-to-use hooks, scripts, and shot lists for creating winning UGC content.
                  These are tailored to your market based on successful patterns.
                </p>
              </div>
            </div>
            <Button onClick={handleDownloadAll} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Hooks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ugc.hooks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Attention-grabbing openers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Scripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ugc.scripts.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Full video outlines
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shot List Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ugc.shotList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Visual composition ideas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Angles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ugc.angleMap.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Messaging approaches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>UGC Content Library</CardTitle>
          <CardDescription>
            Browse and copy ready-to-use content for your video creators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="hooks" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hooks">
                <Video className="h-4 w-4 mr-2" />
                Hooks ({ugc.hooks.length})
              </TabsTrigger>
              <TabsTrigger value="scripts">
                <Film className="h-4 w-4 mr-2" />
                Scripts ({ugc.scripts.length})
              </TabsTrigger>
              <TabsTrigger value="shots">
                <Target className="h-4 w-4 mr-2" />
                Shot List ({ugc.shotList.length})
              </TabsTrigger>
              <TabsTrigger value="angles">
                <Sparkles className="h-4 w-4 mr-2" />
                Angles ({ugc.angleMap.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="hooks" className="space-y-3">
              {ugc.hooks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No hooks available</p>
              ) : (
                ugc.hooks.map((hook, index) => (
                  <HookCard key={index} hook={hook} index={index} />
                ))
              )}
            </TabsContent>

            <TabsContent value="scripts" className="space-y-4">
              {ugc.scripts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No scripts available</p>
              ) : (
                ugc.scripts.map((script, index) => (
                  <ScriptCard key={index} script={script} index={index} />
                ))
              )}
            </TabsContent>

            <TabsContent value="shots" className="space-y-3">
              {ugc.shotList.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No shot list available</p>
              ) : (
                ugc.shotList.map((shot, index) => (
                  <ShotListItem key={index} shot={shot} index={index} />
                ))
              )}
            </TabsContent>

            <TabsContent value="angles" className="space-y-4">
              {ugc.angleMap.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No angle mapping available</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {ugc.angleMap.map((angle, index) => (
                    <AngleCard key={index} angle={angle} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Usage Tips */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle>How to Use This Pack</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">1.</span>
              <span>
                <strong>Choose Your Hooks:</strong> Select 3-5 hooks that resonate with your target audience and align with your brand voice.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">2.</span>
              <span>
                <strong>Adapt Scripts:</strong> Use the script outlines as templates. Customize them with your specific product details and benefits.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">3.</span>
              <span>
                <strong>Follow Shot Lists:</strong> Share shot list items with creators to ensure consistent visual quality and messaging.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">4.</span>
              <span>
                <strong>Test Angles:</strong> Start with high-priority angles and A/B test different approaches to find what converts best.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">5.</span>
              <span>
                <strong>Download & Share:</strong> Use the download button to export all content and share with your creator network or team.
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
