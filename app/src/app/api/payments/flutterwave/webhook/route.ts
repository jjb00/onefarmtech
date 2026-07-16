import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {verifyFlutterwaveTransaction} from "@/lib/payments/flutterwave";
import {createPaymentReconciliationIncident} from "@/lib/payments/reconciliation";
import {getEmailBaseUrl, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {validateFlutterwaveVerification} from "@/lib/payments/verificationRules";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyFlutterwaveSignature(signature: string | null) {
  const secretHash = process.env.FLUTTERWAVE_WEBHOOK_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_HASH;

  if (!secretHash || !signature) {
    return false;
  }

  return signature === secretHash;
}

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get("verif-hash");

  if (!verifyFlutterwaveSignature(signature)) {
    return NextResponse.json({ok: false, error: "Invalid signature"}, {status: 401});
  }

  let event: any;

  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ok: false, error: "Invalid JSON"}, {status: 400});
  }

  const status = String(event?.data?.status || event?.status || "").toLowerCase();
  const txRef = String(event?.data?.tx_ref || event?.tx_ref || "").trim();
  const transactionId = String(event?.data?.id || event?.transaction_id || "").trim();
  const paidAmount = Number(event?.data?.amount ?? event?.amount);
  const paidCurrency = String(event?.data?.currency || event?.currency || "").toUpperCase();

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

  if (
    !Number.isFinite(paidAmount) ||
    paidAmount !== paymentRequest.amount ||
    paidCurrency !== String(paymentRequest.currency || "NGN").toUpperCase()
  ) {
    console.error("Flutterwave webhook amount/currency mismatch", {
      paymentRequestId: paymentRequest.id,
      txRef,
      transactionId,
      expectedAmount: paymentRequest.amount,
      paidAmount,
      expectedCurrency: paymentRequest.currency || "NGN",
      paidCurrency,
    });
    await createPaymentReconciliationIncident({provider: "Flutterwave", internalReference: paymentRequest.reference, providerReference: transactionId || txRef, reason: "Authenticated webhook amount/currency conflicts with the internal payment request.", payloadMetadata: {status, txRef, transactionId, paidAmount, paidCurrency}});
    return NextResponse.json({ok: true, ignored: "webhook payment details mismatch"});
  }

  const existingPayment = await prisma.payment.findFirst({
    where: {
      reference: paymentRequest.reference,
      orderId: paymentRequest.orderId,
    },
  });

  const paidAt = new Date();

  await prisma.paymentRequest.update({
    where: {id: paymentRequest.id},
    data: {
      provider: "Flutterwave",
      gatewayReference: transactionId || txRef,
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
        provider: "Flutterwave",
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
        body: `Flutterwave confirmed payment for order ${paymentRequest.order.code}.\\n\\nReference: ${paymentRequest.reference}\\nAmount: ${formatNaira(paymentRequest.amount)}\\nStatus: Paid`,
        channel: "Portal",
        direction: "Outbound",
        status: "Unread",
        recipient: paymentRequest.order.phone,
        source: "Flutterwave webhook",
        relatedType: "Payment",
        relatedId: payment.id,
        metadata: JSON.stringify({
          provider: "Flutterwave",
          txRef,
          transactionId,
        }),
      },
    });

    if (paymentRequest.customer?.email) {
      await sendTransactionalEmail({deduplicationKey: `payment-confirmation:${payment.id}`, template: "payment-confirmation", to: paymentRequest.customer.email, content: emailTemplates.paymentConfirmation(paymentRequest.customer.name, paymentRequest.order.code, formatNaira(paymentRequest.amount), getEmailBaseUrl()), relatedType: "Payment", relatedId: payment.id});
    }
  }

  return NextResponse.json({ok: true});
}
