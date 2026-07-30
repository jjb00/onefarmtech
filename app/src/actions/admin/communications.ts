/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck -- carried over from createAdminRecords.ts during the module split; see git
// history for context. Removing this needs a dedicated type-safety pass.
"use server";

import crypto from "node:crypto";
import {revalidatePath} from "next/cache";
import {redirect} from "next/navigation";
import {prisma} from "@/lib/prisma";
import {createAuditLog} from "@/lib/auditLog";
import {requireCapability, requireStaff} from "@/lib/auth";
import {getEmailBaseUrl, getOperationalEmailRecipients, sendAdminTransactionalEmail, sendTransactionalEmail} from "@/lib/email/service";
import {emailTemplates} from "@/lib/email/templates";
import {protectPublicIntake} from "@/lib/publicIntakeProtection";
import {normalizeInternationalPhone} from "@/lib/phoneNumbers";
import {readText} from "./shared";

export async function createContactEnquiryAction(formData: FormData) {
  const name = readText(formData, "name");
  const organisation = readText(formData, "organisation");
  const email = readText(formData, "email").toLowerCase();
  const phone = readText(formData, "phone");
  const enquiryType = readText(formData, "enquiryType", "General enquiry");
  const message = readText(formData, "message");

  await protectPublicIntake({
    formType: "contact",
    action: "contact_enquiry",
    token: readText(formData, "cf-turnstile-response"),
    honeypot: readText(formData, "website"),
    values: [name, organisation, email, phone, enquiryType, message],
  });

  if (!name || (!email && !phone) || !message) {
    throw new Error("Please provide your name, message and an email or phone number.");
  }

  if (enquiryType === "Buyer account request") {
    if (!phone) {
      throw new Error("A phone number is required for a buyer account request.");
    }

    const request = await prisma.buyerAccountRequest.create({
      data: {
        contactName: name,
        organisationName: organisation || null,
        buyerType: organisation ? "Business buyer" : "Individual buyer",
        phone: normalizeInternationalPhone(phone, "234"),
        email: email || null,
        location: null,
        usualProduceNeeds: null,
        orderFrequency: null,
        estimatedSpend: null,
        businessRegNumber: null,
        preferredPaymentMethod: null,
        needsReceipts: false,
        interestedInCredit: false,
        message,
        status: "New",
        source: "Contact page",
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
      await sendTransactionalEmail({
        deduplicationKey: `account-request-ack:${request.id}`,
        template: "account-request-acknowledgement",
        to: request.email,
        content: emailTemplates.accountRequestAcknowledgement(
          request.contactName,
        ),
        relatedType: "BuyerAccountRequest",
        relatedId: request.id,
      });
    }

    await sendAdminTransactionalEmail({
      deduplicationKeyPrefix: `account-request-admin:${request.id}`,
      template: "account-request-admin",
      content: emailTemplates.accountRequestAdmin(
        request.contactName,
        request.organisationName,
        getEmailBaseUrl(),
      ),
      relatedType: "BuyerAccountRequest",
      relatedId: request.id,
    });

    revalidatePath("/admin/buyer-account-requests");
    revalidatePath("/admin/customers");
    revalidatePath("/admin/audit-log");

    redirect("/contact?submitted=1");
  }

  const submissionId = crypto.randomUUID();

  if (email) {
    await sendTransactionalEmail({
      deduplicationKey: `contact-ack:${submissionId}:${email}`,
      template: "contact-acknowledgement",
      to: email,
      content: emailTemplates.contactAcknowledgement(name),
    });
  }

  const recipients = getOperationalEmailRecipients("contact");
  if (!recipients.length) {
    throw new Error("No contact enquiry email recipient is configured.");
  }

  await Promise.all(
    recipients.map((recipient) =>
      sendTransactionalEmail({
        deduplicationKey: `contact-admin:${submissionId}:${recipient}`,
        template: "contact-admin",
        to: recipient,
        content: emailTemplates.contactAdminEmail({
          name,
          organisation,
          email,
          phone,
          enquiryType,
          message,
        }),
      }),
    ),
  );

  redirect("/contact?submitted=1");
}
export async function updateContactEnquiryStatusAction(formData: FormData) {
  await requireCapability("manage_support");
  const enquiryId = readText(formData, "enquiryId");
  const status = readText(formData, "status");

  if (!enquiryId || !status) {
    throw new Error("Enquiry ID and status are required.");
  }

  const updated = await prisma.contactEnquiry.update({
    where: {id: enquiryId},
    data: {status},
  });

  await createAuditLog({
    action: "Updated contact enquiry status",
    entityType: "ContactEnquiry",
    entityId: updated.id,
    entityLabel: `${updated.enquiryType} · ${updated.name}`,
    newValue: {status: updated.status},
  });

  revalidatePath("/admin/contact-enquiries");
  revalidatePath("/admin/launch-inbox");
  revalidatePath("/admin/audit-log");
}
export async function markBuyerMessageReadAction(formData: FormData) {
  const {revalidatePath} = await import("next/cache");
  const {redirect} = await import("next/navigation");
  const {prisma} = await import("@/lib/prisma");
  const {getCurrentBuyer} = await import("@/lib/currentBuyer");

  const buyer = await getCurrentBuyer();
  if (!buyer?.customerId) {
    redirect("/buyer-account-request");
  }

  const customerId = buyer.customerId as string;

  const messageId = String(formData.get("messageId") || "");
  if (!messageId) {
    redirect("/buyer-account/inbox");
  }

  await prisma.buyerMessage.updateMany({
    where: {
      id: messageId,
      customerId,
    },
    data: {
      status: "Read",
      readAt: new Date(),
    },
  });

  revalidatePath("/buyer-account");
  revalidatePath("/buyer-account/inbox");
  redirect("/buyer-account/inbox");
}
export async function logPreparedBuyerWhatsAppAction(formData: FormData) {
  await requireCapability("manage_communications");
  await requireStaff();
  const customerId = readText(formData, "customerId");
  const title = readText(formData, "title", "WhatsApp message prepared");
  const body = readText(formData, "body");
  const relatedType = readText(formData, "relatedType");
  const relatedId = readText(formData, "relatedId");

  if (!customerId || !body) {
    throw new Error("Customer and message body are required.");
  }

  const customer = await prisma.customer.findUnique({
    where: {id: customerId},
  });

  if (!customer) {
    throw new Error("Customer not found.");
  }

  const message = await prisma.buyerMessage.create({
    data: {
      customerId: customer.id,
      title,
      body,
      channel: "WhatsApp",
      direction: "Outbound",
      status: "Prepared",
      recipient: customer.phone,
      source: "Admin compose",
      relatedType: relatedType || null,
      relatedId: relatedId || null,
      metadata: "Manual WhatsApp compose opened by admin. Delivery confirmation is outside the app until WhatsApp Business/API is connected.",
    },
  });

  await createAuditLog({
    action: "Prepared buyer WhatsApp message",
    entityType: "BuyerMessage",
    entityId: message.id,
    entityLabel: `${customer.name} · ${title}`,
    newValue: message,
    actorRole: "Admin",
  });

  revalidatePath("/admin/buyer-messages");
  revalidatePath("/admin");
  revalidatePath(`/admin/customers/${customer.id}`);
  revalidatePath("/buyer-account/inbox");
}
