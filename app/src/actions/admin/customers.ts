/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- carried over from createAdminRecords.ts during the module split; see git
// history for context. Removing this needs a dedicated type-safety pass.
"use server";

import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {requireBuyer} from "@/lib/currentBuyer";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {requireAnyCapability, requireCapability, requireStaff} from "@/lib/auth";
import {getEmailBaseUrl, sendAdminTransactionalEmail, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {BuyerAccountConversionError, convertBuyerAccountRequestIntegrity} from "@/lib/buyerAccountConversion.js";
import {normalizeInternationalPhone} from "@/lib/phoneNumbers";
import {randomAccessCode} from "@/lib/loginRateLimit.js";
import {readText, readBoolean, readNumber} from "./shared";

export async function createCustomerAction(formData: FormData) {
  await requireCapability("manage_buyer_access");
  const name = readText(formData, "name");
  const phone = readText(formData, "phone");
  const email = readText(formData, "email");
  const buyerType = readText(formData, "buyerType", "Individual");
  const location = readText(formData, "location");
  const paymentTerms = readText(formData, "paymentTerms", "Full payment before order allocation");
  const creditLimit = readNumber(formData, "creditLimit");
  const outstandingBalance = readNumber(formData, "outstandingBalance");
  const accountStatus = readText(formData, "accountStatus", "Manual WhatsApp");
  const accountLoginReady = readBoolean(formData, "accountLoginReady");
  const receiptEmail = readText(formData, "receiptEmail");
  const status = readText(formData, "status", "Active");

  if (!name || !phone) {
    throw new Error("Customer name and phone are required.");
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      phone,
      email: email || null,
      buyerType,
      location: location || null,
      paymentTerms,
      creditLimit,
      outstandingBalance,
      accountStatus,
      accountLoginReady,
      receiptEmail: receiptEmail || email || null,
      status,
    },
  });

  await createAuditLog({
    action: "Created customer",
    entityType: "Customer",
    entityId: customer.id,
    entityLabel: customer.name,
    newValue: customer,
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath("/admin/audit-log");
  redirect("/admin/customers");
}
export async function updateCustomerAccountAction(formData: FormData) {
  const authoritativeStaff = await requireAnyCapability("manage_buyer_access", "manage_finance");
  const customerId = readText(formData, "customerId");
  const paymentTerms = readText(formData, "paymentTerms", "Full payment before order allocation");
  const creditLimit = readNumber(formData, "creditLimit");
  const outstandingBalance = readNumber(formData, "outstandingBalance");
  const accountStatus = readText(formData, "accountStatus", "Manual WhatsApp");
  const accountLoginReady = readBoolean(formData, "accountLoginReady");
  const receiptEmail = readText(formData, "receiptEmail");
  const status = readText(formData, "status", "Active");

  if (!customerId) {
    throw new Error("Customer is required.");
  }

  const existingCustomer = await prisma.customer.findUnique({
    where: {id: customerId},
  });

  if (!existingCustomer) {
    throw new Error("Customer not found.");
  }

  const updatedCustomer = await prisma.customer.update({
    where: {id: customerId},
    data: {
      paymentTerms,
      creditLimit,
      outstandingBalance,
      accountStatus,
      accountLoginReady,
      receiptEmail: receiptEmail || null,
      status,
      approvedAt:
        accountLoginReady && !existingCustomer.approvedAt
          ? new Date()
          : existingCustomer.approvedAt,
      approvedBy:
        accountLoginReady && !existingCustomer.approvedBy
          ? authoritativeStaff.name
          : existingCustomer.approvedBy,
    },
  });

  await createAuditLog({
    action: "Updated buyer account",
    entityType: "Customer",
    entityId: updatedCustomer.id,
    entityLabel: updatedCustomer.name,
    previousValue: {
      paymentTerms: existingCustomer.paymentTerms,
      creditLimit: existingCustomer.creditLimit,
      outstandingBalance: existingCustomer.outstandingBalance,
      accountStatus: existingCustomer.accountStatus,
      accountLoginReady: existingCustomer.accountLoginReady,
      receiptEmail: existingCustomer.receiptEmail,
      status: existingCustomer.status,
    },
    newValue: {
      paymentTerms: updatedCustomer.paymentTerms,
      creditLimit: updatedCustomer.creditLimit,
      outstandingBalance: updatedCustomer.outstandingBalance,
      accountStatus: updatedCustomer.accountStatus,
      accountLoginReady: updatedCustomer.accountLoginReady,
      receiptEmail: updatedCustomer.receiptEmail,
      status: updatedCustomer.status,
    },
    actorRole: "Buyer account manager",
  });

  revalidatePath("/admin/customers");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath("/admin/audit-log");
  revalidatePath(`/admin/customers/${customerId}`);
  redirect(`/admin/customers/${customerId}`);
}
export async function createBuyerContactAction(formData: FormData) {
  await requireCapability("manage_buyer_access");
  const customerId = readText(formData, "customerId");
  const name = readText(formData, "name");
  const email = readText(formData, "email");
  const phoneInput = readText(formData, "phone");
  const phone = phoneInput
    ? normalizeInternationalPhone(phoneInput, readText(formData, "phoneCountryCode", "234"))
    : "";
  const role = readText(formData, "role", "Buyer user");
  const canPlaceOrders = readBoolean(formData, "canPlaceOrders");
  const canViewReceipts = readBoolean(formData, "canViewReceipts");
  const canViewCredit = readBoolean(formData, "canViewCredit");
  const status = readText(formData, "status", "Active");

  if (!customerId || !name) {
    throw new Error("Customer and contact name are required.");
  }

  const customer = await prisma.customer.findUnique({
    where: {id: customerId},
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  const contact = await prisma.buyerContact.create({
    data: {
      customerId,
      name,
      email: email || null,
      phone: phone || null,
      role,
      canPlaceOrders,
      canViewReceipts,
      canViewCredit,
      status,
    },
  });

  await createAuditLog({
    action: "Created buyer contact",
    entityType: "BuyerContact",
    entityId: contact.id,
    entityLabel: `${customer.name} · ${contact.name}`,
    newValue: contact,
    actorRole: "Buyer account manager",
  });

  revalidatePath("/admin/buyer-access");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-access");
}
function makeInviteCode(customerName: string) {
  const cleanName = customerName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "BUYER";

  return `INV-${cleanName}-${randomAccessCode(8)}`;
}
export async function createBuyerAccountInviteAction(formData: FormData) {
  const authoritativeStaff = await requireCapability("manage_buyer_access");
  const customerId = readText(formData, "customerId");
  const email = readText(formData, "email");
  const phoneInput = readText(formData, "phone");
  const phone = phoneInput
    ? normalizeInternationalPhone(phoneInput, readText(formData, "phoneCountryCode", "234"))
    : "";
  const role = readText(formData, "role", "Buyer user");
  const status = readText(formData, "status", "Draft");

  if (!customerId) {
    throw new Error("Customer is required.");
  }

  const customer = await prisma.customer.findUnique({
    where: {id: customerId},
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  if (!email && !phone) {
    throw new Error("Invite email or phone is required.");
  }

  const invite = await prisma.buyerAccountInvite.create({
    data: {
      customerId,
      inviteCode: makeInviteCode(customer.name),
      email: email || null,
      phone: phone || null,
      role,
      status,
      createdBy: authoritativeStaff.name,
    },
  });

  await createAuditLog({
    action: "Created buyer account invite",
    entityType: "BuyerAccountInvite",
    entityId: invite.id,
    entityLabel: `${customer.name} · ${invite.inviteCode}`,
    newValue: invite,
    actorRole: "Buyer account manager",
  });

  if (invite.email) {
    await sendTransactionalEmail({
      deduplicationKey: `buyer-invite:${invite.id}`,
      template: "buyer-invite",
      to: invite.email,
      content: emailTemplates.buyerInvite(customer.name, invite.inviteCode, getEmailBaseUrl()),
      relatedType: "BuyerAccountInvite",
      relatedId: invite.id,
    });
  }

  revalidatePath("/admin/buyer-access");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-access");
}
export async function sendBuyerAccountInviteAction(formData: FormData) {
  const staff = await requireCapability("manage_buyer_access");
  const inviteId = readText(formData, "inviteId");
  const channel = readText(formData, "channel").toLowerCase();

  if (!inviteId || !["email", "whatsapp"].includes(channel)) {
    redirect("/admin/buyer-access?delivery=invalid");
  }

  const invite = await prisma.buyerAccountInvite.findUnique({
    where: {id: inviteId},
    include: {customer: true},
  });

  if (!invite) {
    redirect("/admin/buyer-access?delivery=not-found");
  }

  if (invite.status.toLowerCase().includes("cancel")) {
    redirect("/admin/buyer-access?delivery=cancelled");
  }

  const loginUrl = `${getEmailBaseUrl()}/buyer-login`;

  if (channel === "email") {
    if (!invite.email) {
      redirect("/admin/buyer-access?delivery=missing-email");
    }

    const result = await sendTransactionalEmail({
      deduplicationKey: `buyer-invite:${invite.id}`,
      template: "buyer-invite",
      to: invite.email,
      content: emailTemplates.buyerInvite(
        invite.customer.name,
        invite.inviteCode,
        getEmailBaseUrl(),
      ),
      relatedType: "BuyerAccountInvite",
      relatedId: invite.id,
    });

    if (!result.ok) {
      redirect(
        `/admin/buyer-access?delivery=email-failed&detail=${encodeURIComponent(
          result.error || result.status,
        ).slice(0, 220)}`,
      );
    }

    const updated = await prisma.buyerAccountInvite.update({
      where: {id: invite.id},
      data: {
        status: invite.status === "Accepted" ? invite.status : "Sent",
        sentAt: invite.sentAt || new Date(),
      },
    });

    await createAuditLog({
      action: "Sent buyer account invite by email",
      entityType: "BuyerAccountInvite",
      entityId: invite.id,
      entityLabel: `${invite.customer.name} · ${invite.email}`,
      previousValue: invite,
      newValue: updated,
      actorRole: staff.role,
    });

    revalidatePath("/admin/buyer-access");
    revalidatePath("/admin/buyer-messages");
    revalidatePath("/admin/audit-log");
    redirect(`/admin/buyer-access?delivery=email-${result.status.toLowerCase()}`);
  }

  if (!invite.phone) {
    redirect("/admin/buyer-access?delivery=missing-phone");
  }

  const {
    normaliseWhatsAppPhone,
    sendWhatsAppBuyerInviteTemplate,
    WhatsAppProviderError,
  } = await import("@/lib/whatsapp/provider");

  let normalizedRecipient: string;

  try {
    normalizedRecipient = normaliseWhatsAppPhone(invite.phone);
  } catch (error) {
    const detail =
      error instanceof Error
        ? error.message
        : "WhatsApp recipient phone is invalid.";

    redirect(
      `/admin/buyer-access?delivery=whatsapp-recipient&detail=${encodeURIComponent(
        detail,
      ).slice(0, 220)}`,
    );
  }

  const messageLog = await prisma.buyerMessage.create({
    data: {
      customerId: invite.customerId,
      title: "Buyer access code sent by WhatsApp",
      body: `A buyer access code was sent securely to ${normalizedRecipient}.`,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Pending",
      recipient: normalizedRecipient,
      source: "WhatsApp API",
      relatedType: "BuyerAccountInvite",
      relatedId: invite.id,
      metadata: JSON.stringify({
        provider: "Meta WhatsApp Cloud API",
        attemptedAt: new Date().toISOString(),
        normalizedRecipient,
      }),
    },
  });

  try {
    const result = await sendWhatsAppBuyerInviteTemplate({
      to: invite.phone,
      buyerName: invite.customer.name,
      accessCode: invite.inviteCode,
      loginUrl,
    });

    await prisma.buyerMessage.update({
      where: {id: messageLog.id},
      data: {
        status: "Sent",
        sentAt: new Date(),
        metadata: JSON.stringify({
          provider: result.provider,
          messageId: result.messageId,
          metaHttpStatus: result.httpStatus,
          normalizedRecipient: result.normalizedTo,
          messageType: result.messageType,
        }),
      },
    });

    const updated = await prisma.buyerAccountInvite.update({
      where: {id: invite.id},
      data: {
        status: invite.status === "Accepted" ? invite.status : "Sent",
        sentAt: invite.sentAt || new Date(),
      },
    });

    await createAuditLog({
      action: "Sent buyer account invite by WhatsApp",
      entityType: "BuyerAccountInvite",
      entityId: invite.id,
      entityLabel: `${invite.customer.name} · ${normalizedRecipient}`,
      previousValue: invite,
      newValue: updated,
      actorRole: staff.role,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "WhatsApp send failed.";
    const details =
      error instanceof WhatsAppProviderError ? error.details : {};

    await prisma.buyerMessage.update({
      where: {id: messageLog.id},
      data: {
        status: "Failed",
        metadata: JSON.stringify({
          provider: "Meta WhatsApp Cloud API",
          normalizedRecipient,
          error: message,
          ...details,
        }),
      },
    });

    revalidatePath("/admin/buyer-access");
    revalidatePath("/admin/buyer-messages");

    redirect(
      `/admin/buyer-access?delivery=whatsapp-failed&detail=${encodeURIComponent(
        message,
      ).slice(0, 220)}`,
    );
  }

  revalidatePath("/admin/buyer-access");
  revalidatePath("/admin/buyer-messages");
  revalidatePath("/buyer-account/inbox");
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-access?delivery=whatsapp-accepted");
}
export async function updateBuyerAccountInviteStatusAction(formData: FormData) {
  await requireCapability("manage_buyer_access");
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {requireStaff} = await import("@/lib/auth");
  const {prisma} = await import("@/lib/prisma");

  await requireStaff();

  const id = String(formData.get("id") || "").trim();
  const status = String(formData.get("status") || "").trim();

  const allowedStatuses = [
    "Draft",
    "Ready to send",
    "Sent manually",
    "Accepted later",
    "Cancelled",
  ];

  if (!id || !allowedStatuses.includes(status)) {
    throw new Error("Valid buyer invite and status are required.");
  }

  await prisma.buyerAccountInvite.update({
    where: {id},
    data: {status},
  });

  revalidatePath("/admin/buyer-access");
  revalidatePath("/admin/audit-log");
  redirect("/admin/buyer-access?inviteStatus=updated");
}
export async function createBuyerAccountRequestAction(formData: FormData) {
  const contactName = readText(formData, "contactName");
  const organisationName = readText(formData, "organisationName");
  const buyerType = readText(formData, "buyerType", "Business buyer");
  const phone = normalizeInternationalPhone(
    readText(formData, "phone"),
    readText(formData, "phoneCountryCode", "234"),
  );
  const email = readText(formData, "email");
  const location = readText(formData, "location");
  const usualProduceNeeds = readText(formData, "usualProduceNeeds");
  const orderFrequency = readText(formData, "orderFrequency");
  const estimatedSpend = readText(formData, "estimatedSpend");
  const businessRegNumber = readText(formData, "businessRegNumber");
  const preferredPaymentMethod = readText(formData, "preferredPaymentMethod");
  const needsReceipts = readBoolean(formData, "needsReceipts");
  const interestedInCredit = readBoolean(formData, "interestedInCredit");
  const message = readText(formData, "message");

  if (!contactName || !phone) {
    throw new Error("Contact name and phone are required.");
  }

  const request = await prisma.buyerAccountRequest.create({
    data: {
      contactName,
      organisationName: organisationName || null,
      buyerType,
      phone,
      email: email || null,
      location: location || null,
      usualProduceNeeds: usualProduceNeeds || null,
      orderFrequency: orderFrequency || null,
      estimatedSpend: estimatedSpend || null,
      businessRegNumber: businessRegNumber || null,
      preferredPaymentMethod: preferredPaymentMethod || null,
      needsReceipts,
      interestedInCredit,
      message: message || null,
      status: "New",
      source: "Buyer account request page",
    },
  });

  await createAuditLog({
    action: "Created buyer account request",
    entityType: "BuyerAccountRequest",
    entityId: request.id,
    entityLabel: `${request.buyerType} · ${request.contactName}`,
    newValue: request,
  });

  if (request.email) {
    await sendTransactionalEmail({deduplicationKey: `account-request-ack:${request.id}`, template: "account-request-acknowledgement", to: request.email, content: emailTemplates.accountRequestAcknowledgement(request.contactName), relatedType: "BuyerAccountRequest", relatedId: request.id});
  }
  await sendAdminTransactionalEmail({deduplicationKeyPrefix: `account-request-admin:${request.id}`, template: "account-request-admin", content: emailTemplates.accountRequestAdmin(request.contactName, request.organisationName, getEmailBaseUrl()), relatedType: "BuyerAccountRequest", relatedId: request.id});

  revalidatePath("/buyer-account-request");
  revalidatePath("/admin/buyer-account-requests");
  revalidatePath("/admin/audit-log");
  redirect("/buyer-account-request?submitted=1");
}
export async function updateBuyerAccountRequestStatusAction(formData: FormData) {
  await requireCapability("manage_buyer_access");
  await requireStaff();
  const requestId = readText(formData, "requestId");
  const status = readText(formData, "status");

  if (!requestId || !status) {
    throw new Error("Request ID and status are required.");
  }

  const updated = await prisma.buyerAccountRequest.update({
    where: {id: requestId},
    data: {status},
  });

  await createAuditLog({
    action: "Updated buyer account request status",
    entityType: "BuyerAccountRequest",
    entityId: updated.id,
    entityLabel: `${updated.buyerType} · ${updated.contactName}`,
    newValue: {status: updated.status},
  });

  revalidatePath("/admin/buyer-account-requests");
  revalidatePath("/admin/audit-log");
}
export async function convertBuyerAccountRequestToCustomerAction(formData: FormData) {
  const staff = await requireCapability("manage_buyer_access");
  const requestId = readText(formData, "requestId");

  if (!requestId) {
    redirect("/admin/buyer-account-requests?conversionError=missing-request-id");
  }

  let customerId = "";
  try {
    const result = await convertBuyerAccountRequestIntegrity({db: prisma, requestId, actor: staff});
    customerId = result.customer.id;
  } catch (error) {
    const code = error instanceof BuyerAccountConversionError ? error.code : "conversion-failed";
    redirect(`/admin/buyer-account-requests?conversionError=${encodeURIComponent(code)}`);
  }

  revalidatePath("/admin/buyer-account-requests");
  revalidatePath("/admin/launch-inbox");
  revalidatePath("/admin/buyer-accounts");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customerId}`);
  revalidatePath("/admin/audit-log");
  redirect(`/admin/customers/${customerId}?conversion=created`);
}
export async function createBuyerProfileUpdateRequestAction(formData: FormData) {
  const {customer} = await requireBuyer();

  const requestType = readText(formData, "requestType", "Profile update");
  const companyInfo = readText(formData, "companyInfo");
  const buyingProfile = readText(formData, "buyingProfile");
  const financeInfo = readText(formData, "financeInfo");
  const contactInfo = readText(formData, "contactInfo");
  const documentsNote = readText(formData, "documentsNote");
  const message = readText(formData, "message");

  if (!companyInfo && !buyingProfile && !financeInfo && !contactInfo && !documentsNote && !message) {
    throw new Error("Please describe the update you want us to review.");
  }

  const request = await prisma.buyerProfileUpdateRequest.create({
    data: {
      customerId: customer.id,
      requestType,
      companyInfo: companyInfo || null,
      buyingProfile: buyingProfile || null,
      financeInfo: financeInfo || null,
      contactInfo: contactInfo || null,
      documentsNote: documentsNote || null,
      message: message || null,
      status: "New",
    },
  });

  await createAuditLog({
    action: "Created buyer profile update request",
    entityType: "BuyerProfileUpdateRequest",
    entityId: request.id,
    entityLabel: `${customer.name} · ${request.requestType}`,
    newValue: request,
    actorRole: "Buyer portal",
  });

  await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title: "Profile update request received",
      body: `Your ${request.requestType.toLowerCase()} has been submitted for review.`,
      channel: "Portal",
      direction: "Outbound",
      status: "Logged",
      recipient: customer.email || customer.phone,
      source: "Buyer portal",
      relatedType: "BuyerProfileUpdateRequest",
      relatedId: request.id,
    },
  });

  revalidatePath("/buyer-account");
  revalidatePath("/buyer-account/inbox");
  revalidatePath("/admin/buyer-profile-requests");
  revalidatePath("/admin/audit-log");
  redirect("/buyer-account?profileSubmitted=1#profile-updates");
}
export async function updateBuyerProfileUpdateRequestStatusAction(formData: FormData) {
  await requireCapability("manage_buyer_access");
  await requireStaff();
  const requestId = readText(formData, "requestId");
  const status = readText(formData, "status", "Reviewing");
  const adminNote = readText(formData, "adminNote");

  if (!requestId || !status) {
    throw new Error("Request ID and status are required.");
  }

  const existing = await prisma.buyerProfileUpdateRequest.findUnique({
    where: {id: requestId},
    include: {customer: true},
  });

  if (!existing) {
    throw new Error("Buyer profile update request not found.");
  }

  const updated = await prisma.buyerProfileUpdateRequest.update({
    where: {id: requestId},
    data: {
      status,
      adminNote: adminNote || existing.adminNote,
    },
  });

  await createAuditLog({
    action: "Updated buyer profile update request",
    entityType: "BuyerProfileUpdateRequest",
    entityId: updated.id,
    entityLabel: `${existing.customer.name} · ${updated.requestType}`,
    previousValue: {
      status: existing.status,
      adminNote: existing.adminNote,
    },
    newValue: {
      status: updated.status,
      adminNote: updated.adminNote,
    },
    actorRole: "Buyer account manager",
  });

  revalidatePath("/admin/buyer-profile-requests");
  revalidatePath("/admin");
  revalidatePath("/admin/audit-log");
}
