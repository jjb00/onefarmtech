import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {mapResendEventStatus, verifyResendWebhookSignature} from "@/lib/email/resendWebhook";
import {recordOperationalEvent} from "@/lib/operationalEvents";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const eventId = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");

  if (!verifyResendWebhookSignature({rawBody, id: eventId, timestamp, signature})) {
    await recordOperationalEvent({category: "Resend webhook", summary: "Rejected invalid Resend webhook signature.", route: "/api/email/resend/webhook"});
    return NextResponse.json({ok: false, error: "Invalid signature"}, {status: 401});
  }

  let event: {type?: string; created_at?: string; data?: {email_id?: string; id?: string}};
  try { event = JSON.parse(rawBody); } catch {
    return NextResponse.json({ok: false, error: "Invalid JSON"}, {status: 400});
  }

  const type = String(event.type || "");
  const status = mapResendEventStatus(type);
  if (!status) return NextResponse.json({ok: true, ignored: type || "unknown"});
  const providerMessageId = String(event.data?.email_id || event.data?.id || "");
  if (!providerMessageId) return NextResponse.json({ok: true, ignored: "missing provider message id"});

  if (eventId) {
    const replay = await prisma.emailProviderEvent.findUnique({where: {eventId}});
    if (replay) return NextResponse.json({ok: true, duplicate: true});
  }

  const delivery = await prisma.emailDelivery.findFirst({where: {providerMessageId}});
  const eventAt = event.created_at && !Number.isNaN(Date.parse(event.created_at)) ? new Date(event.created_at) : new Date();
  if (!delivery) {
    if (eventId) await prisma.emailProviderEvent.create({data: {eventId, providerMessageId, eventType: type, eventAt, matched: false, metadata: JSON.stringify({type})}});
    await recordOperationalEvent({category: "Resend webhook", summary: "Resend event did not match an EmailDelivery record.", route: "/api/email/resend/webhook", relatedType: "EmailDelivery", metadata: {eventId, type, providerMessageId}});
    return NextResponse.json({ok: true, ignored: "unmatched provider message id"});
  }
  try {
    await prisma.$transaction(async (tx) => {
      if (eventId) await tx.emailProviderEvent.create({data: {eventId, emailDeliveryId: delivery.id, providerMessageId, eventType: type, eventAt, matched: true, metadata: JSON.stringify({type})}});
      if (!delivery.latestEventAt || eventAt >= delivery.latestEventAt) await tx.emailDelivery.update({where: {id: delivery.id}, data: {
        status, latestEventId: eventId, latestEventType: type, latestEventAt: eventAt,
        eventMetadata: JSON.stringify({type, providerMessageId}),
        lastError: ["Bounced", "Complained", "Failed"].includes(status) ? `Resend reported ${status.toLowerCase()}.` : null,
        failedAt: ["Bounced", "Complained", "Failed"].includes(status) ? eventAt : delivery.failedAt,
        nextRetryAt: ["Bounced", "Complained"].includes(status) ? null : delivery.nextRetryAt,
      }});
    });
  } catch (error) {
    if (eventId) {
      const replay = await prisma.emailProviderEvent.findUnique({where: {eventId}});
      if (replay) return NextResponse.json({ok: true, duplicate: true});
    }
    await recordOperationalEvent({category: "Resend webhook", summary: "Failed to apply Resend delivery event.", route: "/api/email/resend/webhook", relatedType: "EmailDelivery", relatedId: delivery.id, metadata: {eventId, type, error: error instanceof Error ? error.message : "unknown"}});
    Sentry.captureException(error, {tags: {component: "resend-webhook"}, extra: {eventId, type, deliveryId: delivery.id}});
    return NextResponse.json({ok: false, error: "Temporary processing failure"}, {status: 503, headers: {"Retry-After": "60"}});
  }

  return NextResponse.json({ok: true, status});
}
