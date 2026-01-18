/**
 * White Label Reports
 *
 * Utilities for managing and applying custom branding to reports (Studio plan feature)
 */

import { SupabaseClient } from "@supabase/supabase-js";
import { getUserSubscription } from "@/lib/subscription/permissions";

export interface WhiteLabelConfig {
  companyName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  removeBranding?: boolean;
}

/**
 * Check if user can use white-label features
 * Only available to Studio plan users
 */
export async function canUseWhiteLabel(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; message?: string }> {
  try {
    const subscription = await getUserSubscription(supabase, userId);

    if (!subscription || subscription.tier !== "studio") {
      return {
        allowed: false,
        message: "White-label reports are only available on the Studio plan",
      };
    }

    if (subscription.status !== "active" && subscription.status !== "trialing") {
      return {
        allowed: false,
        message: "Your Studio subscription is not active",
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error("Error checking white-label eligibility:", error);
    return {
      allowed: false,
      message: "An error occurred while checking eligibility",
    };
  }
}

/**
 * Get white-label configuration for a user
 */
export async function getWhiteLabelConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  success: boolean;
  config?: WhiteLabelConfig | null;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("white_label_configs")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error) {
      // If no config exists, return null rather than error
      if (error.code === "PGRST116") {
        return { success: true, config: null };
      }
      console.error("Error fetching white-label config:", error);
      return {
        success: false,
        error: "Failed to retrieve white-label configuration",
      };
    }

    if (!data) {
      return { success: true, config: null };
    }

    // Convert database format to app format
    const config: WhiteLabelConfig = {
      companyName: data.company_name,
      logoUrl: data.logo_url,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      removeBranding: data.remove_branding,
    };

    return { success: true, config };
  } catch (error) {
    console.error("Error in getWhiteLabelConfig:", error);
    return {
      success: false,
      error: "An error occurred while retrieving configuration",
    };
  }
}

/**
 * Set white-label configuration for a user
 */
export async function setWhiteLabelConfig(
  supabase: SupabaseClient,
  userId: string,
  config: WhiteLabelConfig
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is eligible
    const eligibility = await canUseWhiteLabel(supabase, userId);
    if (!eligibility.allowed) {
      return {
        success: false,
        error: eligibility.message || "Not eligible for white-label features",
      };
    }

    // Convert app format to database format
    const dbConfig: any = {
      user_id: userId,
    };

    if (config.companyName !== undefined) {
      dbConfig.company_name = config.companyName;
    }
    if (config.logoUrl !== undefined) {
      dbConfig.logo_url = config.logoUrl;
    }
    if (config.primaryColor !== undefined) {
      dbConfig.primary_color = config.primaryColor;
    }
    if (config.secondaryColor !== undefined) {
      dbConfig.secondary_color = config.secondaryColor;
    }
    if (config.removeBranding !== undefined) {
      dbConfig.remove_branding = config.removeBranding;
    }

    // Upsert configuration
    const { error } = await supabase
      .from("white_label_configs")
      .upsert(dbConfig);

    if (error) {
      console.error("Error setting white-label config:", error);
      return {
        success: false,
        error: "Failed to save white-label configuration",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in setWhiteLabelConfig:", error);
    return {
      success: false,
      error: "An error occurred while saving configuration",
    };
  }
}

/**
 * Delete white-label configuration for a user
 */
export async function deleteWhiteLabelConfig(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from("white_label_configs")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting white-label config:", error);
      return {
        success: false,
        error: "Failed to delete white-label configuration",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteWhiteLabelConfig:", error);
    return {
      success: false,
      error: "An error occurred while deleting configuration",
    };
  }
}

/**
 * Apply white-label configuration to report data
 * This function modifies the report data to use custom branding
 */
export function applyWhiteLabelToReport(
  reportData: any,
  whiteLabel: WhiteLabelConfig | null
): any {
  // If no white-label config, return original
  if (!whiteLabel) {
    return reportData;
  }

  // Create a deep copy to avoid mutating original
  const customizedReport = JSON.parse(JSON.stringify(reportData));

  // Apply branding changes
  if (!customizedReport.branding) {
    customizedReport.branding = {};
  }

  if (whiteLabel.companyName) {
    customizedReport.branding.companyName = whiteLabel.companyName;
  }

  if (whiteLabel.logoUrl) {
    customizedReport.branding.logoUrl = whiteLabel.logoUrl;
  }

  if (whiteLabel.primaryColor) {
    customizedReport.branding.primaryColor = whiteLabel.primaryColor;
  }

  if (whiteLabel.secondaryColor) {
    customizedReport.branding.secondaryColor = whiteLabel.secondaryColor;
  }

  // Remove DemandRadar branding if requested
  if (whiteLabel.removeBranding) {
    // Remove footer attribution
    if (customizedReport.footer) {
      customizedReport.footer = customizedReport.footer.replace(
        /Generated by DemandRadar/gi,
        ""
      );
      customizedReport.footer = customizedReport.footer.replace(
        /DemandRadar/gi,
        whiteLabel.companyName || ""
      );
      customizedReport.footer = customizedReport.footer.trim();
    }

    // Remove watermarks
    if (customizedReport.watermark) {
      delete customizedReport.watermark;
    }

    // Remove any DemandRadar mentions in headers
    if (customizedReport.header) {
      customizedReport.header = customizedReport.header.replace(
        /DemandRadar/gi,
        whiteLabel.companyName || ""
      );
    }
  }

  return customizedReport;
}

/**
 * Get default branding (DemandRadar)
 */
export function getDefaultBranding() {
  return {
    companyName: "DemandRadar",
    logoUrl: "/demandradar-logo.png",
    primaryColor: "#3B82F6",
    secondaryColor: "#1E40AF",
    removeBranding: false,
  };
}
