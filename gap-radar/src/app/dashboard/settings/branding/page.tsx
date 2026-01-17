'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface BrandingSettings {
  companyName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  reportTitlePrefix: string;
  footerText: string;
  showPoweredBy: boolean;
  contactEmail: string;
  websiteUrl: string;
}

const DEFAULT_SETTINGS: BrandingSettings = {
  companyName: '',
  primaryColor: '#2563eb',
  secondaryColor: '#1e40af',
  accentColor: '#3b82f6',
  reportTitlePrefix: '',
  footerText: '',
  showPoweredBy: true,
  contactEmail: '',
  websiteUrl: '',
};

export default function BrandingSettingsPage() {
  const supabase = createClient();
  const [settings, setSettings] = useState<BrandingSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userPlan, setUserPlan] = useState<string>('free');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user plan
      const { data: userData } = await supabase
        .from('users')
        .select('plan')
        .eq('id', user.id)
        .single();

      if (userData) {
        setUserPlan(userData.plan);
      }

      // Load branding settings
      const { data, error } = await supabase
        .from('branding_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading branding settings:', error);
        return;
      }

      if (data) {
        setSettings({
          companyName: data.company_name || '',
          primaryColor: data.primary_color || DEFAULT_SETTINGS.primaryColor,
          secondaryColor: data.secondary_color || DEFAULT_SETTINGS.secondaryColor,
          accentColor: data.accent_color || DEFAULT_SETTINGS.accentColor,
          reportTitlePrefix: data.report_title_prefix || '',
          footerText: data.footer_text || '',
          showPoweredBy: data.show_powered_by ?? true,
          contactEmail: data.contact_email || '',
          websiteUrl: data.website_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('branding_settings')
        .upsert({
          user_id: user.id,
          company_name: settings.companyName,
          primary_color: settings.primaryColor,
          secondary_color: settings.secondaryColor,
          accent_color: settings.accentColor,
          report_title_prefix: settings.reportTitlePrefix,
          footer_text: settings.footerText,
          show_powered_by: settings.showPoweredBy,
          contact_email: settings.contactEmail,
          website_url: settings.websiteUrl,
        });

      if (error) throw error;

      toast.success('Branding settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (userPlan !== 'studio') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">
            Studio Plan Required
          </h2>
          <p className="text-yellow-800 mb-4">
            White-label branding customization is available exclusively on the Studio plan.
          </p>
          <a
            href="/dashboard/settings/billing"
            className="inline-block px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Upgrade to Studio
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">White-Label Branding</h1>
        <p className="text-gray-600 mt-1">
          Customize how your reports appear to clients. All settings apply to PDF exports.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Company Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Acme Analytics"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Title Prefix
              </label>
              <input
                type="text"
                value={settings.reportTitlePrefix}
                onChange={(e) => setSettings({ ...settings, reportTitlePrefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Acme Corp"
              />
              <p className="text-xs text-gray-500 mt-1">
                Appears as &quot;{settings.reportTitlePrefix || 'DemandRadar'} Market Analysis&quot; in report header
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Footer Text
              </label>
              <input
                type="text"
                value={settings.footerText}
                onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Acme Analytics • Market Research"
              />
              <p className="text-xs text-gray-500 mt-1">
                Appears at the bottom of each page in the report
              </p>
            </div>
          </div>
        </div>

        {/* Brand Colors */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Brand Colors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Used for scores and accents</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Secondary Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Used for headings and titles</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Accent Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  className="h-10 w-16 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.accentColor}
                  onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Used for highlights</p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information (Optional)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email
              </label>
              <input
                type="email"
                value={settings.contactEmail}
                onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contact@acme.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website URL
              </label>
              <input
                type="url"
                value={settings.websiteUrl}
                onChange={(e) => setSettings({ ...settings, websiteUrl: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://acme.com"
              />
            </div>
          </div>
        </div>

        {/* Powered By */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.showPoweredBy}
              onChange={(e) => setSettings({ ...settings, showPoweredBy: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Show &quot;Powered by DemandRadar&quot; in reports
            </span>
          </label>
          <p className="text-xs text-gray-500 mt-1 ml-6">
            Uncheck to completely white-label your reports
          </p>
        </div>

        {/* Preview */}
        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Preview</h2>
          <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div
              className="border-b-2 pb-3 mb-4"
              style={{ borderColor: settings.primaryColor }}
            >
              <h3
                className="text-xl font-bold mb-1"
                style={{ color: settings.secondaryColor }}
              >
                {settings.reportTitlePrefix || 'DemandRadar'} Market Analysis
              </h3>
              <p className="text-sm text-gray-600">Sample Report Preview</p>
            </div>
            <div className="text-xs text-gray-500 text-center mt-6">
              {settings.footerText || 'DemandRadar • Market Gap Analysis Tool'}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end border-t pt-6">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
