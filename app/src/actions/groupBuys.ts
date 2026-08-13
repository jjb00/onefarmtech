"use server";

import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {requireCapability} from "@/lib/auth";
import {createAuditLog} from "@/lib/auditLog";
import {nextGroupBuyCloseTime} from "@/lib/groupBuySchedule";
import {protectPublicIntake, PublicIntakeError} from "@/lib/publicIntakeProtection";
import {
  deriveGroupBuyState,
  isPaidGroupBuyReservationStatus,
  paidGroupBuyQuantity,
  resolveGroupBuyTierPrice,
  LIVE_GROUP_BUY_STATUSES,
  MAX_CONCURRENT_GROUP_BUYS,
} from "@/lib/groupBuyState.js";
import {
  GroupBuyPaymentInitializationError,
  initialiseGroupBuyPayment,
} from "@/lib/payments/groupBuyPaymentInitialization.js";
import {createPaymentCheckout} from "@/lib/payments/provider";
import {verifyPaystackTransaction} from "@/lib/payments/paystack";
import {settleVerifiedGroupBuyPaystackPayment} from "@/lib/payments/groupBuyPaystackSettlement.js";
import {createPaymentReconciliationIncident} from "@/lib/payments/reconciliation";

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.round(numberValue) : 0;
}

function readDate(formData: FormData, key: string) {
  const value = readText(formData, key);
  return value ? new Date(value) : null;
}

async function createNextGroupBuyCode() {
  const count = await prisma.groupBuy.count();
  return `GB-${String(count + 1).padStart(4, "0")}`;
}

async function syncGroupBuyState(groupBuyId: string, requestedStatus?: string) {
  const groupBuy = await prisma.groupBuy.findUnique({
    where: {id: groupBuyId},
    include: {
      reservations: {
        select: {
          quantity: true,
          paymentStatus: true,
        },
      },
    },
  });

  if (!groupBuy) {
    throw new Error("Group buy not found.");
  }

  const derived = deriveGroupBuyState({
    currentStatus: groupBuy.status,
    requestedStatus,
    minQuantity: groupBuy.minQuantity,
    targetQuantity: groupBuy.targetQuantity,
    fulfilmentStatus: groupBuy.fulfilmentStatus,
    reservations: groupBuy.reservations,
  });

  await prisma.groupBuy.update({
    where: {id: groupBuyId},
    data: {
      status: derived.status,
      paymentStatus: derived.paymentStatus,
      reservedQuantity: derived.reservedQuantity,
    },
  });

  return derived;
}

function refreshGroupBuyPaths() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/group-buys");
  revalidatePath("/admin/products");
}

function groupBuyErrorRedirect(code: string, detail?: string): never {
  const params = new URLSearchParams({error: code});
  if (detail) params.set("detail", detail);
  redirect(`/admin/group-buys?${params.toString()}`);
}

export async function createGroupBuyAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const title = readText(formData, "title");
  const description = readText(formData, "description");
  const productId = readText(formData, "productId");
  const productName = readText(formData, "productName", "Mixed produce");
  const grade = readText(formData, "grade", "Standard");
  const unit = readText(formData, "unit", "unit");
  const unitPrice = readNumber(formData, "unitPrice");
  const minQuantity = readNumber(formData, "minQuantity");
  const targetQuantity = readNumber(formData, "targetQuantity");
  const closingDate = readDate(formData, "closingDate");
  const pickupWindow = readText(formData, "pickupWindow");
  const adminNote = readText(formData, "adminNote");

  if (!title || !productName || unitPrice <= 0 || targetQuantity <= 0) {
    throw new Error("Title, product name, unit price, and target quantity are required.");
  }

  if (minQuantity > targetQuantity) {
    throw new Error("Minimum quantity cannot be greater than target quantity.");
  }

  const code = await createNextGroupBuyCode();

  await prisma.groupBuy.create({
    data: {
      code,
      title,
      description: description || null,
      // Starts as Draft, not Closed -- Closed means "this window ran and
      // finished", which isn't true for something that's never opened.
      // The weekly cron picks up Draft group buys and opens them on the
      // standard Sunday-night schedule.
      status: "Draft",
      minQuantity,
      targetQuantity,
      reservedQuantity: 0,
      unit,
      closingDate: closingDate || nextGroupBuyCloseTime(),
      pickupWindow: pickupWindow || null,
      paymentStatus: "Not collecting",
      fulfilmentStatus: "Planning",
      adminNote: adminNote || null,
      items: {
        create: [
          {
            productId: productId || null,
            name: productName,
            grade,
            quantity: targetQuantity,
            unit,
            unitPrice,
            lineTotal: targetQuantity * unitPrice,
          },
        ],
      },
    },
  });

  refreshGroupBuyPaths();
  redirect("/admin/group-buys");
}

