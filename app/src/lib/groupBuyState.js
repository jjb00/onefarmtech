const PAID_STATUSES = new Set(["paid", "fully paid", "approved"]);

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
