import {freshPaymentReference} from "./paymentInitialization.js";
import {providerFailureDetails} from "./providerError.js";

export class GroupBuyPaymentInitializationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "GroupBuyPaymentInitializationError";
    this.code = code;
  }
}

export function isReusableGroupBuyPaymentRequest(request, now = new Date()) {
  const lastUpdated = request?.updatedAt || request?.createdAt;
  const recentEnough =
    lastUpdated && now.getTime() - new Date(lastUpdated).getTime() <= 30 * 60 * 1000;

  return Boolean(
    request &&
      request.status === "Pending" &&
      !request.paidAt &&
      request.paymentUrl &&
      /^https:\/\//.test(request.paymentUrl) &&
      recentEnough &&
      (!request.expiresAt || new Date(request.expiresAt) > now),
  );
}

export async function initialiseGroupBuyPayment({
  db,
  reservationId,
  createCheckout,
  referenceFactory = freshPaymentReference,
  now = () => new Date(),
}) {
  const reservation = await db.groupBuyReservation.findUnique({
    where: {id: reservationId},
    include: {
      groupBuy: true,
      paymentRequests: {orderBy: {createdAt: "desc"}},
    },
  });

  if (!reservation) {
    throw new GroupBuyPaymentInitializationError("not-found", "Reservation was not found.");
  }

  if (!["Open", "Minimum met"].includes(reservation.groupBuy.status)) {
    throw new GroupBuyPaymentInitializationError(
      "group-buy-closed",
      "This group buy is not currently accepting payments.",
    );
  }

  if (["Paid", "Fully paid", "Approved"].includes(reservation.paymentStatus)) {
    throw new GroupBuyPaymentInitializationError(
      "already-paid",
      "This reservation has already been paid.",
    );
  }

  if (!Number.isFinite(reservation.amount) || reservation.amount <= 0) {
    throw new GroupBuyPaymentInitializationError(
      "invalid-amount",
      "Reservation payment amount must be positive.",
    );
  }

  const reusable = reservation.paymentRequests.find((request) =>
    isReusableGroupBuyPaymentRequest(request, now()),
  );
  if (reusable) {
    return {reservation, paymentRequest: reusable, checkout: reusable, reused: true};
  }

  const reference = referenceFactory(`GB-${reservation.groupBuy.code}`);
  const startedAt = now();
  const attempt = await db.groupBuyPaymentRequest.create({
    data: {
      reservationId: reservation.id,
      provider: "Paystack",
      reference,
      amount: reservation.amount,
      currency: "NGN",
      status: "Initialising",
      gatewayReference: reference,
      expiresAt: new Date(startedAt.getTime() + 30 * 60 * 1000),
    },
  });

  try {
    const checkout = await createCheckout({
      provider: "Paystack",
      reference,
      amount: reservation.amount,
      currency: "NGN",
      buyerEmail: reservation.email,
      buyerName: reservation.buyerName,
      buyerPhone: reservation.phone,
      orderCode: reservation.groupBuy.code,
      callbackPath: `/api/group-buy-payments/return?reference=${encodeURIComponent(reference)}`,
      metadata: {
        source: "OneFarmTech group buy",
        groupBuyCode: reservation.groupBuy.code,
        groupBuyReservationId: reservation.id,
        quantity: reservation.quantity,
        chargedUnitPrice: reservation.unitPrice,
      },
    });

    if (!checkout?.paymentUrl || !/^https:\/\//.test(checkout.paymentUrl)) {
      throw new Error("Paystack returned an invalid checkout link.");
    }

    const persistSuccess = async (tx) => {
      const updated = await tx.groupBuyPaymentRequest.update({
        where: {id: attempt.id},
        data: {
          paymentUrl: checkout.paymentUrl,
          gatewayReference: checkout.gatewayReference,
          providerHttpStatus: checkout.httpStatus || 200,
          providerError: null,
          status: "Pending",
        },
      });
      await tx.groupBuyPaymentRequest.updateMany({
        where: {
          reservationId: reservation.id,
          id: {not: attempt.id},
          paidAt: null,
          status: {in: ["Pending", "Initialising"]},
        },
        data: {status: "Superseded"},
      });
      await tx.groupBuyReservation.update({
        where: {id: reservation.id},
        data: {paymentStatus: "Payment pending"},
      });
      return updated;
    };

    const paymentRequest = db.$transaction
      ? await db.$transaction(persistSuccess)
      : await persistSuccess(db);

    return {reservation, paymentRequest, checkout, reused: false};
  } catch (error) {
    const failure = providerFailureDetails(error, "Paystack");
    await db.groupBuyPaymentRequest.update({
      where: {id: attempt.id},
      data: {
        status: "Failed",
        paymentUrl: null,
        providerHttpStatus: failure.httpStatus,
        providerError: failure.message,
      },
    });
    throw new GroupBuyPaymentInitializationError(
      `paystack-${failure.code}`,
      failure.message,
    );
  }
}
