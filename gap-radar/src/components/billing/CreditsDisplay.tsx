"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Coins } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CreditsInfo {
  used: number;
  limit: number;
  remaining: number;
  plan?: string;
}

interface CreditsDisplayProps {
  refreshTrigger?: number;
}

/**
 * CreditsDisplay Component
 * Feature: CREDIT-002 - Credits Display Component
 *
 * Shows remaining credits in header/sidebar with low balance warning
 */
export default function CreditsDisplay({ refreshTrigger }: CreditsDisplayProps) {
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchCredits();
  }, [refreshTrigger]);

  async function fetchCredits() {
    try {
      setLoading(true);
      setError(false);
      const response = await fetch('/api/billing/credits');
      if (response.ok) {
        const data = await response.json();
        setCredits(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error('Error fetching credits:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function isLowBalance(): boolean {
    if (!credits) return false;
    // Low balance if remaining credits are 20% or less of limit (minimum 2)
    const threshold = Math.max(2, Math.ceil(credits.limit * 0.2));
    return credits.remaining <= threshold;
  }

  return (
    <div data-testid="credits-display" className="flex items-center gap-2">
      {loading ? (
        <div className="flex items-center gap-2">
          <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Coins className="h-4 w-4" />
          <span className="text-sm">--</span>
        </div>
      ) : credits ? (
        <>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{credits.remaining}</span>
            {isLowBalance() && (
              <span data-testid="low-balance-warning">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              </span>
            )}
          </div>
          <Link
            href="/dashboard/billing"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Buy Credits
          </Link>
        </>
      ) : null}
    </div>
  );
}
