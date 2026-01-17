"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NicheConfig {
  offeringName: string;
  category: string;
  nicheTags: string[];
  customerProfile: {
    type: "B2C" | "B2B";
    segment: string;
    pricePoint: "low" | "mid" | "high";
  };
  competitors: string[];
  keywords: string[];
  geo: string;
}

interface NichePreviewProps {
  config: NicheConfig;
  onChange: (config: NicheConfig) => void;
}

export function NichePreview({ config, onChange }: NichePreviewProps) {
  const [newKeyword, setNewKeyword] = useState("");
  const [newCompetitor, setNewCompetitor] = useState("");
  const [newTag, setNewTag] = useState("");

  const addKeyword = () => {
    if (newKeyword && !config.keywords.includes(newKeyword)) {
      onChange({
        ...config,
        keywords: [...config.keywords, newKeyword],
      });
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    onChange({
      ...config,
      keywords: config.keywords.filter((k) => k !== keyword),
    });
  };

  const addCompetitor = () => {
    if (newCompetitor && !config.competitors.includes(newCompetitor)) {
      onChange({
        ...config,
        competitors: [...config.competitors, newCompetitor],
      });
      setNewCompetitor("");
    }
  };

  const removeCompetitor = (competitor: string) => {
    onChange({
      ...config,
      competitors: config.competitors.filter((c) => c !== competitor),
    });
  };

  const addTag = () => {
    if (newTag && !config.nicheTags.includes(newTag)) {
      onChange({
        ...config,
        nicheTags: [...config.nicheTags, newTag],
      });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    onChange({
      ...config,
      nicheTags: config.nicheTags.filter((t) => t !== tag),
    });
  };

  return (
    <div className="space-y-6">
      {/* Offering Name */}
      <div className="space-y-2">
        <Label htmlFor="offeringName">Offering Name</Label>
        <Input
          id="offeringName"
          value={config.offeringName}
          onChange={(e) =>
            onChange({ ...config, offeringName: e.target.value })
          }
          placeholder="e.g., BlankLogo"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={config.category}
          onChange={(e) =>
            onChange({ ...config, category: e.target.value })
          }
          placeholder="e.g., Design Tools, SaaS, Education"
        />
      </div>

      {/* Niche Tags */}
      <div className="space-y-2">
        <Label>Niche Tags</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {config.nicheTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            placeholder="Add a tag"
          />
          <Button onClick={addTag} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Customer Profile */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Customer Type</Label>
          <Select
            value={config.customerProfile.type}
            onValueChange={(value: "B2C" | "B2B") =>
              onChange({
                ...config,
                customerProfile: { ...config.customerProfile, type: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="B2C">B2C (Consumer)</SelectItem>
              <SelectItem value="B2B">B2B (Business)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="segment">Segment</Label>
          <Input
            id="segment"
            value={config.customerProfile.segment}
            onChange={(e) =>
              onChange({
                ...config,
                customerProfile: {
                  ...config.customerProfile,
                  segment: e.target.value,
                },
              })
            }
            placeholder="e.g., creators, SMBs, agencies"
          />
        </div>

        <div className="space-y-2">
          <Label>Price Point</Label>
          <Select
            value={config.customerProfile.pricePoint}
            onValueChange={(value: "low" | "mid" | "high") =>
              onChange({
                ...config,
                customerProfile: {
                  ...config.customerProfile,
                  pricePoint: value,
                },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low ($0-50/mo)</SelectItem>
              <SelectItem value="mid">Mid ($50-200/mo)</SelectItem>
              <SelectItem value="high">High ($200+/mo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label>Keywords to Track</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {config.keywords.map((keyword) => (
            <Badge key={keyword} variant="secondary" className="gap-1">
              {keyword}
              <button
                onClick={() => removeKeyword(keyword)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
            placeholder="Add a keyword"
          />
          <Button onClick={addKeyword} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Keywords we'll monitor in ads, search, and social media
        </p>
      </div>

      {/* Competitors */}
      <div className="space-y-2">
        <Label>Competitors to Watch</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {config.competitors.map((competitor) => (
            <Badge key={competitor} variant="secondary" className="gap-1">
              {competitor}
              <button
                onClick={() => removeCompetitor(competitor)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newCompetitor}
            onChange={(e) => setNewCompetitor(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && (e.preventDefault(), addCompetitor())
            }
            placeholder="Add a competitor"
          />
          <Button onClick={addCompetitor} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          We'll track their pricing, features, and ad strategies
        </p>
      </div>

      {/* Geography */}
      <div className="space-y-2">
        <Label>Geography</Label>
        <Select
          value={config.geo}
          onValueChange={(value) => onChange({ ...config, geo: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="US">United States</SelectItem>
            <SelectItem value="UK">United Kingdom</SelectItem>
            <SelectItem value="CA">Canada</SelectItem>
            <SelectItem value="AU">Australia</SelectItem>
            <SelectItem value="global">Global</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