export async function createGroupBuyProposalAction(formData: FormData) {
  const buyerName = readText(formData, "buyerName");
  const phone = readText(formData, "phone");
  const email = readText(formData, "email");
  const productName = readText(formData, "productName");
  const unit = readText(formData, "unit", "unit");
  const targetQuantity = readNumber(formData, "targetQuantity");
  const pickupWindow = readText(formData, "pickupWindow");
  const closingDate = readDate(formData, "closingDate");
  const message = readText(formData, "message");

  if (!buyerName || !phone || !productName || targetQuantity <= 0) {
    redirect("/group-buy-request?intakeError=validation");
  }

  try {
    await protectPublicIntake({
      formType: "group-buy-request",
      action: "group_buy_request",
      token: readText(formData, "cf-turnstile-response"),
      honeypot: readText(formData, "website"),
      values: [buyerName, phone, email, productName, unit, targetQuantity, pickupWindow, message],
    });
  } catch (error) {
    const code = error instanceof PublicIntakeError ? error.code : "bot-check";
    redirect(`/group-buy-request?intakeError=${encodeURIComponent(code)}`);
  }

  const code = await createNextGroupBuyCode();
  const contactNote = [
    `Proposed by: ${buyerName}`,
    `Phone: ${phone}`,
    email ? `Email: ${email}` : "",
    message ? `Message: ${message}` : "",
    "",
    "Set a real unit price and review the target quantity before approving and opening this group buy.",
  ]
    .filter(Boolean)
    .join("\n");

  const groupBuy = await prisma.groupBuy.create({
    data: {
      code,
      title: `${productName} group buy — proposed by ${buyerName}`,
      status: "Proposed",
      minQuantity: 0,
      targetQuantity,
      reservedQuantity: 0,
      unit,
      closingDate,
      pickupWindow: pickupWindow || null,
      paymentStatus: "Not collecting",
      fulfilmentStatus: "Planning",
      adminNote: contactNote,
      items: {
        create: [
          {
            name: productName,
            grade: "Standard",
            quantity: targetQuantity,
            unit,
            unitPrice: 0,
            lineTotal: 0,
          },
        ],
      },
    },
  });

  await createAuditLog({
    action: "Buyer proposed a self-serve group buy",
    entityType: "GroupBuy",
    entityId: groupBuy.id,
    entityLabel: groupBuy.title,
    actorName: buyerName,
    actorRole: "Buyer",
    newValue: {code: groupBuy.code, productName, unit, targetQuantity, phone},
  });

  refreshGroupBuyPaths();
  redirect("/group-buy-request?submitted=1");
}

export async function createGroupBuyReservationAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const groupBuyId = readText(formData, "groupBuyId");
  const buyerName = readText(formData, "buyerName");
  const phone = readText(formData, "phone");
  const email = readText(formData, "email");
  const buyerType = readText(formData, "buyerType", "Individual");
  const quantity = readNumber(formData, "quantity");
  const paymentStatus = readText(formData, "paymentStatus", "Unpaid");

  if (!groupBuyId || !buyerName || !phone || quantity <= 0) {
    throw new Error("Group buy, buyer name, phone, and quantity are required.");
  }

  const groupBuy = await prisma.groupBuy.findUnique({
    where: {id: groupBuyId},
    include: {
      reservations: {
        select: {
          quantity: true,
          paymentStatus: true,
        },
      },
      items: {orderBy: {id: "asc"}, take: 1},
      priceTiers: {orderBy: {minQuantity: "asc"}},
    },
  });

  if (!groupBuy) {
    throw new Error("Group buy not found.");
  }

  if (["Cancelled", "Completed", "Fully reserved"].includes(groupBuy.status)) {
    throw new Error("This group buy is not accepting new reservations.");
  }

  const activeReservationQuantity = groupBuy.reservations.reduce(
    (sum, reservation) =>
      ["Refunded", "Cancelled"].includes(reservation.paymentStatus)
        ? sum
        : sum + reservation.quantity,
    0,
  );
  if (
    groupBuy.targetQuantity > 0 &&
    activeReservationQuantity + quantity > groupBuy.targetQuantity
  ) {
    throw new Error("This reservation would exceed the group-buy target.");
  }

  const unitPrice =
    resolveGroupBuyTierPrice(groupBuy.priceTiers, groupBuy.reservedQuantity) ??
    groupBuy.items[0]?.unitPrice ??
    0;
  if (unitPrice <= 0) {
    throw new Error("Set a valid group-buy price before adding reservations.");
  }

  const currentPaidQuantity = paidGroupBuyQuantity(groupBuy.reservations);
  if (
    isPaidGroupBuyReservationStatus(paymentStatus) &&
    groupBuy.targetQuantity > 0 &&
    currentPaidQuantity + quantity > groupBuy.targetQuantity
  ) {
    throw new Error("This paid reservation would exceed the group-buy target.");
  }

  await prisma.groupBuyReservation.create({
    data: {
      groupBuyId,
      buyerName,
      phone,
      email: email || null,
      buyerType,
      quantity,
      unitPrice,
      amount: quantity * unitPrice,
      paymentStatus,
    },
  });

  await syncGroupBuyState(groupBuyId);
  refreshGroupBuyPaths();
  redirect("/admin/group-buys");
}

export async function generateGroupBuyPaymentLinkAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const reservationId = readText(formData, "reservationId");
  if (!reservationId) groupBuyErrorRedirect("missing-reservation");

  let result;
  try {
    result = await initialiseGroupBuyPayment({
      db: prisma,
      reservationId,
      createCheckout: createPaymentCheckout,
    });
  } catch (error) {
    const code =
      error instanceof GroupBuyPaymentInitializationError
        ? error.code
        : "payment-link-failed";
    const detail = error instanceof Error ? error.message : "Payment link generation failed.";
    groupBuyErrorRedirect(code, detail);
  }

  await createAuditLog({
    action: result.reused
      ? "Reused group-buy Paystack link"
      : "Generated group-buy Paystack link",
    entityType: "GroupBuyReservation",
    entityId: result.reservation.id,
    entityLabel: `${result.reservation.groupBuy.code} · ${result.reservation.buyerName}`,
    actorName: "Staff",
    actorRole: "Admin",
    newValue: {
      reference: result.paymentRequest.reference,
      amount: result.paymentRequest.amount,
      reused: result.reused,
    },
  });

  refreshGroupBuyPaths();
  redirect(`/admin/group-buys?paymentLink=${result.reused ? "reused" : "generated"}`);
}

export async function verifyGroupBuyPaystackPaymentAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const paymentRequestId = readText(formData, "paymentRequestId");
  if (!paymentRequestId) groupBuyErrorRedirect("missing-payment-request");

  const paymentRequest = await prisma.groupBuyPaymentRequest.findUnique({
    where: {id: paymentRequestId},
  });
  if (!paymentRequest) groupBuyErrorRedirect("payment-request-not-found");

  const providerReference = paymentRequest.gatewayReference || paymentRequest.reference;

  try {
    const verification = await verifyPaystackTransaction(providerReference);
    const result = await settleVerifiedGroupBuyPaystackPayment({
      db: prisma,
      paymentRequest,
      verification,
      paidAt: verification.metadata?.paidAt
        ? new Date(String(verification.metadata.paidAt))
        : new Date(),
      source: "Manual staff verification",
    });

    if (!result.ok) {
      await createPaymentReconciliationIncident({
        provider: "Paystack",
        internalReference: paymentRequest.reference,
        providerReference,
        reason: `Manual group-buy verification conflict: ${result.conflict}.`,
        verificationMetadata: verification,
      });
      groupBuyErrorRedirect("verification-mismatch");
    }

    if (result.reviewRequired) {
      await createPaymentReconciliationIncident({
        provider: "Paystack",
        internalReference: paymentRequest.reference,
        providerReference,
        reason: result.duplicateCharge
          ? "A second Paystack charge was received for an already-paid group-buy reservation; refund review required."
          : "Group-buy payment arrived after collection closed or above remaining capacity; refund review required.",
        verificationMetadata: verification,
      });
    }
  } catch (error) {
    await createPaymentReconciliationIncident({
      provider: "Paystack",
      internalReference: paymentRequest.reference,
      providerReference,
      reason: "Manual group-buy Paystack verification failed.",
      verificationMetadata: {error: error instanceof Error ? error.message : "unknown"},
    });
    groupBuyErrorRedirect("verification-failed");
  }

  refreshGroupBuyPaths();
  redirect("/admin/group-buys?payment=verified");
}

export async function updateGroupBuyReservationAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const reservationId = readText(formData, "reservationId");
  const paymentStatus = readText(formData, "paymentStatus");

  if (!reservationId || !paymentStatus) {
    throw new Error("Reservation and payment status are required.");
  }

  const reservation = await prisma.groupBuyReservation.findUnique({
    where: {id: reservationId},
    include: {
      groupBuy: {
        include: {
          reservations: {
            select: {
              id: true,
              quantity: true,
              paymentStatus: true,
            },
          },
        },
      },
    },
  });

  if (!reservation) {
    throw new Error("Reservation not found.");
  }

  const otherReservations = reservation.groupBuy.reservations.filter(
    (item) => item.id !== reservation.id,
  );
  const otherPaidQuantity = paidGroupBuyQuantity(otherReservations);

  if (
    isPaidGroupBuyReservationStatus(paymentStatus) &&
    reservation.groupBuy.targetQuantity > 0 &&
    otherPaidQuantity + reservation.quantity > reservation.groupBuy.targetQuantity
  ) {
    throw new Error("This payment update would exceed the group-buy target.");
  }

  await prisma.groupBuyReservation.update({
    where: {id: reservationId},
    data: {paymentStatus},
  });

  await syncGroupBuyState(reservation.groupBuyId);
  refreshGroupBuyPaths();
  redirect("/admin/group-buys");
}

