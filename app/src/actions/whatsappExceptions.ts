"use server";

import {revalidatePath} from "next/cache";
import {createAuditLog} from "@/lib/auditLog";
import {requireCapability} from "@/lib/auth";
import {prisma} from "@/lib/prisma";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function resolveWhatsAppExceptionAction(formData: FormData) {
  await requireCapability("manage_support");
  const recordType = readText(formData, "recordType");
  const recordId = readText(formData, "recordId");

  if (!recordId || !["BuyerMessage", "ContactEnquiry"].includes(recordType)) {
    throw new Error("A valid WhatsApp exception is required.");
  }

  if (recordType === "BuyerMessage") {
    const message = await prisma.buyerMessage.update({
      where: {id: recordId},
      data: {status: "Resolved"},
      select: {id: true, title: true, customerId: true},
    });

    await createAuditLog({
      action: "Resolved WhatsApp exception",
      entityType: "BuyerMessage",
      entityId: message.id,
      entityLabel: message.title,
      newValue: {status: "Resolved"},
    });
  } else {
    const enquiry = await prisma.contactEnquiry.update({
      where: {id: recordId},
      data: {status: "Closed"},
      select: {id: true, name: true, phone: true},
    });

    await createAuditLog({
      action: "Resolved WhatsApp exception",
      entityType: "ContactEnquiry",
      entityId: enquiry.id,
      entityLabel: enquiry.name || enquiry.phone || "Unknown WhatsApp contact",
      newValue: {status: "Closed"},
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/buyer-messages");
}
