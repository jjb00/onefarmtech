"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {requireCapability} from "@/lib/auth";

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

  revalidatePath("/admin/group-buys");
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
    throw new Error("Group-buy, buyer name, phone, quantity, and unit price are required.");
  }

  await prisma.$transaction([
    prisma.groupBuyReservation.create({
      data: {
        groupBuyId,
        buyerName,
        phone,
        buyerType,
        quantity,
        amount: quantity * unitPrice,
        paymentStatus,
      },
    }),
    prisma.groupBuy.update({
      where: {
        id: groupBuyId,
      },
      data: {
        reservedQuantity: {
          increment: quantity,
        },
      },
    }),
  ]);

  revalidatePath("/admin/group-buys");
  redirect("/admin/group-buys");
}

export async function updateGroupBuyAction(formData: FormData) {
  await requireCapability("manage_group_buys");
  const groupBuyId = readText(formData, "groupBuyId");
  const status = readText(formData, "status", "Closed");
  const paymentStatus = readText(formData, "paymentStatus", "Not collecting");
  const fulfilmentStatus = readText(formData, "fulfilmentStatus", "Planning");
  const adminNote = readText(formData, "adminNote");

  if (!groupBuyId) {
    throw new Error("Group-buy ID is required.");
  }

  await prisma.groupBuy.update({
    where: {
      id: groupBuyId,
    },
    data: {
      status,
      paymentStatus,
      fulfilmentStatus,
      adminNote: adminNote || null,
    },
  });

  revalidatePath("/admin/group-buys");
  redirect("/admin/group-buys");
}
