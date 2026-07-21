import {NextRequest, NextResponse} from "next/server";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {verifyFlutterwaveTransaction} from "@/lib/payments/flutterwave";
import {createPaymentReconciliationIncident} from "@/lib/payments/reconciliation";
import {getEmailBaseUrl, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {validateFlutterwaveVerification} from "@/lib/payments/verificationRules";
import {settleVerifiedFlutterwavePayment} from "@/lib/payments/flutterwaveSettlement.js";
import {validateFlutterwaveWebhookPayment, verifyFlutterwaveWebhookSignature} from "@/lib/payments/flutterwaveWebhookRules.js";
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
  const signature = request.headers.get("flutterwave-signature");
  const legacyHash = request.headers.get("verif-hash");
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_HASH;
  if (!verifyFlutterwaveWebhookSignature({rawBody, signature, legacyHash, secretHash})) {
    return NextResponse.json({ok: false, error: "Invalid signature"}, {status: 401});
  }

  let event: {status?: string; tx_ref?: string; transaction_id?: string | number; amount?: number; currency?: string; data?: {status?: string; tx_ref?: string; id?: string | number; amount?: number; currency?: string; created_at?: string}};

  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ok: false, error: "Invalid JSON"}, {status: 400});
  }

  const status = String(event?.data?.status || event?.status || "").toLowerCase();
  const txRef = String(event?.data?.tx_ref || event?.tx_ref || "").trim();
  const transactionId = String(event?.data?.id || event?.transaction_id || "").trim();

  if (status !== "successful" && status !== "success") {
    return NextResponse.json({ok: true, ignored: status || "non-success"});
  }

  if (!txRef) {
    return NextResponse.json({ok: false, error: "Missing tx_ref"}, {status: 400});
  }

  const paymentRequest = await prisma.paymentRequest.findFirst({
    where: {
      OR: [
        {reference: txRef},
        {gatewayReference: txRef},
      ],
    },
    include: {
      order: true,
      customer: true,
    },
  });

  if (!paymentRequest) {
    await createPaymentReconciliationIncident({provider: "Flutterwave", providerReference: transactionId || txRef, reason: "No internal payment request matched the webhook reference.", payloadMetadata: {status, txRef, transactionId}});
    return NextResponse.json({ok: true, ignored: "payment request not found"});
  }

  if (["Cancelled", "Failed"].includes(paymentRequest.status)) {
    await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: transactionId || txRef, reason: `Payment request is not eligible for settlement (${paymentRequest.status}).`, payloadMetadata: {status, txRef, transactionId}});
    return NextResponse.json({ok: true, ignored: "payment request not eligible"});
  }

  let verification;
  try {
    verification = await verifyFlutterwaveTransaction(transactionId);
  } catch (error) {
    Sentry.captureException(error, {tags: {component: "flutterwave-verification"}, extra: {internalReference: paymentRequest.reference, transactionId}});
    await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: transactionId || txRef, reason: "Provider verification failed or timed out.", payloadMetadata: {status, txRef, transactionId}, verificationMetadata: {error: error instanceof Error ? error.message : "unknown"}});
    return NextResponse.json({ok: false, error: "Provider verification temporarily unavailable"}, {status: 503, headers: {"Retry-After": "60"}});
  }

  const verificationConflict = validateFlutterwaveVerification({verification, reference: txRef, amount: paymentRequest.amount, currency: paymentRequest.currency || "NGN"});
  if (verificationConflict) {
    await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: transactionId || txRef, reason: `Provider verification conflict: ${verificationConflict}.`, payloadMetadata: {status, txRef, transactionId}, verificationMetadata: verification});
    return NextResponse.json({ok: true, ignored: "provider verification mismatch"});
  }

  const webhookConflict = validateFlutterwaveWebhookPayment({data: event.data || event, expectedAmount: paymentRequest.amount, expectedCurrency: paymentRequest.currency || "NGN"});
  if (webhookConflict) {
    await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: transactionId || txRef, reason: `Authenticated webhook payment conflict: ${webhookConflict}.`, payloadMetadata: {status, txRef, transactionId}});
    return NextResponse.json({ok: true, ignored: "webhook payment details mismatch"});
  }

  const paidAt = event.data?.created_at ? new Date(event.data.created_at) : new Date();
  const settlement = await settleVerifiedFlutterwavePayment({db: prisma, paymentRequest, verification, paidAt, source: "Flutterwave webhook"});
  if (!settlement.ok) {
    await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: transactionId || txRef, reason: `Settlement verification conflict: ${settlement.conflict}.`, verificationMetadata: verification});
    return NextResponse.json({ok: true, ignored: "settlement verification mismatch"});
  }
  if (settlement.receiptError) await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: transactionId || txRef, reason: "Payment was verified and marked paid, but automatic receipt creation failed.", verificationMetadata: {receiptError: settlement.receiptError}});

  if (paymentRequest.customerId && !settlement.duplicate) {
    await prisma.buyerMessage.create({
      data: {
        customerId: paymentRequest.customerId,
        title: `Payment received for ${paymentRequest.order.code}`,
        body: `Flutterwave confirmed payment for order ${paymentRequest.order.code}.\\n\\nReference: ${paymentRequest.reference}\\nAmount: ${formatNaira(paymentRequest.amount)}\\nStatus: Paid`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        recipient: paymentRequest.order.phone,
        source: "Flutterwave webhook",
        relatedType: "Payment",
        relatedId: settlement.payment.id,
        metadata: JSON.stringify({
          provider: "Flutterwave",
          txRef,
          transactionId,
        }),
      },
    });

    if (paymentRequest.customer?.email) {
      await sendTransactionalEmail({deduplicationKey: `payment-confirmation:${settlement.payment.id}`, template: "payment-confirmation", to: paymentRequest.customer.email, content: emailTemplates.paymentConfirmation(paymentRequest.customer.name, paymentRequest.order.code, formatNaira(paymentRequest.amount), getEmailBaseUrl()), relatedType: "Payment", relatedId: settlement.payment.id});
    }
  }

  for (const path of ["/admin/payment-requests", "/admin/orders", `/admin/orders/${paymentRequest.orderId}`, "/admin/payments", "/admin/receipts", "/admin", "/buyer-account"]) revalidatePath(path);

  return NextResponse.json({ok: true, duplicate: settlement.duplicate});
}
