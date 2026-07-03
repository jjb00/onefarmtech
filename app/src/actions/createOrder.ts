"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function readNumber(formData: FormData, key: string) {
  const value = formData.get(key);
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? Math.round(numberValue) : 0;
}

async function createNextOrderCode() {
  const orderCount = await prisma.order.count();
  const nextNumber = orderCount + 1;
  return `OFT-${String(nextNumber).padStart(4, "0")}`;
}

export async function createOrderAction(formData: FormData) {
  const buyerName = readText(formData, "buyerName");
  const phone = readText(formData, "phone");
  const buyerType = readText(formData, "buyerType", "Individual");
  const orderType = readText(formData, "orderType", "Direct");
  const produceItem = readText(formData, "produceItem", "Tomatoes");
  const produceGrade = readText(formData, "produceGrade", "Standard");
  const quantity = readNumber(formData, "quantity");
  const unitPrice = readNumber(formData, "unitPrice");
  const paymentStatus = readText(formData, "paymentStatus", "Unpaid");
  const fulfilmentStatus = readText(formData, "fulfilmentStatus", "New order");
  const deliveryMethod = readText(formData, "deliveryMethod", "Platform delivery");
  const deliveryNote = readText(formData, "deliveryNote");
  const adminNote = readText(formData, "adminNote");

  if (!buyerName || !phone || quantity <= 0 || unitPrice <= 0) {
    throw new Error("Buyer name, phone, quantity, and unit price are required.");
  }

  const lineTotal = quantity * unitPrice;
  const product = await prisma.product.findFirst({
    where: {
      name: produceItem,
    },
  });

  let code = await createNextOrderCode();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existingOrder = await prisma.order.findUnique({
      where: {
        code,
      },
    });

    if (!existingOrder) {
      break;
    }

    code = `OFT-${String(Date.now()).slice(-6)}`;
  }

  const order = await prisma.order.create({
    data: {
      code,
      buyerName,
      phone,
      buyerType,
      orderType,
      paymentStatus,
      fulfilmentStatus,
      deliveryMethod,
      deliveryNote: deliveryNote || null,
      estimatedTotal: lineTotal,
      adminNote: adminNote || null,
      items: {
        create: [
          {
            productId: product?.id,
            name: produceItem,
            grade: produceGrade,
            quantity,
            unit: product?.unit || "unit",
            unitPrice,
            lineTotal,
          },
        ],
      },
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${order.code}`);
  redirect(`/admin/orders/${order.code}`);
}
