'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { trackNLPSearch } from '@/lib/analytics/landing';
import { isAuthenticated, buildSignupURL, buildCreateRunURL, storePendingQuery } from '@/lib/auth/redirect';
import { generateSuggestions, type Suggestion } from '@/lib/nlp';

const EXAMPLE_QUERIES = [
  "AI tools for content creators",
  "alternatives to expensive project management",
  "automation for small businesses",
  "social media scheduling apps",
  "no-code website builders",
  "subscription management tools",
  "remote team collaboration",
  "AI writing assistants",
];

export function NLPSearch({ onSearch, initialValue = '' }: { onSearch?: (query: string) => void; initialValue?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Rotate placeholder examples
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // NLP-powered suggestions using the library
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsAnalyzing(true);

      // Simulate NLP processing with slight delay for UX
      setTimeout(() => {
        const generated = generateSuggestions(query);
        setSuggestions(generated);
        setIsAnalyzing(false);
        setShowSuggestions(true);
      }, 300);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const trimmedQuery = query.trim();
    trackNLPSearch('submit', trimmedQuery);
    setShowSuggestions(false);

    // Call onSearch callback if provided (for custom handling)
    if (onSearch) {
      onSearch(trimmedQuery);
      return;
    }

    // Default flow: check auth and route accordingly
    if (isAuthenticated()) {
      // User is authenticated - route to create run page
      router.push(buildCreateRunURL(trimmedQuery));
    } else {
      // User is not authenticated - preserve query and route to signup
      storePendingQuery(trimmedQuery);
      router.push(buildSignupURL(trimmedQuery));
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    trackNLPSearch('submit', suggestion.text);

    // Call onSearch callback if provided (for custom handling)
    if (onSearch) {
      onSearch(suggestion.text);
      return;
    }

    // Default flow: check auth and route accordingly
    if (isAuthenticated()) {
      // User is authenticated - route to create run page
      router.push(buildCreateRunURL(suggestion.text));
    } else {
      // User is not authenticated - preserve query and route to signup
      storePendingQuery(suggestion.text);
      router.push(buildSignupURL(suggestion.text));
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative bg-card border-2 border-border hover:border-primary/50 focus-within:border-primary rounded-2xl transition-all shadow-lg">
            <div className="flex items-center px-4 py-2">
              <Search className="h-5 w-5 text-muted-foreground mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => {
                  trackNLPSearch('focus');
                  query.length >= 3 && setShowSuggestions(true);
                }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={`Try: "${EXAMPLE_QUERIES[placeholderIndex]}"`}
                className="flex-1 bg-transparent border-none outline-none text-lg py-3 placeholder:text-muted-foreground/60"
              />
              {isAnalyzing && (
                <Loader2 className="h-5 w-5 text-primary animate-spin mr-2" />
              )}
              <Button type="submit" size="lg" className="rounded-xl">
                <span className="hidden sm:inline mr-2">Analyze Market</span>
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
            
            {/* NLP indicator */}
            <div className="px-4 pb-3 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">
                AI-powered market analysis • Enter any niche, product idea, or competitor
              </span>
            </div>
          </div>
        </div>

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="p-2 border-b bg-muted/50">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                AI Suggestions
              </span>
            </div>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center justify-between group"
              >
                <div>
                  <span className="font-medium">{suggestion.text}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {suggestion.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-primary">
                    {Math.round(suggestion.confidence * 100)}% match
                  </span>
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
              </button>
            ))}
          </div>
        )}
      </form>

      {/* Quick search chips */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        <span className="text-sm text-muted-foreground">Popular:</span>
        {['AI tools', 'SaaS alternatives', 'No-code apps', 'Automation'].map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setQuery(chip);
              trackNLPSearch('submit', chip);

              if (onSearch) {
                onSearch(chip);
              } else if (isAuthenticated()) {
                router.push(buildCreateRunURL(chip));
              } else {
                storePendingQuery(chip);
                router.push(buildSignupURL(chip));
              }
            }}
            className={cn(
              "text-sm px-3 py-1 rounded-full border",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary",
              "transition-all"
            )}
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
