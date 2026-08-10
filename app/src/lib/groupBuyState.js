const PAID_STATUSES = new Set(["paid", "fully paid", "approved"]);

// Buyer-proposed, staff-approved group buys can run many at once -- capped
// so weekly approval/sourcing load stays manageable for a small team rather
// than growing unbounded with demand.
export const MAX_CONCURRENT_GROUP_BUYS = 5;

export const LIVE_GROUP_BUY_STATUSES = ["Open", "Minimum met", "Fully reserved"];

// Tiers unlock as the group's paid+reserved quantity crosses each
// threshold -- "buy in bulk, buy cheaper" applies to the whole group, not
// just whoever joined first. Returns null if no tiers are configured (flat
// pricing via the GroupBuyItem's own unitPrice applies instead).
export function resolveGroupBuyTierPrice(tiers = [], quantity = 0) {
  if (!tiers.length) return null;

  const sorted = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
  let activePrice = sorted[0].unitPrice;

  for (const tier of sorted) {
    if (quantity >= tier.minQuantity) {
      activePrice = tier.unitPrice;
    }
  }

  return activePrice;
}

// A buyer is charged the tier active when they joined; if the group later
// unlocks a cheaper tier by close, this is the per-reservation refund owed
// so everyone actually settles at the best tier reached, honestly.
export function tierRefundDue(chargedUnitPrice, finalUnitPrice, quantity) {
  const perUnitRefund = Math.max(0, Number(chargedUnitPrice || 0) - Number(finalUnitPrice || 0));
  return perUnitRefund * Number(quantity || 0);
}

export function isPaidGroupBuyReservationStatus(status) {
  return PAID_STATUSES.has(String(status || "").trim().toLowerCase());
}

export function paidGroupBuyQuantity(reservations = []) {
  return reservations.reduce(
    (total, reservation) =>
      total +
      (isPaidGroupBuyReservationStatus(reservation.paymentStatus)
        ? Number(reservation.quantity || 0)
        : 0),
    0,
  );
}

export function deriveGroupBuyState({
  currentStatus = "Draft",
  requestedStatus,
  minQuantity = 0,
  targetQuantity = 0,
  fulfilmentStatus = "Planning",
  reservations = [],
}) {
  const paidQuantity = paidGroupBuyQuantity(reservations);
  const minimum = Math.max(0, Number(minQuantity || 0));
  const target = Math.max(0, Number(targetQuantity || 0));
  const minimumMet = paidQuantity > 0 && paidQuantity >= (minimum || 1);
  const targetMet = target > 0 && paidQuantity >= target;

  let status = String(requestedStatus || currentStatus || "Draft").trim();

  if (String(fulfilmentStatus).trim() === "Completed") {
    status = "Completed";
  } else if (!["Cancelled", "Completed"].includes(status)) {
    if (status === "Closed") {
      status = minimumMet ? "Processing" : "Closed";
    } else if (["Open", "Minimum met", "Fully reserved"].includes(status)) {
      status = targetMet ? "Fully reserved" : minimumMet ? "Minimum met" : "Open";
    }
  }

  let paymentStatus = "Not collecting";
  if (targetMet) {
    paymentStatus = "Fully paid";
  } else if (minimumMet) {
    paymentStatus = "Minimum payments met";
  } else if (
    paidQuantity > 0 ||
    ["Open", "Minimum met", "Fully reserved"].includes(status)
  ) {
    paymentStatus = "Collecting payments";
  }

  return {
    status,
    paymentStatus,
    reservedQuantity: paidQuantity,
    minimumMet,
    targetMet,
  };
}
