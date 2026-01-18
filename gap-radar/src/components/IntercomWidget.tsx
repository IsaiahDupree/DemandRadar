"use client"

import { useEffect } from 'react';

interface IntercomUser {
  userId?: string;
  email?: string;
  name?: string;
}

interface IntercomSettings {
  hide_default_launcher?: boolean;
  custom_launcher_selector?: string;
  [key: string]: any;
}

interface IntercomWidgetProps {
  user?: IntercomUser;
  settings?: IntercomSettings;
}

declare global {
  interface Window {
    Intercom: any;
    intercomSettings: any;
  }
}

export default function IntercomWidget({ user, settings }: IntercomWidgetProps) {
  const appId = process.env.NEXT_PUBLIC_INTERCOM_APP_ID;

  useEffect(() => {
    // Don't load if app ID is not configured
    if (!appId) {
      return;
    }

    // Load Intercom script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = `https://widget.intercom.io/widget/${appId}`;

    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    }

    // Initialize Intercom settings
    window.intercomSettings = {
      api_base: 'https://api-iam.intercom.io',
      app_id: appId,
    };

    // Boot Intercom with user data and settings
    const bootSettings: any = {
      app_id: appId,
      ...settings,
    };

    if (user) {
      if (user.userId) bootSettings.user_id = user.userId;
      if (user.email) bootSettings.email = user.email;
      if (user.name) bootSettings.name = user.name;
    }

    // Wait for Intercom to be available
    const checkIntercom = setInterval(() => {
      if (window.Intercom) {
        clearInterval(checkIntercom);
        window.Intercom('boot', bootSettings);
      }
    }, 100);

    // Cleanup timeout after 10 seconds
    const timeout = setTimeout(() => {
      clearInterval(checkIntercom);
    }, 10000);

    return () => {
      clearInterval(checkIntercom);
      clearTimeout(timeout);
      if (window.Intercom) {
        window.Intercom('shutdown');
      }
    };
  }, []); // Empty dependency array for initial load

  // Update Intercom when user data changes
  useEffect(() => {
    if (!appId || !window.Intercom || !user) {
      return;
    }

    const updateSettings: any = {};
    if (user.userId) updateSettings.user_id = user.userId;
    if (user.email) updateSettings.email = user.email;
    if (user.name) updateSettings.name = user.name;

    // Only update if we have user data
    if (Object.keys(updateSettings).length > 0) {
      window.Intercom('update', updateSettings);
    }
  }, [user?.userId, user?.email, user?.name, appId]);

  // This component doesn't render anything visible
  return null;
}
