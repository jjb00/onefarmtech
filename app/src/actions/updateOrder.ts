"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

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

  await prisma.order.update({
    where: {
      code,
    },
    data: {
      paymentStatus,
      fulfilmentStatus,
      deliveryNote: deliveryNote || null,
      adminNote: adminNote || null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${code}`);
  redirect(`/admin/orders/${code}`);
}
