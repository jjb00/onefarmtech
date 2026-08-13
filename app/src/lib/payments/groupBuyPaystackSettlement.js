import {deriveGroupBuyState, isPaidGroupBuyReservationStatus} from "../groupBuyState.js";
import {validatePaystackVerification} from "./verificationRules.js";

export async function settleVerifiedGroupBuyPaystackPayment({
  db,
  paymentRequest,
  verification,
  paidAt = new Date(),
  source = "Paystack webhook",
}) {
  const conflict = validatePaystackVerification({
    verification,
    reference: paymentRequest.gatewayReference || paymentRequest.reference,
    amount: paymentRequest.amount,
    currency: paymentRequest.currency || "NGN",
  });
  if (conflict) return {ok: false, conflict};

  const apply = async (tx) => {
    const current = await tx.groupBuyPaymentRequest.findUnique({
      where: {id: paymentRequest.id},
      include: {
        reservation: {
          include: {
            paymentRequests: true,
            groupBuy: {
              include: {
                reservations: true,
              },
            },
          },
        },
      },
    });

    if (!current) throw new Error("Group-buy payment request disappeared during settlement.");
    if (current.paidAt) {
      return {duplicate: true, reviewRequired: false, reservation: current.reservation};
    }

    const reservation = current.reservation;
    const groupBuy = reservation.groupBuy;
    const otherPaidQuantity = groupBuy.reservations.reduce(
      (sum, item) =>
        item.id !== reservation.id && isPaidGroupBuyReservationStatus(item.paymentStatus)
          ? sum + item.quantity
          : sum,
      0,
    );
    const overCapacity =
      groupBuy.targetQuantity > 0 &&
      otherPaidQuantity + reservation.quantity > groupBuy.targetQuantity;
    const noLongerCollecting = !["Open", "Minimum met"].includes(groupBuy.status);
    const duplicateCharge = reservation.paymentRequests.some(
      (request) => request.id !== current.id && Boolean(request.paidAt),
    );
    const reviewRequired = duplicateCharge || overCapacity || noLongerCollecting;
    const reservationPaymentStatus =
      duplicateCharge && isPaidGroupBuyReservationStatus(reservation.paymentStatus)
        ? reservation.paymentStatus
        : reviewRequired
          ? "Refund pending"
          : "Paid";

    await tx.groupBuyPaymentRequest.update({
      where: {id: current.id},
      data: {
        gatewayReference: verification.reference,
        providerTransactionId: verification.providerId || null,
        status: reviewRequired ? "Paid — refund review" : "Paid",
        paidAt,
      },
    });

    await tx.groupBuyReservation.update({
      where: {id: reservation.id},
      data: {paymentStatus: reservationPaymentStatus},
    });

    if (!reviewRequired) {
      const nextReservations = groupBuy.reservations.map((item) =>
        item.id === reservation.id ? {...item, paymentStatus: "Paid"} : item,
      );
      const derived = deriveGroupBuyState({
        currentStatus: groupBuy.status,
        minQuantity: groupBuy.minQuantity,
        targetQuantity: groupBuy.targetQuantity,
        fulfilmentStatus: groupBuy.fulfilmentStatus,
        reservations: nextReservations,
      });
      await tx.groupBuy.update({
        where: {id: groupBuy.id},
        data: {
          status: derived.status,
          paymentStatus: derived.paymentStatus,
          reservedQuantity: derived.reservedQuantity,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorName: "Paystack",
        actorRole: "System",
        action: reviewRequired
          ? "Received group-buy payment requiring refund review"
          : "Verified group-buy reservation payment",
        entityType: "GroupBuyReservation",
        entityId: reservation.id,
        entityLabel: `${groupBuy.code} · ${reservation.buyerName}`,
        previousValue: JSON.stringify({paymentStatus: reservation.paymentStatus}),
        newValue: JSON.stringify({
          paymentStatus: reservationPaymentStatus,
          amount: current.amount,
          paidAt,
        }),
        metadata: JSON.stringify({
          source,
          provider: "Paystack",
          providerReference: verification.reference,
          providerTransactionId: verification.providerId || null,
          overCapacity,
          noLongerCollecting,
          duplicateCharge,
        }),
      },
    });

    return {duplicate: false, reviewRequired, duplicateCharge, reservation, groupBuy};
  };

  const result = db.$transaction ? await db.$transaction(apply) : await apply(db);
  return {ok: true, ...result};
}
