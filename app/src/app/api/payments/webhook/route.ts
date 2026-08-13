import {NextRequest, NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {verifyPaystackTransaction} from "@/lib/payments/paystack";
import {createPaymentReconciliationIncident} from "@/lib/payments/reconciliation";
import {getEmailBaseUrl, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {validatePaystackVerification} from "@/lib/payments/verificationRules";
import {settleVerifiedPaystackPayment} from "@/lib/payments/paystackSettlement.js";
import {settleVerifiedGroupBuyPaystackPayment} from "@/lib/payments/groupBuyPaystackSettlement.js";
import {validatePaystackWebhookPayment, verifyPaystackWebhookSignature} from "@/lib/payments/paystackWebhookRules.js";
import {sendPaymentConfirmationWhatsApp, notifyAdminOfPaymentConfirmation} from "@/lib/whatsapp/statusReply";
import {sendWhatsAppTextMessage} from "@/lib/whatsapp/provider";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackWebhookSignature(rawBody, signature, process.env.PAYSTACK_SECRET_KEY)) {
    return NextResponse.json({ok: false, error: "Invalid signature"}, {status: 401});
  }

  let event: {event?: string; data?: {reference?: unknown; amount?: unknown; currency?: unknown; paid_at?: string}};

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ok: false, error: "Invalid JSON"}, {status: 400});
  }

  if (event?.event !== "charge.success") {
    return NextResponse.json({ok: true, ignored: event?.event || "unknown"});
  }

  const data = event.data || {};
  const gatewayReference = String(data.reference || "").trim();

  if (!gatewayReference) {
    return NextResponse.json({ok: false, error: "Missing reference"}, {status: 400});
  }

  const [paymentRequest, groupBuyPaymentRequest] = await Promise.all([
    prisma.paymentRequest.findFirst({
      where: {
        OR: [
          {gatewayReference},
          {reference: gatewayReference},
        ],
      },
      include: {
        order: true,
        customer: true,
      },
    }),
    prisma.groupBuyPaymentRequest.findFirst({
      where: {
        OR: [
          {gatewayReference},
          {reference: gatewayReference},
        ],
      },
      include: {
        reservation: {
          include: {groupBuy: true},
        },
      },
    }),
  ]);

  if (!paymentRequest && groupBuyPaymentRequest) {
    let verification;
    try {
      verification = await verifyPaystackTransaction(gatewayReference);
    } catch (error) {
      Sentry.captureException(error, {tags: {component: "group-buy-paystack-verification"}, extra: {internalReference: groupBuyPaymentRequest.reference, gatewayReference}});
      await createPaymentReconciliationIncident({provider: "Paystack", internalReference: groupBuyPaymentRequest.reference, providerReference: gatewayReference, reason: "Group-buy provider verification failed or timed out.", payloadMetadata: {event: event.event}, verificationMetadata: {error: error instanceof Error ? error.message : "unknown"}});
      return NextResponse.json({ok: false, error: "Provider verification temporarily unavailable"}, {status: 503, headers: {"Retry-After": "60"}});
    }

    const verificationConflict = validatePaystackVerification({verification, reference: gatewayReference, amount: groupBuyPaymentRequest.amount, currency: groupBuyPaymentRequest.currency || "NGN"});
    if (verificationConflict) {
      await createPaymentReconciliationIncident({provider: "Paystack", internalReference: groupBuyPaymentRequest.reference, providerReference: gatewayReference, reason: `Group-buy provider verification conflict: ${verificationConflict}.`, payloadMetadata: {event: event.event}, verificationMetadata: verification});
      return NextResponse.json({ok: true, ignored: "provider verification mismatch"});
    }

    const webhookConflict = validatePaystackWebhookPayment({data, expectedAmount: groupBuyPaymentRequest.amount, expectedCurrency: groupBuyPaymentRequest.currency || "NGN"});
    if (webhookConflict) {
      await createPaymentReconciliationIncident({provider: "Paystack", internalReference: groupBuyPaymentRequest.reference, providerReference: gatewayReference, reason: `Authenticated group-buy webhook conflict: ${webhookConflict}.`, payloadMetadata: {event: event.event, amountMinor: data.amount, currency: data.currency}});
      return NextResponse.json({ok: true, ignored: "webhook payment details mismatch"});
    }

    const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
    const settlement = await settleVerifiedGroupBuyPaystackPayment({db: prisma, paymentRequest: groupBuyPaymentRequest, verification, paidAt, source: "Paystack webhook"});
    if (!settlement.ok) {
      await createPaymentReconciliationIncident({provider: "Paystack", internalReference: groupBuyPaymentRequest.reference, providerReference: gatewayReference, reason: `Group-buy settlement verification conflict: ${settlement.conflict}.`, verificationMetadata: verification});
      return NextResponse.json({ok: true, ignored: "settlement verification mismatch"});
    }

    if (settlement.reviewRequired) {
      await createPaymentReconciliationIncident({provider: "Paystack", internalReference: groupBuyPaymentRequest.reference, providerReference: gatewayReference, reason: settlement.duplicateCharge ? "A second Paystack charge was received for an already-paid group-buy reservation; refund review required." : "Group-buy payment arrived after collection closed or above remaining capacity; refund review required.", verificationMetadata: verification});
    }

    if (!settlement.duplicate) {
      try {
        const reservation = groupBuyPaymentRequest.reservation;
        const amount = formatNaira(groupBuyPaymentRequest.amount);
        const body = settlement.reviewRequired
          ? `Hi ${reservation.buyerName}, OneFarmTech received your ${amount} payment for group buy ${reservation.groupBuy.code}. The reservation needs a staff review before confirmation, and the team will contact you.`
          : `Hi ${reservation.buyerName}, OneFarmTech has confirmed your ${amount} payment for group buy ${reservation.groupBuy.code}. Your ${reservation.quantity} ${reservation.groupBuy.unit} reservation is now confirmed.`;
        await sendWhatsAppTextMessage({to: reservation.phone, body});
      } catch (error) {
        Sentry.captureException(error, {tags: {component: "group-buy-payment-confirmation-whatsapp"}, extra: {internalReference: groupBuyPaymentRequest.reference}});
        await createPaymentReconciliationIncident({provider: "Paystack", internalReference: groupBuyPaymentRequest.reference, providerReference: gatewayReference, reason: "Group-buy payment was verified but the WhatsApp confirmation failed.", verificationMetadata: {error: error instanceof Error ? error.message : "unknown"}});
      }
    }

    for (const path of ["/", "/admin", "/admin/group-buys", "/admin/payments"]) revalidatePath(path);
    return NextResponse.json({ok: true, duplicate: settlement.duplicate, groupBuy: true, reviewRequired: settlement.reviewRequired});
  }

  if (!paymentRequest) {
    await createPaymentReconciliationIncident({provider: "Paystack", providerReference: gatewayReference, reason: "No internal payment request matched the webhook reference.", payloadMetadata: {event: event.event, reference: gatewayReference}});
    return NextResponse.json({ok: true, ignored: "payment request not found"});
  }

  if (["Cancelled", "Failed"].includes(paymentRequest.status)) {
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference: gatewayReference, reason: `Payment request is not eligible for settlement (${paymentRequest.status}).`, payloadMetadata: {event: event.event}});
    return NextResponse.json({ok: true, ignored: "payment request not eligible"});
  }

  let verification;
  try {
    verification = await verifyPaystackTransaction(gatewayReference);
  } catch (error) {
    Sentry.captureException(error, {tags: {component: "paystack-verification"}, extra: {internalReference: paymentRequest.reference, gatewayReference}});
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference: gatewayReference, reason: "Provider verification failed or timed out.", payloadMetadata: {event: event.event}, verificationMetadata: {error: error instanceof Error ? error.message : "unknown"}});
    return NextResponse.json({ok: false, error: "Provider verification temporarily unavailable"}, {status: 503, headers: {"Retry-After": "60"}});
  }

  const verificationConflict = validatePaystackVerification({verification, reference: gatewayReference, amount: paymentRequest.amount, currency: paymentRequest.currency || "NGN"});
  if (verificationConflict) {
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference: gatewayReference, reason: `Provider verification conflict: ${verificationConflict}.`, payloadMetadata: {event: event.event}, verificationMetadata: verification});
    return NextResponse.json({ok: true, ignored: "provider verification mismatch"});
  }

  const webhookConflict = validatePaystackWebhookPayment({data, expectedAmount: paymentRequest.amount, expectedCurrency: paymentRequest.currency || "NGN"});
  if (webhookConflict) {
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference: gatewayReference, reason: `Authenticated webhook payment conflict: ${webhookConflict}.`, payloadMetadata: {event: event.event, amountMinor: data.amount, currency: data.currency}});
    return NextResponse.json({ok: true, ignored: "webhook payment details mismatch"});
  }

  const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();
  const settlement = await settleVerifiedPaystackPayment({db: prisma, paymentRequest, verification, paidAt, source: "Paystack webhook"});
  if (!settlement.ok) {
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference: gatewayReference, reason: `Settlement verification conflict: ${settlement.conflict}.`, verificationMetadata: verification});
    return NextResponse.json({ok: true, ignored: "settlement verification mismatch"});
  }
  if (settlement.receiptError) {
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference: gatewayReference, reason: "Payment was verified and marked paid, but automatic receipt creation failed.", verificationMetadata: {receiptError: settlement.receiptError}});
  }

  if (!settlement.duplicate) {
    // The buyer's primary channel -- not gated on having a linked Customer
    // account, since a first-time WhatsApp buyer usually doesn't have one.
    try {
      await sendPaymentConfirmationWhatsApp(paymentRequest.order, paymentRequest.amount);
    } catch (error) {
      Sentry.captureException(error, {tags: {component: "paystack-payment-confirmation-whatsapp"}, extra: {internalReference: paymentRequest.reference}});
      await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference: gatewayReference, reason: "Payment was verified and marked paid, but the WhatsApp confirmation failed to send.", verificationMetadata: {error: error instanceof Error ? error.message : "unknown"}});
    }

    try {
      await notifyAdminOfPaymentConfirmation(paymentRequest.order, paymentRequest.amount);
    } catch (error) {
      Sentry.captureException(error, {tags: {component: "paystack-admin-payment-alert"}, extra: {internalReference: paymentRequest.reference}});
    }

    if (paymentRequest.customerId) {
      await prisma.buyerMessage.create({
        data: {
          customerId: paymentRequest.customerId,
          title: `Payment received for ${paymentRequest.order.code}`,
          body: `Paystack confirmed payment for order ${paymentRequest.order.code}.\n\nReference: ${paymentRequest.reference}\nAmount: ${formatNaira(paymentRequest.amount)}\nStatus: Paid`,
          channel: "Portal",
          direction: "Outbound",
          status: "Unread",
          recipient: paymentRequest.order.phone,
          source: "Paystack webhook",
          relatedType: "Payment",
          relatedId: settlement.payment.id,
          metadata: JSON.stringify({
            provider: "Paystack",
            gatewayReference,
            event: event.event,
          }),
        },
      });

      if (paymentRequest.customer?.email) {
        await sendTransactionalEmail({deduplicationKey: `payment-confirmation:${settlement.payment.id}`, template: "payment-confirmation", to: paymentRequest.customer.email, content: emailTemplates.paymentConfirmation(paymentRequest.customer.name, paymentRequest.order.code, formatNaira(paymentRequest.amount), getEmailBaseUrl()), relatedType: "Payment", relatedId: settlement.payment.id});
      }
    }
  }

  for (const path of ["/admin/payments", "/admin/orders", `/admin/orders/${paymentRequest.orderId}`, "/admin/payments", "/admin/receipts", "/admin", "/buyer-account"]) revalidatePath(path);

  return NextResponse.json({ok: true, duplicate: settlement.duplicate});
}
