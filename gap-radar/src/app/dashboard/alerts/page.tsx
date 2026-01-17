/**
 * Alerts Dashboard Page
 *
 * Display between-brief alerts for significant niche events
 */

'use client';

import { useEffect, useState } from 'react';
import { Bell, TrendingUp, Tag, AlertCircle, DollarSign, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Alert {
  id: string;
  niche_id: string;
  alert_type: 'competitor_price' | 'trend_spike' | 'new_angle' | 'pain_surge' | 'feature_change';
  title: string;
  body: string;
  urgency: 'low' | 'medium' | 'high';
  is_read: boolean;
  created_at: string;
  user_niches: {
    offering_name: string;
    category: string;
  };
}

const ALERT_ICONS = {
  competitor_price: DollarSign,
  trend_spike: TrendingUp,
  new_angle: Tag,
  pain_surge: AlertCircle,
  feature_change: Zap,
};

const ALERT_COLORS = {
  competitor_price: 'text-green-600',
  trend_spike: 'text-blue-600',
  new_angle: 'text-purple-600',
  pain_surge: 'text-orange-600',
  feature_change: 'text-yellow-600',
};

const URGENCY_VARIANTS = {
  low: 'secondary',
  medium: 'default',
  high: 'destructive',
} as const;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, []);

  async function fetchAlerts() {
    try {
      const response = await fetch('/api/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');

      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(alertIds: string[]) {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_ids: alertIds }),
      });

      if (!response.ok) throw new Error('Failed to mark alerts as read');

      // Update local state
      setAlerts((prev) =>
        prev.map((alert) =>
          alertIds.includes(alert.id) ? { ...alert, is_read: true } : alert
        )
      );
    } catch (error) {
      console.error('Error marking alerts as read:', error);
    }
  }

  function markAllAsRead() {
    const unreadIds = alerts.filter((a) => !a.is_read).map((a) => a.id);
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  }

  const filteredAlerts = alerts.filter((alert) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'unread') return !alert.is_read;
    return alert.urgency === activeTab;
  });

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-1/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Alerts
          </h1>
          <p className="text-muted-foreground">
            Significant events in your tracked niches
          </p>
        </div>

        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            Mark all as read
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">
            All ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="high">
            High
          </TabsTrigger>
          <TabsTrigger value="medium">
            Medium
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
            <p className="text-muted-foreground">
              {activeTab === 'unread'
                ? "You're all caught up!"
                : 'Alerts will appear here when significant events occur in your niches.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAlerts.map((alert) => {
            const Icon = ALERT_ICONS[alert.alert_type];
            const iconColor = ALERT_COLORS[alert.alert_type];

            return (
              <Card
                key={alert.id}
                className={`transition-all ${
                  alert.is_read ? 'opacity-60' : 'border-primary'
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <Icon className={`h-5 w-5 mt-0.5 ${iconColor}`} />
                      <div>
                        <CardTitle className="text-lg mb-1">
                          {alert.title}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span className="font-medium">
                            {alert.user_niches.offering_name}
                          </span>
                          <span>•</span>
                          <span className="text-xs">
                            {new Date(alert.created_at).toLocaleDateString()}
                          </span>
                        </CardDescription>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant={URGENCY_VARIANTS[alert.urgency]}>
                        {alert.urgency}
                      </Badge>
                      {!alert.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead([alert.id])}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {alert.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
