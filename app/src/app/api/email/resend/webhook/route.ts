import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {mapResendEventStatus, verifyResendWebhookSignature} from "@/lib/email/resendWebhook";
import {applyResendDeliveryEvent} from "@/lib/email/resendEventProcessing.js";
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

  const eventAt = event.created_at && !Number.isNaN(Date.parse(event.created_at)) ? new Date(event.created_at) : new Date();
  try {
    const result = await applyResendDeliveryEvent({db: prisma, eventId: eventId!, providerMessageId, type, status, eventAt});
    if (result.outcome === "duplicate") return NextResponse.json({ok: true, duplicate: true});
    if (result.outcome === "unmatched") return NextResponse.json({ok: true, unmatched: true});
  } catch (error) {
    Sentry.captureException(error, {tags: {component: "resend-webhook"}, extra: {eventId, type}});
    return NextResponse.json({ok: false, error: "Temporary processing failure"}, {status: 503, headers: {"Retry-After": "60"}});
  }

  return NextResponse.json({ok: true, status});
}
