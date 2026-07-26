"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {createAuditLog} from "@/lib/auditLog";
import {requireCapability} from "@/lib/auth";
import {prisma} from "@/lib/prisma";
import {normalizeInternationalPhone} from "@/lib/phoneNumbers";
import {phoneMatchCandidates} from "@/lib/whatsapp/phone";
import {
  sendWhatsAppTextMessage,
  WhatsAppProviderError,
} from "@/lib/whatsapp/provider";

type RecordType = "BuyerMessage" | "ContactEnquiry";

function readText(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function conversationPath(recordType: string, recordId: string) {
  return `/admin/buyer-messages/${recordType}/${recordId}`;
}

async function loadSource(recordType: RecordType, recordId: string) {
  if (recordType === "BuyerMessage") {
    const record = await prisma.buyerMessage.findUnique({
      where: {id: recordId},
      include: {customer: true},
    });

    if (!record) throw new Error("WhatsApp message not found.");

    return {
      recordType,
      id: record.id,
      phone: record.recipient || record.customer.phone,
      name: record.customer.name,
      body: record.body,
      customerId: record.customerId,
      sourceCreatedAt: record.createdAt,
    };
  }

  const record = await prisma.contactEnquiry.findUnique({
    where: {id: recordId},
  });

  if (!record) throw new Error("WhatsApp enquiry not found.");

  return {
    recordType,
    id: record.id,
    phone: record.phone || "",
    name: record.name || "WhatsApp buyer",
    body: record.message,
    customerId: null,
    sourceCreatedAt: record.createdAt,
  };
}

async function findCustomerByPhone(phone: string) {
  const candidates = phoneMatchCandidates(phone);
  if (!candidates.length) return null;

  const contact = await prisma.buyerContact.findFirst({
    where: {
      phone: {in: candidates},
      status: "Active",
    },
    include: {customer: true},
  });

  if (contact?.customer) return contact.customer;

  return prisma.customer.findFirst({
    where: {
      phone: {in: candidates},
    },
  });
}

async function ensureConversationCustomer(source: Awaited<ReturnType<typeof loadSource>>) {
  if (source.customerId) {
    const existing = await prisma.customer.findUnique({
      where: {id: source.customerId},
    });

    if (existing) return existing;
  }

  const matched = await findCustomerByPhone(source.phone);
  if (matched) return matched;

  const phone = normalizeInternationalPhone(source.phone);

  const customer = await prisma.customer.create({
    data: {
      name: source.name || "WhatsApp buyer",
      phone,
      buyerType: "WhatsApp buyer",
      accountStatus: "Manual WhatsApp",
      status: "Active",
    },
  });

  await prisma.buyerContact.create({
    data: {
      customerId: customer.id,
      name: source.name || customer.name,
      phone,
      role: "WhatsApp ordering contact",
      canPlaceOrders: true,
      canViewReceipts: true,
      canViewCredit: false,
      status: "Active",
    },
  });

  await createAuditLog({
    action: "Created buyer from WhatsApp conversation",
    entityType: "Customer",
    entityId: customer.id,
    entityLabel: customer.name,
    newValue: {
      phone: customer.phone,
      sourceRecordType: source.recordType,
      sourceRecordId: source.id,
    },
  });

  return customer;
}

async function moveSourceToCustomer(
  source: Awaited<ReturnType<typeof loadSource>>,
  customerId: string,
) {
  if (source.recordType === "BuyerMessage") {
    await prisma.buyerMessage.update({
      where: {id: source.id},
      data: {customerId},
    });
    return;
  }

  const existingCopy = await prisma.buyerMessage.findFirst({
    where: {
      customerId,
      relatedType: "ContactEnquiry",
      relatedId: source.id,
    },
  });

  if (!existingCopy) {
    await prisma.buyerMessage.create({
      data: {
        customerId,
        title: `Inbound WhatsApp from ${source.name}`,
        body: source.body,
        channel: "WhatsApp",
        direction: "Inbound",
        status: "Unread",
        recipient: source.phone,
        source: "WhatsApp enquiry linked to buyer",
        relatedType: "ContactEnquiry",
        relatedId: source.id,
        sentAt: source.sourceCreatedAt,
      },
    });
  }

  await prisma.contactEnquiry.update({
    where: {id: source.id},
    data: {
      status: "Closed",
      adminNote: JSON.stringify({
        linkedCustomerId: customerId,
        linkedAt: new Date().toISOString(),
      }),
    },
  });
}

export async function sendWhatsAppConversationReplyAction(formData: FormData) {
  const staff = await requireCapability("manage_communications");

  const recordType = readText(formData, "recordType") as RecordType;
  const recordId = readText(formData, "recordId");
  const body = readText(formData, "body");

  if (!["BuyerMessage", "ContactEnquiry"].includes(recordType) || !recordId) {
    redirect("/admin/buyer-messages?error=invalid-conversation");
  }

  if (!body) {
    redirect(`${conversationPath(recordType, recordId)}?error=reply-required`);
  }

  const source = await loadSource(recordType, recordId);
  const customer = await ensureConversationCustomer(source);
  await moveSourceToCustomer(source, customer.id);

  const messageLog = await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title: `WhatsApp reply from ${staff.name}`,
      body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Pending",
      recipient: source.phone,
      source: "Admin WhatsApp conversation",
      relatedType: source.recordType,
      relatedId: source.id,
      metadata: JSON.stringify({
        attemptedAt: new Date().toISOString(),
        staffId: staff.id,
      }),
    },
  });

  try {
    const result = await sendWhatsAppTextMessage({
      to: source.phone,
      body,
    });

    await prisma.buyerMessage.update({
      where: {id: messageLog.id},
      data: {
        status: "Sent",
        sentAt: new Date(),
        metadata: JSON.stringify({
          provider: result.provider,
          messageId: result.messageId || null,
          normalizedRecipient: result.normalizedTo,
          httpStatus: result.httpStatus,
          messageType: result.messageType,
          staffId: staff.id,
        }),
      },
    });

    if (source.recordType === "BuyerMessage") {
      await prisma.buyerMessage.update({
        where: {id: source.id},
        data: {status: "Replied"},
      });
    } else {
      await prisma.contactEnquiry.update({
        where: {id: source.id},
        data: {status: "Closed"},
      });
    }

    await createAuditLog({
      action: "Sent WhatsApp conversation reply",
      entityType: "BuyerMessage",
      entityId: messageLog.id,
      entityLabel: customer.name,
      newValue: {
        recipient: result.normalizedTo,
        sourceRecordType: source.recordType,
        sourceRecordId: source.id,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WhatsApp reply failed.";

    const details =
      error instanceof WhatsAppProviderError ? error.details : {};

    await prisma.buyerMessage.update({
      where: {id: messageLog.id},
      data: {
        status: "Failed",
        metadata: JSON.stringify({
          error: message,
          ...details,
          staffId: staff.id,
        }),
      },
    });

    redirect(
      `${conversationPath(recordType, recordId)}?error=${encodeURIComponent(
        message,
      ).slice(0, 220)}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/buyer-messages");
  revalidatePath(conversationPath(recordType, recordId));
  revalidatePath("/buyer-account/inbox");

  redirect(`${conversationPath(recordType, recordId)}?sent=1`);
}

export async function linkWhatsAppConversationBuyerAction(formData: FormData) {
  await requireCapability("manage_buyer_access");

  const recordType = readText(formData, "recordType") as RecordType;
  const recordId = readText(formData, "recordId");
  const customerId = readText(formData, "customerId");

  if (
    !["BuyerMessage", "ContactEnquiry"].includes(recordType) ||
    !recordId ||
    !customerId
  ) {
    redirect("/admin/buyer-messages?error=invalid-link");
  }

  const [source, customer] = await Promise.all([
    loadSource(recordType, recordId),
    prisma.customer.findUnique({where: {id: customerId}}),
  ]);

  if (!customer) {
    redirect(`${conversationPath(recordType, recordId)}?error=buyer-not-found`);
  }

  const phone = normalizeInternationalPhone(source.phone);
  const candidates = phoneMatchCandidates(phone);

  const conflictingCustomer = await prisma.customer.findFirst({
    where: {
      id: {not: customer.id},
      phone: {in: candidates},
    },
  });

  const conflictingContact = await prisma.buyerContact.findFirst({
    where: {
      customerId: {not: customer.id},
      phone: {in: candidates},
    },
  });

  if (conflictingCustomer || conflictingContact) {
    redirect(
      `${conversationPath(recordType, recordId)}?error=phone-already-linked`,
    );
  }

  await moveSourceToCustomer(source, customer.id);

  const existingContact = await prisma.buyerContact.findFirst({
    where: {
      customerId: customer.id,
      phone: {in: candidates},
    },
  });

  if (!existingContact) {
    await prisma.buyerContact.create({
      data: {
        customerId: customer.id,
        name: source.name || customer.name,
        phone,
        role: "WhatsApp ordering contact",
        canPlaceOrders: true,
        canViewReceipts: true,
        status: "Active",
      },
    });
  }

  await createAuditLog({
    action: "Linked WhatsApp conversation to buyer",
    entityType: "Customer",
    entityId: customer.id,
    entityLabel: customer.name,
    newValue: {
      phone,
      sourceRecordType: source.recordType,
      sourceRecordId: source.id,
    },
  });

  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customer.id}`);
  revalidatePath(conversationPath(recordType, recordId));

  redirect(`${conversationPath(recordType, recordId)}?linked=1`);
}

export async function createWhatsAppConversationBuyerAction(formData: FormData) {
  await requireCapability("manage_buyer_access");

  const recordType = readText(formData, "recordType") as RecordType;
  const recordId = readText(formData, "recordId");
  const name = readText(formData, "name");
  const buyerType = readText(formData, "buyerType") || "WhatsApp buyer";
  const email = readText(formData, "email");

  if (!["BuyerMessage", "ContactEnquiry"].includes(recordType) || !recordId) {
    redirect("/admin/buyer-messages?error=invalid-conversation");
  }

  const source = await loadSource(recordType, recordId);
  const phone = normalizeInternationalPhone(source.phone);
  const existing = await findCustomerByPhone(phone);

  if (existing) {
    redirect(
      `${conversationPath(recordType, recordId)}?error=buyer-already-exists`,
    );
  }

  const customer = await prisma.customer.create({
    data: {
      name: name || source.name || "WhatsApp buyer",
      phone,
      email: email || null,
      receiptEmail: email || null,
      buyerType,
      accountStatus: "Manual WhatsApp",
      status: "Active",
    },
  });

  await prisma.buyerContact.create({
    data: {
      customerId: customer.id,
      name: name || source.name || customer.name,
      phone,
      email: email || null,
      role: "WhatsApp ordering contact",
      canPlaceOrders: true,
      canViewReceipts: true,
      canViewCredit: false,
      status: "Active",
    },
  });

  await moveSourceToCustomer(source, customer.id);

  await createAuditLog({
    action: "Created and linked WhatsApp buyer",
    entityType: "Customer",
    entityId: customer.id,
    entityLabel: customer.name,
    newValue: {
      phone,
      buyerType,
      sourceRecordType: source.recordType,
      sourceRecordId: source.id,
    },
  });

  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin/customers");
  revalidatePath(conversationPath(recordType, recordId));

  redirect(`${conversationPath(recordType, recordId)}?created=1`);
}

export async function startWhatsAppOrderFromConversationAction(
  formData: FormData,
) {
  await requireCapability("manage_orders");

  const recordType = readText(formData, "recordType") as RecordType;
  const recordId = readText(formData, "recordId");

  if (!["BuyerMessage", "ContactEnquiry"].includes(recordType) || !recordId) {
    redirect("/admin/buyer-messages?error=invalid-conversation");
  }

  const source = await loadSource(recordType, recordId);
  const matchedCustomer =
    source.customerId
      ? await prisma.customer.findUnique({where: {id: source.customerId}})
      : await findCustomerByPhone(source.phone);

  const marker = `conversation:${recordType}:${recordId}`;

  const existingDraft = await prisma.orderRequest.findFirst({
    where: {
      source: "WhatsApp inbound draft",
      adminNote: {contains: marker},
      status: {not: "Converted to order"},
    },
  });

  if (existingDraft) {
    redirect(`/admin/whatsapp-orders/new?draftId=${existingDraft.id}`);
  }

  const draft = await prisma.orderRequest.create({
    data: {
      buyerName: matchedCustomer?.name || source.name || "WhatsApp buyer",
      buyerType: matchedCustomer?.buyerType || "WhatsApp buyer",
      phone: normalizeInternationalPhone(source.phone),
      email: matchedCustomer?.email || null,
      location: matchedCustomer?.location || null,
      deliveryPreference: "Delivery",
      items: source.body,
      message: source.body,
      status: "New",
      source: "WhatsApp inbound draft",
      adminNote: JSON.stringify({
        marker,
        sourceRecordType: recordType,
        sourceRecordId: recordId,
        sourcePhone: source.phone,
        matchedCustomerId: matchedCustomer?.id || null,
        createdFromConversationAt: new Date().toISOString(),
      }),
    },
  });

  await createAuditLog({
    action: "Started order from WhatsApp conversation",
    entityType: "OrderRequest",
    entityId: draft.id,
    entityLabel: draft.buyerName,
    newValue: {
      sourceRecordType: recordType,
      sourceRecordId: recordId,
      matchedCustomerId: matchedCustomer?.id || null,
    },
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/buyer-messages");

  redirect(`/admin/whatsapp-orders/new?draftId=${draft.id}`);
}
