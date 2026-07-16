import {randomUUID} from "node:crypto";
import {providerFailureDetails} from "./providerError.js";

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
  const lastUpdated = request?.updatedAt || request?.createdAt;
  const recentEnough = lastUpdated && now.getTime() - new Date(lastUpdated).getTime() <= 30 * 60 * 1000;
  return Boolean(request && request.status === "Pending" && !request.paidAt && request.paymentUrl && /^https:\/\//.test(request.paymentUrl) && recentEnough && (!request.expiresAt || new Date(request.expiresAt) > now));
}

export async function initialisePayment({db, paymentRequestId, provider, createCheckout, referenceFactory = freshPaymentReference}) {
  const source = await db.paymentRequest.findUnique({where: {id: paymentRequestId}, include: {order: {include: {customer: true}}, customer: true}});
  if (!source) throw new PaymentInitializationError("not-found", "Payment request was not found.");
  const selectedProvider = String(provider || "").trim();
  if (!["Paystack", "Flutterwave"].includes(selectedProvider)) throw new PaymentInitializationError("unsupported-provider", "Select Paystack or Flutterwave.");
  const orderPaymentStatus = String(source.order?.paymentStatus || "").trim().toLowerCase();
  const paidOrder = ["paid", "fully paid", "payment complete"].includes(orderPaymentStatus);
  const paidRequest = await db.paymentRequest.findFirst?.({where: {orderId: source.orderId, OR: [{status: "Paid"}, {paidAt: {not: null}}]}});
  if (source.status === "Paid" || source.paidAt || paidOrder || paidRequest) throw new PaymentInitializationError("already-paid", "Paid orders cannot create another payment request.");
  if (!Number.isFinite(source.amount) || source.amount <= 0) throw new PaymentInitializationError("invalid-amount", "Payment amount must be positive.");

  const reference = referenceFactory(source.order.code);
  const attempt = await db.paymentRequest.create({data: {orderId: source.orderId, customerId: source.customerId || null, provider: selectedProvider, reference, amount: source.amount, currency: String(source.currency || "NGN").toUpperCase(), status: "Initialising", paymentUrl: null, gatewayReference: reference, providerHttpStatus: null, providerError: null}});

  try {
    const checkout = await createCheckout({provider: selectedProvider, reference, amount: source.amount, currency: String(source.currency || "NGN").toUpperCase(), buyerEmail: source.customer?.email || source.order.customer?.email || null, buyerName: source.customer?.name || source.order.customer?.name || source.order.buyerName, buyerPhone: source.order.phone, orderCode: source.order.code, callbackPath: `/admin/payment-requests?reference=${encodeURIComponent(reference)}`});
    if (!checkout?.paymentUrl || !/^https:\/\//.test(checkout.paymentUrl) || !checkout.gatewayReference) throw new Error("The provider returned an invalid checkout response.");

    const persistSuccess = async (tx) => {
      const updated = await tx.paymentRequest.update({where: {id: attempt.id}, data: {provider: checkout.provider, paymentUrl: checkout.paymentUrl, gatewayReference: checkout.gatewayReference, providerHttpStatus: checkout.httpStatus || 200, providerError: null, status: "Pending"}});
      await tx.paymentRequest.updateMany({where: {orderId: source.orderId, id: {not: attempt.id}, paidAt: null, status: {in: ["Pending", "Initialising"]}}, data: {status: "Superseded"}});
      await tx.order.update({where: {id: source.orderId}, data: {paymentReference: reference, paymentStatus: "Payment pending"}});
      return updated;
    };
    const updated = await (db.$transaction ? db.$transaction(persistSuccess) : persistSuccess(db));
    console.info("payment-initialisation", {provider: selectedProvider, paymentRequestId: attempt.id, providerReference: checkout.gatewayReference, httpStatus: checkout.httpStatus || 200, status: "Pending"});
    return {source, paymentRequest: updated, checkout, reused: false};
  } catch (error) {
    const failure = providerFailureDetails(error, selectedProvider);
    await db.paymentRequest.update({where: {id: attempt.id}, data: {status: "Failed", paymentUrl: null, providerHttpStatus: failure.httpStatus, providerError: failure.message}});
    console.error("payment-initialisation", {provider: selectedProvider, paymentRequestId: attempt.id, providerReference: reference, httpStatus: failure.httpStatus, error: failure.message});
    throw new PaymentInitializationError(`${selectedProvider.toLowerCase()}-${failure.code}`, failure.message);
  }
}
