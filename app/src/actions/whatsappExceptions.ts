"use server";

import {revalidatePath} from "next/cache";
import {createAuditLog} from "@/lib/auditLog";
import {requireCapability} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {phoneMatchCandidates} from "@/lib/whatsapp/phone";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function resolveWhatsAppExceptionAction(formData: FormData) {
  await requireCapability("manage_support");
  const recordType = readText(formData, "recordType");
  const recordId = readText(formData, "recordId");

  if (!recordId || !["BuyerMessage", "ContactEnquiry", "Conversation"].includes(recordType)) {
    throw new Error("A valid WhatsApp exception is required.");
  }

  if (recordType === "Conversation") {
    // recordId holds the phone number here -- resolve every unresolved
    // BuyerMessage/ContactEnquiry the conversation viewer aggregates by,
    // not just the single message the list row happened to link to.
    const candidates = phoneMatchCandidates(recordId);
    if (!candidates.length) throw new Error("A valid WhatsApp exception is required.");

    const customer = await prisma.customer.findFirst({where: {phone: {in: candidates}}, select: {id: true}});

    const resolvedMessages = await prisma.buyerMessage.updateMany({
      where: {
        channel: "WhatsApp",
        direction: "Inbound",
        status: {notIn: ["Replied", "Closed", "Resolved", "Archived"]},
        OR: [
          {recipient: {in: candidates}},
          ...(customer ? [{customerId: customer.id}] : []),
        ],
      },
      data: {status: "Resolved"},
    });

    const resolvedEnquiries = await prisma.contactEnquiry.updateMany({
      where: {
        enquiryType: "WhatsApp inbound",
        status: {in: ["New", "Open"]},
        phone: {in: candidates},
      },
      data: {status: "Closed"},
    });

    await createAuditLog({
      action: "Resolved WhatsApp conversation",
      entityType: "Conversation",
      entityId: recordId,
      entityLabel: recordId,
      newValue: {resolvedMessages: resolvedMessages.count, resolvedEnquiries: resolvedEnquiries.count},
    });

    revalidatePath("/admin");
    revalidatePath("/admin/buyer-messages");
    return;
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
