"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CompetitorAlert } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function AlertNotifications() {
  const [alerts, setAlerts] = useState<CompetitorAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/competitors/alerts?unread=false');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const data = await response.json();
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    try {
      const response = await fetch(`/api/competitors/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      });

      if (!response.ok) throw new Error('Failed to mark alert as read');

      // Update local state
      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, is_read: true } : alert
      ));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const handleAlertClick = (alert: CompetitorAlert) => {
    if (!alert.is_read) {
      markAsRead(alert.id);
    }
  };

  const unreadCount = alerts.filter(a => !a.is_read && !a.is_dismissed).length;
  const visibleAlerts = alerts.filter(a => !a.is_dismissed);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Alerts"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              data-testid="alert-badge"
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-2 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {visibleAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No alerts</p>
              <p className="text-xs mt-1">You&apos;re all caught up!</p>
            </div>
          ) : (
            <div className="py-1">
              {visibleAlerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={`/dashboard/competitors/${alert.competitor_id}`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <DropdownMenuItem
                    data-testid={`alert-item-${alert.id}`}
                    className={`cursor-pointer px-3 py-3 focus:bg-accent ${
                      !alert.is_read ? 'bg-accent/50 font-semibold' : ''
                    }`}
                  >
                    <div className="flex flex-col gap-1 w-full">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-sm ${!alert.is_read ? 'font-semibold' : ''}`}>
                          {alert.title}
                        </span>
                        {!alert.is_read && (
                          <div className="h-2 w-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                        )}
                      </div>
                      {alert.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {alert.description}
                        </p>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </DropdownMenuItem>
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
        {visibleAlerts.length > 0 && (
          <div className="border-t px-2 py-2">
            <Link href="/dashboard/competitors">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View All Alerts
              </Button>
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
