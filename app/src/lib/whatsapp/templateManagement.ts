import {WhatsAppProviderError} from "./provider";

function getTemplateManagementConfig() {
  const accessToken = process.env.WHATSAPP_CLOUD_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID;
  const apiVersion = process.env.WHATSAPP_CLOUD_API_VERSION || "v23.0";

  if (!accessToken) throw new Error("WHATSAPP_CLOUD_ACCESS_TOKEN is not configured.");
  if (!businessAccountId) throw new Error("WHATSAPP_CLOUD_BUSINESS_ACCOUNT_ID is not configured.");

  return {accessToken, businessAccountId, apiVersion};
}

export type WhatsAppTemplateSummary = {
  id: string;
  name: string;
  status: string;
  category: string;
  language: string;
  bodyText?: string;
  rejectedReason?: string;
};

export async function listWhatsAppTemplates(): Promise<WhatsAppTemplateSummary[]> {
  const {accessToken, businessAccountId, apiVersion} = getTemplateManagementConfig();

  const response = await fetch(
    `https://graph.facebook.com/${apiVersion}/${businessAccountId}/message_templates?fields=name,status,category,language,components,rejected_reason&limit=100`,
    {headers: {Authorization: `Bearer ${accessToken}`}},
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new WhatsAppProviderError(payload?.error?.message || `Failed to list WhatsApp templates (HTTP ${response.status}).`, {
      httpStatus: response.status,
      code: Number(payload?.error?.code) || undefined,
    });
  }

  return (payload?.data || []).map((template: {id: string; name: string; status: string; category: string; language: string; components?: Array<{type: string; text?: string}>; rejected_reason?: string}) => ({
    id: template.id,
    name: template.name,
    status: template.status,
    category: template.category,
    language: template.language,
    bodyText: template.components?.find((component) => component.type === "BODY")?.text,
    rejectedReason: template.rejected_reason && template.rejected_reason !== "NONE" ? template.rejected_reason : undefined,
  }));
}

export async function createWhatsAppTemplate(input: {
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  language: string;
  bodyText: string;
  bodyExamples: string[];
}) {
  const {accessToken, businessAccountId, apiVersion} = getTemplateManagementConfig();

  const placeholderCount = (input.bodyText.match(/\{\{\d+\}\}/g) || []).length;
  if (placeholderCount !== input.bodyExamples.length) {
    throw new Error(`Template body has ${placeholderCount} placeholder(s) but ${input.bodyExamples.length} example value(s) were given.`);
  }

  const components = [
    {
      type: "BODY",
      text: input.bodyText,
      ...(input.bodyExamples.length ? {example: {body_text: [input.bodyExamples]}} : {}),
    },
  ];

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${businessAccountId}/message_templates`, {
    method: "POST",
    headers: {Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json"},
    body: JSON.stringify({
      name: input.name,
      category: input.category,
      language: input.language,
      components,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload?.error;
    const details = error?.error_data?.details;
    const message = error?.message || `Failed to create WhatsApp template (HTTP ${response.status}).`;
    // A bare "Invalid parameter" with no error_data.details is unusual --
    // Meta's template API is normally specific about which field is wrong.
    // Surface everything we got back (code, subcode, type, trace id) so a
    // failure can actually be diagnosed instead of guessed at again.
    const diagnostics = [
      details ? `details: ${details}` : null,
      error?.code != null ? `code: ${error.code}` : null,
      error?.error_subcode != null ? `subcode: ${error.error_subcode}` : null,
      error?.type ? `type: ${error.type}` : null,
      error?.fbtrace_id ? `trace: ${error.fbtrace_id}` : null,
    ].filter(Boolean).join(" | ");
    throw new WhatsAppProviderError(diagnostics ? `${message} (${diagnostics})` : message, {
      httpStatus: response.status,
      code: Number(error?.code) || undefined,
      subcode: Number(error?.error_subcode) || undefined,
      providerDetails: details || undefined,
    });
  }

  return {id: payload.id as string, status: (payload.status as string) || "PENDING"};
}
