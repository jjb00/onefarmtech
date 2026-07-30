import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {sendWhatsAppPaymentTemplate, normaliseWhatsAppPhone, WhatsAppProviderError} from "@/lib/whatsapp/provider";
import {buildPaymentInstructionMessage} from "@/lib/communications/paymentTemplates";
import {recordOperationalEvent} from "@/lib/operationalEvents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Payment requests with a live checkout link that have sat unpaid this long
// are worth nudging.
const STALE_AFTER_MS = 6 * 60 * 60 * 1000; // 6 hours
// Don't remind the same payment request more than once in this window.
const REMINDER_COOLDOWN_MS = 20 * 60 * 60 * 1000; // 20 hours
const MAX_PER_RUN = 50;

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ok: false, error: "Unauthorized"}, {status: 401});
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
  const cooldownBefore = new Date(Date.now() - REMINDER_COOLDOWN_MS);

  const candidates = await prisma.paymentRequest.findMany({
    where: {
      status: {in: ["Pending", "Initialising"]},
      paymentUrl: {not: null},
      createdAt: {lte: staleBefore},
      OR: [{reminderSentAt: null}, {reminderSentAt: {lte: cooldownBefore}}],
      order: {paymentStatus: {notIn: ["Paid"]}},
    },
    include: {order: true, customer: true},
    orderBy: {createdAt: "asc"},
    take: MAX_PER_RUN,
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const paymentRequest of candidates) {
    const recipient = paymentRequest.customer?.phone || paymentRequest.order.phone;

    let normalizedRecipient: string;
    try {
      normalizedRecipient = normaliseWhatsAppPhone(recipient);
    } catch {
      skipped += 1;
      continue;
    }

    if (!paymentRequest.paymentUrl) {
      skipped += 1;
      continue;
    }

    try {
      const result = await sendWhatsAppPaymentTemplate({
        to: recipient,
        buyerName: paymentRequest.customer?.name || paymentRequest.order.buyerName || "Customer",
        orderCode: paymentRequest.order.code,
        amount: new Intl.NumberFormat("en-NG", {
          style: "currency",
          currency: paymentRequest.currency || "NGN",
          maximumFractionDigits: 0,
        }).format(paymentRequest.amount),
        reference: paymentRequest.reference,
        paymentUrl: paymentRequest.paymentUrl,
      });

      await prisma.paymentRequest.update({
        where: {id: paymentRequest.id},
        data: {reminderSentAt: new Date()},
      });

      if (paymentRequest.customerId) {
        await prisma.buyerMessage.create({
          data: {
            customerId: paymentRequest.customerId,
            title: `Automated payment reminder for ${paymentRequest.order.code}`,
            body: buildPaymentInstructionMessage({
              orderCode: paymentRequest.order.code,
              buyerName: paymentRequest.customer?.name || paymentRequest.order.buyerName,
              amount: paymentRequest.amount,
              currency: paymentRequest.currency,
              reference: paymentRequest.reference,
              provider: paymentRequest.provider,
              paymentUrl: paymentRequest.paymentUrl,
            }),
            channel: "WhatsApp",
            direction: "Outbound",
            status: "Sent",
            recipient: normalizedRecipient,
            source: "Automated payment reminder",
            relatedType: "PaymentRequest",
            relatedId: paymentRequest.id,
            sentAt: new Date(),
            metadata: JSON.stringify({
              provider: result.provider,
              messageId: result.messageId,
              automated: true,
            }),
          },
        });
      }

      sent += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "WhatsApp send failed.";
      const details = error instanceof WhatsAppProviderError ? error.details : {};
      await recordOperationalEvent({
        category: "Automated payment reminder",
        severity: "Warning",
        summary: `Automated payment reminder failed for ${paymentRequest.order.code}.`,
        route: "/api/cron/payment-reminders",
        relatedType: "PaymentRequest",
        relatedId: paymentRequest.id,
        metadata: {error: message, ...details},
      });
    }
  }

  return NextResponse.json({ok: true, checked: candidates.length, sent, failed, skipped});
}
