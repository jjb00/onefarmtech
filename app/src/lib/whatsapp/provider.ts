type WhatsAppTextInput = {
  to: string;
  body: string;
};

type WhatsAppSendResult = {
  provider: "Meta WhatsApp Cloud API";
  status: "Sent";
  httpStatus: number;
  normalizedTo: string;
  messageType: "text" | "template";
  messageId?: string;
  raw?: unknown;
};

export class WhatsAppProviderError extends Error {
  details: {httpStatus?: number; code?: number; subcode?: number; providerDetails?: string; templateRequired?: boolean};

  constructor(message: string, details: {httpStatus?: number; code?: number; subcode?: number; providerDetails?: string; templateRequired?: boolean} = {}) {
    super(message);
    this.name = "WhatsAppProviderError";
    this.details = details;
  }
}

export function normaliseWhatsAppPhone(rawPhone: string, defaultCountryCode = "234") {
  const input = String(rawPhone || "").trim();
  const digits = input.replace(/\D/g, "");

  if (!digits) throw new WhatsAppProviderError("WhatsApp recipient phone is required.");

  if (input.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith(defaultCountryCode)) return digits;
  if (digits.startsWith("0")) return `${defaultCountryCode}${digits.slice(1)}`;

  throw new WhatsAppProviderError("WhatsApp recipient must include a country code.");
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
  const to = normaliseWhatsAppPhone(input.to);

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
    const code = Number(payload?.error?.code) || undefined;
    const providerDetails = payload?.error?.error_data?.details || undefined;
    const templateRequired = code === 131047;
    throw new WhatsAppProviderError(
      templateRequired
        ? "An approved WhatsApp payment-notification template is required outside the 24-hour customer-service window."
        : message,
      {httpStatus: response.status, code, subcode: Number(payload?.error?.error_subcode) || undefined, providerDetails, templateRequired},
    );
  }

  return {
    provider: "Meta WhatsApp Cloud API",
    status: "Sent",
    httpStatus: response.status,
    normalizedTo: to,
    messageType: "text",
    messageId: payload?.messages?.[0]?.id,
    raw: payload,
  };
}

export async function sendWhatsAppPaymentTemplate(input: {to: string; buyerName: string; orderCode: string; amount: string; reference: string; paymentUrl: string}) {
  const templateName = process.env.WHATSAPP_PAYMENT_TEMPLATE_NAME?.trim();
  if (!templateName) {
    throw new WhatsAppProviderError("An approved WhatsApp payment-notification template is required. Configure WHATSAPP_PAYMENT_TEMPLATE_NAME before retrying.", {templateRequired: true});
  }
  const {accessToken, phoneNumberId, apiVersion} = getMetaConfig();
  const to = normaliseWhatsAppPhone(input.to);
  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"},
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {code: process.env.WHATSAPP_PAYMENT_TEMPLATE_LANGUAGE || "en"},
        components: [{type: "body", parameters: [input.buyerName, input.orderCode, input.amount, input.reference, input.paymentUrl].map((text) => ({type: "text", text}))}],
      },
    }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new WhatsAppProviderError(payload?.error?.message || `WhatsApp send failed with HTTP ${response.status}.`, {
      httpStatus: response.status,
      code: Number(payload?.error?.code) || undefined,
      subcode: Number(payload?.error?.error_subcode) || undefined,
      providerDetails: payload?.error?.error_data?.details || undefined,
      templateRequired: Number(payload?.error?.code) === 131047,
    });
  }
  return {provider: "Meta WhatsApp Cloud API" as const, status: "Sent" as const, httpStatus: response.status, normalizedTo: to, messageType: "template" as const, messageId: payload?.messages?.[0]?.id, raw: payload};
}

export async function sendWhatsAppBuyerInviteTemplate(input: {
  to: string;
  buyerName: string;
  accessCode: string;
  loginUrl: string;
}) {
  const templateName =
    process.env.WHATSAPP_BUYER_INVITE_TEMPLATE_NAME?.trim();

  if (!templateName) {
    throw new WhatsAppProviderError(
      "An approved WhatsApp buyer-access template is required. Configure WHATSAPP_BUYER_INVITE_TEMPLATE_NAME before retrying.",
      {templateRequired: true},
    );
  }

  const {accessToken, phoneNumberId, apiVersion} = getMetaConfig();
  const to = normaliseWhatsAppPhone(input.to);

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
        type: "template",
        template: {
          name: templateName,
          language: {
            code:
              process.env.WHATSAPP_BUYER_INVITE_TEMPLATE_LANGUAGE || "en",
          },
          components: [
            {
              type: "body",
              parameters: [
                input.buyerName,
                input.accessCode,
                input.loginUrl,
              ].map((text) => ({type: "text", text})),
            },
          ],
        },
      }),
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new WhatsAppProviderError(
      payload?.error?.message ||
        `WhatsApp send failed with HTTP ${response.status}.`,
      {
        httpStatus: response.status,
        code: Number(payload?.error?.code) || undefined,
        subcode: Number(payload?.error?.error_subcode) || undefined,
        providerDetails: payload?.error?.error_data?.details || undefined,
        templateRequired: Number(payload?.error?.code) === 131047,
      },
    );
  }

  return {
    provider: "Meta WhatsApp Cloud API" as const,
    status: "Sent" as const,
    httpStatus: response.status,
    normalizedTo: to,
    messageType: "template" as const,
    messageId: payload?.messages?.[0]?.id,
    raw: payload,
  };
}