export async function updateGroupBuyAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const groupBuyId = readText(formData, "groupBuyId");
  const status = readText(formData, "status") || undefined;

  // Quick-action buttons (Open/Close/Cancel/Approve) only submit
  // groupBuyId and status -- omitted fields must stay untouched rather
  // than reset to a default, or a one-click status change would silently
  // wipe the fulfilment stage and internal note the full "Manage group
  // buy" form set.
  const fulfilmentStatusRaw = formData.get("fulfilmentStatus");
  const adminNoteRaw = formData.get("adminNote");
  const itemUnitPriceRaw = formData.get("itemUnitPrice");

  if (!groupBuyId) {
    throw new Error("Group-buy ID is required.");
  }

  // Cap concurrent live group buys so buyer-proposed demand can't outpace
  // what a small team can actually source and approve in a week. Only
  // blocks newly opening one -- a group buy already live moving between
  // live sub-states (Open -> Minimum met, etc.) isn't newly consuming a slot.
  if (status && LIVE_GROUP_BUY_STATUSES.includes(status)) {
    const current = await prisma.groupBuy.findUnique({
      where: {id: groupBuyId},
      select: {status: true},
    });

    if (current && !LIVE_GROUP_BUY_STATUSES.includes(current.status)) {
      const liveCount = await prisma.groupBuy.count({
        where: {status: {in: LIVE_GROUP_BUY_STATUSES}},
      });

      if (liveCount >= MAX_CONCURRENT_GROUP_BUYS) {
        throw new Error(
          `Cannot open another group buy -- ${MAX_CONCURRENT_GROUP_BUYS} are already live. Close one first.`,
        );
      }
    }
  }

  const data: {fulfilmentStatus?: string; adminNote?: string | null} = {};
  if (typeof fulfilmentStatusRaw === "string" && fulfilmentStatusRaw.trim()) {
    data.fulfilmentStatus = fulfilmentStatusRaw.trim();
  }
  if (typeof adminNoteRaw === "string") {
    data.adminNote = adminNoteRaw.trim() || null;
  }

  if (Object.keys(data).length) {
    await prisma.groupBuy.update({where: {id: groupBuyId}, data});
  }

  // A self-serve proposal is created with unitPrice 0 -- this is where
  // staff set the real price before approving and opening it. Applies to
  // the group buy's first/only item, matching the single-item shape both
  // createGroupBuyAction and createGroupBuyProposalAction create.
  if (typeof itemUnitPriceRaw === "string" && itemUnitPriceRaw.trim()) {
    const itemUnitPrice = Number(itemUnitPriceRaw);
    if (Number.isFinite(itemUnitPrice) && itemUnitPrice >= 0) {
      const firstItem = await prisma.groupBuyItem.findFirst({where: {groupBuyId}, orderBy: {id: "asc"}});
      if (firstItem) {
        await prisma.groupBuyItem.update({
          where: {id: firstItem.id},
          data: {unitPrice: Math.round(itemUnitPrice), lineTotal: Math.round(itemUnitPrice) * firstItem.quantity},
        });
      }
    }
  }

  await syncGroupBuyState(groupBuyId, status);
  refreshGroupBuyPaths();
  redirect("/admin/group-buys");
}

export async function addGroupBuyPriceTierAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const groupBuyId = readText(formData, "groupBuyId");
  const minQuantity = readNumber(formData, "minQuantity");
  const unitPrice = readNumber(formData, "unitPrice");

  if (!groupBuyId || unitPrice <= 0) {
    throw new Error("Group buy and a positive unit price are required.");
  }

  await prisma.groupBuyPriceTier.create({
    data: {groupBuyId, minQuantity, unitPrice},
  });

  await createAuditLog({
    action: "Added a group-buy price tier",
    entityType: "GroupBuy",
    entityId: groupBuyId,
    entityLabel: groupBuyId,
    actorName: "Staff",
    actorRole: "Admin",
    newValue: {minQuantity, unitPrice},
  });

  refreshGroupBuyPaths();
  redirect("/admin/group-buys");
}

export async function deleteGroupBuyPriceTierAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const tierId = readText(formData, "tierId");

  if (!tierId) {
    throw new Error("Tier ID is required.");
  }

  await prisma.groupBuyPriceTier.delete({where: {id: tierId}});

  refreshGroupBuyPaths();
  redirect("/admin/group-buys");
}
