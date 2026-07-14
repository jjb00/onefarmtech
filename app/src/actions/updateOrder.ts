"use server";

import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {requireStaff} from "@/lib/auth";
import {getEmailBaseUrl, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";

function readText(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function updateOrderAction(formData: FormData) {
  await requireStaff();
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
      buyerName: true,
      customer: {select: {email: true}},
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

  if (existingOrder.customer?.email && existingOrder.fulfilmentStatus !== fulfilmentStatus) {
    await sendTransactionalEmail({deduplicationKey: `order-status:${existingOrder.id}:${fulfilmentStatus}`, template: "order-status", to: existingOrder.customer.email, content: emailTemplates.orderStatus(existingOrder.buyerName, existingOrder.code, fulfilmentStatus, getEmailBaseUrl()), relatedType: "Order", relatedId: existingOrder.id});
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin/audit-log");
  revalidatePath(`/admin/orders/${code}`);
  redirect(`/admin/orders/${code}`);
}
