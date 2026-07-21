import {validatePaystackVerification} from "./verificationRules.js";

function receiptCode(reference) {
  return `RCT-${String(reference).replace(/[^A-Z0-9-]/gi, "").toUpperCase()}`;
}

export async function settleVerifiedPaystackPayment({db, paymentRequest, verification, paidAt = new Date(), source = "Paystack webhook"}) {
  const conflict = validatePaystackVerification({
    verification,
    reference: paymentRequest.gatewayReference || paymentRequest.reference,
    amount: paymentRequest.amount,
    currency: paymentRequest.currency || "NGN",
  });
  if (conflict) return {ok: false, conflict};

  const applyCore = async (tx) => {
    const current = await tx.paymentRequest.findUnique({where: {id: paymentRequest.id}});
    if (!current) throw new Error("Payment request disappeared during settlement.");

    const payment = await tx.payment.upsert({
      where: {reference: paymentRequest.reference},
      update: {provider: "Paystack", amount: paymentRequest.amount, status: "Paid", paidAt},
      create: {orderId: paymentRequest.orderId, reference: paymentRequest.reference, provider: "Paystack", amount: paymentRequest.amount, status: "Paid", paidAt},
    });
    await tx.paymentRequest.update({where: {id: paymentRequest.id}, data: {provider: "Paystack", gatewayReference: verification.reference, status: "Paid", paidAt}});
    await tx.order.update({where: {id: paymentRequest.orderId}, data: {paymentStatus: "Paid", paymentReference: paymentRequest.reference}});

    if (current.status !== "Paid" || !current.paidAt) {
      await tx.auditLog.create({data: {
        actorName: "Paystack",
        actorRole: "System",
        action: "Verified Paystack payment",
        entityType: "PaymentRequest",
        entityId: paymentRequest.id,
        entityLabel: paymentRequest.reference,
        previousValue: JSON.stringify({status: current.status, paidAt: current.paidAt}),
        newValue: JSON.stringify({status: "Paid", paidAt, providerTransactionId: verification.providerId || null}),
        metadata: JSON.stringify({source, provider: "Paystack", providerReference: verification.reference}),
      }});
    }
    return {payment, duplicate: current.status === "Paid" && Boolean(current.paidAt)};
  };

  const core = db.$transaction ? await db.$transaction(applyCore) : await applyCore(db);
  let receipt = null;
  let receiptError = null;
  try {
    receipt = await db.receipt.upsert({
      where: {code: receiptCode(paymentRequest.reference)},
      update: {paymentId: core.payment.id},
      create: {
        code: receiptCode(paymentRequest.reference),
        orderId: paymentRequest.orderId,
        customerId: paymentRequest.customerId || null,
        paymentId: core.payment.id,
        buyerName: paymentRequest.customer?.name || paymentRequest.order?.buyerName || "Customer",
        buyerEmail: paymentRequest.customer?.receiptEmail || paymentRequest.customer?.email || null,
        amount: paymentRequest.amount,
        status: "Issued",
        issuedBy: "Paystack verification",
        issuedAt: paidAt,
      },
    });
  } catch (error) {
    receiptError = error instanceof Error ? error.message : "Receipt creation failed.";
  }

  return {ok: true, ...core, receipt, receiptError};
}
