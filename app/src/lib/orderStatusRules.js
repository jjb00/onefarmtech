export const PICKUP_FULFILMENT_STATUSES = ["Pending pickup", "Confirmed", "Preparing", "Ready for pickup", "Collected", "Cancelled"];
export const DELIVERY_FULFILMENT_STATUSES = ["New order", "Confirmed", "Preparing", "Delivery pending assignment", "Delivery assigned", "Picked up by delivery partner", "Out for delivery", "Delivered", "Delivery issue", "Cancelled"];
export const PAYMENT_STATUSES = ["Pending confirmation", "Payment pending", "Unpaid", "Part-paid", "Paid", "Payment failed", "Payment cancelled", "Refunded"];

const PAYMENT_TRANSITIONS = {
  "Pending confirmation": new Set(["Pending confirmation", "Unpaid", "Payment pending", "Part-paid", "Paid", "Payment cancelled"]),
  "Payment pending": new Set(["Payment pending", "Part-paid", "Paid", "Payment failed", "Payment cancelled"]),
  Unpaid: new Set(["Unpaid", "Payment pending", "Part-paid", "Paid", "Payment failed", "Payment cancelled"]),
  "Part-paid": new Set(["Part-paid", "Paid", "Payment failed", "Payment cancelled"]),
  Paid: new Set(["Paid", "Refunded"]),
  "Payment failed": new Set(["Payment failed", "Payment pending", "Payment cancelled"]),
  "Payment cancelled": new Set(["Payment cancelled", "Payment pending"]),
  Refunded: new Set(["Refunded"]),
};

export function isPickupMethod(deliveryMethod) {
  return String(deliveryMethod || "").trim().toLowerCase().includes("pickup");
}

export function initialFulfilmentStatus(deliveryMethod, deliveryDefault = "New order") {
  return isPickupMethod(deliveryMethod) ? "Pending pickup" : deliveryDefault;
}

export function fulfilmentStatusesFor(deliveryMethod, currentStatus = "") {
  const allowed = isPickupMethod(deliveryMethod) ? PICKUP_FULFILMENT_STATUSES : DELIVERY_FULFILMENT_STATUSES;
  return currentStatus && !allowed.includes(currentStatus) ? [currentStatus, ...allowed] : allowed;
}

export function validateFulfilmentStatus(deliveryMethod, status) {
  if (!status) return null;
  if (isPickupMethod(deliveryMethod) && status === "Delivered") return "pickup-cannot-be-delivered";
  if (!isPickupMethod(deliveryMethod) && ["Ready for pickup", "Collected", "Pending pickup"].includes(status)) return "delivery-cannot-use-pickup-status";
  return null;
}

export function validatePaymentTransition(currentStatus, nextStatus) {
  if (!nextStatus || nextStatus === currentStatus) return null;
  const allowed = PAYMENT_TRANSITIONS[currentStatus];
  if (!allowed || !PAYMENT_STATUSES.includes(nextStatus)) return "invalid-payment-transition";
  return allowed.has(nextStatus) ? null : "payment-status-regression";
}

export function validateFulfilmentTransition(deliveryMethod, currentStatus, nextStatus) {
  const invalid = validateFulfilmentStatus(deliveryMethod, nextStatus);
  if (invalid || !nextStatus || nextStatus === currentStatus) return invalid;
  const statuses = isPickupMethod(deliveryMethod) ? PICKUP_FULFILMENT_STATUSES : DELIVERY_FULFILMENT_STATUSES;
  const currentIndex = statuses.indexOf(currentStatus), nextIndex = statuses.indexOf(nextStatus);
  if (nextIndex < 0) return "invalid-fulfilment-transition";
  if (currentStatus === "Cancelled" || currentStatus === "Collected" || currentStatus === "Delivered") return "fulfilment-status-final";
  if (currentStatus === "Delivery issue") return ["Delivery pending assignment", "Delivery assigned", "Picked up by delivery partner", "Out for delivery", "Delivered", "Cancelled"].includes(nextStatus) ? null : "fulfilment-status-regression";
  if (currentIndex >= 0 && nextIndex < currentIndex && nextStatus !== "Cancelled") return "fulfilment-status-regression";
  return null;
}

export function validateOrderStatusTransition({deliveryMethod, currentPaymentStatus, nextPaymentStatus, currentFulfilmentStatus, nextFulfilmentStatus}) {
  return validatePaymentTransition(currentPaymentStatus, nextPaymentStatus)
    || validateFulfilmentTransition(deliveryMethod, currentFulfilmentStatus, nextFulfilmentStatus);
}
