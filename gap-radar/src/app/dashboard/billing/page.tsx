"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Loader2, Receipt } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";

interface Invoice {
  id: string;
  number: string | null;
  status: string;
  amount: number;
  currency: string;
  created: string;
  periodStart: string | null;
  periodEnd: string | null;
  pdfUrl: string | null;
  hostedUrl: string | null;
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInvoices();
  }, []);

  async function fetchInvoices() {
    try {
      const response = await fetch('/api/billing/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  }

  function formatAmount(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      paid: { variant: "default", label: "Paid" },
      open: { variant: "secondary", label: "Open" },
      void: { variant: "outline", label: "Void" },
      uncollectible: { variant: "destructive", label: "Uncollectible" },
      draft: { variant: "outline", label: "Draft" },
    };

    const config = variants[status] || { variant: "secondary" as const, label: status };

    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
          <p className="text-muted-foreground">
            View and download your past invoices and payment history
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard">
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Invoice History
          </CardTitle>
          <CardDescription>
            Your billing history and invoice downloads
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No invoices yet</p>
              <p className="text-sm text-muted-foreground">
                Your billing history will appear here once you have completed payments
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <p className="font-medium">
                        {invoice.number || invoice.id}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>
                        {formatDate(invoice.created)}
                      </span>
                      {invoice.periodStart && invoice.periodEnd && (
                        <span>
                          Billing Period: {formatDate(invoice.periodStart)} - {formatDate(invoice.periodEnd)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {invoice.pdfUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={invoice.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                          >
                            <Download className="h-4 w-4 mr-2" />
                            PDF
                          </a>
                        </Button>
                      )}
                      {invoice.hostedUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={invoice.hostedUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Questions about billing or need a copy of your invoice?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Contact our support team at support@gapradar.com for billing assistance.
          </p>
          <Button variant="outline">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
