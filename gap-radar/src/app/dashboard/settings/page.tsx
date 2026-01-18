"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Key,
  CreditCard,
  Bell,
  Globe,
  Plug,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const integrations = [
  {
    name: "Meta Ads Library",
    description: "Access to Facebook & Instagram ad data",
    status: "connected",
    icon: "📘"
  },
  {
    name: "Google Ads Transparency",
    description: "Google ad archive access",
    status: "connected",
    icon: "🔍"
  },
  {
    name: "Reddit API",
    description: "User sentiment and discussions",
    status: "connected",
    icon: "🤖"
  },
  {
    name: "TikTok Creative Center",
    description: "Top ads and trend data",
    status: "connected",
    icon: "🎵"
  },
  {
    name: "TikTok Account",
    description: "Your connected TikTok for analytics",
    status: "disconnected",
    icon: "📱"
  },
  {
    name: "Instagram Account",
    description: "Your connected Instagram for insights",
    status: "disconnected",
    icon: "📸"
  },
];

const PLANS = {
  free: { name: 'Free', price: 0, runs: 2 },
  starter: { name: 'Starter', price: 29, runs: 2 },
  builder: { name: 'Builder', price: 99, runs: 10 },
  agency: { name: 'Agency', price: 249, runs: 35 },
  studio: { name: 'Studio', price: 499, runs: 90 },
};

interface SubscriptionData {
  plan: string;
  runsLimit: number;
  runsUsed: number;
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: string;
    cancelAtPeriodEnd: boolean;
  } | null;
}

export default function SettingsPage() {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    try {
      const response = await fetch('/api/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptionData(data);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpgrade(planKey: string) {
    setActionLoading(true);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'upgrade', planKey }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          toast.success('Plan updated successfully');
          await fetchSubscription();
        }
      } else {
        toast.error(data.error || 'Failed to upgrade plan');
      }
    } catch (error) {
      console.error('Error upgrading plan:', error);
      toast.error('Failed to upgrade plan');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelSubscription() {
    if (!confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.')) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Subscription cancelled. Access retained until period end.');
        await fetchSubscription();
      } else {
        toast.error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivateSubscription() {
    setActionLoading(true);
    try {
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate' }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Subscription reactivated successfully');
        await fetchSubscription();
      } else {
        toast.error(data.error || 'Failed to reactivate subscription');
      }
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
    } finally {
      setActionLoading(false);
    }
  }

  const currentPlan = subscriptionData?.plan || 'free';
  const planInfo = PLANS[currentPlan as keyof typeof PLANS] || PLANS.free;
  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage your account, integrations, and preferences
        </p>
      </div>

      {/* Plan & Usage */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
                Plan & Usage
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Your current subscription and usage
              </CardDescription>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 w-fit">
              {loading ? 'Loading...' : `${planInfo.name} Plan`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                <div className="p-3 sm:p-4 border rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground">Monthly Runs</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {subscriptionData?.runsUsed || 0} / {subscriptionData?.runsLimit || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(subscriptionData?.runsLimit || 0) - (subscriptionData?.runsUsed || 0)} remaining
                  </p>
                </div>
                <div className="p-3 sm:p-4 border rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground">Current Plan</p>
                  <p className="text-2xl font-bold">{planInfo.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ${planInfo.price}/month
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Next Billing</p>
                  <p className="text-2xl font-bold">
                    {subscriptionData?.subscription?.currentPeriodEnd
                      ? new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {subscriptionData?.subscription?.cancelAtPeriodEnd ? 'Cancels' : 'Renews'}
                  </p>
                </div>
              </div>

              {subscriptionData?.subscription?.cancelAtPeriodEnd && (
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-orange-600">Subscription Ending</p>
                      <p className="text-sm text-muted-foreground">
                        Your subscription will end on {new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleReactivateSubscription}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Reactivate'
                      )}
                    </Button>
                  </div>
                </div>
              )}

              <Separator />

              <div className="space-y-3">
                <p className="font-medium">Available Plans</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {Object.entries(PLANS)
                    .filter(([key]) => key !== 'free' && key !== currentPlan)
                    .map(([key, plan]) => (
                      <div
                        key={key}
                        className="p-4 border rounded-lg flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{plan.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {plan.runs} runs/month · ${plan.price}/mo
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant={plan.price > planInfo.price ? 'default' : 'outline'}
                          onClick={() => handleUpgrade(key)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : plan.price > planInfo.price ? (
                            'Upgrade'
                          ) : (
                            'Switch'
                          )}
                        </Button>
                      </div>
                    ))}
                </div>
              </div>

              {subscriptionData?.subscription && !subscriptionData.subscription.cancelAtPeriodEnd && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Cancel Subscription</p>
                      <p className="text-sm text-muted-foreground">
                        Cancel at any time. Access retained until period end.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Cancel Plan'
                      )}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Data Integrations
          </CardTitle>
          <CardDescription>
            Connect your accounts to unlock more features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {integrations.map((integration, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center text-xl">
                    {integration.icon}
                  </div>
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-sm text-muted-foreground">{integration.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {integration.status === "connected" ? (
                    <>
                      <Badge className="bg-green-500/10 text-green-600 border-0 gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Connected
                      </Badge>
                      <Button variant="outline" size="sm">Manage</Button>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Not connected
                      </Badge>
                      <Button size="sm">Connect</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Keys
          </CardTitle>
          <CardDescription>
            Manage your API keys for programmatic access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="api-key">Your API Key</Label>
              <Input
                id="api-key"
                type="password"
                value="gr_sk_xxxxxxxxxxxxxxxxxxxxxxxxxx"
                readOnly
                className="font-mono"
              />
            </div>
            <div className="flex items-end">
              <Button variant="outline">Regenerate</Button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Use this key to access the GapRadar API. Keep it secret!
          </p>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferences
          </CardTitle>
          <CardDescription>
            Customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Default Geography</Label>
              <Select defaultValue="us">
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="uk">United Kingdom</SelectItem>
                  <SelectItem value="eu">European Union</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Default Run Type</Label>
              <Select defaultValue="deep">
                <SelectTrigger>
                  <SelectValue placeholder="Select run type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Run</SelectItem>
                  <SelectItem value="deep">Deep Run</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choose what updates you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: "Run completed", desc: "Get notified when your analysis finishes" },
              { title: "Weekly digest", desc: "Summary of market trends in your niches" },
              { title: "New features", desc: "Updates about GapRadar improvements" },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
                <Button variant="outline" size="sm">
                  {index === 0 ? "On" : "Off"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions for your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="font-medium">Delete all data</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete all your runs, reports, and data
              </p>
            </div>
            <Button variant="destructive">Delete All Data</Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
            <div>
              <p className="font-medium">Delete account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and cancel subscription
              </p>
            </div>
            <Button variant="destructive">Delete Account</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
