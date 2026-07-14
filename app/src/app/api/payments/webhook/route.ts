import crypto from "node:crypto";
import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {verifyPaystackTransaction} from "@/lib/payments/paystack";
import {createPaymentReconciliationIncident} from "@/lib/payments/reconciliation";
import {getEmailBaseUrl, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {validatePaystackVerification} from "@/lib/payments/verificationRules";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyPaystackSignature(rawBody: string, signature: string | null) {
  const secret = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

  if (!secret || !signature) {
    return false;
  }

  const hash = crypto
    .createHmac("sha512", secret)
    .update(rawBody)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

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

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ok: false, error: "Invalid signature"}, {status: 401});
  }

  let event: any;

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
  const paidAmount = Number(data.amount) / 100;
  const paidCurrency = String(data.currency || "").toUpperCase();

  if (!gatewayReference) {
    return NextResponse.json({ok: false, error: "Missing reference"}, {status: 400});
  }

  const paymentRequest = await prisma.paymentRequest.findFirst({
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
  });

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

  if (
    !Number.isFinite(paidAmount) ||
    paidAmount !== paymentRequest.amount ||
    paidCurrency !== String(paymentRequest.currency || "NGN").toUpperCase()
  ) {
    console.error("Paystack webhook amount/currency mismatch", {
      paymentRequestId: paymentRequest.id,
      gatewayReference,
      expectedAmount: paymentRequest.amount,
      paidAmount,
      expectedCurrency: paymentRequest.currency || "NGN",
      paidCurrency,
    });
    await createPaymentReconciliationIncident({provider: "Paystack", internalReference: paymentRequest.reference, providerReference: gatewayReference, reason: "Authenticated webhook amount/currency conflicts with the internal payment request.", payloadMetadata: {event: event.event, paidAmount, paidCurrency}});
    return NextResponse.json({ok: true, ignored: "webhook payment details mismatch"});
  }

  const paidAt = data.paid_at ? new Date(data.paid_at) : new Date();

  const existingPayment = await prisma.payment.findFirst({
    where: {
      reference: paymentRequest.reference,
      orderId: paymentRequest.orderId,
    },
  });

  await prisma.paymentRequest.update({
    where: {id: paymentRequest.id},
    data: {
      provider: "Paystack",
      gatewayReference,
      status: "Paid",
      paidAt,
    },
  });

  const payment =
    existingPayment ||
    (await prisma.payment.create({
      data: {
        orderId: paymentRequest.orderId,
        reference: paymentRequest.reference,
        provider: "Paystack",
        amount: paymentRequest.amount,
        status: "Paid",
        paidAt,
      },
    }));

  await prisma.order.update({
    where: {id: paymentRequest.orderId},
    data: {
      paymentStatus: "Paid",
      paymentReference: paymentRequest.reference,
    },
  });

  if (paymentRequest.customerId && !existingPayment) {
    await prisma.buyerMessage.create({
      data: {
        customerId: paymentRequest.customerId,
        title: `Payment received for ${paymentRequest.order.code}`,
        body: `Paystack confirmed payment for order ${paymentRequest.order.code}.\\n\\nReference: ${paymentRequest.reference}\\nAmount: ${formatNaira(paymentRequest.amount)}\\nStatus: Paid`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        recipient: paymentRequest.order.phone,
        source: "Paystack webhook",
        relatedType: "Payment",
        relatedId: payment.id,
        metadata: JSON.stringify({
          provider: "Paystack",
          gatewayReference,
          event: event.event,
        }),
      },
    });

    if (paymentRequest.customer?.email) {
      await sendTransactionalEmail({deduplicationKey: `payment-confirmation:${payment.id}`, template: "payment-confirmation", to: paymentRequest.customer.email, content: emailTemplates.paymentConfirmation(paymentRequest.customer.name, paymentRequest.order.code, formatNaira(paymentRequest.amount), getEmailBaseUrl()), relatedType: "Payment", relatedId: payment.id});
    }
  }

  return NextResponse.json({ok: true});
}
