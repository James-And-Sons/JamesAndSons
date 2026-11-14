/**
 * Amazon Selling Partner AppIntegrations API (v2024-04-01)
 *
 * Enables James & Sons to:
 * 1. Create and trigger in-app operational notifications inside Amazon Seller Central.
 * 2. Delete / dismiss stale notification alerts.
 * 3. Record seller feedback on operational actions.
 */

import { getAmazonConfig, getLwaAccessToken, signedSpApiFetch } from "./sp-api";

export interface CreateAppNotificationPayload {
  templateId: string;
  notificationParameters: Record<string, any>;
  marketplaceId?: string;
}

export interface AppNotificationResponse {
  success: boolean;
  notificationId?: string;
  error?: string;
}

/**
 * Trigger an in-app operational notification inside Amazon Seller Central.
 * POST /appIntegrations/2024-04-01/notifications
 */
export async function createAppNotification(
  payload: CreateAppNotificationPayload,
): Promise<AppNotificationResponse> {
  try {
    const config = getAmazonConfig();
    const accessToken = await getLwaAccessToken();

    const body = {
      templateId: payload.templateId,
      notificationParameters: payload.notificationParameters,
      marketplaceId: payload.marketplaceId || config.marketplaceId,
    };

    const res = await signedSpApiFetch(
      "/appIntegrations/2024-04-01/notifications",
      accessToken,
      config,
      {
        method: "POST",
        extraHeaders: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        error: `Amazon API error ${res.status}: ${errorText}`,
      };
    }

    const data = await res.json();
    return {
      success: true,
      notificationId: data?.notificationId,
    };
  } catch (err: any) {
    console.error("[Amazon AppIntegrations] Error creating notification:", err);
    return {
      success: false,
      error: err.message || "Failed to create AppIntegrations notification",
    };
  }
}

/**
 * Delete a notification from Seller Central.
 * POST /appIntegrations/2024-04-01/notifications/deletion
 */
export async function deleteAppNotification(
  templateId: string,
  deletionReason = "ACTION_COMPLETED",
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getAmazonConfig();
    const accessToken = await getLwaAccessToken();

    const body = {
      templateId,
      deletionReason,
    };

    const res = await signedSpApiFetch(
      "/appIntegrations/2024-04-01/notifications/deletion",
      accessToken,
      config,
      {
        method: "POST",
        extraHeaders: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        error: `Amazon API error ${res.status}: ${errorText}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Amazon AppIntegrations] Error deleting notification:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Record seller feedback / action taken on a notification.
 * POST /appIntegrations/2024-04-01/notifications/{notificationId}/feedback
 */
export async function recordNotificationFeedback(
  notificationId: string,
  feedbackAction: "ACTION_TAKEN" | "DISMISSED" = "ACTION_TAKEN",
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = getAmazonConfig();
    const accessToken = await getLwaAccessToken();

    const body = {
      feedbackAction,
    };

    const res = await signedSpApiFetch(
      `/appIntegrations/2024-04-01/notifications/${encodeURIComponent(notificationId)}/feedback`,
      accessToken,
      config,
      {
        method: "POST",
        extraHeaders: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      return {
        success: false,
        error: `Amazon API error ${res.status}: ${errorText}`,
      };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Amazon AppIntegrations] Error recording feedback:", err);
    return { success: false, error: err.message };
  }
}
