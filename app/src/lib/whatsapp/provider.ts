type WhatsAppTextInput = {
  to: string;
  body: string;
};

type WhatsAppSendResult = {
  provider: "Meta WhatsApp Cloud API";
  status: "Sent";
  messageId?: string;
  raw?: unknown;
};

function normalisePhone(rawPhone: string) {
  const phone = String(rawPhone || "").replace(/[^\d+]/g, "");

  if (!phone) {
    throw new Error("WhatsApp recipient phone is required.");
  }

  return phone.startsWith("+") ? phone.slice(1) : phone;
}

function getMetaConfig() {
  const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0";

  if (!accessToken) {
    throw new Error("WHATSAPP_CLOUD_ACCESS_TOKEN is not configured.");
  }

  if (!phoneNumberId) {
    throw new Error("WHATSAPP_CLOUD_PHONE_NUMBER_ID is not configured.");
  }

  return {accessToken, phoneNumberId, apiVersion};
}

export async function sendWhatsAppTextMessage(
  input: WhatsAppTextInput,
): Promise<WhatsAppSendResult> {
  const {accessToken, phoneNumberId, apiVersion} = getMetaConfig();
  const to = normalisePhone(input.to);

  if (!input.body || !input.body.trim()) {
    throw new Error("WhatsApp message body is required.");
  }

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: true,
          body: input.body,
        },
      }),
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `WhatsApp send failed with HTTP ${response.status}.`;
    throw new Error(message);
  }

  return {
    provider: "Meta WhatsApp Cloud API",
    status: "Sent",
    messageId: payload?.messages?.[0]?.id,
    raw: payload,
  };
}
