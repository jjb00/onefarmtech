"use server";

import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {requireCapability} from "@/lib/auth";
import {
  deriveGroupBuyState,
  isPaidGroupBuyReservationStatus,
  paidGroupBuyQuantity,
} from "@/lib/groupBuyState.js";

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
      status: "Closed",
      minQuantity,
      targetQuantity,
      reservedQuantity: 0,
      unit,
      closingDate,
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

export async function createGroupBuyReservationAction(formData: FormData) {
  await requireCapability("manage_group_buys");

  const groupBuyId = readText(formData, "groupBuyId");
  const buyerName = readText(formData, "buyerName");
  const phone = readText(formData, "phone");
  const buyerType = readText(formData, "buyerType", "Individual");
  const quantity = readNumber(formData, "quantity");
  const unitPrice = readNumber(formData, "unitPrice");
  const paymentStatus = readText(formData, "paymentStatus", "Unpaid");

  if (!groupBuyId || !buyerName || !phone || quantity <= 0 || unitPrice <= 0) {
    throw new Error("Group buy, buyer name, phone, quantity, and unit price are required.");
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
    },
  });

  if (!groupBuy) {
    throw new Error("Group buy not found.");
  }

  if (["Cancelled", "Completed", "Fully reserved"].includes(groupBuy.status)) {
    throw new Error("This group buy is not accepting new reservations.");
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
      buyerType,
      quantity,
      amount: quantity * unitPrice,
      paymentStatus,
    },
  });

  await syncGroupBuyState(groupBuyId);
  refreshGroupBuyPaths();
  redirect("/admin/group-buys");
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

  // Quick-action buttons (Open/Close/Cancel) only submit groupBuyId and
  // status -- omitted fields must stay untouched rather than reset to a
  // default, or a one-click status change would silently wipe the
  // fulfilment stage and internal note the full "Manage group buy" form set.
  const fulfilmentStatusRaw = formData.get("fulfilmentStatus");
  const adminNoteRaw = formData.get("adminNote");

  if (!groupBuyId) {
    throw new Error("Group-buy ID is required.");
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

  await syncGroupBuyState(groupBuyId, status);
  refreshGroupBuyPaths();
  redirect("/admin/group-buys");
}
