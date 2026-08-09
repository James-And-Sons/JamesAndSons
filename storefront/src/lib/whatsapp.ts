export interface WhatsAppMessagePayload {
  to: string;
  text: string;
}

/**
 * Sends a direct WhatsApp message using Meta Official WhatsApp Cloud API
 */
export async function sendWhatsAppMessage({
  to,
  text,
}: WhatsAppMessagePayload): Promise<{
  success: boolean;
  id?: string;
  error?: string;
}> {
  const waToken = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!to) {
    return { success: false, error: "Recipient phone number is required" };
  }

  const cleanPhone = to.replace(/\D/g, "");
  if (!cleanPhone) {
    return { success: false, error: "Invalid recipient phone number" };
  }

  // Meta Official WhatsApp Cloud API (Primary Provider - Lowest Cost)
  if (waToken && phoneId) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${phoneId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${waToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            type: "text",
            text: { preview_url: true, body: text },
          }),
        },
      );

      const data = await res.json();
      if (res.ok) {
        console.log(
          `[Meta WhatsApp API] Successfully sent message to +${cleanPhone} (ID: ${data.messages?.[0]?.id})`,
        );
        return { success: true, id: data.messages?.[0]?.id };
      }
      console.warn(`[Meta WhatsApp API Error]`, data.error);
      return {
        success: false,
        error: data.error?.message || "Meta WhatsApp dispatch failed",
      };
    } catch (err: any) {
      console.error("[Meta WhatsApp API Exception]", err);
      return { success: false, error: err.message };
    }
  }

  // Fallback: Simulation log in development mode
  console.log(`[Meta WhatsApp Simulated] To +${cleanPhone}:\n"${text}"`);
  return { success: true, id: `sim_wa_${Date.now()}` };
}
