"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";
import { Plus, ExternalLink, Trash2, RefreshCw, Bell, BellOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface TrackedCompetitor {
  id: string;
  name: string;
  url: string;
  category?: string;
  notes?: string;
  pricing_model?: string;
  pricing_amount?: number;
  pricing_currency?: string;
  features?: string[];
  description?: string;
  last_checked_at?: string;
  pricing_changed_at?: string;
  features_changed_at?: string;
  alert_on_pricing_change: boolean;
  alert_on_feature_change: boolean;
  created_at: string;
  updated_at: string;
  changes_last_7_days?: number;
  recent_changes?: any[];
}

interface CompetitorFormData {
  name: string;
  url: string;
  category: string;
  notes: string;
  alert_on_pricing_change: boolean;
  alert_on_feature_change: boolean;
}

export default function CompetitorTrackerPage() {
  const [competitors, setCompetitors] = useState<TrackedCompetitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CompetitorFormData>({
    name: "",
    url: "",
    category: "",
    notes: "",
    alert_on_pricing_change: true,
    alert_on_feature_change: true,
  });
  const [formErrors, setFormErrors] = useState<Partial<CompetitorFormData>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCompetitors();
  }, []);

  async function fetchCompetitors() {
    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from('competitors_with_changes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCompetitors(data || []);
    } catch (error) {
      console.error('Error fetching competitors:', error);
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): boolean {
    const errors: Partial<CompetitorFormData> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.url.trim()) {
      errors.url = "URL is required";
    } else if (!formData.url.match(/^https?:\/\/.+/)) {
      errors.url = "URL must start with http:// or https://";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('tracked_competitors')
        .insert({
          user_id: user.id,
          name: formData.name,
          url: formData.url,
          category: formData.category || null,
          notes: formData.notes || null,
          alert_on_pricing_change: formData.alert_on_pricing_change,
          alert_on_feature_change: formData.alert_on_feature_change,
        })
        .select()
        .single();

      if (error) throw error;

      setCompetitors(prev => [data, ...prev]);
      setIsDialogOpen(false);
      setFormData({
        name: "",
        url: "",
        category: "",
        notes: "",
        alert_on_pricing_change: true,
        alert_on_feature_change: true,
      });
      setFormErrors({});
    } catch (error: any) {
      console.error('Error adding competitor:', error);
      if (error.code === '23505') {
        setFormErrors({ url: 'This competitor is already being tracked' });
      } else {
        alert('Failed to add competitor. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('tracked_competitors')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCompetitors(prev => prev.filter(comp => comp.id !== id));
    } catch (error) {
      console.error('Error removing competitor:', error);
      alert('Failed to remove competitor');
    } finally {
      setRemovingId(null);
    }
  }

  async function handleToggleAlert(id: string, field: 'pricing' | 'feature', value: boolean) {
    try {
      const supabase = createClient();
      const updateField = field === 'pricing' ? 'alert_on_pricing_change' : 'alert_on_feature_change';

      const { error } = await supabase
        .from('tracked_competitors')
        .update({ [updateField]: value })
        .eq('id', id);

      if (error) throw error;

      setCompetitors(prev => prev.map(comp =>
        comp.id === id
          ? { ...comp, [updateField]: value }
          : comp
      ));
    } catch (error) {
      console.error('Error updating alert settings:', error);
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Competitor Tracker</h1>
          <p className="text-muted-foreground">
            Track specific competitors over time and get alerts on changes
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-competitor-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Competitor
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="add-competitor-form">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Track New Competitor</DialogTitle>
                <DialogDescription>
                  Add a competitor to track their pricing, features, and changes over time.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Competitor Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., CompetitorApp"
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">Website URL *</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://competitor.com"
                  />
                  {formErrors.url && (
                    <p className="text-sm text-destructive">{formErrors.url}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category (optional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., SaaS, E-commerce"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any notes about this competitor..."
                    rows={3}
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="alert-pricing" className="cursor-pointer">
                      Alert on pricing changes
                    </Label>
                    <Switch
                      id="alert-pricing"
                      checked={formData.alert_on_pricing_change}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, alert_on_pricing_change: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="alert-features" className="cursor-pointer">
                      Alert on feature changes
                    </Label>
                    <Switch
                      id="alert-features"
                      checked={formData.alert_on_feature_change}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, alert_on_feature_change: checked }))
                      }
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting} data-testid="submit-competitor">
                  {submitting ? 'Adding...' : 'Add Competitor'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {competitors.length === 0 ? (
        <Card data-testid="empty-state">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ExternalLink className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No competitors tracked yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              Start tracking competitors to monitor their pricing, features, and changes over time.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Track Your First Competitor
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4" data-testid="competitors-container">
          {competitors.map((competitor) => (
            <Card key={competitor.id} data-testid="competitor-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {competitor.category && (
                        <Badge variant="outline">{competitor.category}</Badge>
                      )}
                      {(competitor.changes_last_7_days || 0) > 0 && (
                        <Badge
                          className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                          data-testid="changes-badge"
                        >
                          {competitor.changes_last_7_days} change{competitor.changes_last_7_days !== 1 ? 's' : ''} this week
                        </Badge>
                      )}
                    </div>
                    <CardTitle
                      className="text-xl mb-1"
                      data-testid="competitor-name"
                    >
                      {competitor.name}
                    </CardTitle>
                    <a
                      href={competitor.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      data-testid="competitor-url"
                    >
                      {competitor.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(competitor.id)}
                    disabled={removingId === competitor.id}
                    data-testid="remove-competitor"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {competitor.description && (
                    <p className="text-sm text-muted-foreground">
                      {competitor.description}
                    </p>
                  )}

                  {competitor.notes && (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <p className="text-sm">{competitor.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Last checked:</span>
                      <span>{formatDate(competitor.last_checked_at)}</span>
                    </div>
                    {competitor.pricing_model && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Pricing:</span>
                        <span>{competitor.pricing_model}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAlert(
                          competitor.id,
                          'pricing',
                          !competitor.alert_on_pricing_change
                        )}
                        data-testid="alert-pricing-toggle"
                      >
                        {competitor.alert_on_pricing_change ? (
                          <Bell className="h-4 w-4 mr-1" />
                        ) : (
                          <BellOff className="h-4 w-4 mr-1" />
                        )}
                        Pricing alerts
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAlert(
                          competitor.id,
                          'feature',
                          !competitor.alert_on_feature_change
                        )}
                        data-testid="alert-feature-toggle"
                      >
                        {competitor.alert_on_feature_change ? (
                          <Bell className="h-4 w-4 mr-1" />
                        ) : (
                          <BellOff className="h-4 w-4 mr-1" />
                        )}
                        Feature alerts
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      data-testid="check-now-button"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Check Now
                    </Button>
                  </div>

                  {competitor.recent_changes && competitor.recent_changes.length > 0 && (
                    <div className="pt-2 border-t" data-testid="recent-changes">
                      <h4 className="font-semibold text-sm mb-2">Recent Changes</h4>
                      <div className="space-y-2">
                        {competitor.recent_changes.slice(0, 3).map((change: any, idx: number) => (
                          <div key={idx} className="text-sm bg-muted/30 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {change.change_type}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(change.detected_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
