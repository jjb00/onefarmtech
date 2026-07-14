import {prisma} from "@/lib/prisma";
import type {TransactionalEmail} from "./templates";
import * as Sentry from "@sentry/nextjs";
import {recordOperationalEvent} from "@/lib/operationalEvents";

export type EmailSendResult = {
  ok: boolean;
  status: "Accepted" | "Failed" | "Skipped" | "Duplicate" | "RateLimited";
  deliveryId?: string;
  providerMessageId?: string;
  error?: string;
};

type SendTransactionalEmailInput = {
  deduplicationKey: string;
  template: string;
  to: string;
  content: TransactionalEmail;
  relatedType?: string;
  relatedId?: string;
};

function baseUrl() {
  const configured = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") throw new Error("APP_BASE_URL is required in production.");
  return "http://localhost:3002";
}

export function getEmailBaseUrl() {
  try {
    return baseUrl();
  } catch {
    return "https://configuration-required.invalid";
  }
}

export function getAdminEmailRecipients() {
  return (process.env.EMAIL_ADMIN_RECIPIENTS || "").split(",").map((value) => value.trim()).filter(Boolean);
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown email error";
  return message.replace(/re_[A-Za-z0-9_-]+/g, "[redacted]").slice(0, 500);
}

export async function sendTransactionalEmail(input: SendTransactionalEmailInput): Promise<EmailSendResult> {
  const recipient = input.to.trim().toLowerCase();
  if (!recipient) return {ok: false, status: "Skipped", error: "Recipient email is missing."};

  const existing = await prisma.emailDelivery.findUnique({where: {deduplicationKey: input.deduplicationKey}});
  if (existing?.status === "Accepted" || existing?.status === "Skipped") {
    return {ok: true, status: "Duplicate", deliveryId: existing.id, providerMessageId: existing.providerMessageId || undefined};
  }
  if (existing?.lastAttemptAt && Date.now() - existing.lastAttemptAt.getTime() < 60_000) {
    return {ok: false, status: "RateLimited", deliveryId: existing.id, error: "Wait at least 60 seconds before retrying."};
  }
  if (existing && ["Bounced", "Complained"].includes(existing.status)) {
    return {ok: false, status: "Failed", deliveryId: existing.id, error: `${existing.status} emails require recipient correction before retry.`};
  }

  const delivery = existing || await prisma.emailDelivery.create({
    data: {
      deduplicationKey: input.deduplicationKey,
      template: input.template,
      recipient,
      subject: input.content.subject,
      textBody: input.content.text,
      htmlBody: input.content.html,
      relatedType: input.relatedType,
      relatedId: input.relatedId,
    },
  });

  if (process.env.NODE_ENV !== "production" && process.env.EMAIL_DELIVERY_MODE !== "send") {
    await prisma.emailDelivery.update({where: {id: delivery.id}, data: {status: "Skipped", lastError: "Development delivery disabled.", lastAttemptAt: new Date(), nextRetryAt: null}});
    return {ok: true, status: "Skipped", deliveryId: delivery.id};
  }

  try {
    baseUrl();
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM_ADDRESS;
    const fromName = process.env.EMAIL_FROM_NAME || "OneFarmTech";
    if (!apiKey || !fromAddress) throw new Error("Email provider configuration is incomplete.");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "Idempotency-Key": input.deduplicationKey},
      body: JSON.stringify({
        from: `${fromName} <${fromAddress}>`,
        to: [recipient],
        reply_to: process.env.EMAIL_REPLY_TO || undefined,
        subject: input.content.subject,
        text: input.content.text,
        html: input.content.html,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.id) throw new Error(payload?.message || `Resend rejected email with HTTP ${response.status}.`);

    await prisma.emailDelivery.update({where: {id: delivery.id}, data: {status: "Accepted", providerMessageId: payload.id, acceptedAt: new Date(), lastAttemptAt: new Date(), lastError: null, nextRetryAt: null, retryCount: {increment: 1}}});
    return {ok: true, status: "Accepted", deliveryId: delivery.id, providerMessageId: payload.id};
  } catch (error) {
    const message = safeError(error);
    console.error("Transactional email delivery failed", {deliveryId: delivery.id, template: input.template, relatedType: input.relatedType, relatedId: input.relatedId, error: message});
    Sentry.captureException(error, {tags: {component: "email", template: input.template}, extra: {deliveryId: delivery.id, relatedType: input.relatedType, relatedId: input.relatedId}});
    await recordOperationalEvent({category: "Email delivery", summary: message, relatedType: input.relatedType, relatedId: input.relatedId, metadata: {deliveryId: delivery.id, template: input.template}});
    await prisma.emailDelivery.update({where: {id: delivery.id}, data: {status: "Failed", lastError: message, failedAt: new Date(), lastAttemptAt: new Date(), nextRetryAt: new Date(Date.now() + 60_000), retryCount: {increment: 1}}});
    return {ok: false, status: "Failed", deliveryId: delivery.id, error: message};
  }
}

export async function retryEmailDelivery(deliveryId: string) {
  const delivery = await prisma.emailDelivery.findUnique({where: {id: deliveryId}});
  if (!delivery) return {ok: false, status: "Failed" as const, error: "Email delivery record not found."};
  if (!delivery.textBody || !delivery.htmlBody) return {ok: false, status: "Failed" as const, deliveryId, error: "Stored email content is unavailable for retry."};
  return sendTransactionalEmail({
    deduplicationKey: delivery.deduplicationKey,
    template: delivery.template,
    to: delivery.recipient,
    content: {subject: delivery.subject, text: delivery.textBody, html: delivery.htmlBody},
    relatedType: delivery.relatedType || undefined,
    relatedId: delivery.relatedId || undefined,
  });
}

export async function sendAdminTransactionalEmail(input: Omit<SendTransactionalEmailInput, "to" | "deduplicationKey"> & {deduplicationKeyPrefix: string}) {
  return Promise.all(getAdminEmailRecipients().map((recipient) => sendTransactionalEmail({...input, to: recipient, deduplicationKey: `${input.deduplicationKeyPrefix}:${recipient.toLowerCase()}`})));
}
