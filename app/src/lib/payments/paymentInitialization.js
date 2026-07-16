import {randomUUID} from "node:crypto";

export class PaymentInitializationError extends Error {
  constructor(code, message) {
    super(message); this.name = "PaymentInitializationError"; this.code = code;
  }
}

export function freshPaymentReference(orderCode, now = () => Date.now(), uuid = () => randomUUID()) {
  const code = String(orderCode || "ORDER").replace(/[^A-Z0-9-]/gi, "").toUpperCase();
  return `PAY-${code}-${now().toString(36).toUpperCase()}-${uuid().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function isReusablePaymentRequest(request, now = new Date()) {
  return Boolean(request && request.status === "Pending" && !request.paidAt && request.paymentUrl && /^https:\/\//.test(request.paymentUrl) && (!request.expiresAt || new Date(request.expiresAt) > now));
}

export async function initialisePayment({db, paymentRequestId, provider, createCheckout, referenceFactory = freshPaymentReference, now = () => new Date()}) {
  const source = await db.paymentRequest.findUnique({where: {id: paymentRequestId}, include: {order: true, customer: true}});
  if (!source) throw new PaymentInitializationError("not-found", "Payment request was not found.");
  if (source.status === "Paid" || source.paidAt) throw new PaymentInitializationError("already-paid", "Paid payment requests cannot be reinitialised.");
  if (!Number.isFinite(source.amount) || source.amount <= 0) throw new PaymentInitializationError("invalid-amount", "Payment amount must be positive.");

  const run = async (tx) => {
    if (tx.$queryRawUnsafe) await tx.$queryRawUnsafe("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", `payment-order:${source.orderId}`);
    const active = await tx.paymentRequest.findFirst?.({where: {orderId: source.orderId, status: "Pending", paidAt: null, paymentUrl: {not: null}}, orderBy: {createdAt: "desc"}});
    const reusable = isReusablePaymentRequest(active || source, now());
    if (reusable) return {source, paymentRequest: active || source, checkout: null, reused: true};

    const reference = referenceFactory(source.order.code);
    const attempt = await tx.paymentRequest.create({data: {orderId: source.orderId, customerId: source.customerId || null, provider, reference, amount: source.amount, currency: String(source.currency || "NGN").toUpperCase(), status: "Initialising"}});
    try {
      const checkout = await createCheckout({provider, reference, amount: source.amount, currency: String(source.currency || "NGN").toUpperCase(), buyerEmail: source.customer?.email || null, buyerName: source.customer?.name || source.order.buyerName, buyerPhone: source.order.phone, orderCode: source.order.code, callbackPath: `/admin/payment-requests?reference=${encodeURIComponent(reference)}`});
      if (!checkout?.paymentUrl || !/^https:\/\//.test(checkout.paymentUrl) || !checkout.gatewayReference) throw new Error("invalid-provider-response");
      const updated = await tx.paymentRequest.update({where: {id: attempt.id}, data: {provider: checkout.provider, paymentUrl: checkout.paymentUrl, gatewayReference: checkout.gatewayReference, status: "Pending"}});
      await tx.paymentRequest.updateMany({where: {orderId: source.orderId, id: {not: attempt.id}, paidAt: null, status: {in: ["Pending", "Initialising"]}}, data: {status: "Superseded"}});
      await tx.order.update({where: {id: source.orderId}, data: {paymentReference: reference, paymentStatus: "Payment pending"}});
      return {source, paymentRequest: updated, checkout, reused: false};
    } catch {
      await tx.paymentRequest.update({where: {id: attempt.id}, data: {status: "Failed", paymentUrl: null, gatewayReference: null}});
      return {source, paymentRequest: attempt, checkout: null, reused: false, failureCode: "provider-failed"};
    }
  };
  const result = await (db.$transaction ? db.$transaction(run) : run(db));
  if (result.failureCode) throw new PaymentInitializationError(result.failureCode, "The payment provider could not create a valid payment link.");
  return result;
}
