"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";

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
  const customerId = readText(formData, "customerId");
  const productId = readText(formData, "productId");
  const buyerNameInput = readText(formData, "buyerName");
  const phoneInput = readText(formData, "phone");
  const buyerTypeInput = readText(formData, "buyerType", "Individual");
  const orderType = readText(formData, "orderType", "Direct");
  const produceItemInput = readText(formData, "produceItem", "Tomatoes");
  const produceGradeInput = readText(formData, "produceGrade", "Standard");
  const quantity = readNumber(formData, "quantity");
  const unitPriceInput = readNumber(formData, "unitPrice");
  const paymentStatus = readText(formData, "paymentStatus", "Unpaid");
  const fulfilmentStatus = readText(formData, "fulfilmentStatus", "New order");
  const deliveryMethod = readText(formData, "deliveryMethod", "Platform delivery");
  const deliveryNote = readText(formData, "deliveryNote");
  const adminNote = readText(formData, "adminNote");

  const [customer, selectedProduct] = await Promise.all([
    customerId
      ? prisma.customer.findUnique({
          where: {
            id: customerId,
          },
        })
      : null,
    productId
      ? prisma.product.findUnique({
          where: {
            id: productId,
          },
        })
      : null,
  ]);

  const fallbackProduct =
    selectedProduct ||
    (await prisma.product.findFirst({
      where: {
        name: produceItemInput,
      },
    }));

  const buyerName = buyerNameInput || customer?.name || "";
  const phone = phoneInput || customer?.phone || "";
  const buyerType = customer?.buyerType || buyerTypeInput;
  const produceItem = fallbackProduct?.name || produceItemInput;
  const produceGrade = fallbackProduct?.grade || produceGradeInput;
  const unitPrice = unitPriceInput || fallbackProduct?.basePrice || 0;
  const unit = fallbackProduct?.unit || "unit";

  if (!buyerName || !phone || quantity <= 0 || unitPrice <= 0) {
    throw new Error("Buyer name, phone, quantity, and unit price are required.");
  }

  const lineTotal = quantity * unitPrice;
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
      customerId: customer?.id || null,
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
            productId: fallbackProduct?.id,
            name: produceItem,
            grade: produceGrade,
            quantity,
            unit,
            unitPrice,
            lineTotal,
          },
        ],
      },
    },
  });

  await createAuditLog({
    action: "Created order",
    entityType: "Order",
    entityId: order.id,
    entityLabel: order.code,
    newValue: {
      code: order.code,
      buyerName,
      phone,
      buyerType,
      orderType,
      paymentStatus,
      fulfilmentStatus,
      deliveryMethod,
      estimatedTotal: lineTotal,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/customers");
  revalidatePath("/admin/products");
  revalidatePath(`/admin/orders/${order.code}`);
  redirect(`/admin/orders/${order.code}`);
}
