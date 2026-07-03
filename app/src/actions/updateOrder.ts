"use server";

import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function updateOrderAction(formData: FormData) {
  const code = readText(formData, "code");
  const paymentStatus = readText(formData, "paymentStatus", "Unpaid");
  const fulfilmentStatus = readText(formData, "fulfilmentStatus", "New order");
  const deliveryNote = readText(formData, "deliveryNote");
  const adminNote = readText(formData, "adminNote");

  if (!code) {
    throw new Error("Order code is required.");
  }

  const existingOrder = await prisma.order.findUnique({
    where: {code},
    select: {
      id: true,
      code: true,
      paymentStatus: true,
      fulfilmentStatus: true,
      deliveryNote: true,
      adminNote: true,
    },
  });

  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  const updatedOrder = await prisma.order.update({
    where: {code},
    data: {
      paymentStatus,
      fulfilmentStatus,
      deliveryNote: deliveryNote || null,
      adminNote: adminNote || null,
    },
  });

  await createAuditLog({
    action: "Updated order",
    entityType: "Order",
    entityId: updatedOrder.id,
    entityLabel: updatedOrder.code,
    previousValue: existingOrder,
    newValue: {
      paymentStatus,
      fulfilmentStatus,
      deliveryNote: deliveryNote || null,
      adminNote: adminNote || null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/audit-log");
  revalidatePath(`/admin/orders/${code}`);
  redirect(`/admin/orders/${code}`);
}
