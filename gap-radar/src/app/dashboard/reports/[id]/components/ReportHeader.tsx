"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Share2, FileText, Copy, Lock } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";

interface ReportHeaderProps {
  nicheQuery: string;
  createdAt: string;
  runId: string;
}

export function ReportHeader({ nicheQuery, createdAt, runId }: ReportHeaderProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [sharePassword, setSharePassword] = useState("");
  const [shareExpireDays, setShareExpireDays] = useState("30");
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  const formattedDate = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(`/api/reports/${runId}/pdf`);
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demandradar-${nicheQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  };

  const handleDownloadJSON = async () => {
    try {
      const response = await fetch(`/api/reports/${runId}`);
      if (!response.ok) {
        throw new Error('Failed to download JSON');
      }

      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demandradar-${nicheQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading JSON:', error);
      alert('Failed to download JSON. Please try again.');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const response = await fetch(`/api/exports/${runId}?format=csv`);
      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `demandradar-${nicheQuery.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV. Please try again.');
    }
  };

  const handleCreateShareLink = async () => {
    try {
      setIsCreatingShare(true);

      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          runId,
          password: sharePassword || undefined,
          expiresInDays: parseInt(shareExpireDays) || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      setShareUrl(data.shareLink.url);
      toast.success('Share link created!');
    } catch (error) {
      console.error('Error creating share link:', error);
      toast.error('Failed to create share link. Please try again.');
    } finally {
      setIsCreatingShare(false);
    }
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard!');
  };

  const handleOpenShareDialog = () => {
    setShareUrl("");
    setSharePassword("");
    setShareExpireDays("30");
    setIsShareDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{nicheQuery}</h1>
            <Badge variant="secondary">Full Dossier</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Generated on {formattedDate}</span>
            <span>•</span>
            <span>Run ID: {runId.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownloadPDF}>
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadJSON}>
                <FileText className="mr-2 h-4 w-4" />
                Download JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadCSV}>
                <FileText className="mr-2 h-4 w-4" />
                Download CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={handleOpenShareDialog}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Report</DialogTitle>
            <DialogDescription>
              Create a shareable link to this report. Optionally add password protection and set an expiration date.
            </DialogDescription>
          </DialogHeader>

          {!shareUrl ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password (optional)</Label>
                <div className="flex gap-2">
                  <Lock className="h-4 w-4 mt-3 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    placeholder="Leave empty for no password"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires">Expires in (days)</Label>
                <Input
                  id="expires"
                  type="number"
                  value={shareExpireDays}
                  onChange={(e) => setShareExpireDays(e.target.value)}
                  placeholder="30"
                  min="1"
                  max="365"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for no expiration
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Share URL</Label>
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyShareUrl}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {sharePassword && (
                <div className="bg-muted p-3 rounded-md">
                  <p className="text-sm text-muted-foreground">
                    <Lock className="h-4 w-4 inline mr-1" />
                    This link is password protected. Share the password separately.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {!shareUrl ? (
              <>
                <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateShareLink} disabled={isCreatingShare}>
                  {isCreatingShare ? "Creating..." : "Create Share Link"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsShareDialogOpen(false)}>
                Done
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
